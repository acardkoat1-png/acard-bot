const axios = require("axios");
const fs = require("fs");
const path = require("path");

const baseApiUrl = async () => {
  const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
  return base.data.mahmud[0];
};

module.exports = {
  config: {
    name: "poli",
    author: "Acard",
    version: "2.0",
    cooldowns: 10,
    role: 0,
    category: "ai-image",
    guide: { ar: "{p}poli <وصف>" }
  },

  onStart: async function ({ message, args, api, event }) {
    if (args.length === 0) return api.sendMessage("❌ | يرجى إدخال وصف.", event.threadID, event.messageID);

    const prompt = args.join(" ");
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

    api.sendMessage("😘 انتظر قليلاً...", event.threadID, event.messageID);

    try {
      const styles = ["ultra detailed", "4k resolution", "realistic lighting", "artstation", "digital painting"];
      const imagePaths = [];

      for (let i = 0; i < 4; i++) {
        const enhancedPrompt = `${prompt}, ${styles[i % styles.length]}`;
        const response = await axios.post(`${await baseApiUrl()}/api/poli/generate`, { prompt: enhancedPrompt }, { responseType: "arraybuffer", headers: { "author": module.exports.config.author } });
        const filePath = path.join(cacheDir, `generated_${Date.now()}_${i}.png`);
        fs.writeFileSync(filePath, response.data);
        imagePaths.push(filePath);
      }

      const attachments = imagePaths.map(p => fs.createReadStream(p));
      message.reply({ body: "✅ | إليك الصور المولدة من وصفك:", attachment: attachments });
    } catch (error) {
      console.error("خطأ توليد الصور:", error);
      message.reply("❌ | تعذر توليد الصور. حاول مرة أخرى لاحقاً.");
    }
  }
};
