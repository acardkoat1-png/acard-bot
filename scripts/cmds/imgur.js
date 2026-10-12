const axios = require('axios');

module.exports = {
  config: {
    name: "imgur",
    version: "2.0",
    author: "Acard",
    role: 0,
    shortDescription: "رفع صورة/فيديو/GIF إلى Imgur",
    longDescription: "قم بالرد على أي صورة أو فيديو أو GIF لرفعها إلى Imgur والحصول على الرابط.",
    category: "other",
    guide: "[رد على ملف وسائط]",
    cooldowns: 0
  },

  onStart: async function ({ api, event }) {
    let Shaon;
    try {
      const apis = await axios.get('https://raw.githubusercontent.com/shaonproject/Shaon/main/api.json');
      Shaon = apis.data.imgur;
    } catch {
      return api.sendMessage("❌ فشل جلب رابط API!", event.threadID, event.messageID);
    }

    const reply = event.messageReply;
    if (!reply || !reply.attachments || reply.attachments.length === 0) {
      return api.sendMessage("يرجى الرد على الصورة أو الفيديو مع الأمر...!✅", event.threadID, event.messageID);
    }

    const links = [];

    for (const attachment of reply.attachments) {
      try {
        const url = encodeURIComponent(attachment.url);
        const upload = await axios.get(`${Shaon}/imgur?link=${url}`);
        links.push(upload.data.uploaded.image || "❌ لم يتم استلام رابط");
      } catch (e) {
        links.push("❌ فشل الرفع");
      }
    }

    const messageToSend = links.length === 1
      ? links[0]
      : `✅ روابط الملفات المرفوعة:\n\n${links.join("\n")}`;

    return api.sendMessage(messageToSend, event.threadID, event.messageID);
  }
};
