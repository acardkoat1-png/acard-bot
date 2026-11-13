/**
 * index.js — مشغّل البوت + سيرفر الصحة + تجهيز البيئة على Railway
 * ---------------------------------------------------------------
 * 1) ينشئ account.txt من ACCOUNT_B64 (أو أي متغيّر يحتوي account/appstate/cookie)
 * 2) ينشئ config.json من CONFIG_B64 (أو أي متغيّر يحتوي config)
 * 3) يصلح الحقول الإجبارية (credentials) التي يُوقف البوت بسببها
 * 4) ينشئ مجلد database/data (وإلا يتوقف البوت بخطأ ENOENT)
 * 5) يطبّق BOT_PREFIX و BOT_ADMIN_ID إن وُجدا
 */

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const log = require("./logger/log.js");

const CONFIG_PATH = path.join(__dirname, "config.json");

/* ————————————————— فك الترميز ————————————————— */

function decodeValue(raw) {
	if (!raw) return null;
	const text = String(raw).trim();
	if (!text) return null;
	if (text.startsWith("{") || text.startsWith("[")) return text;

	const cleaned = text.replace(/\s+/g, "");
	if (!/^[A-Za-z0-9+/=]+$/.test(cleaned)) return null;
	try {
		const decoded = Buffer.from(cleaned, "base64").toString("utf8").trim();
		if (decoded.startsWith("{") || decoded.startsWith("[")) return decoded;
	}
	catch (error) { /* تجاهل */ }
	return null;
}

function isCookieArray(value) {
	try {
		const data = JSON.parse(value);
		return Array.isArray(data) && data.length > 0 && data.every(item => item && typeof item === "object" && "key" in item && "value" in item);
	}
	catch (error) {
		return false;
	}
}

function isBotConfig(value) {
	try {
		const data = JSON.parse(value);
		return data && typeof data === "object" && !Array.isArray(data) && ("prefix" in data || "database" in data || "facebookAccount" in data || "optionsFca" in data);
	}
	catch (error) {
		return false;
	}
}

function pickEnv(preferred, pattern, validate) {
	for (const name of preferred) {
		const content = decodeValue(process.env[name]);
		if (content && validate(content)) return { name, content };
	}
	const matched = Object.keys(process.env).filter(key => pattern.test(key));
	for (const name of matched) {
		const content = decodeValue(process.env[name]);
		if (content && validate(content)) return { name, content };
	}
	return { name: null, content: null, matched };
}

function install(fileName, label, preferred, pattern, validate) {
	const found = pickEnv(preferred, pattern, validate);

	if (!found.content) {
		const list = (found.matched || []).map(key => `${key}(${String(process.env[key] || "").length})`);
		console.log(`[env] ✖ لم أجد ${label}. متغيرات مشابهة: ${list.length ? list.join(", ") : "لا شيء"}`);
		return false;
	}

	try {
		fs.writeFileSync(path.join(__dirname, fileName), found.content.trim());
		console.log(`[env] ✓ ${fileName} أُنشئ من المتغيّر ${found.name}`);
		return true;
	}
	catch (error) {
		console.log(`[env] تعذّر كتابة ${fileName}: ${error.message}`);
		return false;
	}
}

console.log(`[env] عدد المتغيرات في البيئة: ${Object.keys(process.env).length}`);

install(
	"account.txt",
	"كوكيز الحساب",
	["ACCOUNT_B64", "ACCOUNT_JSON", "ACCOUNT", "APPSTATE", "APPSTATE_B64", "COOKIES"],
	/account|appstate|cookie/i,
	isCookieArray
);

install(
	"config.json",
	"إعدادات البوت",
	["CONFIG_B64", "CONFIG_JSON", "CONFIG", "BOT_CONFIG", "CONFIG_DATA"],
	/config/i,
	isBotConfig
);

/* ————————————————— مجلد قاعدة البيانات ————————————————— */

(function prepareDataDir() {
	const folders = [
		path.join(__dirname, "database", "data"),
		path.join(__dirname, "scripts", "cmds", "cache")
	];
	for (const folder of folders) {
		try {
			fs.mkdirSync(folder, { recursive: true });
		}
		catch (error) {
			console.log(`[env] تعذّر إنشاء ${folder}: ${error.message}`);
		}
	}
	console.log("[env] ✓ مجلدات database/data و scripts/cmds/cache جاهزة");
})();

/* ————————————————— إصلاح الحقول الإجبارية ————————————————— */

(function fixConfig() {
	if (!fs.existsSync(CONFIG_PATH)) return;

	let config;
	try {
		config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
	}
	catch (error) {
		console.log("[env] config.json غير صالح:", error.message);
		return;
	}

	let changed = false;

	if (!config.credentials || typeof config.credentials !== "object") {
		config.credentials = {};
		changed = true;
	}
	if (!config.credentials.gmailAccount || typeof config.credentials.gmailAccount !== "object") {
		config.credentials.gmailAccount = {};
		changed = true;
	}
	if (!config.credentials.gRecaptcha || typeof config.credentials.gRecaptcha !== "object") {
		config.credentials.gRecaptcha = { siteKey: "", secretKey: "" };
		changed = true;
	}

	const google = config.credentials.gmailAccount;
	const placeholders = {
		email: "acard-bot@example.com",
		clientId: "acard-bot.apps.googleusercontent.com",
		clientSecret: "acard-bot-client-secret",
		refreshToken: "acard-bot-refresh-token",
		apiKey: "acard-bot-api-key"
	};
	for (const key of Object.keys(placeholders)) {
		if (!google[key]) {
			google[key] = placeholders[key];
			changed = true;
		}
	}

	const validTypes = ["json", "sqlite", "mongodb"];
	if (config.database && !validTypes.includes(config.database.type)) {
		config.database.type = "json";
		changed = true;
	}

	if (process.env.BOT_PREFIX) {
		config.prefix = process.env.BOT_PREFIX;
		changed = true;
	}
	if (process.env.BOT_ADMIN_ID) {
		config.adminBot = String(process.env.BOT_ADMIN_ID).split(/[,\s]+/).filter(Boolean);
		changed = true;
	}

	if (changed) {
		try {
			fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
			console.log("[env] ✓ تم إصلاح config.json (credentials / إعدادات ناقصة)");
		}
		catch (error) {
			console.log("[env] تعذّر حفظ config.json:", error.message);
		}
	}
})();

/* ————————————————— التشغيل ————————————————— */

function startProject() {
	const child = spawn("node", ["Goat.js"], {
		cwd: __dirname,
		stdio: "inherit",
		shell: true
	});

	child.on("close", (code) => {
		if (code == 2) {
			log.info("Restarting Project...");
			startProject();
		}
	});
}

startProject();

/* ————————————————— سيرفر الصحة ————————————————— */

try {
	const express = require("express");
	const app = express();
	const PORT = process.env.PORT || 3000;

	app.get("/", (req, res) => {
		res.send("Bot is running!");
	});

	app.get("/uptime", (req, res) => {
		res.status(200).json({ ok: true, uptime: process.uptime() });
	});

	app.listen(PORT, "0.0.0.0", () => {
		console.log(`Uptime server running on port ${PORT}`);
	});
}
catch (error) {
	console.log("Uptime server skipped:", error.message);
}
