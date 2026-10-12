const { createCanvas, loadImage } = require("canvas");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "gambleboard",
    aliases: ["gambtop", "مقامرين"],
    version: "1.0",
    author: "Acard",
    countDown: 10,
    role: 0,
    shortDescription: { ar: "🎰 لوحة صدارة المقامرين" },
    category: "economy"
  },

  onStart: async function ({ api, event, usersData }) {
    const allUsers = await usersData.getAll();
    const gamblers = allUsers
      .filter(u => (u.data?.gamesPlayed || 0) > 0)
      .map(u => ({
        uid: u.userID,
        name: u.name || "مستخدم",
        played: u.data?.gamesPlayed || 0,
        won: u.data?.gamesWon || 0,
        money: u.data?.money || 0
      }))
      .sort((a, b) => b.played - a.played)
      .slice(0, 10);

    if (!gamblers.length) return api.sendMessage("🎰 | لا مقامرين بعد!");

    const W = 800, H = 120 + gamblers.length * 80;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext("2d");

    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, "#1a0000"); bg.addColorStop(1, "#0d0000");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    ctx.font = "bold 36px Arial"; ctx.fillStyle = "#ff6b6b"; ctx.textAlign = "center";
    ctx.fillText("🎰 لوحة المقامرين", W/2, 55);

    const medals = ["🥇", "🥈", "🥉"];
    
    for (let i = 0; i < gamblers.length; i++) {
      const g = gamblers[i];
      const y = 120 + i * 80;
      
      ctx.fillStyle = i % 2 === 0 ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.06)";
      ctx.fillRect(40, y + 5, W - 80, 65);

      ctx.font = "bold 24px Arial";
      ctx.fillStyle = i < 3 ? "#ffd700" : "#fff";
      ctx.textAlign = "center";
      ctx.fillText(i < 3 ? medals[i] : `#${i+1}`, 60, y + 45);

      try {
        const av = await axios.get(`https://graph.facebook.com/${g.uid}/picture?height=100&width=100&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" });
        const img = await loadImage(Buffer.from(av.data));
        ctx.save(); ctx.beginPath(); ctx.arc(120, y + 37, 25, 0, Math.PI*2); ctx.clip();
        ctx.drawImage(img, 95, y + 12, 50, 50); ctx.restore();
      } catch (e) {}

      ctx.font = "bold 18px Arial"; ctx.fillStyle = "#fff"; ctx.textAlign = "left";
      ctx.fillText(g.name.substring(0, 18), 155, y + 35);
      
      ctx.font = "16px Arial"; ctx.fillStyle = "#aaa";
      ctx.fillText(`🎮${g.played} 🏆${g.won}`, 155, y + 55);

      ctx.font = "bold 20px Arial"; ctx.fillStyle = "#f59e0b"; ctx.textAlign = "right";
      ctx.fillText(`${g.money.toLocaleString()} $`, W - 60, y + 38);
    }

    const fp = path.join(__dirname, "cache", `gamble_${Date.now()}.png`);
    fs.writeFileSync(fp, canvas.toBuffer("image/png"));
    await api.sendMessage({ attachment: fs.createReadStream(fp) }, event.threadID, event.messageID);
    setTimeout(() => fs.unlinkSync(fp), 10000);
  }
};