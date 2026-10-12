const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "weigen",
    aliases: ["wgen"],
    version: "2.0",
    author: "Acard",
    countDown: 3,
    role: 0,
    shortDescription: "توليد صورة بالذكاء الاصطناعي",
    longDescription: "توليد صورة باستخدام Weigen AI",
    category: "AI-IMAGE",
    guide: "{pn} <وصف>"
  },

  onStart: async function ({ api, event, args }) {
    const prompt = args.join(" ");
    if (!prompt) return api.sendMessage("⚠️ | يرجى إدخال وصف للصورة.", event.threadID, event.messageID);
    const msg = await api.sendMessage("🖌️ | جارٍ توليد الصورة...", event.threadID);

    try {
      const cachePath = path.join(__dirname, "../cache");
      if (!fs.existsSync(cachePath)) fs.mkdirSync(cachePath);
      const imgPath = path.join(cachePath, `weigen-${Date.now()}.png`);

      const response = await axios({ method: "GET", url: "https://www.arch2devs.ct.ws/api/weigen", params: { prompt }, responseType: "stream" });
      const writer = fs.createWriteStream(imgPath);
      response.data.pipe(writer);

      writer.on("finish", () => {
        api.sendMessage({ body: `🎨 | تم توليد الصورة لـ:\n"${prompt}"`, attachment: fs.createReadStream(imgPath) }, event.threadID, () => fs.unlinkSync(imgPath), msg.messageID);
      });
      writer.on("error", err => { console.error("❌ خطأ:", err); api.sendMessage("❌ | فشل حفظ الصورة.", event.threadID, msg.messageID); });
    } catch (err) { console.error("❌ خطأ:", err); api.sendMessage("❌ | فشل توليد الصورة.", event.threadID, msg.messageID); }
  }
};
