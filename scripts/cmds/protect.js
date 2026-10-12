module.exports = {
  config: {
    name: "protect",
    version: "2.0",
    author: "Acard",
    role: 1,
    shortDescription: "قفل اسم المجموعة، الألقاب، الثيم، الإيموجي",
    category: "group",
    guide: "{pn} on/off"
  },

  onStart: async ({ api, event, message, threadsData, args }) => {
    const { threadID } = event;
    if (!args[0]) return message.reply("⚠️ الاستخدام: /protect on | /protect off");

    if (args[0] === "on") {
      const info = await api.getThreadInfo(threadID);
      const protectData = { enable: true, name: info.threadName || "", emoji: info.emoji || "", color: info.color || "", nickname: {} };
      const members = info.members || [];
      members.forEach(u => { protectData.nickname[u.userID] = u.nickname || ""; });
      await threadsData.set(threadID, protectData, "data.protect");
      return message.reply("🛡 تم تفعيل الحماية\n✨ الاسم، الألقاب، الثيم والإيموجي مقفلة الآن!");
    }

    if (args[0] === "off") {
      await threadsData.set(threadID, {}, "data.protect");
      return message.reply("🔓 تم إيقاف الحماية\n💥 جميع الأقفال مفتوحة الآن!");
    }
  },

  onEvent: async ({ api, event, threadsData }) => {
    const { threadID, author, logMessageType, logMessageData } = event;
    const protectData = await threadsData.get(threadID, "data.protect");
    if (!protectData?.enable) return;

    const info = await api.getThreadInfo(threadID);
    const isAdmin = info.adminIDs.some(e => e.id === author);
    const isBot = api.getCurrentUserID() === author;

    if (!isAdmin && !isBot) {
      if (logMessageType === "log:thread-name") api.setTitle(protectData.name, threadID);
      if (logMessageType === "log:thread-icon") api.changeThreadEmoji(protectData.emoji, threadID);
      if (logMessageType === "log:thread-color") api.changeThreadColor(protectData.color, threadID);
      if (logMessageType === "log:user-nickname") {
        const { participant_id } = logMessageData;
        api.changeNickname(protectData.nickname[participant_id] || "", threadID, participant_id);
      }
    }

    if (isAdmin) {
      if (logMessageType === "log:thread-name") await threadsData.set(threadID, logMessageData.name || "", "data.protect.name");
      if (logMessageType === "log:thread-icon") await threadsData.set(threadID, logMessageData.thread_icon || "", "data.protect.emoji");
      if (logMessageType === "log:thread-color") await threadsData.set(threadID, logMessageData.theme_id || "", "data.protect.color");
      if (logMessageType === "log:user-nickname") {
        const { participant_id, nickname } = logMessageData;
        await threadsData.set(threadID, nickname || "", `data.protect.nickname.${participant_id}`);
      }
    }
  }
};
