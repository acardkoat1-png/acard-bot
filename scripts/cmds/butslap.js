const axios = require("axios");
const fs = require("fs");
const path = require("path");

const baseApiUrl = async () => {
  const base = await axios.get(
    "https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json"
  );
  return base.data.mahmud[0];
};

module.exports = {
  config: {
    name: "butslap",
    aliases: ["buttslap"],
    version: "2.0",
    author: "Acard",
    role: 0,
    category: "fun",
    cooldown: 8,
    guide: "butslap [منشن/رد/معرف]",
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID, messageReply, mentions, senderID } = event;
    const type = args[0];

    if (!type) return api.sendMessage("استخدم: butslap @منشن", threadID, messageID);

    let id = senderID;
    let id2;

    if (messageReply) {
      id2 = messageReply.senderID;
    } else if (Object.keys(mentions).length > 0) {
      id2 = Object.keys(mentions)[0];
    } else if (args[1]) {
      id2 = args[1];
    } else {
      return api.sendMessage("قم بمنشن أو رد أو إدخال معرف الهدف.", threadID, messageID);
    }

    try {
      const url = `${await baseApiUrl()}/api/dig?type=buttslap&user=${id}&user2=${id2}`;

      const response = await axios.get(url, { responseType: "arraybuffer" });
      const filePath = path.join(__dirname, `slap_${id2}.png`);
      fs.writeFileSync(filePath, response.data);

      api.sendMessage(
        {
          attachment: fs.createReadStream(filePath),
          body: `تأثير: butslap ناجح 💥`
        },
        threadID,
        () => fs.unlinkSync(filePath),
        messageID
      );
    } catch (err) {
      console.error(err);
      api.sendMessage(`🥹 حدث خطأ، يرجى المحاولة لاحقاً.`, threadID, messageID);
    }
  }
};
