const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports = {
  config: {
    name: "say",
    version: "2.0",
    author: "Acard",
    countDown: 5,
    role: 0,
    shortDescription: "تحويل النص إلى صوت بالعربية",
    longDescription: "يحول أي نص إلى صوت باستخدام Google TTS بالعربية.",
    category: "media",
    guide: { ar: "{p}say <نص>" }
  },

  onStart: async function ({ api, event, args }) {
    try {
      const text = args.join(" ") || (event.messageReply?.body ?? null);
      if (!text) return api.sendMessage("❌ يرجى كتابة نص لتحويله إلى صوت.", event.threadID, event.messageID);

      const filePath = path.join(__dirname, "cache", `${event.senderID}.mp3`);
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=ar&client=tw-ob`;

      const response = await axios.get(url, { responseType: "arraybuffer" });
      fs.writeFileSync(filePath, Buffer.from(response.data, "utf-8"));

      await api.sendMessage({ attachment: fs.createReadStream(filePath) }, event.threadID, () => { fs.unlinkSync(filePath); });
    } catch (error) {
      console.error("خطأ أمر say:", error);
      api.sendMessage("❌ حدث خطأ ما. حاول مرة أخرى لاحقاً!", event.threadID);
    }
  }
};
