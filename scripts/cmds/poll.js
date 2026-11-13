/**
 * /poll — تصويت بالإيموجي (للأدمن فقط)
 * مسار الملف: scripts/cmds/poll.js
 *
 * طريقة الاستخدام:
 *   poll سؤال التصويت | الخيار الأول | الخيار الثاني | ...
 *   poll show   → عرض النتائج
 *   poll end    → إنهاء التصويت وإعلان الفائز
 *   poll cancel → إلغاء التصويت
 *
 * التصويت: الأعضاء يردّون على رسالة التصويت بالإيموجي (أو يتفاعلون به).
 * يتطلب نسخة bot/handler/handlerEvents.js المرفقة.
 */

const EMOJIS = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];
const ARABIC_DIGITS = { "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4", "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9" };
const POLL_TTL = 24 * 60 * 60 * 1000;

/** كل التصويتات النشطة: messageID → poll */
const polls = new Map();

module.exports.config = {
	name: "poll",
	aliases: ["تصويت", "استفتاء", "vote"],
	version: "2.0",
	author: "Acard",
	countDown: 5,
	role: 0,
	category: "economy",
	shortDescription: "إنشاء تصويت بالايموجي (للأدمن فقط)",
	guide: {
		ar: "poll السؤال | الخيار 1 | الخيار 2\n" +
			"   poll show — النتائج\n" +
			"   poll end — إنهاء وإعلان الفائز\n" +
			"   poll cancel — إلغاء"
	}
};

/* ————————————————— أدوات ————————————————— */

function normalize(text) {
	return String(text || "")
		.trim()
		.replace(/[\uFE0F\u20E3]/g, "")
		.replace(/[٠-٩]/g, d => ARABIC_DIGITS[d] || d);
}

/** يحوّل نصاً/إيموجي إلى رقم خيار (0-based) أو -1 */
function parseChoice(input) {
	const text = normalize(input);
	if (!text) return -1;

	for (let i = 0; i < EMOJIS.length; i++) {
		const emoji = normalize(EMOJIS[i]); // "1" .. "10"
		if (text === emoji) return i;
		const withKeycap = EMOJIS[i];
		if (input && String(input).trim() === withKeycap) return i;
	}

	if (/^\d+$/.test(text)) {
		const n = parseInt(text, 10);
		if (n >= 1 && n <= EMOJIS.length) return n - 1;
	}
	return -1;
}

function bar(count, total) {
	const width = 10;
	if (!total) return "░".repeat(width);
	const filled = Math.round((count / total) * width);
	return "█".repeat(Math.max(0, Math.min(width, filled))) + "░".repeat(Math.max(0, width - filled));
}

function tally(poll) {
	const totals = poll.options.map(() => 0);
	for (const index of poll.votes.values()) if (totals[index] !== undefined) totals[index] += 1;
	return totals;
}

function resultsText(poll) {
	const totals = tally(poll);
	const totalVotes = poll.votes.size;
	const lines = poll.options.map((option, index) => {
		const count = totals[index];
		const percent = totalVotes ? Math.round((count / totalVotes) * 100) : 0;
		return `${EMOJIS[index]} ${option} — ${count} صوت (${percent}%)\n${bar(count, totalVotes)}`;
	});

	let winner = "";
	if (totalVotes > 0) {
		let best = 0;
		totals.forEach((count, index) => { if (count > totals[best]) best = index; });
		if (totals[best] > 0) winner = `\n━━━━━━━━━━━━━━━━━━━\n🏆 | المتصدّر: ${EMOJIS[best]} ${poll.options[best]} (${totals[best]} صوت)`;
	}

	return (
		`📊 | نتائج التصويت\n━━━━━━━━━━━━━━━━━━━\n` +
		`❓ | ${poll.question}\n` +
		`━━━━━━━━━━━━━━━━━━━\n` +
		`${lines.join("\n\n")}\n` +
		`━━━━━━━━━━━━━━━━━━━\n` +
		`🗳️ | مجموع الأصوات: ${totalVotes}` +
		winner
	);
}

function dropPoll(poll) {
	if (poll.messageID) {
		global.GoatBot.onReply.delete(poll.messageID);
		global.GoatBot.onReaction.delete(poll.messageID);
	}
	if (poll.timer) clearTimeout(poll.timer);
	polls.delete(poll.messageID);
}

function isAdmin(role) {
	return Number(role) >= 1;
}

function activeInThread(threadID) {
	for (const poll of polls.values()) {
		if (poll.threadID === threadID && !poll.closed) return poll;
	}
	return null;
}

/* ————————————————— إنشاء التصويت ————————————————— */

function createPoll(api, event, parsed) {
	const { senderID, threadID, messageID } = event;

	const previous = activeInThread(threadID);
	if (previous) dropPoll(previous);

	const options = parsed.options;
	if (options.length < 2) {
		return api.sendMessage("⚠️ | التصويت يحتاج خيارين على الأقل — افصل بينها بـ |", threadID, messageID);
	}
	if (options.length > EMOJIS.length) {
		return api.sendMessage(`⚠️ | أقصى عدد خيارات هو ${EMOJIS.length}.`, threadID, messageID);
	}

	const poll = {
		id: `${threadID}:${Date.now()}`,
		threadID,
		creator: senderID,
		question: parsed.question,
		options,
		votes: new Map(),
		createdAt: Date.now(),
		closed: false,
		messageID: null,
		timer: null
	};

	const body =
		`🗳️ | تصويت جديد\n━━━━━━━━━━━━━━━━━━━\n` +
		`❓ | ${poll.question}\n` +
		`━━━━━━━━━━━━━━━━━━━\n` +
		options.map((option, index) => `${EMOJIS[index]} ${option}`).join("\n") +
		`\n━━━━━━━━━━━━━━━━━━━\n` +
		`📌 | صوّت بالرد على هذه الرسالة بالإيموجي أو بالرقم\n` +
		`📊 | poll show — النتائج   |   poll end — إنهاء\n` +
		`⏳ | ينتهي تلقائياً بعد 24 ساعة`;

	api.sendMessage(body, threadID, (err, info) => {
		if (err || !info || !info.messageID) return;
		poll.messageID = info.messageID;
		polls.set(info.messageID, poll);

		global.GoatBot.onReply.set(info.messageID, {
			commandName: "poll",
			messageID: info.messageID,
			pollId: poll.id
		});
		global.GoatBot.onReaction.set(info.messageID, {
			commandName: "poll",
			messageID: info.messageID,
			pollId: poll.id
		});

		poll.timer = setTimeout(() => {
			if (poll.closed) return;
			poll.closed = true;
			api.sendMessage(resultsText(poll) + "\n\n⏳ | انتهى وقت التصويت.", poll.threadID);
			dropPoll(poll);
		}, POLL_TTL);
	}, messageID);
}

