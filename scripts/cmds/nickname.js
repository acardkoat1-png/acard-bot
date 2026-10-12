module.exports = {
  config: {
    name: "nickname",
    aliases: ["كنية", "لقب", "nick"],
    version: "3.0",
    author: "Acard",
    countDown: 5,
    role: 0,
    shortDescription: { ar: "لعبة الكنية - ادفع مليار لتغيير كنية شخص" },
    category: "economy",
    guide: {
      ar: "رد على رسالة الشخص + {pn} <الكنية> : تغيير كنية (1,000,000,000$)\nرد على نفسك + {pn} <الكنية> : استعادة كنية (1,000,000,000$)"
    }
  },

  langs: {
    ar: {
      noReply: "⚠️ | يرجى الرد على رسالة الشخص",
      noNickname: "⚠️ | يرجى كتابة الكنية",
      noBalance: "❌ | رصيدك غير كاف!\n💳 | %1$\n💰 | تحتاج: 1,000,000,000$",
      forceSuccess: "✅ | تم تغيير كنية %1 إلى %2!\n💰 | التكلفة: 1,000,000,000$\n💳 | رصيدك: %3$",
      selfChange: "✅ | تم استعادة كنية %1 إلى %2!\n💰 | التكلفة: 1,000,000,000$\n💳 | رصيدك: %3$",
      protected: "❌ | كنية %1 محمية!\n💡 | هو فقط يمكنه تغييرها بدفع مليار"
    }
  },

  onStart: async function ({ message, event, args, usersData, threadsData, api, getLang }) {
    const { senderID, threadID, messageReply } = event;
    if (!messageReply) return message.reply(getLang("noReply"));

    const newNick = args.join(" ");
    if (!newNick) return message.reply(getLang("noNickname"));

    const targetID = messageReply.senderID;
    const targetName = (await usersData.getName(targetID)) || "مستخدم";

    // التحقق من الرصيد
    const userData = await usersData.get(senderID);
    const balance = userData?.data?.money ?? 100;
    const COST = 1000000000; // مليار
    if (balance < COST) return message.reply(getLang("noBalance", balance));

    const protectedNicks = await threadsData.get(threadID, "data.protectedNicks", {});

    // ✅ إذا رد على نفسه = استعادة كنيته الأصلية
    if (targetID === senderID) {
      const savedNick = protectedNicks[senderID];
      const oldNick = savedNick ? savedNick.originalNick : newNick;
      
      await api.changeNickname(oldNick, threadID, senderID);
      
      // إزالة الحماية
      delete protectedNicks[senderID];
      await threadsData.set(threadID, protectedNicks, "data.protectedNicks");
      
      const newBalance = balance - COST;
      await usersData.set(senderID, {
        ...userData,
        data: { ...userData.data, money: newBalance }
      });

      return message.reply(getLang("selfChange", targetName, oldNick, newBalance));
    }

    // ✅ إذا رد على شخص آخر = فرض كنية
    if (protectedNicks[targetID]) {
      return message.reply(getLang("protected", targetName));
    }

    // ✅ حفظ الكنية الأصلية قبل التغيير
    const originalNick = targetName;

    // تغيير الكنية
    await api.changeNickname(newNick, threadID, targetID);
    
    // تخزين الحماية
    protectedNicks[targetID] = {
      originalNick: originalNick,
      currentNick: newNick,
      protectedBy: senderID,
      protectedAt: Date.now()
    };
    await threadsData.set(threadID, protectedNicks, "data.protectedNicks");

    // خصم المال
    const newBalance = balance - COST;
    await usersData.set(senderID, {
      ...userData,
      data: { ...userData.data, money: newBalance }
    });

    return message.reply({
      body: getLang("forceSuccess", targetName, newNick, newBalance),
      mentions: [{ id: targetID, tag: targetName }]
    });
  }
};