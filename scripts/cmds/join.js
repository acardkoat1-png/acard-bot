module.exports = {
  config: {
    name: "join",
    aliases: ["boxlist"],
    version: "2.0",
    author: "Acard",
    role: 2,
    shortDescription: "قائمة المجموعات النشطة وإضافة نفسك",
    category: "system",
    countDown: 10
  },

  onStart: async function ({ api, event }) {
    const { threadID, messageID, senderID } = event;
    const perPage = 10;

    try {
      const allThreads = await api.getThreadList(50, null, ["INBOX"]);
      const groups = allThreads.filter(t => t.isGroup && t.isSubscribed);
      if (!groups.length) return api.sendMessage("⚠️ البوت ليس في أي مجموعة حالياً.", threadID, messageID);

      const page = 1;
      const start = (page - 1) * perPage;
      const end = start + perPage;
      const currentGroups = groups.slice(start, end);

      let msg = `📦 | قائمة المجموعات (صفحة ${page})\n\n`;
      currentGroups.forEach((g, i) => {
        msg += `${start + i + 1}. ${g.name || "مجموعة بدون اسم"}\n`;
        msg += `🆔 ${g.threadID}\n\n`;
      });

      msg += "↩️ رد بـ: add 1 | add 2 5\n➡️ أو page 2 ... لرؤية المزيد من المجموعات";

      api.sendMessage(msg.trim(), threadID, (err, info) => {
        global.GoatBot.onReply.set(info.messageID, { commandName: this.config.name, author: senderID, groups, page, perPage });
      }, messageID);

    } catch (e) {
      console.error(e);
      api.sendMessage("❌ فشل جلب قائمة المجموعات النشطة.", threadID, messageID);
    }
  },

  onReply: async function ({ api, event, Reply }) {
    if (event.senderID !== Reply.author) return;

    const args = event.body.trim().toLowerCase().split(/\s+/);
    const perPage = Reply.perPage || 10;

    if (args[0] === "page") {
      const pageNum = parseInt(args[1]);
      if (isNaN(pageNum) || pageNum < 1) return api.sendMessage("❌ رقم صفحة غير صالح", event.threadID);

      const start = (pageNum - 1) * perPage;
      const end = start + perPage;
      const currentGroups = Reply.groups.slice(start, end);

      if (!currentGroups.length) return api.sendMessage("⚠️ لا توجد مجموعات أخرى", event.threadID);

      let msg = `📦 | قائمة المجموعات (صفحة ${pageNum})\n\n`;
      currentGroups.forEach((g, i) => {
        msg += `${start + i + 1}. ${g.name || "مجموعة بدون اسم"}\n`;
        msg += `🆔 ${g.threadID}\n\n`;
      });
      msg += `↩️ رد بـ: add 1 | add 2 5\n➡️ أو page ${pageNum + 1} ... لرؤية المزيد`;

      api.sendMessage(msg.trim(), event.threadID, (err, info) => {
        global.GoatBot.onReply.set(info.messageID, { commandName: Reply.commandName, author: Reply.author, groups: Reply.groups, page: pageNum, perPage });
      });
      return;
    }

    if (args[0] === "add") {
      const addUserToGroup = async (uid, tid, name) => {
        try {
          await api.addUserToGroup(uid, tid);
          await api.sendMessage(`✅ تمت إضافتك إلى: ${name}`, event.threadID);
        } catch {
          await api.sendMessage(`❌ فشلت إضافتك إلى: ${name}`, event.threadID);
        }
      };

      for (let i = 1; i < args.length; i++) {
        const index = parseInt(args[i]) - 1;
        if (isNaN(index) || index < 0 || index >= Reply.groups.length) {
          await api.sendMessage(`❌ رقم غير صالح: ${args[i]}`, event.threadID);
          continue;
        }
        const g = Reply.groups[index];
        await addUserToGroup(event.senderID, g.threadID, g.name || "مجموعة بدون اسم");
      }
    }
  }
};
