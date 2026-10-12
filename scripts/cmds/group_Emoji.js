module.exports = {
  config: {
    name: "emoji",
    version: "2.0",
    author: "Acard",
    countDown: 0,
    role: 0,
    shortDescription: "تغيير إيموجي المجموعة 😘",
    longDescription: "تغيير إيموجي المجموعة (التفاعل السريع) بأمر واحد!",
    category: "box chat",
    guide: "{pn} 😘"
  },

  onStart: async function ({ api, event, args }) {
    const emoji = args.join(" ");

    if (!emoji) {
      return api.sendMessage("❌ | يرجى إدخال إيموجي! مثال: /emoji 😘", event.threadID, event.messageID);
    }

    try {
      await api.changeThreadEmoji(emoji, event.threadID);
      return api.sendMessage(`✅ | تم تغيير إيموجي المجموعة بنجاح إلى ${emoji}!`, event.threadID, event.messageID);
    } catch (err) {
      console.error(err);
      return api.sendMessage("⚠️ | حدث خطأ أثناء تغيير الإيموجي، حاول مرة أخرى!", event.threadID, event.messageID);
    }
  }
};
