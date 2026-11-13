/**
 * /work — عمل بمهنة عشوائية كل ساعتين
 * مسار الملف: scripts/cmds/work.js
 */

const eco = require("../../func/economy.js");

module.exports.config = {
	name: "work",
	aliases: ["عمل", "اشتغل", "شغل"],
	version: "2.0",
	author: "Acard",
	countDown: 5,
	role: 0,
	category: "economy",
	shortDescription: "اعمل لتكسب مالاً كل ساعتين (دخل ثابت)",
	guide: { ar: "{pn}" }
};

const JOBS = [
	{ name: "سائق طاكسي", min: 180, max: 420, emoji: "🚕" },
	{ name: "طباخ في مطعم", min: 200, max: 460, emoji: "👨‍🍳" },
	{ name: "مبرمج مستقل", min: 260, max: 560, emoji: "💻" },
	{ name: "مدرّس خصوصي", min: 220, max: 480, emoji: "📚" },
	{ name: "بائع في السوق", min: 150, max: 380, emoji: "🛒" },
	{ name: "مصمم صور", min: 240, max: 520, emoji: "🎨" },
	{ name: "ميكانيكي", min: 190, max: 440, emoji: "🔧" },
	{ name: "مغني في حفلة", min: 210, max: 600, emoji: "🎤" }
];

const COOLDOWN = 2 * 60 * 60 * 1000;

module.exports.onStart = async function ({ api, event, usersData }) {
	const { senderID, threadID, messageID } = event;

	const result = await eco.withWallet(usersData, senderID, async (w) => {
		const check = w.cooldown("work", COOLDOWN);
		if (!check.ok) return { wait: check.left, balance: w.money };

		const job = eco.pick(JOBS);
		let pay = eco.rint(job.min, job.max);
		const critical = Math.random() < 0.08;
		if (critical) pay = Math.floor(pay * 2.5);

		w.add(pay);
		w.mark("work");
		w.stat("workShifts", 1);
		w.stat("earnedWork", pay);

		return { job, pay, critical, balance: w.money };
	});

	if (result.wait) {
		return api.sendMessage(
			`😴 | أنت متعب… ارتح قليلاً\n━━━━━━━━━━━━━━━━━━━\n` +
			`⏰ | يمكنك العمل مجدداً بعد: ${eco.timeLeft(result.wait)}\n` +
			eco.balanceLine(result.balance),
			threadID, messageID
		);
	}

	return api.sendMessage(
		`💼 | انتهت وردية العمل\n━━━━━━━━━━━━━━━━━━━\n` +
		`${result.job.emoji} | المهنة: ${result.job.name}\n` +
		`💰 | الأجر: +${eco.fmt(result.pay)}$${result.critical ? "  ⚡ (عمل ممتاز ×2.5)" : ""}\n` +
		eco.balanceLine(result.balance) +
		`\n\n⏳ | الوردية القادمة بعد ساعتين`,
		threadID, messageID
	);
};
