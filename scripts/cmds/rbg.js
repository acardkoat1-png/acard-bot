const axios = require("axios");
const apiKey = "66e0cfbb-62b8-4829-90c7-c78cacc72ae2";

module.exports = {
  config: {
    name: "rbg",
    version: "2.0",
    author: "Acard",
    category: "image",
    shortDescription: "إزالة خلفية الصورة",
    longDescription: "إزالة خلفية الصورة المرفقة أو المردود عليها",
    guide: "{pn} (رد على صورة)"
  },

  onStart: async function({ api, event, args }) {
    try {
      let imageUrl = "";
      if (event.type === "message_reply" && event.messageReply && event.messageReply.attachments && event.messageReply.attachments.length) {
        imageUrl = event.messageReply.attachments[0].url;
      } else if (event.attachments && event.attachments.length) {
        imageUrl = event.attachments[0].url;
      } else {
        return api.sendMessage("❌ يرجى الرد على صورة أو إرفاق صورة.", event.threadID, event.messageID);
      }

      const apiUrl = `https://kaiz-apis.gleeze.com/api/removebgv3?url=${encodeURIComponent(imageUrl)}&stream=true&apikey=${apiKey}`;
      const response = await axios({ method: "GET", url: apiUrl, responseType: "stream" });

      return api.sendMessage({ attachment: response.data }, event.threadID, event.messageID);
    } catch (error) {
      console.error("خطأ أمر rbg:", error);
      return api.sendMessage("❌ فشلت إزالة الخلفية.", event.threadID, event.messageID);
    }
  }
};