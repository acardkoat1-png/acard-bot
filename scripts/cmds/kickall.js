module.exports = {
  config: {
    name: "kickall",
    version: "2.0",
    author: "Acard",
    role: 2,
    shortDescription: { ar: "طرد الجميع من المجموعة" },
    category: "owner",
    guide: { ar: "{prefix}kickall" }
  },

  onStart: async function ({ api, event }) {
    const threadID = event.threadID;
    const senderID = event.senderID;

    try {
      const threadInfo = await api.getThreadInfo(threadID);
      if (!threadInfo.adminIDs.some(item => item.id === api.getCurrentUserID())) {
        return api.sendMessage("❌ يجب أن يكون البوت مشرفاً لطرد الأعضاء.", threadID);
      }

      const membersToKick = threadInfo.participantIDs.filter(id => id !== senderID && id !== api.getCurrentUserID());
      if (membersToKick.length === 0) {
        return api.sendMessage("❌ لا يوجد أعضاء للطرد.", threadID);
      }

      api.sendMessage(`⚠️ جارٍ طرد ${membersToKick.length} عضو...`, threadID, async () => {
        for (const userID of membersToKick) {
          try { await api.removeUserFromGroup(userID, threadID); }
          catch (e) { console.log(`❌ فشل طرد ${userID}: ${e.message}`); }
        }
      });
    } catch (e) {
      console.error(e);
      api.sendMessage("❌ حدث خطأ أثناء محاولة طرد الأعضاء.", threadID);
    }
  }
};
