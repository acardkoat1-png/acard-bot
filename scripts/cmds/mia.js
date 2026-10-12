const axios = require("axios");
const fs = require("fs-extra");
const canvas = require("canvas");

module.exports = {
  config: { name: "mia", aliases: ["mia khalifa"], author: "Acard", countDown: 5, role: 0, category: "fun" },

  wrapText: async (ctx, text, maxWidth) => {
    return new Promise((resolve) => {
      if (ctx.measureText(text).width < maxWidth) return resolve([text]);
      if (ctx.measureText("W").width > maxWidth) return resolve(null);
      const words = text.split(" "); const lines = []; let line = "";
      while (words.length > 0) {
        let split = false;
        while (ctx.measureText(words[0]).width >= maxWidth) {
          const temp = words[0]; words[0] = temp.slice(0, -1);
          if (split) words[1] = `${temp.slice(-1)}${words[1]}`;
          else { split = true; words.splice(1, 0, temp.slice(-1)); }
        }
        if (ctx.measureText(`${line}${words[0]}`).width < maxWidth) { line += `${words.shift()} `; }
        else { lines.push(line.trim()); line = ""; }
        if (words.length === 0) lines.push(line.trim());
      }
      resolve(lines);
    });
  },

  onStart: async function ({ api, event, args }) {
    fs.mkdirSync(__dirname + "/cache", { recursive: true });
    const { loadImage, createCanvas } = require("canvas");
    let { threadID, messageID } = event;
    const text = args.join(" ");
    if (!text) return api.sendMessage("أدخل نصاً!", threadID, messageID);

    const imageURL = "https://i.ibb.co/4gDpt4Tx/img-1765026096438.jpg";
    const pathImg = __dirname + "/cache/mia.png";

    try { const res = await axios.get(imageURL, { responseType: "arraybuffer" }); fs.writeFileSync(pathImg, Buffer.from(res.data)); }
    catch (err) { return api.sendMessage("❌ فشل تحميل الصورة!", threadID, messageID); }

    const baseImage = await loadImage(pathImg);
    const canvasImg = createCanvas(baseImage.width, baseImage.height);
    const ctx = canvasImg.getContext("2d");

    ctx.drawImage(baseImage, 0, 0, canvasImg.width, canvasImg.height);
    ctx.font = "300 32px Arial"; ctx.fillStyle = "#000000"; ctx.textAlign = "start";

    const lines = await this.wrapText(ctx, text, 600);
    const startY = 160;
    ctx.fillText(lines.join("\n"), 50, startY);
    fs.writeFileSync(pathImg, canvasImg.toBuffer());

    return api.sendMessage({ attachment: fs.createReadStream(pathImg) }, threadID, () => fs.unlinkSync(pathImg), messageID);
  },
};
