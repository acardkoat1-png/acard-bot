const lockedThreads = {};
const pageID = "100067158230673";

module.exports = {
  config: {
    name: "lock",
    version: "3.0",
    author: "Acard",
    countDown: 5,
    role: 1,
    description: "قفل/فتح المجموعة لمنع الأعضاء من الإرسال",
    category: "box chat"
  },

  onStart: async function({ api, event, args }) {
    const threadID = event.threadID;
    const senderID = event.senderID;
    const info = await api.getThreadInfo(threadID);
    const adminIDs = info.adminIDs.map(i => i.id);

    if (!adminIDs.includes(senderID)) return api.sendMessage("❌ المشرفون فقط يمكنهم استخدام هذا الأمر!", threadID);

    const action = args[0]?.toLowerCase();

    if (action === "on" || action === "lock") {
      if (lockedThreads[threadID]) return api.sendMessage("✅ المجموعة مقفلة مسبقاً!", threadID);
      try { await api.addUserToGroup(pageID, threadID); } catch (e) {}
      lockedThreads[threadID] = true;
      return api.sendMessage("🔒 تم قفل المجموعة! لا يمكن لأحد الإرسال الآن.", threadID);
    }

    if (action === "off" || action === "unlock") {
      if (!lockedThreads[threadID]) return api.sendMessage("✅ المجموعة مفتوحة مسبقاً!", threadID);
      delete lockedThreads[threadID];
      try { await api.removeUserFromGroup(pageID, threadID); } catch (e) { console.error("❌ خطأ في إزالة الصفحة:", e.message); }
      return api.sendMessage("🔓 تم فتح المجموعة! يمكن للجميع الإرسال الآن.", threadID);
    }

    return api.sendMessage("❌ الاستخدام: /lock on أو /lock off", threadID);
  },

  onEvent: async function({ api, event }) {
    const threadID = event.threadID;
    const senderID = event.senderID;
    if (!lockedThreads[threadID]) return;

    const info = await api.getThreadInfo(threadID);
    const adminIDs = info.adminIDs.map(i => i.id);
    if (adminIDs.includes(senderID)) return;

    try { await api.unsendMessage(event.messageID); } catch (e) { console.error(e); }
  }
};
