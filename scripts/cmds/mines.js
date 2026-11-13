/**
 * /mines — حقل الألغام (5x5، 6 ألغام)
 * مسار الملف: scripts/cmds/mines.js
 * مردود اللعبة المتوقع: 96% — لا استراتيجية تكسب أكثر من ذلك
 *
 * يتطلب نسخة bot/handler/handlerEvents.js المرفقة (لأنه يعتمد على onReply)
 */

const eco = require("../../func/economy.js");

module.exports.config = {
	name: "mines",
	aliases: ["الغام", "ألغام", "حقل"],
	version: "2.1",
	author: "Acard",
	countDown: 5,
	role: 0,
	category: "economy",
	shortDescription: "حقل الألغام — افتح خانات واحفظ أرباحك قبل الانفجار",
	guide: { ar: "{pn} <المبلغ>\n   ثم ردّ على الرسالة برقم الخانة\n   اكتب «سحب» لتحفظ أرباحك" }
};

const sessions = new Map();
const SAFE_CELLS = eco.MINES_CELLS - eco.MINES_BOMBS;
const SESSION_TTL = 3 * 60 * 1000;

/* ————————————————— أدوات العرض ————————————————— */

function makeBoard(session, reveal) {
	const rows = [];
	for (let r = 0; r < 5; r++) {
		const cells = [];
		for (let c = 0; c < 5; c++) {
			const cell = r * 5 + c + 1;
			let text;
			if (reveal && session.bombs.has(cell)) text = "[💥]";
			else if (session.opened.has(cell)) text = "[✅]";
			else if (reveal) text = "[  ]";
			else text = `[${String(cell).padStart(2, " ")}]`;
			cells.push(text);
		}
		rows.push(cells.join(" "));
	}
	return rows.join("\n");
}

function multiplierOf(session) {
	return Number(eco.minesMultiplier(session.opened.size).toFixed(2));
}

function cashValue(session) {
	return Math.floor(session.bet * eco.minesMultiplier(session.opened.size));
}

function boardText(session) {
	const picks = session.opened.size;
	return (
		`💣 | حقل الألغام\n━━━━━━━━━━━━━━━━━━━\n` +
		`${makeBoard(session, false)}\n` +
		`━━━━━━━━━━━━━━━━━━━\n` +
		`🎯 | الخانات المفتوحة: ${picks}/${SAFE_CELLS}\n` +
		`📈 | المضاعف الحالي: ${multiplierOf(session)}x\n` +
		`💰 | قيمة السحب الآن: ${eco.fmt(cashValue(session))}$ (رهانك ${eco.fmt(session.bet)}$)\n` +
		`━━━━━━━━━━━━━━━━━━━\n` +
		`📌 | ردّ برقم خانة لفتحها، أو اكتب «سحب» لتحفظ أرباحك\n` +
		`⏳ | تنتهي الجولة تلقائياً بعد 3 دقائق (ويُسحب لك حينها)`
	);
}

function dropReply(messageID) {
	if (messageID) global.GoatBot.onReply.delete(messageID);
}

function closeSession(session) {
	if (session.timer) clearTimeout(session.timer);
	session.timer = null;
	sessions.delete(session.id);
	dropReply(session.messageID);
}

function sendBoard(api, session, threadID, replyTo) {
	api.sendMessage(boardText(session), threadID, (err, info) => {
		if (err || !info || !info.messageID) return;
		const previous = session.messageID;
		session.messageID = info.messageID;
		if (previous && previous !== info.messageID) {
			dropReply(previous);
			if (typeof api.unsendMessage === "function") api.unsendMessage(previous, () => {});
		}
		global.GoatBot.onReply.set(info.messageID, {
			commandName: "mines",
			messageID: info.messageID,
			author: session.author,
			sessionId: session.id
		});
	}, replyTo);
}

/* ————————————————— الأوامر ————————————————— */

module.exports.onStart = async function ({ api, event, args, usersData }) {
	const { senderID, threadID, messageID } = event;
	const parsed = eco.parseAmount(args[0]);

	if (parsed === null) {
		return api.sendMessage(
			`💣 | حقل الألغام\n━━━━━━━━━━━━━━━━━━━\n` +
			`📌 | الاستخدام: mines <المبلغ>\n` +
			`🕹 | 25 خانة فيها 6 ألغام — كل خانة آمنة ترفع ربحك\n` +
			`💰 | اسحب أرباحك في أي وقت قبل أن تنفجر\n` +
			`💡 | مثال: mines 500 — ثم ردّ برقم الخانة\n` +
			`⚠️ | الحد الأدنى: ${eco.MIN_BET}$ — أقصى رهان: 20% من رصيدك`,
			threadID, messageID
		);
	}

	const busy = Array.from(sessions.values()).some(s => s.author === senderID && s.threadID === threadID);
	if (busy) return api.sendMessage("⚠️ | لديك جولة ألغام مفتوحة! أكملها أو اكتب «سحب».", threadID, messageID);

	const setup = await eco.withWallet(usersData, senderID, async (w) => {
		const maxBet = Math.max(eco.MIN_BET, Math.floor(w.money * 0.2));
		const bet = parsed === "all" ? maxBet : parsed;

		if (bet < eco.MIN_BET) return { error: `الحد الأدنى للرهان هو ${eco.MIN_BET}$` };
		if (bet > maxBet) return { error: `أقصى رهان مسموح: ${eco.fmt(maxBet)}$ (20% من رصيدك)` };
		if (w.money < bet) return { error: "رصيدك غير كافٍ لهذا الرهان" };

		return { bet };
	});

	if (setup.error) return api.sendMessage(`❌ | ${setup.error}`, threadID, messageID);

	const bombs = new Set();
	while (bombs.size < eco.MINES_BOMBS) bombs.add(eco.rint(1, eco.MINES_CELLS));

	const session = {
		id: `${threadID}:${senderID}:${Date.now()}`,
		author: senderID,
		threadID,
		bet: setup.bet,
		bombs,
		opened: new Set(),
		messageID: null,
		timer: null
	};
	sessions.set(session.id, session);

	session.timer = setTimeout(() => {
		if (!sessions.has(session.id)) return;
		const picks = session.opened.size;
		const payout = picks > 0 ? cashValue(session) : session.bet;
		const net = payout - session.bet;
		const author = session.author;
		const targetThread = session.threadID;
		closeSession(session);

		eco.withWallet(usersData, author, async (w) => {
			w.add(net);
			w.recordGame("mines", net > 0);
			return w.money;
		}).then((balance) => {
			api.sendMessage(
				`⏳ | انتهى وقت الجولة — تم السحب تلقائياً\n━━━━━━━━━━━━━━━━━━━\n` +
				`💰 | ${net >= 0 ? "+" : ""}${eco.fmt(net)}$\n` +
				eco.balanceLine(balance),
				targetThread
			);
		}).catch(() => {});
	}, SESSION_TTL);

	return sendBoard(api, session, threadID, messageID);
};

