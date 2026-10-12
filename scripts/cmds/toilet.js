const axios = require("axios");
const fs = require("fs");
const path = require("path");

const baseApiUrl = async () => {
  const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
  return base.data.mahmud[0];
};

module.exports = {
  config: {
    name: "toilet",
    version: "2.0",
    author: "Acard",
    role: 0,
    category: "fun",
    cooldown: 10,
    guide: "[منشن/رد/معرف]",
  },

  onStart: async function({ api, event, args }) {
    const { senderID, mentions, threadID, messageID, messageReply } = event;
    let id;
    if (Object.keys(mentions).length > 0) { id = Object.keys(mentions)[0]; }
    else if (messageReply) { id = messageReply.senderID; }
    else if (args[0]) { id = args[0]; }
    else { return api.sendMessage("❌ قم بمنشن أو رد أو إدخال معرف الهدف", threadID, messageID); }

    try {
      const apiUrl = await baseApiUrl();
      const url = `${apiUrl}/api/toilet?user=${id}`;
      const response = await axios.get(url, { responseType: "arraybuffer" });
      const filePath = path.join(__dirname, `toilet_${id}.png`);
      fs.writeFileSync(filePath, response.data);
      
      api.sendMessage({ attachment: fs.createReadStream(filePath), body: "🤮 وعليكم السلام" }, threadID, () => fs.unlinkSync(filePath), messageID);
    } catch (err) { api.sendMessage(`🥹 حدث خطأ، يرجى المحاولة لاحقاً.`, threadID, messageID); }
  }
};
