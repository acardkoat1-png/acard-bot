const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");
const axios = require("axios");

function formatBalance(num) {
  if (num >= 1e9) return (num / 1e9).toFixed(1) + "B";
  if (num >= 1e6) return (num / 1e6).toFixed(1) + "M";
  if (num >= 1e3) return (num / 1e3).toFixed(1) + "K";
  return num;
}

module.exports.config = {
  name: "balance",
  aliases: [],
  version: "7.0",
  author: "Acard",
  countDown: 5,
  role: 0,
  shortDescription: "بطاقة بنكية افتراضية",
  category: "economy"
};

module.exports.onStart = async function ({ api, event, usersData }) {
  const { threadID, senderID, messageID } = event;

  try {
    const userData = await usersData.get(senderID);
    const balance = userData?.data?.money ?? 100;
    const userName = await usersData.getName(senderID);
    const formatted = formatBalance(balance);

    // تحميل الصورة الرمزية
    let avatar = null;
    try {
      const picURL = `https://graph.facebook.com/${senderID}/picture?height=1500&width=1500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
      const response = await axios({ url: picURL, method: "GET", responseType: "arraybuffer" });
      avatar = await loadImage(response.data);
    } catch (err) {
      console.log("فشل تحميل الصورة الرمزية:", err.message);
    }

    const width = 850;
    const height = 520;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // خلفية البطاقة
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, "#0f4c81");
    grad.addColorStop(1, "#1c77c3");
    ctx.fillStyle = grad;
    roundRect(ctx, 0, 0, width, height, 30, true);

    // اسم البنك
    ctx.font = "bold 36px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("البنك الوطني", 60, 90);

    // الشريحة
    ctx.fillStyle = "#d4af37";
    roundRect(ctx, 60, 140, 90, 65, 10, true);

    // رقم البطاقة
    ctx.font = "30px monospace";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("1234 5678 9012 8456", 60, 250);

    // تاريخ الصلاحية
    ctx.font = "20px Arial";
    ctx.fillText("صالح حتى", 60, 300);
    ctx.font = "24px Arial";
    ctx.fillText("12/29", 60, 330);

    // اسم الحامل
    ctx.font = "bold 26px Arial";
    ctx.fillText(userName.toUpperCase(), 60, 380);

    // صندوق الرصيد
    const boxX = 480, boxY = 250, boxW = 300, boxH = 180;
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    roundRect(ctx, boxX, boxY, boxW, boxH, 25, true);

    ctx.textAlign = "center";
    ctx.font = "22px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("الرصيد المتاح", boxX + boxW / 2, boxY + 50);
    ctx.font = "bold 50px Arial";
    ctx.fillText("$" + formatted, boxX + boxW / 2, boxY + 120);
    ctx.textAlign = "left";

    // الصورة الرمزية
    if (avatar) {
      const size = 110;
      const x = width - size - 50;
      const y = 50;
      ctx.save();
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(avatar, x, y, size, size);
      ctx.restore();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size / 2 + 2, 0, Math.PI * 2);
      ctx.stroke();
    }

    const buffer = canvas.toBuffer("image/png");
    const cachePath = path.join(__dirname, "cache");
    if (!fs.existsSync(cachePath)) fs.mkdirSync(cachePath, { recursive: true });
    const filePath = path.join(cachePath, "balance.png");
    fs.writeFileSync(filePath, buffer);

    await api.sendMessage({ attachment: fs.createReadStream(filePath) }, threadID, messageID);

    setTimeout(() => { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); }, 10000);

  } catch (err) {
    console.error(err);
    api.sendMessage("❌ فشل إنشاء البطاقة!", threadID, messageID);
  }
};

function roundRect(ctx, x, y, w, h, r, fill = false, stroke = false) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}
