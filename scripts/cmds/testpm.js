module.exports = {
  config: {
    name: "testpm",
    aliases: ["اختبار", "test"],
    version: "1.0",
    author: "Acard",
    countDown: 3,
    role: 0,
    shortDescription: { ar: "اختبار المراسلة" },
    category: "system"
  },

  onStart: async function ({ message, event, api }) {
    const { senderID, threadID } = event;
    const botID = api.getCurrentUserID();
    
    let results = [];
    message.reply("🧪 | جارٍ اختبار المراسلة...");

    // ✅ اختبار 1: الخاص
    try {
      const info = await api.sendMessage("✅ | اختبار 1: رسالة في الخاص ناجحة!", senderID);
      results.push("✅ الخاص: ناجح");
    } catch (e) {
      results.push("❌ الخاص: فشل - " + (e.message || e.errorDescription || "غير معروف"));
    }

    // ✅ اختبار 2: إنشاء مجموعة
    try {
      const groupID = await api.createNewGroup([senderID, botID]);
      results.push("✅ إنشاء مجموعة: ناجح (ID: " + groupID + ")");
      
      // ✅ اختبار 3: إرسال للمجموعة
      try {
        await new Promise(resolve => setTimeout(resolve, 2000));
        await api.sendMessage("✅ | اختبار 3: رسالة في المجموعة الجديدة ناجحة!", groupID);
        results.push("✅ إرسال للمجموعة: ناجح");
      } catch (e) {
        results.push("❌ إرسال للمجموعة: فشل - " + (e.message || "غير معروف"));
      }
    } catch (e) {
      results.push("❌ إنشاء مجموعة: فشل - " + (e.message || "غير معروف"));
    }

    // ✅ عرض النتائج
    message.reply("🧪 | نتــائــج الاختــبــار\n━━━━━━━━━━━━━━━━━━━\n" + results.join("\n"));
  }
};