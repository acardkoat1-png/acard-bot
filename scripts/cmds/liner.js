const axios = require('axios');

async function liner(api, event, args, message) {
  try {
    const prompt = args.join(" ").trim();
    if (!prompt) return message.reply("يرجى إدخال سؤال.");
    const response = await getLinerResponse(prompt);
    if (response && response.answer) {
      message.reply(response.answer, (r, s) => { global.GoatBot.onReply.set(s.messageID, { commandName: module.exports.config.name, uid: event.senderID }); });
    } else message.reply("لا يوجد رد من Liner.");
  } catch (error) { console.error("خطأ:", error); message.reply("حدث خطأ أثناء معالجة طلبك."); }
}

async function getLinerResponse(prompt) {
  try {
    const url = `https://liner-ai.vercel.app/kshitiz?prompt=${encodeURIComponent(prompt)}`;
    const response = await axios.get(url);
    return response.data;
  } catch (error) { console.error("خطأ من Liner API:", error.message); throw error; }
}

module.exports = {
  config: { name: "liner", version: "2.0", author: "Acard", role: 0, longDescription: "مساعد Liner AI.", category: "ai", guide: { ar: "{p}liner [سؤال]" } },
  handleCommand: liner,
  onStart: function ({ api, message, event, args }) { return liner(api, event, args, message); },
  onReply: function ({ api, message, event, args }) { return liner(api, event, args, message); }
};