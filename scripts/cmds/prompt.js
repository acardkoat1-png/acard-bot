const axios = require("axios");

const configUrl = "https://raw.githubusercontent.com/aryannix/stuffs/master/raw/apis.json";

module.exports = {
  config: {
    name: "prompt",
    aliases: ["p"],
    version: "2.0",
    role: 0,
    author: "Acard",
    category: "AI",
    cooldowns: 5,
    guide: { ar: "رد على صورة لتوليد وصف Midjourney" }
  },

  onStart: async ({ api, event }) => {
    const { threadID, messageID, messageReply } = event;
    let baseApi;
    try {
      const configRes = await axios.get(configUrl);
      baseApi = configRes.data && configRes.data.api;
      if (!baseApi) throw new Error("خطأ في الإعدادات: API مفقود.");
    } catch (error) {
      return api.sendMessage("❌ فشل جلب إعدادات API.", threadID, messageID);
    }

    if (!messageReply || !messageReply.attachments || messageReply.attachments.length === 0 || !messageReply.attachments[0].url) {
      return api.sendMessage("يرجى الرد على صورة.", threadID, messageID);
    }

    try {
      api.setMessageReaction("⏰", messageID, () => {}, true);
      const imageUrl = messageReply.attachments[0].url;
      const apiUrl = `${baseApi}/promptv2`;
      const apiResponse = await axios.get(apiUrl, { params: { imageUrl } });
      const result = apiResponse.data;
      if (!result.success) throw new Error(result.message || "فشل API.");
      const promptText = result.prompt || "لم يتم إرجاع وصف.";
      await api.sendMessage({ body: `${promptText}` }, threadID, messageID);
      api.setMessageReaction("✅", messageID, () => {}, true);
    } catch (e) {
      api.setMessageReaction("❌", messageID, () => {}, true);
      let msg = "خطأ أثناء توليد الوصف.";
      if (e.response?.data?.error) msg = e.response.data.error;
      else if (e.message) msg = e.message;
      api.sendMessage(msg, threadID, messageID);
    }
  }
};
