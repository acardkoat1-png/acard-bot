const fs = require("fs-extra");
const path = __dirname + "/cache/autoseen.json";

// إذا المجلد أو الملف غير موجود يتم إنشاؤه
fs.ensureDirSync(__dirname + "/cache");
if (!fs.existsSync(path)) {
  fs.writeFileSync(path, JSON.stringify({ status: true }, null, 2));
}

module.exports = {
  config: {
    name: "autoseen",
    version: "2.0",
    author: "Acard",
    countDown: 0,
    role: 0,
    shortDescription: "نظام التعليم المقروء التلقائي",
    longDescription: "يقوم البوت تلقائياً بتعليم جميع الرسائل الجديدة كمقروءة.",
    category: "system",
    guide: {
      ar: "{pn} on/off",
    },
  },

  onStart: async function ({ message, args }) {
    const data = JSON.parse(fs.readFileSync(path));
    if (!args[0]) {
      return message.reply(`📄 حالة التعليم المقروء التلقائي: ${data.status ? "✅ مفعّل" : "❌ معطّل"}`);
    }

    if (args[0].toLowerCase() === "on") {
      data.status = true;
      fs.writeFileSync(path, JSON.stringify(data, null, 2));
      return message.reply("✅ تم تشغيل التعليم المقروء التلقائي!");
    } else if (args[0].toLowerCase() === "off") {
      data.status = false;
      fs.writeFileSync(path, JSON.stringify(data, null, 2));
      return message.reply("❌ تم إيقاف التعليم المقروء التلقائي!");
    } else {
      return message.reply("⚠️ الاستخدام: autoseen on / off");
    }
  },

  onChat: async function ({ event, api }) {
    try {
      const data = JSON.parse(fs.readFileSync(path));
      if (data.status === true) {
        api.markAsReadAll();
      }
    } catch (e) {
      console.error(e);
    }
  },
};
