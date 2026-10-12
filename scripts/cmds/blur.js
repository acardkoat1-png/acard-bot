const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "blur",
    version: "2.0",
    author: "Acard",
    countDown: 10,
    role: 0,
    shortDescription: {
      ar: "تطبيق تأثير ضبابي على الصورة الرمزية"
    },
    description: {
      ar: "يضيف تأثير ضبابي على صورتك الرمزية أو صورة شخص آخر"
    },
    category: "fun",
    guide: {
      ar: "{p}blur [@منشن أو رد]\nإذا لم تذكر أحداً، يستخدم صورتك الرمزية."
    }
  },

  onStart: async function ({ api, event, message }) {
    const { senderID, mentions, type, messageReply } = event;

    // تحديد معرف المستخدم للصورة الرمزية
    let uid;
    if (Object.keys(mentions).length > 0) {
      uid = Object.keys(mentions)[0];
    } else if (type === "message_reply") {
      uid = messageReply.senderID;
    } else {
      uid = senderID;
    }

    const avatarURL = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=350685531728|62f8ce9f74b12f84c123cc23437a4a32`;

    try {
      const res = await axios.get(`https://api.popcat.xyz/v2/blur?image=${encodeURIComponent(avatarURL)}`, {
        responseType: "arraybuffer"
      });

      const filePath = path.join(__dirname, "cache", `blur_${uid}_${Date.now()}.png`);
      fs.writeFileSync(filePath, res.data);

      message.reply({
        body: "🌫️ إليك صورتك بتأثير ضبابي!",
        attachment: fs.createReadStream(filePath)
      }, () => fs.unlinkSync(filePath));

    } catch (err) {
      console.error(err);
      message.reply("❌ | فشل إنشاء الصورة الضبابية.");
    }
  }
};
