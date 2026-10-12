const axios = require("axios");
const fs = require("fs-extra");
const { loadImage, createCanvas } = require("canvas");

module.exports = {
  config: {
    name: "wish",
    version: "2.0",
    author: "Acard",
    role: 0,
    shortDescription: "بطاقة تهنئة بعيد الميلاد",
    longDescription: "إنشاء بطاقة تهنئة بعيد ميلاد بتصميم مميز",
    category: "birthday",
    guide: { ar: "{pn} @منشن" }
  },

  wrapText(ctx, text, maxWidth) {
    return new Promise(resolve => {
      if (ctx.measureText(text).width < maxWidth) return resolve([text]);
      const words = text.split(" "); const lines = []; let line = "";
      for (let word of words) { const testLine = line + word + " "; if (ctx.measureText(testLine).width > maxWidth) { lines.push(line.trim()); line = word + " "; } else line = testLine; }
      lines.push(line.trim()); resolve(lines);
    });
  },

  onStart: async function ({ api, event, usersData }) {
    fs.mkdirSync(__dirname + "/cache", { recursive: true });
    try {
      const bgPath = __dirname + "/cache/bgc.png", avtPath = __dirname + "/cache/avt.png";
      const mentionID = Object.keys(event.mentions)[0] || event.senderID;
      const targetName = await usersData.getName(mentionID);
      const senderName = await usersData.getName(event.senderID);

      const bgURL = "https://i.postimg.cc/k4RS69d8/20230921-195836.png";
      const avtData = (await axios.get(`https://graph.facebook.com/${mentionID}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" })).data;
      fs.writeFileSync(avtPath, Buffer.from(avtData, "utf-8"));
      const bgData = (await axios.get(bgURL, { responseType: "arraybuffer" })).data;
      fs.writeFileSync(bgPath, Buffer.from(bgData, "utf-8"));

      const bg = await loadImage(bgPath), avt = await loadImage(avtPath);
      const canvas = createCanvas(bg.width, bg.height);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
      ctx.save(); ctx.beginPath(); ctx.arc(270, 470, 200, 0, Math.PI * 2); ctx.closePath(); ctx.clip();
      ctx.drawImage(avt, 70, 270, 400, 400); ctx.restore();

      ctx.font = "bold 40px Arial"; ctx.fillStyle = "#ffffff"; ctx.textAlign = "left";
      const nameLines = await this.wrapText(ctx, targetName, 900);
      ctx.fillText(nameLines.join("\n"), 550, 420);

      fs.writeFileSync(bgPath, canvas.toBuffer());

      const caption = `🎉💐✨ *عيد ميلاد سعيد، ${targetName}!* ✨💐🎉\n\n🌟 اليوم يوم مميز جداً! 🌟\n🎂 إنه يوم ميلادك — يوم السعادة والبركات! 💝\n\n💖 أتمنى أن تبقى ابتسامتك مشرقة دائماً،\n💖 وأن تتحقق كل أحلامك،\n💖 وأن تمتلئ حياتك بالألوان ✨✨\n\n🩷 *كل عام وأنت بخير!* 🎉\n🕊️ وفقك الله دائماً!\n\n— مع أطيب التمنيات من: *${senderName}* 💙`;

      api.sendMessage({ body: caption, mentions: [{ id: mentionID, tag: targetName }], attachment: fs.createReadStream(bgPath) }, event.threadID, () => { fs.unlinkSync(bgPath); fs.unlinkSync(avtPath); });
    } catch (e) { console.error(e); api.sendMessage("❌ خطأ، يرجى المحاولة مرة أخرى", event.threadID); }
  }
};
