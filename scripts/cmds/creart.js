const axios = require("axios");

module.exports = {
  config: {
    name: "creart",
    version: "2.0",
    author: "Acard",
    countDown: 5,
    role: 0,
    shortDescription: "توليد صور بالذكاء الاصطناعي",
    longDescription: "توليد صورة باستخدام CreartAI عبر smfahim.xyz",
    category: "AI-IMAGE",
    guide: {
      ar: "{pn} <وصف الصورة>"
    }
  },

  onStart: async function ({ message, args }) {
    const prompt = args.join(" ");
    if (!prompt) return message.reply("❌ | يرجى إدخال وصف للصورة.");

    const waiting = await message.reply(`⏳ | جارٍ توليد الصورة لـ: "${prompt}"`);

    try {
      const url = `https://smfahim.xyz/creartai?prompt=${encodeURIComponent(prompt)}`;
      const imgRes = await axios.get(url, { responseType: "stream" });

      return message.reply({
        body: `✅ | إليك صورتك لـ: "${prompt}"`,
        attachment: imgRes.data
      });

    } catch (error) {
      console.error("خطأ في توليد الصورة:", error.message);
      return message.reply("❌ | فشل توليد الصورة. حاول مرة أخرى لاحقاً.");
    }
  }
};