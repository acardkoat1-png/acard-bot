module.exports = {
  config: {
    name: "hunter",
    aliases: ["sayd", "صياد", "صيد"],
    version: "2.0",
    author: "Acard",
    role: 0,
    category: "economy",
    shortDescription: "لعبة الصياد - اكتب الكلمة قبل انتهاء الوقت",
    countDown: 5
  },

  langs: {
    ar: {
      noBalance: "❌ | رصيدك غير كاف!\n💳 | رصيدك الحالي: %1 دولار\n📌 | تحتاج %2 دولاراً للعب",
      gameStart: "🎯 | لــعــبــة الــصــيــاد\n━━━━━━━━━━━━━━━━━\n✍️ | اكتب هذه الكلمة بسرعة:\n\n           🎯 \"%1\"\n\n━━━━━━━━━━━━━━━━━\n⏱ | لديك 10 ثوانٍ فقط!\n💰 | الجائزة: +%2 دولار\n❌ | الخطأ: -%3 دولار",
      win: "🎉 | صــيــاد مــاهــر!\n━━━━━━━━━━━━━━━━━\n✅ | أحسنت! كتبتها بشكل صحيح\n💰 | ربحت: +%1 دولار\n💳 | رصيدك: %2 دولار",
      lose: "❌ | فــاتــك الــهــدف!\n━━━━━━━━━━━━━━━━━\n💸 | الكلمة كانت: %1\n💸 | خسرت: -%2 دولار\n💳 | رصيدك: %3 دولار",
      timeout: "⏰ | انــتــهى الــوقــت!\n━━━━━━━━━━━━━━━━━\n💸 | الكلمة كانت: %1\n💸 | خسرت: -%2 دولار\n💳 | رصيدك: %3 دولار"
    }
  },

  onStart: async function ({ message, event, usersData, getLang }) {
    const { senderID, threadID } = event;
    const userData = await usersData.get(senderID);
    const balance = userData?.data?.money ?? 100;

    // ✅ مكافأة عكسية حسب الرصيد
    let bonus, penalty, minBalance;
    if (balance < 10000) { bonus = 5000; penalty = 100; minBalance = 100; }
    else if (balance < 100000) { bonus = 2000; penalty = 200; minBalance = 200; }
    else if (balance < 1000000) { bonus = 1000; penalty = 500; minBalance = 500; }
    else { bonus = 500; penalty = 1000; minBalance = 1000; }

    if (balance < minBalance) return message.reply(getLang("noBalance", balance, minBalance));

    const words = ["ثعلب", "نجمة", "قمر", "شمس", "بحر", "جبل", "وردة", "كتاب", "قلم", "باب", "نافذة", "حديقة", "مدرسة", "مستشفى", "سيارة", "طائرة", "قطار", "سفينة", "دراجة", "طريق", "أسد", "نمر", "فيل", "زرافة", "بطريق", "دلفين", "نسر", "صقر", "حمامة", "عصفور", "تفاح", "برتقال", "عنب", "موز", "فراولة", "مانجو", "بطيخ", "رمان", "ليمون", "خوخ", "أحمر", "أزرق", "أخضر", "أصفر", "بنفسجي", "ذهبي", "فضي", "أبيض", "أسود"];
    
    const targetWord = words[Math.floor(Math.random() * words.length)];
    const gameMsg = await message.reply(getLang("gameStart", targetWord, bonus, penalty));

    global.GoatBot.onReply.set(gameMsg.messageID, {
      commandName: "hunter", messageID: gameMsg.messageID,
      targetWord: targetWord, author: senderID, bonus: bonus, penalty: penalty
    });

    setTimeout(async () => {
      if (global.GoatBot.onReply.has(gameMsg.messageID)) {
        global.GoatBot.onReply.delete(gameMsg.messageID);
        const currentData = await usersData.get(senderID);
        const currentBalance = currentData?.data?.money ?? 100;
        const newBalance = Math.max(0, currentBalance - penalty);
        await usersData.set(senderID, { ...currentData, data: { ...currentData.data, money: newBalance } });
        message.reply(getLang("timeout", targetWord, penalty, newBalance));
      }
    }, 10000);
  },

  onReply: async function ({ message, event, usersData, Reply, getLang }) {
    const { senderID, body } = event;
    const { targetWord, author, bonus, penalty } = Reply;
    if (senderID !== author) return;
    global.GoatBot.onReply.delete(Reply.messageID);

    const userData = await usersData.get(senderID);
    const balance = userData?.data?.money ?? 100;

    if (body.trim() === targetWord) {
      const newBalance = balance + bonus;
      await usersData.set(senderID, { ...userData, data: { ...userData.data, money: newBalance } });
      return message.reply(getLang("win", bonus, newBalance));
    }
    
    const newBalance = Math.max(0, balance - penalty);
    await usersData.set(senderID, { ...userData, data: { ...userData.data, money: newBalance } });
    return message.reply(getLang("lose", targetWord, penalty, newBalance));
  }
};