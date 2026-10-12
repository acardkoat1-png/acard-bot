const axios = require("axios");
const fs = require("fs");
const path = require("path");

const mahmud = async () => {
  const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
  return base.data.mahmud[0];
};

module.exports = {
  config: {
    name: "kiss",
    version: "2.0",
    author: "Acard",
    countDown: 5,
    role: 0,
    longDescription: "إنشاء صورة قبلة بأسلوب الأنمي",
    category: "love",
    guide: "{pn} @منشن"
  },

  onStart: async function ({ message, event, api }) {
    try {
      const mention = Object.keys(event.mentions);
      if (mention.length === 0) {
        return message.reply("يرجى منشن شخص لتقبيله 💋");
      }

      const senderID = event.senderID;
      const targetID = mention[0];
      const base = await mahmud();
      const apiURL = `${base}/api/kiss`;

      const response = await axios.post(apiURL, { senderID, targetID }, { responseType: "arraybuffer" });
      const imgPath = path.join(__dirname, `kiss_${senderID}_${targetID}.png`);
      fs.writeFileSync(imgPath, Buffer.from(response.data, "binary"));

      message.reply({ body: "💋 إليك صورة القبلة!", attachment: fs.createReadStream(imgPath) });

      setTimeout(() => { if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath); }, 10000);
    } catch (err) {
      console.error("خطأ في أمر kiss:", err.message || err);
      message.reply("🥹 حدث خطأ، يرجى المحاولة لاحقاً.");
    }
  }
};
