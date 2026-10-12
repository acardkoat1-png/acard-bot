module.exports = {
  config: {
    name: "groupname",
    version: "2.0",
    author: "Acard",
    countDown: 0,
    role: 1,
    shortDescription: "تغيير اسم المجموعة",
    longDescription: "تغيير اسم المجموعة إلى الاسم الذي تدخله.",
    category: "box",
    guide: "{pn} [الاسم الجديد]"
  },

  onStart: async function ({ api, event, args }) {
    const name = args.join(" ");

    if (!name) {
      return api.sendMessage(
        "❌ | يرجى إدخال اسم المجموعة الجديد!\n\n📝 مثال: /groupname فريق الأحلام 💀",
        event.threadID,
        event.messageID
      );
    }

    try {
      await api.setTitle(name, event.threadID);
      api.sendMessage(`✅ | تم تغيير اسم المجموعة إلى:\n➡️ ${name}`, event.threadID, event.messageID);
    } catch (err) {
      console.error(err);
      api.sendMessage("⚠️ | تعذر تغيير الاسم! تأكد من صلاحيات البوت.", event.threadID, event.messageID);
    }
  }
};
