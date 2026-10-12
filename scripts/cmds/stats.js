const { createCanvas, loadImage } = require("canvas");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "stats",
    aliases: ["احصائيات", "بروفايل", "profile"],
    version: "2.0",
    author: "Acard",
    countDown: 5,
    role: 0,
    shortDescription: { ar: "📊 إحصائياتك الكاملة" },
    category: "economy"
  },

  onStart: async function ({ api, event, usersData, message }) {
    const targetID = Object.keys(event.mentions)[0] || event.senderID;
    const userData = await usersData.get(targetID);
    const name = userData?.name || "مستخدم";
    const money = userData?.data?.money || 100;
    const exp = userData?.data?.exp || 0;
    const gamesPlayed = userData?.data?.gamesPlayed || 0;
    const gamesWon = userData?.data?.gamesWon || 0;
    const title = userData?.data?.title || "مبتدئ";
    const winRate = gamesPlayed ? Math.round((gamesWon / gamesPlayed) * 100) : 0;

    const W = 700, H = 500;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext("2d");

    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, "#0a192f"); bg.addColorStop(1, "#020c1b");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    try {
      const av = await axios.get(`https://graph.facebook.com/${targetID}/picture?height=300&width=300&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" });
      const img = await loadImage(Buffer.from(av.data));
      ctx.save(); ctx.beginPath(); ctx.arc(130, 120, 75, 0, Math.PI*2); ctx.clip();
      ctx.drawImage(img, 55, 45, 150, 150); ctx.restore();
      ctx.strokeStyle = "#64ffda"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(130, 120, 77, 0, Math.PI*2); ctx.stroke();
    } catch (e) {}

    ctx.font = "bold 32px Arial"; ctx.fillStyle = "#fff"; ctx.textAlign = "left";
    ctx.fillText(name, 250, 100);
    ctx.font = "20px Arial"; ctx.fillStyle = "#64ffda";
    ctx.fillText(`🏅 ${title}`, 250, 135);

    const stats = [
      { label: "💰 الرصيد", value: `${money.toLocaleString()} $` },
      { label: "⭐ الخبرة", value: `${exp} XP` },
      { label: "🎮 مرات اللعب", value: gamesPlayed },
      { label: "🏆 مرات الفوز", value: gamesWon },
      { label: "📊 نسبة الفوز", value: `${winRate}%` }
    ];

    stats.forEach((s, i) => {
      const y = 200 + i * 45;
      ctx.fillStyle = "rgba(255,255,255,0.05)";
      ctx.fillRect(40, y, W - 80, 35);
      ctx.font = "bold 18px Arial"; ctx.fillStyle = "#8892b0";
      ctx.textAlign = "left"; ctx.fillText(s.label, 60, y + 25);
      ctx.fillStyle = "#fff"; ctx.textAlign = "right";
      ctx.fillText(s.value, W - 60, y + 25);
    });

    const fp = path.join(__dirname, "cache", `stats_${Date.now()}.png`);
    fs.writeFileSync(fp, canvas.toBuffer("image/png"));
    await message.reply({ attachment: fs.createReadStream(fp) });
    setTimeout(() => fs.unlinkSync(fp), 10000);
  }
};