/**
 * /bet — عجلة الحظ الأسطورية
 * مسار الملف: scripts/cmds/bet.js
 * مردود اللعبة المتوقع: 93.5% (لا يمكن ربح المال بلا نهاية)
 */

const eco = require("../../func/economy.js");

module.exports.config = {
	name: "bet",
	aliases: ["مراهنة", "راهن", "رهان"],
	version: "6.0",
	author: "Acard",
	countDown: 8,
	role: 0,
	category: "economy",
	shortDescription: "المراهنة على عجلة الحظ (مردود 93.5%)",
	guide: { ar: "{pn} <المبلغ>\n   مثال: {pn} 500\n   {pn} all — تراهن بأقصى مبلغ مسموح" }
};

const SPINS = ["🌀", "🎯", "⚡", "🔥", "💫"];

module.exports.onStart = async function ({ api, event, args, usersData }) {
	const { senderID, threadID, messageID } = event;
	const parsed = eco.parseAmount(args[0]);

	if (parsed === null) {
		return api.sendMessage(
			`🎰 | عجلة الحظ\n━━━━━━━━━━━━━━━━━━━\n` +
			`📌 | الاستخدام: bet <المبلغ>\n` +
			`💡 | الحد الأدنى: ${eco.MIN_BET}$ — أقصى رهان: 20% من رصيدك\n` +
			`🎲 | مثال: bet 500`,
			threadID, messageID
		);
	}

	const result = await eco.withWallet(usersData, senderID, async (w) => {
		const maxBet = Math.max(eco.MIN_BET, Math.floor(w.money * 0.2));
		const bet = parsed === "all" ? maxBet : parsed;

		if (bet < eco.MIN_BET) return { error: `الحد الأدنى للرهان هو ${eco.MIN_BET}$` };
		if (bet > maxBet) return { error: `أقصى رهان مسموح: ${eco.fmt(maxBet)}$ (20% من رصيدك)` };
		if (w.money < bet) return { error: "رصيدك غير كافٍ لهذا الرهان" };

		const spin = eco.rollBet();
		const payout = Math.floor(bet * spin.multiplier);
		const net = payout - bet;

		w.add(net);
		w.recordGame("bet", net > 0);
		if (spin.multiplier >= 4) w.stat("bigWins", 1);

		return { bet, spin, payout, net, balance: w.money };
	});

	if (result.error) return api.sendMessage(`❌ | ${result.error}`, threadID, messageID);

	const { bet, spin, net, balance } = result;
	const icon = eco.pick(SPINS);

	let verdict;
	if (spin.multiplier === 0) verdict = "💀 | خسارة كاملة…";
	else if (spin.multiplier < 1) verdict = "😬 | استعدت نصف رهانك فقط";
	else if (spin.multiplier < 2) verdict = "🟢 | ربح صغير";
	else if (spin.multiplier < 4) verdict = "🔥 | مضاعفة!";
	else if (spin.multiplier < 10) verdict = "💥 | ربح كبير!";
	else verdict = "👑 | الجائزة الكبرى!!!";

	const netText = net >= 0 ? `+${eco.fmt(net)}$` : `-${eco.fmt(Math.abs(net))}$`;

	const message =
		`${icon} | عجلة الحظ\n━━━━━━━━━━━━━━━━━━━\n` +
		`🎲 | رميتك: ${spin.roll} / ${spin.faces}\n` +
		`${verdict}\n` +
		`🎯 | ${spin.label} — ${spin.multiplier}x\n` +
		`💰 | ${netText} (راهنت ${eco.fmt(bet)}$)\n` +
		eco.balanceLine(balance);

	return api.sendMessage(message, threadID, messageID);
};
