module.exports = {
  config: {
    name: "out",
    version: "2.0",
    author: "Acard",
    countDown: 5,
    role: 2,
    shortDescription: "إخراج البوت من المجموعة",
    longDescription: "هذا الأمر يخرج البوت من المجموعة الحالية أو مجموعة محددة.",
    category: "owner",
    guide: { ar: "{pn} [معرف المجموعة (اختياري)]" },
  },

  onStart: async function ({ api, event, args }) {
    const botID = api.getCurrentUserID();
    const targetThread = args[0] || event.threadID;

    try {
      await api.sendMessage("👋 وداعاً جميعاً! سأغادر المجموعة الآن...", targetThread);
      await api.removeUserFromGroup(botID, targetThread);
    } catch (error) {
      console.error(error);
      return api.sendMessage("❌ لم أستطع الخروج! ربما لست مشرفاً أو هناك مشكلة.", event.threadID);
    }
  },
};
