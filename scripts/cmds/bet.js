module.exports.config = {
  name: "bet",
  version: "5.1",
  author: "Acard",
  role: 0,
  category: "economy",
  shortDescription: "لعبة المراهنة"
};

module.exports.onStart = async function ({ api, event, args, usersData }) {
  const { senderID, threadID, messageID } = event;
  if (!args[0]) return api.sendMessage("🎰 | الاستخدام: bet <المبلغ>", threadID, messageID);

  const bet = parseInt(args[0]);
  if (!bet || bet <= 0) return api.sendMessage("❌ | مبلغ الرهان غير صالح!", threadID, messageID);

  const userData = await usersData.get(senderID);
  let balance = userData?.data?.money ?? 100;

  // ✅ حد أقصى 10% مع حد أدنى 50
  const maxBet = Math.max(50, Math.floor(balance * 0.10));
  if (bet > maxBet) return api.sendMessage(`❌ | أقصى رهان: ${maxBet.toLocaleString()}$`, threadID, messageID);
  if (balance < bet) return api.sendMessage(`❌ | رصيدك غير كاف!`, threadID, messageID);

  let maxMultiplier;
  if (balance < 10000) maxMultiplier = 3;
  else if (balance < 100000) maxMultiplier = 2;
  else maxMultiplier = 1;

  const outcomes = [
    { text: "💥 خسرت كل الرهان!", multiplier: 0 },
    { text: "😞 استعدت نصف الرهان.", multiplier: 0.5 },
    { text: "🟡 تعادلت.", multiplier: 1 },
    { text: "🟢 ضاعفت!", multiplier: 2 },
    { text: `🔥 ${maxMultiplier} أضعاف`, multiplier: maxMultiplier }
  ];

  let winChance;
  if (balance < 10000) winChance = 0.70;
  else if (balance < 100000) winChance = 0.60;
  else if (balance < 1000000) winChance = 0.50;
  else winChance = 0.40;

  const win = Math.random() < winChance;
  let selected;
  if (win) {
    const winOutcomes = outcomes.filter(o => o.multiplier > 0);
    selected = winOutcomes[Math.floor(Math.random() * winOutcomes.length)];
  } else {
    const loseOutcomes = outcomes.filter(o => o.multiplier < 1);
    selected = loseOutcomes[Math.floor(Math.random() * loseOutcomes.length)];
  }

  const reward = Math.floor(bet * selected.multiplier);
  balance = balance - bet + reward;

  const gamesPlayed = (userData?.data?.gamesPlayed || 0) + 1;
  const gamesWon = (userData?.data?.gamesWon || 0) + (reward > bet ? 1 : 0);

  await usersData.set(senderID, {
    ...userData,
    data: { ...userData.data, money: balance, gamesPlayed, gamesWon }
  });

  const profit = reward - bet;
  const profitText = profit >= 0 ? `+${profit.toLocaleString()}` : `${profit.toLocaleString()}`;
  const msg = `${selected.text}\n🎰 | راهنت: ${bet.toLocaleString()}$\n💸 | ${profitText}$\n💳 | ${balance.toLocaleString()}$`;
  api.sendMessage(msg, threadID, messageID);
};