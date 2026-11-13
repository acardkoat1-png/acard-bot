/**
 * /daily — المكافأة اليومية مع سلسلة الأيام
 * مسار الملف: scripts/cmds/daily.js
 */

const eco = require("../../func/economy.js");

module.exports.config = {
	name: "daily",
	aliases: ["يومي", "مكافاة", "مكافأة"],
	version: "4.0",
	author: "Acard",
	countDown: 5,
	role: 0,
	category: "economy",
	shortDescription: "مكافأتك اليومية — كل يوم متتالٍ يزيد الجائزة",
	guide: { ar: "{pn}" }
};

const REWARDS = [400, 700, 1000, 1400, 1800, 2300, 3000];
const COOLDOWN = 22 * 60 * 60 * 1000;
const STREAK_WINDOW = 48 * 60 * 60 * 1000;

module.exports.onStart = async function ({ api, event, usersData }) {
	const { senderID, threadID, messageID } = event;

	const result = await eco.withWallet(usersData, senderID, async (w) => {
		const last = eco.num(w.get("lastDaily", 0), 0);
		const now = Date.now();
		const gap = now - last;

		if (last > 0 && gap < COOLDOWN) {
			return { wait: COOLDOWN - gap, streak: eco.num(w.get("dailyStreak", 1), 1), balance: w.money };
		}

		let streak = eco.num(w.get("dailyStreak", 0), 0);
		if (last > 0 && gap <= STREAK_WINDOW) streak += 1;
		else streak = 1;
		if (streak > 7) streak = 7;

		const reward = REWARDS[streak - 1];
		w.add(reward);
		w.set("lastDaily", now);
		w.set("dailyStreak", streak);
		w.stat("dailyClaims", 1);

		return { reward, streak, balance: w.money, balanceBefore: w.money - reward };
	});

	if (result.wait) {
		return api.sendMessage(
			`⏳ | أخذت مكافأتك بالفعل!\n━━━━━━━━━━━━━━━━━━━\n` +
			`🔥 | سلسلتك الحالية: ${result.streak} يوم\n` +
			`⏰ | عد بعد: ${eco.timeLeft(result.wait)}\n` +
			eco.balanceLine(result.balance),
			threadID, messageID
		);
	}

	const nextDay = Math.min(result.streak + 1, 7);
	const nextReward = REWARDS[nextDay - 1];
	const chest = result.streak === 7 ? "\n👑 | أكملت أسبوعاً كاملاً! جائزة قصوى" : "";

	return api.sendMessage(
		`🎁 | المكافأة اليومية\n━━━━━━━━━━━━━━━━━━━\n` +
		`🔥 | السلسلة: ${result.streak} / 7 يوم\n` +
		`💰 | ربحت: +${eco.fmt(result.reward)}$\n` +
		eco.balanceLine(result.balance) +
		chest +
		`\n\n📅 | غداً: +${eco.fmt(nextReward)}$ إن عدت في الوقت` +
		`\n💡 | المكافأة أكبر كل يوم متتالٍ — لا تقطع السلسلة!`,
		threadID, messageID
	);
};
