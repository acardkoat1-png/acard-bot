const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "download",
    version: "2.0",
    author: "Acard",
    countDown: 5,
    role: 0,
    shortDescription: "تحميل الوسائط من رابط مباشر",
    category: "media",
    guide: "{pn} <رابط-مباشر>"
  },

  onStart: async function ({ api, event, args }) {
    const url = args[0];

    if (!url) {
      return api.sendMessage(
        "⚠️ يرجى إدخال رابط تحميل مباشر.\n\nمثال:\n/download https://example.com/video.mp4",
        event.threadID,
        event.messageID
      );
    }

    const supported = [
      ".mp4", ".mp3",
      ".jpg", ".jpeg", ".png", ".gif",
      ".pdf", ".docx", ".txt", ".zip"
    ];

    const ext = path.extname(url.split("?")[0]).toLowerCase();

    if (!supported.includes(ext)) {
      return api.sendMessage(
        "❌ نوع ملف غير مدعوم!\n\nالأنواع المدعومة:\nmp4, mp3, jpg, png, gif, pdf, docx, txt, zip",
        event.threadID,
        event.messageID
      );
    }

    const fileName = `download${ext}`;

    try {
      const loadingMsg = await api.sendMessage(
        "⏳ جارٍ التحميل...",
        event.threadID
      );

      const res = await axios.get(url, {
        responseType: "arraybuffer",
        timeout: 30000
      });

      fs.writeFileSync(fileName, res.data);

      api.unsendMessage(loadingMsg.messageID);

      api.sendMessage(
        {
          body: `✅ تم التحميل بنجاح!\n📥 الملف: ${fileName}`,
          attachment: fs.createReadStream(fileName)
        },
        event.threadID,
        () => fs.unlinkSync(fileName)
      );

    } catch (err) {
      console.error(err);
      api.sendMessage(
        "❌ فشل التحميل! الرابط قد لا يكون مباشراً.",
        event.threadID
      );
    }
  }
};
