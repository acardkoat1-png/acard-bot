const axios = require("axios");
const fs = require("fs-extra");

module.exports = {
  config: {
    name: "sdxl",
    aliases: [],
    version: "2.0",
    author: "Acard",
    countDown: 10,
    role: 0,
    shortDescription: "توليد صورة بـ SDXL Light",
    longDescription: "توليد صورة بالذكاء الاصطناعي باستخدام SDXL Light API بأنماط متعددة",
    category: "AI-IMAGE",
    guide: {
      ar: "{pn} <وصف> | <النمط>\n\nالأنماط المتاحة:\n- 3D Model\n- Analog Film\n- Anime\n- Cinematic\n- Comic Book"
    }
  },

  onStart: async function ({ api, event, args }) {
    const input = args.join(" ").split("|");
    const prompt = input[0]?.trim();
    const style = input[1]?.trim();

    if (!prompt || !style) {
      return api.sendMessage("❌ | يرجى إدخال الوصف والنمط.\nمثال:\n.sdxl تنين يطير فوق مدينة | Anime", event.threadID, event.messageID);
    }

    const validStyles = ["3D Model", "Analog Film", "Anime", "Cinematic", "Comic Book"];
    if (!validStyles.includes(style)) {
      return api.sendMessage("❌ | نمط غير صالح. الأنماط المتاحة:\n- " + validStyles.join("\n- "), event.threadID, event.messageID);
    }

    const msg = await api.sendMessage("⏳ | جارٍ توليد الصورة...", event.threadID);

    try {
      const response = await axios({
        method: "GET",
        url: "https://www.arch2devs.ct.ws/api/sdxl-light",
        params: { prompt, style, model: "sdxl" },
        responseType: "arraybuffer"
      });

      const path = __dirname + `/cache/sdxllight_${event.senderID}.png`;
      fs.writeFileSync(path, Buffer.from(response.data, "binary"));

      api.sendMessage({
        body: `✅ | إليك صورتك:\nالوصف: ${prompt}\nالنمط: ${style}`,
        attachment: fs.createReadStream(path)
      }, event.threadID, () => fs.unlinkSync(path), msg.messageID);

    } catch (error) {
      console.error(error);
      api.sendMessage("❌ | فشل توليد الصورة. يرجى المحاولة لاحقاً.", event.threadID, msg.messageID);
    }
  }
};