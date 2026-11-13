/**
 * /give — تحويل مال بين الأعضاء (محصّن ضد الخصم المزدوج)
 * مسار الملف: scripts/cmds/give.js
 */

const eco = require("../../func/economy.js");

module.exports.config = {
	name: "give",
	aliases: ["اعطي", "أعطي", "تحويل", "transfer", "pay", "دفع"],
	version: "3.0",
	author: "Acard",
	countDown: 5,
	role: 0,
	category: "economy",
	shortDescription: "حوّل مالاً إلى عضو آخر (بالرد أو بالمنشن)",
	guide: {
		ar: "{pn} <المبلغ> (بالرد على رسالة الشخص أو منشنه)\n" +
			"   {pn} 500 بالرد على رسالته\n" +
			"   {pn} all — تحويل كل رصيدك\n" +
			"   {pn} half — تحويل نصف رصيدك"
	}
};

function resolveTarget(event, senderID) {
	const reply = event.messageReply;
	if (reply && reply.senderID) return String(reply.senderID);
	const mentions = event.mentions || {};
	const keys = Object.keys(mentions);
	if (keys.length > 0) return String(keys[0]);
	return null;
}

module.exports.onStart = async function ({ api, event, args, usersData }) {
	const { senderID, threadID, messageID } = event;
	const raw = String(args[0] || "").trim().toLowerCase();
	const targetID = resolveTarget(event, senderID);

	if (!targetID) {
		return api.sendMessage(
			`💸 | تحويل المال\n━━━━━━━━━━━━━━━━━━━\n` +
			`📌 | ردّ على رسالة الشخص ثم اكتب: give 500\n` +
			`📌 | أو منشنه: give 500 @الاسم\n` +
			`💰 | يمكنك: all (الكل) أو half (النصف)\n` +
			`💡 | الحد الأدنى: ${eco.MIN_TRANSFER}$ — الحد الأقصى: ${eco.fmt(eco.MAX_TRANSFER)}$`,
			threadID, messageID
		);
	}

	if (targetID === String(senderID)) {
		return api.sendMessage("🤨 | لا يمكنك تحويل المال لنفسك!", threadID, messageID);
	}

	const botID = global.GoatBot.botID || (typeof api.getCurrentUserID === "function" ? api.getCurrentUserID() : null);
	if (botID && targetID === String(botID)) {
		return api.sendMessage("🤖 | البوت لا يحتاج مالك… شكراً!", threadID, messageID);
	}

	// حساب المبلغ
	let amount;
	if (raw === "all" || raw === "كل" || raw === "الكل") {
		const me = await usersData.get(senderID);
		amount = eco.toMoney(me && me.data ? me.data.money : 0);
	}
	else if (raw === "half" || raw === "نصف") {
		const me = await usersData.get(senderID);
		amount = Math.floor(eco.toMoney(me && me.data ? me.data.money : 0) / 2);
	}
	else {
		amount = eco.parseAmount(args[0]);
	}

	if (!Number.isFinite(amount) || amount <= 0) {
		return api.sendMessage(
			`⚠️ | اكتب مبلغاً صحيحاً\n📌 | مثال: give 500 (بالرد على رسالة الشخص)`,
			threadID, messageID
		);
	}
	if (amount < eco.MIN_TRANSFER) {
		return api.sendMessage(`⚠️ | الحد الأدنى للتحويل هو ${eco.MIN_TRANSFER}$.`, threadID, messageID);
	}
	if (amount > eco.MAX_TRANSFER) {
		return api.sendMessage(`⚠️ | الحد الأقصى للتحويل هو ${eco.fmt(eco.MAX_TRANSFER)}$.`, threadID, messageID);
	}

	const moved = await eco.transfer(usersData, senderID, targetID, amount);

	if (!moved.ok) {
		if (moved.reason === "poor") {
			return api.sendMessage(
				`❌ | رصيدك غير كافٍ!\n💳 | رصيدك: ${eco.fmt(moved.balance)}$\n💰 | المطلوب: ${eco.fmt(amount)}$`,
				threadID, messageID
			);
		}
		if (moved.reason === "self") {
			return api.sendMessage("🤨 | لا يمكنك تحويل المال لنفسك!", threadID, messageID);
		}
		return api.sendMessage("❌ | تعذّر إتمام التحويل، حاول مجدداً.", threadID, messageID);
	}

	const senderName = moved.from.name;
	const targetName = moved.to.name;

	// إشعار المستلم (مع منشن)
	api.sendMessage(
		{
			body:
				`📥 | وصلك تحويل!\n━━━━━━━━━━━━━━━━━━━\n` +
				`👤 | من: ${senderName}\n` +
				`💰 | المبلغ: +${eco.fmt(amount)}$\n` +
				eco.balanceLine(moved.to.balance),
			mentions: [{ id: targetID, tag: targetName }]
		},
		threadID
	);

	return api.sendMessage(
		`✅ | تم التحويل بنجاح\n━━━━━━━━━━━━━━━━━━━\n` +
		`📤 | إلى: ${targetName}\n` +
		`💰 | المبلغ: ${eco.fmt(amount)}$\n` +
		eco.balanceLine(moved.from.balance),
		threadID, messageID
	);
};
