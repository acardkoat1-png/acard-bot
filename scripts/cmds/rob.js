/**
 * /rob — محاولة سرقة عضو آخر
 * مسار الملف: scripts/cmds/rob.js
 * بلا زمن انتظار (كما طُلب). النجاح 30%.
 * عند الفشل: غرامة = نصف المبلغ الذي حاولت سرقته (فتكون النتيجة سلبية على المدى الطويل).
 * الدرع (من المتجر) يمنع السرقة.
 */

const eco = require("../../func/economy.js");

module.exports.config = {
	name: "rob",
	aliases: ["سرقة", "اسرق", "سلب"],
	version: "3.0",
	author: "Acard",
	countDown: 5,
	role: 0,
	category: "economy",
	shortDescription: "حاول سرقة عضو (30% نجاح، وغرامة عند الفشل) — بلا زمن انتظار",
	guide: { ar: "{pn} (بالرد على رسالة الضحية أو منشن له)" }
};

const SUCCESS_RATE = 0.30;
const STEAL_PERCENT = 0.03;
const STEAL_MIN = 50;
const STEAL_MAX = 5000;
const FINE_RATIO = 0.5;

module.exports.onStart = async function ({ api, event, usersData }) {
	const { senderID, threadID, messageID, messageReply, mentions } = event;

	let targetID = null;
	if (messageReply && messageReply.senderID) targetID = String(messageReply.senderID);
	else if (mentions && Object.keys(mentions).length > 0) targetID = String(Object.keys(mentions)[0]);

	if (!targetID) {
		return api.sendMessage(
			`🥷 | السرقة\n━━━━━━━━━━━━━━━━━━━\n` +
			`📌 | ردّ على رسالة الشخص أو منشنه\n` +
			`🎯 | نسبة النجاح: 30%\n` +
			`💰 | عند النجاح: 3% من رصيده (بحد أقصى ${eco.fmt(STEAL_MAX)}$)\n` +
			`💸 | عند الفشل: غرامة = نصف المبلغ الذي حاولت أخذه\n` +
			`🛡️ | الدرع من المتجر يحمي الضحية\n` +
			`⚡ | لا يوجد زمن انتظار`,
			threadID, messageID
		);
	}

	if (targetID === String(senderID)) {
		return api.sendMessage("🤨 | تسرق نفسك؟ فكرة سيئة…", threadID, messageID);
	}

	const botID = global.GoatBot.botID || (typeof api.getCurrentUserID === "function" ? api.getCurrentUserID() : null);
	if (botID && targetID === String(botID)) {
		return api.sendMessage("🤖 | لا تحاول سرقة البوت!", threadID, messageID);
	}

	const victimUser = await usersData.get(targetID);
	const victimData = (victimUser && victimUser.data) || {};
	const victimMoney = eco.toMoney(victimData.money);
	const victimName = (victimUser && victimUser.name) || "عضو";

	const shieldLeft = eco.num(victimData.shieldUntil, 0) - Date.now();
	if (shieldLeft > 0) {
		const minutes = Math.ceil(shieldLeft / 60000);
		return api.sendMessage(
			`🛡️ | ${victimName} محمي بالدرع!\n⏳ | الدرع ينتهي بعد ${minutes} دقيقة.`,
			threadID, messageID
		);
	}

	if (victimMoney < 500) {
		return api.sendMessage(`😅 | ${victimName} فقير جداً… لا يستحق المخاطرة.`, threadID, messageID);
	}

	const amount = Math.max(STEAL_MIN, Math.min(STEAL_MAX, Math.floor(victimMoney * STEAL_PERCENT)));
	const success = Math.random() < SUCCESS_RATE;

	if (success) {
		const moved = await eco.transfer(usersData, targetID, senderID, amount, "rob");

		if (!moved.ok) {
			return api.sendMessage("❌ | فشلت العملية (تغيّر الرصيد في نفس اللحظة). حاول مجدداً.", threadID, messageID);
		}

		await eco.withWallet(usersData, senderID, async (w) => {
			w.stat("robSuccess", 1);
			return null;
		});

		return api.sendMessage(
			`🥷 | عملية ناجحة!\n━━━━━━━━━━━━━━━━━━━\n` +
			`🎯 | الضحية: ${victimName}\n` +
			`💰 | سرقت: +${eco.fmt(amount)}$\n` +
			eco.balanceLine(moved.to.balance),
			threadID, messageID
		);
	}

	// فشل — غرامة بنصف المبلغ المستهدف
	const caught = await eco.withWallet(usersData, senderID, async (w) => {
		const fine = Math.min(w.money, Math.max(STEAL_MIN, Math.floor(amount * FINE_RATIO)));
		w.add(-fine);
		w.stat("robFail", 1);
		return { fine, balance: w.money };
	});

	return api.sendMessage(
		`🚨 | فشلت السرقة!\n━━━━━━━━━━━━━━━━━━━\n` +
		`👮 | ${victimName} انتبه لك واتصل بالشرطة\n` +
		`💸 | غرامة: -${eco.fmt(caught.fine)}$\n` +
		eco.balanceLine(caught.balance) +
		`\n\n💡 | حاول مجدداً فوراً — لا يوجد زمن انتظار`,
		threadID, messageID
	);
};
