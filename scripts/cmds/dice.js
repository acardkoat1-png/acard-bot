/**
 * /dice — حجر النرد
 * مسار الملف: scripts/cmds/dice.js
 * مردود اللعبة المتوقع: 95%
 */

const eco = require("../../func/economy.js");

module.exports.config = {
	name: "dice",
	aliases: ["نرد", "زهر", "حجر"],
	version: "2.0",
	author: "Acard",
	countDown: 8,
	role: 0,
	category: "economy",
	shortDescription: "حجر النرد — خمّن الرقم (5.7x) أو كبير/صغير (1.9x)",
	guide: { ar: "{pn} <المبلغ> <1-6|كبير|صغير>\n   مثال: {pn} 500 4\n   {pn} 500 صغير" }
};

const ARABIC_DIGITS = { "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4", "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9" };

function normalize(text) {
	return String(text || "").trim().toLowerCase().replace(/[٠-٩]/g, d => ARABIC_DIGITS[d] || d);
}

function readPick(raw) {
	const text = normalize(raw);
	if (!text) return null;
	if (["كبير", "over", "high", "+"].includes(text)) return { type: "side", side: "over", label: "كبير (4-6)" };
	if (["صغير", "under", "low", "-"].includes(text)) return { type: "side", side: "under", label: "صغير (1-3)" };
	const value = parseInt(text, 10);
	if (value >= 1 && value <= 6) return { type: "exact", value, label: `الرقم ${value}` };
	return null;
}

module.exports.onStart = async function ({ api, event, args, usersData }) {
	const { senderID, threadID, messageID } = event;
	const parsed = eco.parseAmount(args[0]);
	const pick = readPick(args[1]);

	if (parsed === null || !pick) {
		return api.sendMessage(
			`🎲 | حجر النرد\n━━━━━━━━━━━━━━━━━━━\n` +
			`📌 | الاستخدام: dice <المبلغ> <توقعك>\n` +
			`🎯 | رقم محدد (1-6) = 5.7x\n` +
			`🎯 | كبير (4،5،6) أو صغير (1،2،3) = 1.9x\n` +
			`💡 | مثال: dice 500 4 — dice 500 صغير\n` +
			`💡 | الحد الأدنى: ${eco.MIN_BET}$ — أقصى رهان: 20% من رصيدك`,
			threadID, messageID
		);
	}

	const result = await eco.withWallet(usersData, senderID, async (w) => {
		const maxBet = Math.max(eco.MIN_BET, Math.floor(w.money * 0.2));
		const bet = parsed === "all" ? maxBet : parsed;

		if (bet < eco.MIN_BET) return { error: `الحد الأدنى للرهان هو ${eco.MIN_BET}$` };
		if (bet > maxBet) return { error: `أقصى رهان مسموح: ${eco.fmt(maxBet)}$ (20% من رصيدك)` };
		if (w.money < bet) return { error: "رصيدك غير كافٍ لهذا الرهان" };

		const roll = eco.rollDice();
		const isWin = pick.type === "exact"
			? roll === pick.value
			: pick.side === "over" ? roll >= 4 : roll <= 3;

		const multiplier = isWin ? (pick.type === "exact" ? eco.DICE_EXACT : eco.DICE_SIDE) : 0;
		const payout = Math.floor(bet * multiplier);
		const net = payout - bet;

		w.add(net);
		w.recordGame("dice", net > 0);
		if (multiplier >= 5) w.stat("bigWins", 1);

		return { bet, roll, pick, isWin, multiplier, net, balance: w.money };
	});

	if (result.error) return api.sendMessage(`❌ | ${result.error}`, threadID, messageID);

	const { bet, roll, isWin, multiplier, net, balance } = result;
	const faces = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
	const die = faces[roll - 1] || "🎲";

	const text = isWin
		? `🟢 | أصبت! ${pick.type === "exact" ? "الرقم مطابق" : "التوقع صحيح"} — ${multiplier}x`
		: `🔴 | أخطأت…`;

	const netText = net >= 0 ? `+${eco.fmt(net)}$` : `-${eco.fmt(Math.abs(net))}$`;

	return api.sendMessage(
		`🎲 | حجر النرد\n━━━━━━━━━━━━━━━━━━━\n` +
		`${die} | النتيجة: ${roll}   (توقعك: ${pick.label})\n` +
		`${text}\n` +
		`💰 | ${netText} (راهنت ${eco.fmt(bet)}$)\n` +
		eco.balanceLine(balance),
		threadID, messageID
	);
};
