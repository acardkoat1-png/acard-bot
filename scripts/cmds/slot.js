module.exports.config = {
  name: "slot",
  version: "4.0",
  author: "Acard",
  role: 0,
  category: "economy",
  shortDescription: "لعبة السلوتس - مضاعفات متوازنة"
};

module.exports.onStart = async function ({ api, event, args, usersData }) {
  const { senderID, threadID, messageID } = event;
  const bet = parseInt(args[0]);
  if (!bet || bet <= 0) return api.sendMessage("❌ | أدخل مبلغ رهان", threadID, messageID);

  const userData = await usersData.get(senderID);
  let balance = userData?.data?.money ?? 100;
  if (balance < bet) return api.sendMessage("❌ | رصيدك غير كاف!", threadID, messageID);

  let multiplier;
  if (balance < 10000) multiplier = 3;
  else if (balance < 100000) multiplier = 2;
  else multiplier = 1;

  const symbols = ["🍎", "🍌", "🍒", "⭐", "7️⃣"];
  const win = Math.random() * 100 < 60;
  let slot1, slot2, slot3;
  const winAmount = bet * multiplier;

  if (win) {
    slot1 = slot2 = slot3 = symbols[Math.floor(Math.random() * symbols.length)];
    balance += winAmount;
  } else {
    do { slot1 = symbols[Math.floor(Math.random() * symbols.length)]; slot2 = symbols[Math.floor(Math.random() * symbols.length)]; slot3 = symbols[Math.floor(Math.random() * symbols.length)]; } while (slot1 === slot2 && slot2 === slot3);
    balance -= bet;
  }

  const gamesPlayed = (userData?.data?.gamesPlayed || 0) + 1;
  const gamesWon = (userData?.data?.gamesWon || 0) + (win ? 1 : 0);

  await usersData.set(senderID, {
    ...userData,
    data: { ...userData.data, money: balance, gamesPlayed, gamesWon }
  });

  const msg = win
    ? `🎰 | ${slot1} ${slot2} ${slot3}\n🏆 | ربحت ${winAmount}$ (${multiplier}x)\n💳 | ${balance}$`
    : `🎰 | ${slot1} ${slot2} ${slot3}\n💸 | خسرت ${bet}$\n💳 | ${balance}$`;
  api.sendMessage(msg, threadID, messageID);
};