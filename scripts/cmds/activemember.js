const axios = require('axios');

module.exports = {
  config: {
    name: "activemember",
    aliases: ["am"],
    version: "2.0",
    author: "Acard",
    countDown: 5,
    role: 0,
    shortDescription: "عرض أكثر 15 عضواً نشاطاً في المجموعة",
    longDescription: "عرض أكثر 15 عضواً نشاطاً في المجموعة بناءً على عدد الرسائل المرسلة",
    category: "box chat",
    guide: "{p}{n}",
  },
  onStart: async function ({ api, event }) {
    const threadId = event.threadID;
    const senderId = event.senderID;

    try {
      // جلب معلومات المجموعة والمشاركين
      const participants = await api.getThreadInfo(threadId, { participantIDs: true });

      // إعداد عداد الرسائل لكل مشارك
      const messageCounts = {};
      participants.participantIDs.forEach(participantId => {
        messageCounts[participantId] = 0;
      });

      // جلب تاريخ المحادثة (يمكنك تعديل العدد حسب الحاجة)
      const messages = await api.getThreadHistory(threadId, 1000);

      messages.forEach(message => {
        const messageSender = message.senderID;
        if (messageCounts[messageSender] !== undefined) {
          messageCounts[messageSender]++;
        }
      });

      // ترتيب المستخدمين وإختيار أعلى 15
      const topUsers = Object.entries(messageCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15);

      // جلب أسماء المستخدمين الأكثر نشاطاً
      const userList = [];
      for (const [userId, messageCount] of topUsers) {
        const userInfo = await api.getUserInfo(userId);
        const userName = userInfo[userId].name;
        userList.push(`\n『${userName}』 \n📨 أرسل ${messageCount} رسالة \n`);
      }

      // إرسال النتيجة
      const messageText = `📊 أكثر الأعضاء نشاطاً في المجموعة:\n${userList.join('\n')}`;
      api.sendMessage({ body: messageText, mentions: [{ tag: senderId, id: senderId, type: "user" }] }, threadId);

    } catch (error) {
      console.error(error);
      api.sendMessage("❌ حدث خطأ أثناء جلب قائمة الأعضاء النشطين. يرجى المحاولة لاحقاً.", threadId);
    }
  },
};