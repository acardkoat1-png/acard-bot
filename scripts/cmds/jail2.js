const axios = require("axios");
const fs = require("fs");
const path = require("path");

const baseApiUrl = async () => {
  const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
  return base.data.mahmud[0];
};

module.exports = {
  config: {
    name: "jail2",
    aliases: [],
    version: "2.0",
    author: "Acard",
    role: 0,
    category: "fun",
    cooldown: 10,
    guide: "jail2 [منشن-رد-معرف]",
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID, messageReply, mentions } = event;
    let id2;
    if (messageReply) { id2 = messageReply.senderID; }
    else if (Object.keys(mentions).length > 0) { id2 = Object.keys(mentions)[0]; }
    else if (args[0]) { id2 = args[0]; }
    else { return api.sendMessage("يرجى منشن أو رد أو إدخال معرف الهدف.", threadID, messageID); }

    try {
      const url = `${await baseApiUrl()}/api/dig?type=jail&user=${id2}`;
      const response = await axios.get(url, { responseType: "arraybuffer" });
      const filePath = path.join(__dirname, `jail_${id2}.png`);
      fs.writeFileSync(filePath, response.data);

      api.sendMessage({
        attachment: fs.createReadStream(filePath),
        body: `تأثير jail ناجح 🐸`,
      }, threadID, () => fs.unlinkSync(filePath), messageID);
    } catch (err) {
      console.error(err);
      api.sendMessage(`🥹 حدث خطأ، يرجى المحاولة لاحقاً.`, threadID, messageID);
    }
  },
};
