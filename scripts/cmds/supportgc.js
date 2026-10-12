module.exports = {
  config: {
    name: "supportgc",
    aliases: ["supportbox"],
    version: "2.0",
    author: "Acard",
    countDown: 5,
    role: 0,
    shortDescription: { ar: "إضافة المستخدم لمجموعة الدعم" },
    longDescription: { ar: "هذا الأمر يضيف المستخدم إلى مجموعة الدعم الخاصة بالمشرف." },
    category: "supportgc",
    guide: { ar: "للاستخدام: /supportgc" },
  },

  onStart: async function ({ api, event }) {
    const supportGroupId = "2253018758534493";
    const commandThreadID = event.threadID;
    const adminUID = "100078049308655";
    const userID = event.senderID;

    const userInfo = await api.getUserInfo(userID);
    const userName = userInfo[userID].name;

    const threadInfo = await api.getThreadInfo(supportGroupId);
    const participantIDs = threadInfo.participantIDs;

    if (participantIDs.includes(userID)) {
      api.sendMessage(`📌 مجموعة الدعم\n\n🤖 تنبيه: ${userName}، أنت عضو بالفعل في مجموعة الدعم.\n📩 تحقق من البريد العشوائي أو طلبات الرسائل إذا لم تظهر.`, commandThreadID);
    } else {
      api.addUserToGroup(userID, supportGroupId, (err) => {
        if (err) {
          api.sendMessage(`📌 مجموعة الدعم\n\n⚠️ خطأ: تعذر إضافة ${userName} (ID: ${userID}).\n❗ قد يكون الحساب خاصاً أو طلبات الرسائل محظورة.`, commandThreadID);
        } else {
          api.sendMessage(`✅ تمت إضافة ${userName} (ID: ${userID}) إلى مجموعة الدعم.`, commandThreadID);
          const notificationMessage = `📌 مجموعة الدعم\n\n👤 مستخدم جديد: ${userName} (ID: ${userID})\n✅ يرجى الموافقة على المستخدم في مجموعة الدعم.`;
          api.sendMessage(notificationMessage, supportGroupId);
          api.sendMessage(notificationMessage, adminUID);
        }
      });
    }
  },
};
