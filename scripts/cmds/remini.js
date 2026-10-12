const axios = require("axios");

const mahmud = async () => {
  const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json");
  return base.data.mahmud[0];
};

module.exports = {
  config: {
    name: "remini",
    version: "2.1",
    author: "Acard",
    countDown: 10,
    role: 0,
    category: "AI",
    description: "تحسين الصورة بـ Remini",
    guide: { ar: "{pn} [رابط] أو رد على صورة" }
  },

  onStart: async function ({ message, event, args }) {
    const startTime = Date.now();
    let imgUrl;

    if (event.messageReply?.attachments?.[0]?.type === "photo") imgUrl = event.messageReply.attachments[0].url;
    else if (args[0]) imgUrl = args.join(" ");
    if (!imgUrl) return message.reply("📸 | يرجى الرد على صورة أو إدخال رابط");

    message.reaction("⌛", event.messageID);
    const waitMsg = await message.reply("⏳ | جارٍ تحسين الصورة...");

    try {
      const apiUrl = `${await mahmud()}/api/remini?imgUrl=${encodeURIComponent(imgUrl)}`;
      const res = await axios.get(apiUrl, { responseType: "stream" });
      if (waitMsg?.messageID) message.unsend(waitMsg.messageID);

      message.reaction("✅", event.messageID);
      const processTime = ((Date.now() - startTime) / 1000).toFixed(2);
      message.reply({ body: `✅ | تم التحسين (${processTime}s)`, attachment: res.data });
    } catch (error) {
      if (waitMsg?.messageID) message.unsend(waitMsg.messageID);
      message.reaction("❌", event.messageID);
      message.reply("❌ | فشل التحسين");
    }
  }
};