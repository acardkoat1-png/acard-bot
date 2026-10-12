module.exports = {
  config: {
    name: "ecoset",
    aliases: ["eco", "اقتصاد"],
    version: "1.2",
    author: "Acard",
    countDown: 3,
    role: 2,
    shortDescription: { ar: "⚙️ التحكم الكامل بالاقتصاد" },
    category: "owner",
    guide: { ar: "{pn} reset all : تصفير كل الإحصائيات عدا المستوى\n{pn} set @منشن 5000 : تعيين رصيد\n{pn} multiply all 2 : مضاعفة الأرصدة\n{pn} setall 1000 : تعيين الكل لرقم" }
  },

  langs: {
    ar: {
      doneReset: "✅ | تم تصفير جميع البيانات الاقتصادية (%1 حساباً)",
      setDone: "✅ | تم تعيين رصيد %1 إلى %2",
      setAllDone: "✅ | تم تعيين أرصدة %1 أعضاء إلى %2",
      multiplyDone: "✅ | تمت مضاعفة أرصدة %1 أعضاء",
      noTarget: "⚠️ | يرجى الرد على رسالة أو منشن"
    }
  },

  onStart: async function ({ message, event, args, usersData, getLang }) {
    const action = args[0]?.toLowerCase();
    const target = args[1];
    const value = parseInt(args[2]) || parseInt(args[1]);

    // ✅ تصفير كل الإحصائيات عدا المستوى والخبرة
    if (action === "reset" && target === "all") {
      const all = await usersData.getAll();
      
      for (const user of all) {
        // الاحتفاظ بـ exp وأي شيء متعلق بالمستوى فقط
        const savedExp = user.data?.exp;
        const savedLevel = user.data?.level;
        
        // تصفير كل شيء آخر
        await usersData.set(user.userID, {
          ...user,
          data: {
            exp: savedExp || 0,
            level: savedLevel || 0,
            money: 0,
            gamesPlayed: 0,
            gamesWon: 0,
            inventory: [],
            title: null,
            lastDaily: 0
          }
        });
      }
      
      return message.reply(getLang("doneReset", all.length));
    }

    // بقية الأوامر كما هي...
    if (action === "reset" && event.messageReply) {
      const id = event.messageReply.senderID;
      const u = await usersData.get(id);
      await usersData.set(id, { ...u, data: { ...u.data, money: 0 } });
      return message.reply(getLang("setDone", u.name, 0));
    }

    if (action === "set" && Object.keys(event.mentions || {}).length > 0) {
      const id = Object.keys(event.mentions)[0];
      const u = await usersData.get(id);
      await usersData.set(id, { ...u, data: { ...u.data, money: value } });
      return message.reply(getLang("setDone", u.name, value));
    }

    if (action === "setall" && !isNaN(value)) {
      const all = await usersData.getAll();
      for (const u of all) {
        await usersData.set(u.userID, { ...u, data: { ...u.data, money: value } });
      }
      return message.reply(getLang("setAllDone", all.length, value));
    }

    if (action === "multiply" && target === "all" && !isNaN(value)) {
      const all = await usersData.getAll();
      for (const u of all) {
        const m = (u.data?.money || 0) * value;
        await usersData.set(u.userID, { ...u, data: { ...u.data, money: m } });
      }
      return message.reply(getLang("multiplyDone", all.length));
    }

    return message.reply(getLang("noTarget"));
  }
};