const { createCanvas, loadImage } = require("canvas");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "interactionboard",
    aliases: ["تفاعل", "itop"],
    version: "1.0",
    author: "Acard",
    countDown: 10,
    role: 0,
    shortDescription: { ar: "🔥 أكثر الناس تفاعلاً" },
    category: "economy"
  },

  onStart: async function ({ api, event, threadsData, usersData }) {
    const { threadID, messageID } = event;
    const threadData = await threadsData.get(threadID);
    const members = threadData.members || [];
    
    const sorted = members
      .filter(m => m.count > 0)
      .sort((a, b) => (b.count || 0) - (a.count || 0))
      .slice(0, 10);

    if (!sorted.length) return api.sendMessage("لا توجد بيانات تفاعل بعد!", threadID);

    const W = 800, H = 120 + sorted.length * 80;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext("2d");

    // خلفية
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, "#1a0033"); bg.addColorStop(1, "#0d001a");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // عنوان
    ctx.font = "bold 36px Arial"; ctx.fillStyle = "#ff6b6b"; ctx.textAlign = "center";
    ctx.fillText("🔥 أكثر الناس تفاعلاً", W/2, 55);
    ctx.font = "18px Arial"; ctx.fillStyle = "#aaa";
    ctx.fillText("عدد الرسائل", W/2, 85);

    const medals = ["🥇", "🥈", "🥉"];
    
    for (let i = 0; i < sorted.length; i++) {
      const m = sorted[i];
      const y = 120 + i * 80;
      const name = m.name || "مستخدم";
      
      // صف
      ctx.fillStyle = i % 2 === 0 ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.06)";
      ctx.fillRect(40, y + 5, W - 80, 65);

      // ترتيب
      ctx.font = "bold 24px Arial";
      ctx.fillStyle = i < 3 ? "#ffd700" : "#fff";
      ctx.textAlign = "center";
      ctx.fillText(i < 3 ? medals[i] : `#${i+1}`, 70, y + 45);

      // صورة
      try {
        const av = await axios.get(`https://graph.facebook.com/${m.userID}/picture?height=100&width=100&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" });
        const img = await loadImage(Buffer.from(av.data));
        ctx.save(); ctx.beginPath(); ctx.arc(130, y + 37, 25, 0, Math.PI*2); ctx.clip();
        ctx.drawImage(img, 105, y + 12, 50, 50); ctx.restore();
      } catch (e) {}

      // اسم
      ctx.font = "bold 20px Arial"; ctx.fillStyle = "#fff"; ctx.textAlign = "left";
      ctx.fillText(name.substring(0, 20), 165, y + 38);

      // رسائل
      ctx.font = "bold 22px Arial"; ctx.fillStyle = "#4ecdc4"; ctx.textAlign = "right";
      ctx.fillText(`${m.count || 0} ✉️`, W - 60, y + 38);
    }

    const fp = path.join(__dirname, "cache", `interaction_${Date.now()}.png`);
    fs.writeFileSync(fp, canvas.toBuffer("image/png"));
    await api.sendMessage({ attachment: fs.createReadStream(fp) }, threadID, messageID);
    setTimeout(() => fs.unlinkSync(fp), 10000);
  }
};