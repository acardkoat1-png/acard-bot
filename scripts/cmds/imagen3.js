const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "imagen3",
    aliases: [],
    version: "2.0",
    author: "Acard",
    countDown: 10,
    role: 0,
    shortDescription: "توليد صورة باستخدام Imagen 3",
    longDescription: "توليد صورة بالذكاء الاصطناعي باستخدام Imagen 3",
    category: "ai-image",
    guide: { ar: "{pn} [وصف]\nمثال: {pn} ساموراي يقف عند الغروب" }
  },

  onStart: async function ({ args, message, event, api }) {
    const prompt = args.join(" ");
    if (!prompt) return message.reply("❌ يرجى إدخال وصف.\nمثال: imagen3 ساموراي يقف عند الغروب");

    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    const url = `https://renzweb.onrender.com/api/imagen3?prompt=${encodeURIComponent(prompt)}`;

    try {
      const response = await axios.get(url, { responseType: "arraybuffer" });
      const fileName = `${Date.now()}_imagen3.jpg`;
      const filePath = path.join(__dirname, "cache", fileName);
      fs.writeFileSync(filePath, Buffer.from(response.data, "binary"));

      message.reply({ attachment: fs.createReadStream(filePath) }, () => {
        fs.unlinkSync(filePath);
        api.setMessageReaction("✅", event.messageID, () => {}, true);
      });
    } catch (error) {
      console.error("خطأ في توليد الصورة:", error.message);
      message.reply("❌ فشل توليد الصورة.");
      api.setMessageReaction("❌", event.messageID, () => {}, true);
    }
  }
};