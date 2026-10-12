const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "webss",
    aliases: ["screenshot", "ss"],
    version: "2.0",
    author: "Acard",
    countDown: 10,
    role: 2,
    shortDescription: "لقطة شاشة لموقع",
    longDescription: "التقاط لقطة شاشة لأي موقع",
    category: "utility",
    guide: { ar: "{p}webss <رابط>\nمثال: {p}webss google.com" },
  },

  onStart: async function ({ api, event, args, message }) {
    if (!args[0]) return message.reply("❌ لم يتم إدخال رابط!\n\nمثال: !webss google.com");
    let url = args[0].trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) url = "https://" + url;
    try { new URL(url); } catch { return message.reply("❌ رابط غير صالح!"); }

    const { messageID } = event;
    await api.setMessageReaction("⏳", messageID, () => {}, true);
    const screenshotPath = path.join(__dirname, `../tmp/webss_${Date.now()}.png`);

    try {
      const encodedUrl = encodeURIComponent(url);
      const apiUrl = `https://s.wordpress.com/mshots/v1/${encodedUrl}?w=1280&h=800`;
      let imageBuffer;
      for (let i = 0; i < 5; i++) {
        const response = await axios.get(apiUrl, { responseType: "arraybuffer", timeout: 30000 });
        const buffer = Buffer.from(response.data);
        const isGif = buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46;
        if (!isGif && buffer.length > 5000) { imageBuffer = buffer; break; }
        await new Promise((r) => setTimeout(r, 4000));
      }
      if (!imageBuffer) throw new Error("لقطة الشاشة غير جاهزة");
      await fs.outputFile(screenshotPath, imageBuffer);
      await api.setMessageReaction("✅", messageID, () => {}, true);
      await message.reply({ body: `✅ لقطة الشاشة جاهزة!\n🌐 ${url}`, attachment: fs.createReadStream(screenshotPath) });
    } catch (err) { await api.setMessageReaction("❌", messageID, () => {}, true); message.reply(`❌ فشل التقاط لقطة الشاشة!\n${err.message}`); }
    finally { setTimeout(() => { fs.remove(screenshotPath).catch(() => {}); }, 10000); }
  },
};
