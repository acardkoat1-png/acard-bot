const axios = require("axios");

module.exports = {
  config: {
    name: "i",
    version: "2.0",
    author: "Acard",
    countDown: 5,
    role: 0,
    longDescription: { ar: "توليد عدة صور بالذكاء الاصطناعي من نص." },
    category: "AI-IMAGE",
    guide: { ar: "مثال: {pn} فتاة جميلة | 4 (سيولد 4 صور)" },
  },

  onStart: async function ({ api, args, message, event }) {
    try {
      const text = args.join(" ");
      if (!text) return message.reply("⚠️ يرجى إدخال وصف.");

      let prompt, quantity;
      if (text.includes("|")) {
        [prompt, quantity] = text.split("|").map(str => str.trim());
        quantity = parseInt(quantity);
        if (isNaN(quantity) || quantity < 1 || quantity > 10) return message.reply("⚠️ العدد يجب أن يكون بين 1 و 10.");
      } else {
        prompt = text;
        quantity = 4;
      }

      api.setMessageReaction("⏳", event.messageID, () => {}, true);
      const waitingMessage = await message.reply(`✅ | جارٍ توليد ${quantity} صورة...`);

      const imageUrls = [];
      const ratio = "1:1";

      for (let i = 0; i < quantity; i++) {
        const res = await axios.get(`https://www.ai4chat.co/api/image/generate`, { params: { prompt, aspect_ratio: ratio } });
        if (res.data?.image_link) imageUrls.push(res.data.image_link);
      }

      const imageStreams = await Promise.all(imageUrls.map(url => global.utils.getStreamFromURL(url)));
      await message.reply({ attachment: imageStreams });

      api.setMessageReaction("✅", event.messageID, () => {}, true);
      await api.unsendMessage(waitingMessage.messageID);
    } catch (error) {
      console.error("خطأ في توليد الصور:", error.message || error);
      message.reply("❌ فشل توليد الصور.");
    }
  },
};