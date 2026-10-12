module.exports = {
  config: {
    name: "give",
    aliases: ["اعطي", "تحويل", "transfer"],
    version: "1.0",
    author: "Acard",
    countDown: 3,
    role: 0,
    shortDescription: {
      ar: "تحويل عملات إلى شخص آخر من رصيدك"
    },
    category: "economy",
    guide: {
      ar: "{pn} <المبلغ> (بالرد على رسالة الشخص أو منشن له)"
    }
  },

  langs: {
    ar: {
      missingAmount: "⚠️ | يرجى إدخال المبلغ الذي تريد تحويله\n📌 | مثال: give 500",
      invalidAmount: "⚠️ | يرجى إدخال مبلغ صحيح أكبر من صفر",
      noTarget: "⚠️ | يرجى الرد على رسالة الشخص أو منشنه لتحويل المال إليه",
      noBalance: "❌ | رصيدك غير كاف!\n💳 | رصيدك: %1 دولار\n💰 | المبلغ المطلوب: %2 دولار",
      cantGiveSelf: "❌ | لا يمكنك تحويل المال لنفسك!",
      success: "✅ | تــم الــتــحــويــل\n━━━━━━━━━━━━━━━━━\n👤 | من: %1\n👤 | إلى: %2\n💰 | المبلغ: %3 دولار\n💳 | رصيدك الجديد: %4 دولار",
      received: "📩 | وصــلك تــحــويــل\n━━━━━━━━━━━━━━━━━\n👤 | من: %1\n💰 | المبلغ: +%2 دولار\n💳 | رصيدك الجديد: %3 دولار"
    }
  },

  onStart: async function ({ message, event, args, usersData, getLang }) {
    const { senderID, threadID, messageReply, mentions } = event;

    // التحقق من المبلغ
    const amount = parseInt(args[0]);
    if (!amount || amount <= 0) {
      if (!args[0]) return message.reply(getLang("missingAmount"));
      return message.reply(getLang("invalidAmount"));
    }

    // تحديد المستلم
    let targetID;
    if (messageReply) {
      targetID = messageReply.senderID;
    } else if (Object.keys(mentions).length > 0) {
      targetID = Object.keys(mentions)[0];
    } else {
      return message.reply(getLang("noTarget"));
    }

    // لا يمكن التحويل لنفسك
    if (targetID === senderID) {
      return message.reply(getLang("cantGiveSelf"));
    }

    // جلب بيانات المرسل
    const senderData = await usersData.get(senderID);
    const senderMoney = senderData?.data?.money ?? 100;
    const senderName = senderData?.name || "مستخدم";

    // التحقق من الرصيد
    if (senderMoney < amount) {
      return message.reply(getLang("noBalance", senderMoney, amount));
    }

    // جلب بيانات المستلم
    const targetData = await usersData.get(targetID);
    const targetMoney = targetData?.data?.money ?? 100;
    const targetName = targetData?.name || "مستخدم";

    // خصم من المرسل
    const newSenderMoney = senderMoney - amount;
    await usersData.set(senderID, {
      ...senderData,
      data: { ...senderData.data, money: newSenderMoney }
    });

    // إضافة للمستلم
    const newTargetMoney = targetMoney + amount;
    await usersData.set(targetID, {
      ...targetData,
      data: { ...targetData.data, money: newTargetMoney }
    });

    // رسالة تأكيد للمرسل
    message.reply(getLang("success", senderName, targetName, amount, newSenderMoney));

    // إشعار للمستلم
    message.reply({
      body: getLang("received", senderName, amount, newTargetMoney),
      mentions: [{ id: targetID, tag: targetName }]
    });
  }
};