const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "text_voice",
    version: "2.0",
    author: "Acard",
    countDown: 5,
    role: 0,
    shortDescription: "ردود صوتية تلقائية",
    longDescription: "يرسل رداً صوتياً عند كتابة كلمات محددة",
    category: "system",
  },

  onChat: async function ({ event, message }) {
    const { body } = event;
    if (!body) return;

    const textAudioMap = {
      "أحبك": "https://files.catbox.moe/npy7kl.mp3",
      "سلام": "https://files.catbox.moe/5rdtc6.mp3",
    };

    const key = body.trim().toLowerCase();
    const audioUrl = textAudioMap[key];
    if (!audioUrl) return;

    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

    const filePath = path.join(cacheDir, `${encodeURIComponent(key)}.mp3`);

    try {
      const response = await axios({ method: "GET", url: audioUrl, responseType: "stream" });
      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      writer.on("finish", async () => {
        await message.reply({ body: "🎵 تم تشغيل الصوت بنجاح 💖", attachment: fs.createReadStream(filePath) });
        fs.unlink(filePath, () => {});
      });

      writer.on("error", () => { message.reply("❌ فشل تشغيل الصوت"); });
    } catch (error) { message.reply("❌ خطأ في تشغيل الصوت"); }
  },

  onStart: async function () {},
};