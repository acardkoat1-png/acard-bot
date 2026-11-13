/**
 * /wallet — محفظتك + دليل الاقتصاد والألعاب
 * مسار الملف: scripts/cmds/wallet.js
 * (الاسم wallet لتفادي التعارض مع الأمر الموجود ecoset/eco)
 */

const eco = require("../../func/economy.js");

module.exports.config = {
	name: "wallet",
	aliases: ["محفظة", "ecohelp", "flous"],
	version: "2.0",
	author: "Acard",
	countDown: 5,
	role: 0,
	category: "economy",
	shortDescription: "محفظتك وإحصاءاتك + دليل أوامر الاقتصاد",
	guide: { ar: "{pn}" }
};

module.exports.onStart = async function ({ api, event, usersData }) {
	const { senderID, threadID, messageID } = event;
	const me = await usersData.get(senderID);
	const money = eco.toMoney(me && me.data ? me.data.money : 0);
	const data = (me && me.data) || {};
	const stats = data.stats || {};
	const played = eco.num(data.gamesPlayed, eco.num(stats.gamesPlayed, 0));
	const won = eco.num(data.gamesWon, eco.num(stats.gamesWon, 0));
	const rate = played > 0 ? Math.round((won / played) * 100) : 0;
	const streak = eco.num(data.dailyStreak, 0);

	return api.sendMessage(
		`💰 | محفظتك\n━━━━━━━━━━━━━━━━━━━\n` +
		`💳 | الرصيد: ${eco.fmt(money)}$\n` +
		`🎮 | جولات لعبتها: ${eco.fmt(played)} — ربحتها: ${eco.fmt(won)} (${rate}%)\n` +
		`🔥 | سلسلة daily: ${streak} / 7\n` +
		`━━━━━━━━━━━━━━━━━━━\n` +
		`🎰 | bet <مبلغ> — عجلة الحظ (عائد 93.5%)\n` +
		`🍒 | slot <مبلغ> — السلوتس حتى 60x (عائد 93%)\n` +
		`🎲 | dice <مبلغ> <1-6|كبير|صغير> — النرد (عائد 95%)\n` +
		`💣 | mines <مبلغ> — حقل الألغام (عائد 96%)\n` +
		`━━━━━━━━━━━━━━━━━━━\n` +
		`🎁 | daily — مكافأة يومية + سلسلة 7 أيام\n` +
		`💼 | work — عمل كل ساعتين\n` +
		`🥷 | rob — سرقة عضو (35% نجاح)\n` +
		`💸 | give <مبلغ> — تحويل بالرد أو المنشن\n` +
		`🏆 | leaderboard — أغنى الأعضاء\n` +
		`🗳️ | poll — تصويت بالايموجي (أدمن)\n` +
		`━━━━━━━━━━━━━━━━━━━\n` +
		`💡 | أقصى رهان = 20% من رصيدك`,
		threadID, messageID
	);
};
