/**
 * /rob — محاولة سرقة عضو آخر
 * مسار الملف: scripts/cmds/rob.js
 * 35% نجاح — عند الفشل غرامة. لا يمكن سرقة نفس الشخص أكثر من مرة كل 6 ساعات.
 */

const eco = require("../../func/economy.js");

module.exports.config = {
	name: "rob",
	aliases: ["سرقة", "اسرق", "سلب"],
	version: "2.0",
	author: "Acard",
	countDown: 10,
	role: 0,
	category: "economy",
	shortDescription: "حاول سرقة عضو (35% نجاح، وغرامة عند الفشل)",
	guide: { ar: "{pn} (بالرد على رسالة الضحية أو منشن له)" }
};

const COOLDOWN = 45 * 60 * 1000;
const SAME_TARGET = 6 * 60 * 60 * 1000;

module.exports.onStart = async function ({ api, event, usersData }) {
	const { senderID, threadID, messageID, messageReply, mentions } = event;

	let targetID = null;
	if (messageReply && messageReply.senderID) targetID = String(messageReply.senderID);
	else if (mentions && Object.keys(mentions).length > 0) targetID = String(Object.keys(mentions)[0]);

	if (!targetID) {
		return api.sendMessage(
			`🥷 | السرقة\n━━━━━━━━━━━━━━━━━━━\n` +
			`📌 | ردّ على رسالة الشخص الذي تريد سرقته، أو منشنه\n` +
			`🎯 | نسبة النجاح: 35%\n` +
			`💰 | عند النجاح: 3% من رصيده (بحد أقصى 5,000$)\n` +
			`💸 | عند الفشل: غرامة 8% من رصيدك (بحد أقصى 3,000$)\n` +
			`⏳ | مرة كل 45 دقيقة — ونفس الضحية مرة كل 6 ساعات`,
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

	// فحص حالة السارق وأزمنة الانتظار
	const check = await eco.withWallet(usersData, senderID, async (w) => {
		const cd = w.cooldown("rob", COOLDOWN);
		if (!cd.ok) return { wait: cd.left };

		const targets = w.get("robTargets", {});
		const last = eco.num(targets[targetID], 0);
		if (last > 0 && Date.now() - last < SAME_TARGET) {
			return { targetWait: SAME_TARGET - (Date.now() - last) };
		}

		return { balance: w.money, targets, name: w.user.name };
	});

	if (check.wait) {
		return api.sendMessage(`⏳ | تمهّل! حاول مجدداً بعد ${eco.timeLeft(check.wait)}.`, threadID, messageID);
	}
	if (check.targetWait) {
		return api.sendMessage(`🚫 | هذا الشخص محصّن ضدك مؤقتاً. جرّب بعد ${eco.timeLeft(check.targetWait)}.`, threadID, messageID);
	}

	const victimUser = await usersData.get(targetID);
	const victimMoney = eco.toMoney(victimUser && victimUser.data ? victimUser.data.money : 0);
	const victimName = (victimUser && victimUser.name) || "عضو";

	if (victimMoney < 500) {
		return api.sendMessage(`😅 | ${victimName} فقير جداً… لا يستحق المخاطرة.`, threadID, messageID);
	}

	const success = Math.random() < 0.35;

	if (success) {
		const amount = Math.max(50, Math.min(5000, Math.floor(victimMoney * 0.03)));
		const moved = await eco.transfer(usersData, targetID, senderID, amount, "rob");

		if (!moved.ok) {
			return api.sendMessage("❌ | فشلت العملية (تغيّر الرصيد في نفس اللحظة). حاول مجدداً.", threadID, messageID);
		}

		await eco.withWallet(usersData, senderID, async (w) => {
			w.mark("rob");
			const targets = { ...(w.get("robTargets", {})), [targetID]: Date.now() };
			w.set("robTargets", targets);
			w.stat("robSuccess", 1);
			return null;
		});

		return api.sendMessage(
			`🥷 | عملية ناجحة!\n━━━━━━━━━━━━━━━━━━━\n` +
			`🎯 | الضحية: ${victimName}\n` +
			`💰 | سرقت: +${eco.fmt(amount)}$\n` +
			eco.balanceLine(moved.to.balance) +
			`\n⏳ | الاختباء الآن… حاول مجدداً بعد 45 دقيقة`,
			threadID, messageID
		);
	}

	// فشل — غرامة
	const caught = await eco.withWallet(usersData, senderID, async (w) => {
		const fine = Math.min(w.money, Math.max(50, Math.min(3000, Math.floor(w.money * 0.08))));
		w.add(-fine);
		w.mark("rob");
		const targets = { ...(w.get("robTargets", {})), [targetID]: Date.now() };
		w.set("robTargets", targets);
		w.stat("robFail", 1);
		return { fine, balance: w.money };
	});

	return api.sendMessage(
		`🚨 | فشلت السرقة!\n━━━━━━━━━━━━━━━━━━━\n` +
		`👮 | ${victimName} انتبه لك واتصل بالشرطة\n` +
		`💸 | غرامة: -${eco.fmt(caught.fine)}$\n` +
		eco.balanceLine(caught.balance),
		threadID, messageID
	);
};
