const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "filecmd",
    aliases: ["file"],
    version: "2.0",
    author: "Acard",
    countDown: 5,
    role: 2,
    shortDescription: "عرض كود أمر",
    longDescription: "عرض الكود المصدري لأي أمر في مجلد الأوامر",
    category: "owner",
    guide: "{pn} <اسم الأمر>"
  },

  onStart: async function ({ args, message }) {
    const cmdName = args[0];
    if (!cmdName) return message.reply("❌ | يرجى إدخال اسم الأمر.\nمثال: filecmd fluxsnell");

    const cmdPath = path.join(__dirname, `${cmdName}.js`);
    if (!fs.existsSync(cmdPath)) return message.reply(`❌ | الأمر "${cmdName}" غير موجود في هذا المجلد.`);

    try {
      const code = fs.readFileSync(cmdPath, "utf8");

      if (code.length > 19000) {
        return message.reply("⚠️ | هذا الملف كبير جداً للعرض.");
      }

      return message.reply({
        body: `📄 | الكود المصدري لـ "${cmdName}.js":\n\n${code}`
      });
    } catch (err) {
      console.error(err);
      return message.reply("❌ | خطأ في قراءة الملف.");
    }
  }
};