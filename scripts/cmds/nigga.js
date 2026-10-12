const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "nigga",
    aliases: ["roast", "burn"],
    version: "2.0",
    author: "Acard",
    countDown: 2,
    role: 0,
    description: "إرسال صورة مزاحية باستخدام المعرف",
    category: "fun",
    guide: { ar: "{pn} @منشن\nأو استخدم بدون منشن لمزاح نفسك." }
  },

  onStart: async function ({ api, event }) {
    try {
      const mention = Object.keys(event.mentions || {});
      const targetUID = mention.length > 0 ? mention[0] : event.senderID;
      const url = `https://betadash-api-swordslush-production.up.railway.app/nigga?userid=${targetUID}`;
      const response = await axios.get(url, { responseType: 'arraybuffer' });

      const filePath = path.join(__dirname, "cache", `roast_${targetUID}.jpg`);
      fs.writeFileSync(filePath, Buffer.from(response.data, "binary"));

      api.sendMessage({
        body: `انظروا من وجدت 😂`,
        attachment: fs.createReadStream(filePath)
      }, event.threadID, () => fs.unlinkSync(filePath), event.messageID);

    } catch (e) {
      console.error("خطأ:", e.message);
      api.sendMessage("❌ تعذر إنشاء الصورة. حاول مرة أخرى لاحقاً.", event.threadID, event.messageID);
    }
  }
};