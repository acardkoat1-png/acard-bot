module.exports = {
  config: {
    name: "bal",
    aliases: ["رصيد", "money"],
    version: "2.0",
    author: "Acard",
    countDown: 3,
    role: 2,
    shortDescription: { ar: "إدارة الأرصدة - تصفير وتعيين" },
    category: "owner",
    guide: {
      ar: "{pn} clear (رد/منشن) : تصفير رصيد\n{pn} clear all : تصفير جميع الأرصدة\n{pn} set <مبلغ> (رد/منشن) : تعيين رصيد"
    }
  },

  langs: {
    ar: {
      cleared: "✅ | تم تصفير رصيد %1!\n💳 | الرصيد: 0$",
      clearedAll: "✅ | تم تصفير جميع الأرصدة (%1 حساباً)",
      setSuccess: "✅ | تم تعيين رصيد %1 إلى %2$",
      noTarget: "⚠️ | يرجى الرد على رسالة أو منشن",
      noAmount: "⚠️ | يرجى إدخال المبلغ\n📌 | bal set 5000 @محمد"
    }
  },

  onStart: async function ({ message, event, args, usersData, getLang }) {
    const { messageReply, mentions } = event;
    const action = args[0]?.toLowerCase();
    
    // ✅ تصفير جميع الأرصدة
    if (action === "clear" && args[1]?.toLowerCase() === "all") {
      const allUsers = await usersData.getAll();
      for (const user of allUsers) {
        await usersData.set(user.userID, {
          ...user,
          data: { ...user.data, money: 0 }
        });
      }
      return message.reply(getLang("clearedAll", allUsers.length));
    }

    let targetID;
    if (messageReply) targetID = messageReply.senderID;
    else if (Object.keys(mentions).length > 0) targetID = Object.keys(mentions)[0];
    else if (action !== "clear" || !args[1]) return message.reply(getLang("noTarget"));

    const targetData = await usersData.get(targetID);
    const targetName = targetData?.name || "مستخدم";

    if (action === "clear" || action === "تصفير") {
      await usersData.set(targetID, {
        ...targetData,
        data: { ...targetData.data, money: 0 }
      });
      return message.reply(getLang("cleared", targetName));
    }

    if (action === "set" || action === "تعيين") {
      const amount = parseInt(args[1]);
      if (!amount) return message.reply(getLang("noAmount"));
      await usersData.set(targetID, {
        ...targetData,
        data: { ...targetData.data, money: amount }
      });
      return message.reply(getLang("setSuccess", targetName, amount.toLocaleString()));
    }
  }
};