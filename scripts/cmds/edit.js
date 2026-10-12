const axios = require("axios");
const fs = require("fs");
const path = require("path");

const noobcore = "https://raw.githubusercontent.com/noobcore404/NC-STORE/main/NCApiUrl.json";

async function getRenzApi() {
  const res = await axios.get(noobcore, { timeout: 10000 });
  if (!res.data?.renz) throw new Error("Renz API not found in JSON");
  return res.data.renz;
}

module.exports = {
  config: {
    name: "edit",
    aliases: ["nanobanana", "gptimage"],
    version: "2.0",
    author: "Acard",
    countDown: 5,
    role: 0,
    shortDescription: "توليد أو تعديل الصور باستخدام الأوامر النصية",
    category: "image",
    guide: "{pn} <وصف> | قم بالرد على صورة مع وصفك"
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID, messageReply } = event;
    const prompt = args.join(" ").trim();

    if (!prompt) {
      return api.sendMessage(
        "❌ يرجى إدخال وصف للصورة.\n\nمثال:\n!edit مدينة سايبربانك\n!edit اجعلني أنمي (بالرد على صورة)",
        threadID,
        messageID
      );
    }

    const loadingMsg = await api.sendMessage("⏳ جارٍ معالجة صورتك...", threadID);

    const imgPath = path.join(__dirname, "cache", `${Date.now()}_gptgen.png`);

    try {
      const BASE_URL = await getRenzApi();
      let apiURL = `${BASE_URL}/api/gptimage?prompt=${encodeURIComponent(prompt)}`;

      if (messageReply?.attachments?.[0]?.type === "photo") {
        const repliedImage = messageReply.attachments[0];
        apiURL += `&ref=${encodeURIComponent(repliedImage.url)}`;
        if (repliedImage.width && repliedImage.height) {
          apiURL += `&width=${repliedImage.width}&height=${repliedImage.height}`;
        }
      } else {
        apiURL += `&width=512&height=512`;
      }

      const res = await axios.get(apiURL, {
        responseType: "arraybuffer",
        timeout: 180000
      });

      fs.mkdirSync(path.dirname(imgPath), { recursive: true });
      fs.writeFileSync(imgPath, res.data);

      await api.unsendMessage(loadingMsg.messageID);

      await api.sendMessage(
        {
          body: messageReply?.attachments?.[0]
            ? `🖌 تم تعديل الصورة بنجاح.\nالوصف: ${prompt}`
            : `🖼 تم توليد الصورة بنجاح.\nالوصف: ${prompt}`,
          attachment: fs.createReadStream(imgPath)
        },
        threadID,
        () => fs.unlinkSync(imgPath)
      );

    } catch (err) {
      console.error("GPTGEN Error:", err?.response?.data || err.message);
      await api.unsendMessage(loadingMsg.messageID);
      api.sendMessage("❌ فشلت معالجة الصورة. يرجى المحاولة لاحقاً.", threadID);
    }
  }
};