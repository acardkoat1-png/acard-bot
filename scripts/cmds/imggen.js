const axios = require("axios");
const fs = require("fs-extra");

module.exports = {
  config: {
    name: "imgen",
    aliases: ["imggen", "imagine"],
    version: "2.0",
    author: "Acard",
    countDown: 10,
    role: 0,
    shortDescription: "توليد صورة بالذكاء الاصطناعي",
    longDescription: "استخدم هذا الأمر لتوليد صور من وصف نصي.",
    category: "AI-IMAGE",
    guide: {
      ar: "{pn} <وصف>\nمثال: {pn} تنين يطير فوق قلعة"
    }
  },

  onStart: async function ({ api, event, args }) {
    const prompt = args.join(" ");
    if (!prompt) {
      return api.sendMessage("❌ | يرجى إدخال وصف.\nمثال: .imgen تنين يطير فوق قلعة", event.threadID, event.messageID);
    }

    const msg = await api.sendMessage("🧠 | جارٍ توليد الصورة، يرجى الانتظار...", event.threadID);

    try {
      const response = await axios({
        method: "GET",
        url: "https://www.arch2devs.ct.ws/api/imgen",
        params: { prompt },
        responseType: "arraybuffer"
      });

      const imagePath = __dirname + `/cache/imgen_${event.senderID}.png`;
      fs.writeFileSync(imagePath, Buffer.from(response.data, "binary"));

      api.sendMessage({
        body: `✅ | الوصف: ${prompt}`,
        attachment: fs.createReadStream(imagePath)
      }, event.threadID, () => fs.unlinkSync(imagePath), msg.messageID);

    } catch (err) {
      console.error(err);
      api.sendMessage("❌ | فشل توليد الصورة. قد يكون الخادم مشغولاً. حاول مرة أخرى لاحقاً.", event.threadID, msg.messageID);
    }
  }
};