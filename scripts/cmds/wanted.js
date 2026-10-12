const fs = require("fs-extra");
const axios = require("axios");
const { loadImage, createCanvas } = require("canvas");

module.exports = {
  config: {
    name: "wanted",
    version: "2.0",
    author: "Acard",
    countDown: 5,
    role: 0,
    shortDescription: "ملصق مطلوب",
    longDescription: "منشن شخصاً لإنشاء ملصق مطلوب عالي الجودة.",
    category: "fun",
    guide: { ar: "{pn} @منشن" }
  },

  getCrime() {
    const crimes = ["سرقة القلوب", "كونه رائعاً جداً", "نشر الفوضى", "اختراق الضحك", "كسر القواعد", "أناقة مفرطة"];
    return crimes[Math.floor(Math.random() * crimes.length)];
  },

  getReward() { const rewards = [1000, 5000, 10000, 50000, 100000]; return "$" + rewards[Math.floor(Math.random() * rewards.length)]; },

  onStart: async function ({ event, message, api, usersData }) {
    fs.mkdirSync(__dirname + "/cache", { recursive: true });
    try {
      const mentionID = Object.keys(event.mentions)[0];
      if (!mentionID) return message.reply("منشن شخصاً!");

      const name = await usersData.getName(mentionID);
      const photoUrl = `https://graph.facebook.com/${mentionID}/picture?height=2048&width=2048&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
      const res = await axios.get(photoUrl, { responseType: "arraybuffer" });
      const avatarPath = __dirname + "/cache/wanted_avatar.jpg";
      const outputPath = __dirname + "/cache/wanted_poster.jpg";
      fs.writeFileSync(avatarPath, Buffer.from(res.data));

      const canvas = createCanvas(700, 900);
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#f5f5f5"; ctx.fillRect(0, 0, 700, 900);
      ctx.fillStyle = "#000"; ctx.fillRect(0, 0, 700, 150);
      ctx.font = "bold 100px Arial"; ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.fillText("مطلوب", 350, 120);
      const avatar = await loadImage(avatarPath);
      ctx.fillStyle = "#fff"; ctx.fillRect(100, 180, 500, 500);
      ctx.save(); ctx.beginPath(); ctx.rect(100, 180, 500, 500); ctx.clip();
      ctx.drawImage(avatar, 100, 180, 500, 500); ctx.restore();
      ctx.lineWidth = 4; ctx.strokeStyle = "#000"; ctx.strokeRect(100, 180, 500, 500);
      ctx.font = "bold 50px Arial"; ctx.fillStyle = "#000"; ctx.fillText(name.toUpperCase(), 350, 750);
      const crime = this.getCrime();
      ctx.font = "italic 32px Arial"; ctx.fillText("الجريمة: " + crime, 350, 800);
      const reward = this.getReward();
      ctx.font = "bold 36px Arial"; ctx.fillStyle = "#d35400"; ctx.fillText("المكافأة: " + reward, 350, 850);
      ctx.font = "italic 24px Arial"; ctx.fillStyle = "#7f8c8d"; ctx.fillText("المطور: Acard", 350, 890);
      fs.writeFileSync(outputPath, canvas.toBuffer("image/jpeg"));

      await message.reply({ body: `📜 ملصق مطلوب\n👤 الاسم: ${name}\n💣 الجريمة: ${crime}\n💰 المكافأة: ${reward}`, attachment: fs.createReadStream(outputPath) });
      [avatarPath, outputPath].forEach(p => fs.existsSync(p) && fs.unlinkSync(p));
    } catch (err) { console.error("خطأ:", err); message.reply("❌ خطأ أثناء إنشاء الملصق!"); }
  }
};
