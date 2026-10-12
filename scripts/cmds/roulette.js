module.exports = {
  config: {
    name: "roulette",
    aliases: ["روليت", "rl"],
    version: "5.0",
    author: "Acard",
    countDown: 5,
    role: 0,
    shortDescription: { ar: "🎰 الروليت الروسي - رهان متدرج" },
    category: "economy",
    guide: { ar: "{pn} : العب الروليت\n{pn} @منشن : ألقِ اللوم على شخص آخر" }
  },

  langs: {
    ar: {
      noBalance: "❌ | رصيدك غير كاف!\n💳 | رصيدك: %1$\n💰 | تحتاج: %2$ للعب",
      death: "💀 | BANG! رصيدك صفر!\n🪦 | %1 أفلس!\n💸 | خسر: %2$",
      half: "😞 | طلقة في الكتف!\n🏥 | %1 أصيب!\n💸 | خسر: %2$\n💳 | الرصيد: %3$",
      draw: "😐 | طلقة فارغة!\n⚖️ | %1 تعادل!\n💳 | الرصيد: %2$",
      win1: "🟡 | طلقة ذهبية!\n💰 | %1 ربح %2$\n💳 | الرصيد: %3$",
      win2: "🟢 | طلقة فضية!\n💎 | %1 ربح %2$\n💳 | الرصيد: %3$",
      jackpot: "🔥 | JACKPOT!\n💥 | %1 ربح %2$\n💳 | الرصيد: %3$"
    }
  },

  onStart: async function ({ message, event, args, usersData, getLang }) {
    const { senderID, threadID, mentions } = event;
    let playerID = senderID;
    let playerName;
    if (Object.keys(mentions).length > 0) { playerID = Object.keys(mentions)[0]; playerName = mentions[playerID]; }
    else { const u = await usersData.get(senderID); playerName = u?.name || "لاعب"; }

    const userData = await usersData.get(playerID);
    const balance = userData?.data?.money ?? 100;

    // ✅ رهان متدرج حسب الرصيد
    let bet;
    if (balance < 10000) bet = 1000;
    else if (balance < 100000) bet = 10000;
    else if (balance < 1000000) bet = 50000;
    else bet = 100000;

    if (balance < bet) return message.reply(getLang("noBalance", balance, bet));

    const mentionText = playerID !== senderID ? `@${playerName}` : playerName;
    await message.reply({
      body: `🎰 | الـــروليـــت الـــروســـي\n━━━━━━━━━━━━━━━━━━━\n💀 0 = إفلاس | 🤏 1 = نصف | 😐 2 = تعادل\n🟡 3 = ربح | 🟢 4 = كبير | 🔥 5 = ضخم\n💰 | الرهان: ${bet.toLocaleString()}$\n━━━━━━━━━━━━━━━━━━━\n🎯 | جارٍ التدوير...\n🔫 | الكلبة نحو ${mentionText}`,
      mentions: playerID !== senderID ? [{ id: playerID, tag: playerName }] : []
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    const bullet = Math.floor(Math.random() * 6);
    let newBalance, msg;

    switch (bullet) {
      case 0: newBalance = 0; msg = getLang("death", playerName, bet); break;
      case 1: newBalance = balance - Math.floor(bet / 2); msg = getLang("half", playerName, Math.floor(bet / 2), newBalance); break;
      case 2: newBalance = balance; msg = getLang("draw", playerName, newBalance); break;
      case 3: newBalance = balance + bet; msg = getLang("win1", playerName, bet, newBalance); break;
      case 4: newBalance = balance + bet * 3; msg = getLang("win2", playerName, bet * 3, newBalance); break;
      case 5: newBalance = balance + bet * 6; msg = getLang("jackpot", playerName, bet * 6, newBalance); break;
    }

    await usersData.set(playerID, { ...userData, data: { ...userData.data, money: newBalance } });
    return message.reply(msg);
  }
};