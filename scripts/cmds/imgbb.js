const axios = require("axios");
const FormData = require("form-data");

const IMGBB_API_KEY = "22f062007b2a03f7923f9e44558314b3";

module.exports = {
  config: {
    name: "imgbb",
    version: "2.0",
    author: "Acard",
    category: "tools",
    shortDescription: "رفع الصور إلى ImgBB والحصول على رابط",
    longDescription: "قم بالرد على صورة بهذا الأمر لرفعها إلى ImgBB والحصول على رابط مباشر.",
    guide: "{pn}imgbb (رد على صورة)"
  },

  onStart: async function ({ api, event }) {
    try {
      const attachments = event.messageReply?.attachments;

      if (!attachments || attachments.length === 0) {
        return api.sendMessage("❌ يرجى الرد على صورة.", event.threadID, event.messageID);
      }

      if (attachments[0].type !== "photo") {
        return api.sendMessage("❌ الصور فقط مدعومة.", event.threadID, event.messageID);
      }

      const imageUrl = attachments[0].url;
      const imageResponse = await axios.get(imageUrl, { responseType: "arraybuffer" });
      const imageBuffer = Buffer.from(imageResponse.data);

      const form = new FormData();
      form.append("image", imageBuffer.toString("base64"));
      form.append("key", IMGBB_API_KEY);

      const uploadResponse = await axios.post("https://api.imgbb.com/1/upload", form, {
        headers: form.getHeaders()
      });

      const result = uploadResponse.data;

      if (result.success) {
        const { url } = result.data;
        return api.sendMessage(url, event.threadID, event.messageID);
      } else {
        return api.sendMessage("❌ فشل الرفع. يرجى المحاولة مرة أخرى.", event.threadID, event.messageID);
      }

    } catch (error) {
      console.error("خطأ ImgBB:", error.message);
      return api.sendMessage("❌ حدث خطأ ما. يرجى المحاولة مرة أخرى.", event.threadID, event.messageID);
    }
  }
};