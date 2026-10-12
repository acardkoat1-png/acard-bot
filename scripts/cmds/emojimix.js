const fs = require("fs-extra");
const axios = require("axios");
const path = require("path");

module.exports = {
  config: {
    name: "emojimix",
    aliases: ["mix"],
    version: "2.0",
    author: "Acard",
    role: 0,
    shortDescription: {
      ar: "دمج إيموجيين"
    },
    longDescription: {
      ar: "دمج إيموجيين في صورة واحدة"
    },
    category: "fun",
    guide: {
      ar: "{p}mix 😄 😍"
    }
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID } = event;

    if (args.length < 2) {
      return api.sendMessage(
        `❌ صيغة خاطئة!\n✅ استخدم: ${global.GoatBot.config.prefix}mix 😄 😍`,
        threadID,
        messageID
      );
    }

    const emoji1 = args[0];
    const emoji2 = args[1];

    const cachePath = path.join(__dirname, "cache", `emojimix_${Date.now()}.png`);

    try {
      const url = encodeURI(
        `https://web-api-delta.vercel.app/emojimix?emoji1=${emoji1}&emoji2=${emoji2}`
      );

      const res = await axios.get(url, { responseType: "arraybuffer" });
      fs.writeFileSync(cachePath, res.data);

      await api.sendMessage(
        {
          body: `✨ نتيجة دمج الإيموجي`,
          attachment: fs.createReadStream(cachePath)
        },
        threadID,
        messageID
      );

      fs.unlinkSync(cachePath);

    } catch (error) {
      return api.sendMessage(
        `❌ لا يمكن دمج ${emoji1} و ${emoji2}`,
        threadID,
        messageID
      );
    }
  }
};