/* ————————————————— الأمر ————————————————— */

module.exports.onStart = async function ({ api, event, args, role }) {
	const { threadID, messageID } = event;
	const text = args.join(" ").trim();
	const lower = text.toLowerCase();

	// النتائج — متاحة للجميع
	if (["show", "عرض", "نتائج", "النتائج", "result", "results"].includes(lower)) {
		const poll = activeInThread(threadID);
		if (!poll) return api.sendMessage("ℹ️ | لا يوجد تصويت نشط في هذه المجموعة.", threadID, messageID);
		return api.sendMessage(resultsText(poll), threadID, messageID);
	}

	// كل ما تبقّى للأدمن فقط
	if (!isAdmin(role)) {
		return api.sendMessage(
			`⛔ | هذا الأمر للمشرفين فقط!\n📌 | الأعضاء يستعملون: poll show لعرض النتائج`,
			threadID, messageID
		);
	}

	if (!text) {
		return api.sendMessage(
			`🗳️ | نظام التصويت\n━━━━━━━━━━━━━━━━━━━\n` +
			`📌 | إنشاء تصويت:\n` +
			`poll السؤال | الخيار الأول | الخيار الثاني\n\n` +
			`📊 | poll show — النتائج\n` +
			`✅ | poll end — إنهاء وإعلان الفائز\n` +
			`❌ | poll cancel — إلغاء التصويت\n\n` +
			`💡 | مثال:\n` +
			`poll ما هي لعبتكم المفضلة؟ | سلوتس | نرد | ألغام`,
			threadID, messageID
		);
	}

	if (["end", "انهاء", "إنهاء", "close", "أغلق", "اغلق"].includes(lower)) {
		const poll = activeInThread(threadID);
		if (!poll) return api.sendMessage("ℹ️ | لا يوجد تصويت نشط.", threadID, messageID);
		poll.closed = true;
		const summary = resultsText(poll);
		dropPoll(poll);
		return api.sendMessage(summary + "\n\n✅ | تم إنهاء التصويت.", threadID, messageID);
	}

	if (["cancel", "الغاء", "إلغاء", "الغي", "ألغي"].includes(lower)) {
		const poll = activeInThread(threadID);
		if (!poll) return api.sendMessage("ℹ️ | لا يوجد تصويت نشط.", threadID, messageID);
		dropPoll(poll);
		return api.sendMessage("❌ | تم إلغاء التصويت.", threadID, messageID);
	}

	// إنشاء
	const parts = text.split("|").map(part => part.trim()).filter(Boolean);
	if (parts.length < 3) {
		return api.sendMessage(
			`⚠️ | الصيغة غير صحيحة.\n📌 | poll السؤال | الخيار 1 | الخيار 2\n💡 | مثال: poll نلعب؟ | نعم | لا`,
			threadID, messageID
		);
	}

	return createPoll(api, event, { question: parts[0], options: parts.slice(1) });
};

/* ————————————————— التصويت بالرد ————————————————— */

module.exports.onReply = async function ({ api, event, Reply }) {
	const poll = polls.get(Reply.messageID);
	if (!poll || poll.closed) return api.sendMessage("⌛ | هذا التصويت انتهى.", event.threadID);

	const choice = parseChoice(event.body);
	if (choice < 0 || choice >= poll.options.length) {
		return api.sendMessage(
			`⚠️ | صوّت بإيموجي أو رقم من 1 إلى ${poll.options.length}\n` +
			poll.options.map((option, index) => `${EMOJIS[index]} ${option}`).join("\n"),
			event.threadID
		);
	}

	return castVote(api, poll, String(event.senderID), choice, true, event.threadID);
};

/* ————————————————— التصويت بالتفاعل ————————————————— */

module.exports.onReaction = async function ({ api, event }) {
	const poll = polls.get(event.messageID);
	if (!poll || poll.closed) return;

	const choice = parseChoice(event.reaction);
	if (choice < 0 || choice >= poll.options.length) return;

	return castVote(api, poll, String(event.senderID), choice, false, event.threadID);
};

/* ————————————————— تسجيل الصوت ————————————————— */

function castVote(api, poll, userID, choice, announce, threadID) {
	const previous = poll.votes.get(userID);
	if (previous === choice) {
		if (announce) api.sendMessage(`ℹ️ | صوتك مسجّل بالفعل على ${EMOJIS[choice]} ${poll.options[choice]}`, threadID);
		return;
	}

	poll.votes.set(userID, choice);

	if (announce) {
		api.sendMessage(
			`✅ | تم تسجيل صوتك: ${EMOJIS[choice]} ${poll.options[choice]}\n` +
			`📊 | مجموع الأصوات: ${poll.votes.size}`,
			threadID
		);
	}
}
