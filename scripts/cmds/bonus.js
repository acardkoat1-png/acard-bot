/**
 * /bonus — مكافأة 2500$ لكل من يتفاعل مع منشورات الأدمن
 * مسار الملف: scripts/cmds/bonus.js
 *
 * كيف يعمل: البوت يراقب الرسائل/المنشورات التي يكتبها حساب الأدمن (adminBot)
 * داخل المجموعات التي فيها البوت، ويسجّل معرّف المنشور. أول من يتفاعل
 * (أي إيموجي) يحصل على المبلغ مرة واحدة لكل منشور.
 *
 * ملاحظة تقنية: فيسبوك لا يرسل للبوت أي حدث عن منشورات الحائط (البروفايل)،
 * لذلك تعمل الميزة مع المنشورات داخل المجموعات التي فيها البوت.
 *
 * متطلبات: ملف bot/handler/handlerEvents.js المرفق (يدعم onReaction).
 */

const fs = require("fs-extra");
const path = require("path");
const eco = require("../../func/economy.js");

module.exports.config = {
	name: "bonus",
	aliases: ["بونص", "جائزة"],
	version: "1.0",
	author: "Acard",
	countDown: 3,
	role: 0,
	category: "economy",
	shortDescription: "مكافأة تلقائية لكل من يتفاعل مع منشورات الأدمن",
	guide: {
		ar: "{pn} — الحالة\n" +
			"{pn} on / off — تشغيل أو إيقاف\n" +
			"{pn} amount 2500 — تحديد المبلغ\n" +
			"{pn} clear — حذف المنشورات المسجّلة"
	}
};

const SETTINGS_PATH = path.join(__dirname, "..", "..", "database", "data", "bonus.json");
const MAX_POSTS = 200;

const defaults = { enable: true, amount: 2500, windowHours: 24 };

/** messageID → { threadID, adminID, at, paid:Set, announced } */
const posts = new Map();

let settings = null;

function loadSettings() {
	if (settings) return settings;
	try {
		if (fs.existsSync(SETTINGS_PATH)) {
			const saved = JSON.parse(fs.readFileSync(SETTINGS_PATH, "utf8"));
			settings = { ...defaults, ...saved };
		}
		else settings = { ...defaults };
	}
	catch (error) {
		settings = { ...defaults };
	}
	return settings;
}

function saveSettings() {
	try {
		fs.ensureDirSync(path.dirname(SETTINGS_PATH));
		fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2));
	}
	catch (error) {
		console.log("[bonus] تعذّر حفظ الإعدادات:", error.message);
	}
}

function adminIDs() {
	return (global.GoatBot.config.adminBot || []).map(String);
}

function isAdmin(userID) {
	return adminIDs().includes(String(userID));
}

function cleanup() {
	const limit = Date.now() - loadSettings().windowHours * 3600 * 1000;
	for (const [messageID, post] of posts) {
		if (post.at < limit) {
			posts.delete(messageID);
			global.GoatBot.onReaction.delete(messageID);
		}
	}
	// حد أقصى للعدد
	if (posts.size > MAX_POSTS) {
		const sorted = Array.from(posts.entries()).sort((a, b) => a[1].at - b[1].at);
		for (const [messageID] of sorted.slice(0, posts.size - MAX_POSTS)) {
			posts.delete(messageID);
			global.GoatBot.onReaction.delete(messageID);
		}
	}
}

/* ————————————————— تسجيل منشورات الأدمن ————————————————— */

module.exports.onChat = async function ({ event, prefix }) {
	const config = loadSettings();
	if (!config.enable) return;
	if (!event || !event.body) return;

	const author = String(event.senderID || event.userID || "");
	if (!isAdmin(author)) return;

	const body = String(event.body).trim();
	if (!body) return;
	if (prefix && body.startsWith(prefix)) return; // رسائل الأوامر ليست منشورات
	if (!event.messageID) return;

	cleanup();

	posts.set(event.messageID, {
		threadID: event.threadID,
		adminID: author,
		at: Date.now(),
		paid: new Set(),
		announced: false
	});

	global.GoatBot.onReaction.set(event.messageID, {
		commandName: "bonus",
		messageID: event.messageID,
		postId: event.messageID
	});
};

