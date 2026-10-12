const QRCode = require('qrcode');
const fs = require('fs-extra');
const path = require('path');

function extractData(args) {
    let data = args.join(" ").trim();
    if (!data) data = "https://example.com";
    return data;
}

module.exports = {
  config: {
    name: "qrgen",
    aliases: ["qrcode"],
    version: "2.0",
    author: "Acard",
    countDown: 5,
    role: 0,
    longDescription: "توليد رمز QR من نص أو رابط أو أي معلومات.",
    category: "utility",
    guide: { ar: "{pn} [نص أو رابط]" }
  },

  onStart: async function({ message, args, event }) {
    const qrData = extractData(args);
    if (!qrData) return message.reply("❌ يرجى إدخال نص أو رابط لتوليد رمز QR.");

    message.reaction("⏳", event.messageID);
    let tempFilePath;

    try {
      const cacheDir = path.join(__dirname, 'cache');
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
      
      tempFilePath = path.join(cacheDir, `qr_code_${Date.now()}.png`);

      await QRCode.toFile(tempFilePath, qrData, { color: { dark: '#000', light: '#FFF' }, scale: 8 });

      message.reaction("✅", event.messageID);
      await message.reply({ body: "✅ تم توليد رمز QR الخاص بك!", attachment: fs.createReadStream(tempFilePath) });
    } catch (error) {
      message.reaction("❌", event.messageID);
      let errorMessage = "حدث خطأ أثناء توليد رمز QR.";
      if (error.message) errorMessage = `❌ ${error.message}`;
      console.error("خطأ أمر QRGen:", error);
      message.reply(`❌ ${errorMessage}`);
    } finally {
      if (tempFilePath && fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
    }
  }
};