module.exports.onReply = async function ({ api, event, usersData, Reply }) {
	const { senderID, threadID, body } = event;
	const session = sessions.get(Reply.sessionId);

	if (!session) {
		dropReply(Reply.messageID);
		return api.sendMessage("⌛ | انتهت هذه الجولة. ابدأ جولة جديدة: mines <المبلغ>", threadID);
	}

	if (senderID !== session.author) {
		return api.sendMessage("🙄 | هذه ليست جولتك! اكتب mines لتبدأ جولتك الخاصة.", threadID);
	}

	const text = String(body || "").trim().toLowerCase();

	/* ————— السحب ————— */
	if (["سحب", "cash", "cashout", "انسحاب", "اوقف", "أوقف"].includes(text)) {
		if (session.opened.size === 0) {
			return api.sendMessage("ℹ️ | لم تفتح أي خانة بعد — لا شيء لسحبه.", threadID);
		}
		const picks = session.opened.size;
		const payout = cashValue(session);
		const net = payout - session.bet;
		closeSession(session);

		const balance = await eco.withWallet(usersData, senderID, async (w) => {
			w.add(net);
			w.recordGame("mines", net > 0);
			return w.money;
		});

		return api.sendMessage(
			`💰 | سحبت أرباحك بنجاح!\n━━━━━━━━━━━━━━━━━━━\n` +
			`🎯 | الخانات المفتوحة: ${picks}\n` +
			`📈 | المضاعف: ${eco.minesMultiplier(picks).toFixed(2)}x\n` +
			`💵 | ${net >= 0 ? "+" : ""}${eco.fmt(net)}$\n` +
			eco.balanceLine(balance),
			threadID
		);
	}

	/* ————— فتح خانة ————— */
	const cell = parseInt(text, 10);
	if (!Number.isInteger(cell) || cell < 1 || cell > eco.MINES_CELLS) {
		return api.sendMessage("⚠️ | أدخل رقم خانة بين 1 و 25، أو اكتب «سحب».", threadID);
	}
	if (session.opened.has(cell)) {
		return api.sendMessage("⚠️ | هذه الخانة مفتوحة أصلاً — اختر غيرها.", threadID);
	}

	/* ————— انفجار ————— */
	if (session.bombs.has(cell)) {
		const net = -session.bet;
		const board = makeBoard(session, true);
		const bet = session.bet;
		closeSession(session);

		const balance = await eco.withWallet(usersData, senderID, async (w) => {
			w.add(net);
			w.recordGame("mines", false);
			return w.money;
		});

		return api.sendMessage(
			`💥 | انفجرت! ضاعت الجولة\n━━━━━━━━━━━━━━━━━━━\n` +
			`${board}\n` +
			`━━━━━━━━━━━━━━━━━━━\n` +
			`💸 | -${eco.fmt(bet)}$\n` +
			eco.balanceLine(balance) +
			`\n\n💡 | المرة القادمة اسحب أرباحك باكراً!`,
			threadID
		);
	}

	session.opened.add(cell);

	/* ————— فتح كل الخانات الآمنة ————— */
	if (session.opened.size >= SAFE_CELLS) {
		const picks = session.opened.size;
		const payout = cashValue(session);
		const net = payout - session.bet;
		const board = makeBoard(session, true);
		closeSession(session);

		const balance = await eco.withWallet(usersData, senderID, async (w) => {
			w.add(net);
			w.recordGame("mines", true);
			return w.money;
		});

		return api.sendMessage(
			`👑 | أسطورة! فتحت كل الخانات الآمنة (${picks})\n━━━━━━━━━━━━━━━━━━━\n` +
			`${board}\n` +
			`━━━━━━━━━━━━━━━━━━━\n` +
			`💵 | +${eco.fmt(net)}$\n` +
			eco.balanceLine(balance),
			threadID
		);
	}

	return sendBoard(api, session, threadID, event.messageID);
};
