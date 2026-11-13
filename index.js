/**
 * index.js — مشغّل البوت + سيرفر الصحة + إنشاء الملفات من متغيرات Railway
 * -----------------------------------------------------------------------
 * ينشئ تلقائياً:
 *   ACCOUNT_B64 (أو ACCOUNT_JSON) → account.txt
 *   CONFIG_B64  (أو CONFIG_JSON)  → config.json
 *   BOT_PREFIX / BOT_ADMIN_ID     → تعديل سريع في config.json
 *
 * بدون هذه المتغيرات يعمل كما كان تماماً.
 */

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const log = require("./logger/log.js");

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

function materialize(fileName, envNames) {
	for (const envName of envNames) {
		const content = decodeValue(process.env[envName]);
		if (!content) continue;
		try {
			JSON.parse(content);
		}
		catch (error) {
			console.log(`[env] ${envName} ليس JSON صالحاً — تم تجاهله`);
			continue;
		}
		try {
			fs.writeFileSync(path.join(__dirname, fileName), content.trim());
			console.log(`[env] ${fileName} ✓ من ${envName}`);
		}
		catch (error) {
			console.log(`[env] تعذّر كتابة ${fileName}:`, error.message);
		}
		return true;
	}
	return false;
}

const gotAccount = materialize("account.txt", ["ACCOUNT_B64", "ACCOUNT_JSON"]);
const gotConfig = materialize("config.json", ["CONFIG_B64", "CONFIG_JSON"]);
if (!gotAccount) console.log("[env] تنبيه: account.txt غير موجود في المشروع ولا في المتغيرات");
if (!gotConfig) console.log("[env] تنبيه: config.json غير موجود في المشروع ولا في المتغيرات");

(function applyOverrides() {
	const prefix = process.env.BOT_PREFIX;
	const adminId = process.env.BOT_ADMIN_ID;
	if (!prefix && !adminId) return;

	const target = path.join(__dirname, "config.json");
	if (!fs.existsSync(target)) return;

	try {
		const config = JSON.parse(fs.readFileSync(target, "utf8"));
		if (prefix) config.prefix = prefix;
		if (adminId) config.adminBot = String(adminId).split(/[,\s]+/).filter(Boolean);
		fs.writeFileSync(target, JSON.stringify(config, null, 2));
		console.log("[env] تم تطبيق BOT_PREFIX / BOT_ADMIN_ID");
	}
	catch (error) {
		console.log("[env] تعذّر تعديل config.json:", error.message);
	}
})();

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
