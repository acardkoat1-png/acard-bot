const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const https = require("https");

function decode(b64) { return Buffer.from(b64, "base64").toString("utf-8"); }

async function downloadImage(url, filePath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filePath);
    https.get(url, res => {
      if (res.statusCode !== 200) return reject(new Error(`فشل جلب الصورة: ${res.statusCode}`));
      res.pipe(file);
      file.on("finish", () => file.close(resolve));
    }).on("error", err => { fs.unlink(filePath, () => reject(err)); });
  });
}

const encodedUrl = "aHR0cHM6Ly9yYXNpbi1hcGlzLm9ucmVuZGVyLmNvbQ==";
const encodedKey = "cnNfaGVpNTJjbTgtbzRvai11Y2ZjLTR2N2MtZzE=";

module.exports = {
  config: {
    name: "needgf",
    version: "3.0.1",
    author: "Acard",
    countDown: 10,
    role: 0,
    shortDescription: "صورة بروفايل صديقتك 😍",
    longDescription: "أمر خاص للعزاب 💔 في كل مرة صورة جديدة لفتاة جميلة 😚",
    category: "fun",
  },

  onStart: async function ({ message, event }) {
    try {
      const apiUrl = decode(encodedUrl);
      const apiKey = decode(encodedKey);
      const fullUrl = `${apiUrl}/api/rasin/gf?apikey=${apiKey}`;
      const res = await axios.get(fullUrl);
      const imgUrl = res.data?.data?.url;
      if (!imgUrl) return message.reply("⚠️ لم يتم العثور على صورة 😭 حاول مرة أخرى!");

      const imgPath = path.join(__dirname, "tmp", `${event.senderID}_gf.jpg`);
      await downloadImage(imgUrl, imgPath);

      const replyMsg = `🌸✨ حظك حلو اليوم!\nفتاة جميلة كهذه لا يجدها الجميع 💕\n👇 شاهد بروفايل صديقتك أدناه 😚`;

      await message.reply({ body: replyMsg, attachment: fs.createReadStream(imgPath) });
      fs.unlinkSync(imgPath);
    } catch (err) {
      console.error("❌ خطأ:", err.message);
      message.reply("⚠️ حدث خطأ ما 😭 حاول مرة أخرى لاحقاً!");
    }
  }
};