/* ————————————————— الدفع عند التفاعل ————————————————— */

module.exports.onReaction = async function ({ api, event, usersData }) {
	const config = loadSettings();
	if (!config.enable) return;

	const post = posts.get(event.messageID);
	if (!post) return;

	const userID = String(event.senderID || event.userID || "");
	if (!userID || post.paid.has(userID)) return;
	if (post.adminID === userID) return;

	const botID = global.GoatBot.botID;
	if (botID && userID === String(botID)) return;

	post.paid.add(userID);

	const balance = await eco.withWallet(usersData, userID, async (wallet) => {
		wallet.add(config.amount);
		wallet.stat("bonusRewards", config.amount);
		return wallet.money;
	});

	if (!post.announced) {
		post.announced = true;
		let name = "عضو";
		try {
			if (typeof usersData.getName === "function") name = await usersData.getName(userID);
		}
		catch (error) { name = "عضو"; }
		api.sendMessage(
			`🎁 | مكافأة تفاعل!\n━━━━━━━━━━━━━━━━━━━\n` +
			`👤 | ${name}\n` +
			`💰 | +${eco.fmt(config.amount)}$\n` +
			`💡 | كل من يتفاعل مع منشورات الأدمن يأخذ نفس المبلغ`,
			post.threadID
		);
	}
};

/* ————————————————— إعدادات الأدمن ————————————————— */

module.exports.onStart = async function ({ api, event, args, role }) {
	const { threadID, messageID } = event;
	const config = loadSettings();

	if (Number(role) < 2) {
		return api.sendMessage("⛔ | هذا الأمر لأدمن البوت فقط.", threadID, messageID);
	}

	const action = String(args[0] || "").toLowerCase();

	if (action === "on" || action === "تشغيل") {
		config.enable = true;
		saveSettings();
		return api.sendMessage(`✅ | تم تشغيل مكافأة التفاعل (${eco.fmt(config.amount)}$ لكل متفاعل).`, threadID, messageID);
	}

	if (action === "off" || action === "ايقاف" || action === "إيقاف") {
		config.enable = false;
		saveSettings();
		return api.sendMessage("⏸️ | تم إيقاف مكافأة التفاعل.", threadID, messageID);
	}

	if (action === "amount" || action === "مبلغ") {
		const value = eco.parseAmount(args[1]);
		if (!Number.isFinite(value) || value < 1) {
			return api.sendMessage("⚠️ | اكتب مبلغاً صحيحاً: bonus amount 2500", threadID, messageID);
		}
		config.amount = value;
		saveSettings();
		return api.sendMessage(`✅ | المكافأة الآن: ${eco.fmt(value)}$ لكل متفاعل.`, threadID, messageID);
	}

	if (action === "clear" || action === "حذف") {
		for (const messageID of posts.keys()) global.GoatBot.onReaction.delete(messageID);
		posts.clear();
		return api.sendMessage("🧹 | تم حذف المنشورات المسجّلة.", threadID, messageID);
	}

	return api.sendMessage(
		`🎁 | مكافأة التفاعل\n━━━━━━━━━━━━━━━━━━━\n` +
		`📊 | الحالة: ${config.enable ? "✅ مفعّلة" : "⏸️ متوقفة"}\n` +
		`💰 | المبلغ لكل متفاعل: ${eco.fmt(config.amount)}$\n` +
		`⏳ | مدة صلاحية المنشور: ${config.windowHours} ساعة\n` +
		`🗂 | منشورات مسجّلة الآن: ${posts.size}\n` +
		`👤 | الأدمن المراقَب: ${adminIDs().join(", ") || "لا أحد (أضف adminBot)"}\n` +
		`━━━━━━━━━━━━━━━━━━━\n` +
		`📌 | إعدادات: bonus on | off | amount 2500 | clear\n` +
		`💡 | كل من يتفاعل (أي إيموجي) مع منشور الأدمن في المجموعة يأخذ المبلغ مرة واحدة`,
		threadID, messageID
	);
};