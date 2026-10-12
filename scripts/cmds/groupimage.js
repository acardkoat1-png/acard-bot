const fs = require("fs");
const axios = require("axios");

module.exports = {
  config: {
    name: "groupimage",
    version: "2.0",
    author: "Acard",
    countDown: 0,
    role: 1,
    shortDescription: "تغيير صورة المجموعة",
    longDescription: "تغيير صورة بروفايل المجموعة بالرد على صورة",
    category: "box",
    guide: "{pn} (قم بالرد على صورة)"
  },

  onStart: async function ({ api, event }) {
    try {
      if (event.type !== "message_reply") {
        return api.sendMessage("❌ يرجى الرد على صورة!", event.threadID, event.messageID);
      }

      const attachments = event.messageReply.attachments;
      if (!attachments || attachments.length === 0) {
        return api.sendMessage("❌ لم يتم العثور على صورة في الرسالة!", event.threadID, event.messageID);
      }

      if (attachments.length > 1) {
        return api.sendMessage("⚠️ يرجى الرد على صورة واحدة فقط!", event.threadID, event.messageID);
      }

      const imageURL = attachments[0].url;
      fs.mkdirSync(__dirname + "/cache", { recursive: true });
      const pathImg = __dirname + "/cache/groupimage.png";
      const getData = (await axios.get(imageURL, { responseType: "arraybuffer" })).data;

      fs.writeFileSync(pathImg, Buffer.from(getData, "utf-8"));
      await api.changeGroupImage(fs.createReadStream(pathImg), event.threadID);
      fs.unlinkSync(pathImg);

      return api.sendMessage("✅ | تم تغيير صورة المجموعة بنجاح!", event.threadID, event.messageID);
    } catch (error) {
      console.error(error);
      return api.sendMessage("⚠️ | تعذر تغيير الصورة، حاول مرة أخرى!", event.threadID, event.messageID);
    }
  }
};
