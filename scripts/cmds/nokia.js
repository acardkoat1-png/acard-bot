const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "nokia",
    version: "2.0",
    author: "Acard",
    countDown: 10,
    role: 0,
    shortDescription: { ar: "تطبيق تأثير شاشة نوكيا على الصورة" },
    description: { ar: "ينشئ صورة بأسلوب نوكيا باستخدام صورتك أو صورة شخص آخر" },
    category: "fun",
    guide: { ar: "{p}nokia [@منشن أو رد]" }
  },

  onStart: async function ({ api, event, usersData, message }) {
    const { senderID, mentions, type, messageReply } = event;
    let uid;
    if (Object.keys(mentions).length > 0) uid = Object.keys(mentions)[0];
    else if (type === "message_reply") uid = messageReply.senderID;
    else uid = senderID;

    const avatarURL = `https://graph.facebook.com/${uid}/picture?height=512&width=512&access_token=350685531728|62f8ce9f74b12f84c123cc23437a4a32`;

    try {
      const res = await axios.get(`https://api.popcat.xyz/v2/nokia?image=${encodeURIComponent(avatarURL)}`, { responseType: "arraybuffer" });
      const imagePath = path.join(__dirname, "cache", `nokia_${uid}.jpg`);
      fs.writeFileSync(imagePath, res.data);

      message.reply({
        body: `📱 | إليك تأثير شاشة نوكيا!`,
        attachment: fs.createReadStream(imagePath)
      }, () => fs.unlinkSync(imagePath));
    } catch (err) {
      console.error(err);
      message.reply("❌ | فشل إنشاء صورة نوكيا.");
    }
  }
};
