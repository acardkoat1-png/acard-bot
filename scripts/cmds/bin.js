const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "pastebin",
    aliases: ["bin"],
    version: "2.0",
    author: "Acard",
    countDown: 5,
    role: 0,
    shortDescription: "رفع كود أمر إلى Pastebin",
    longDescription: "رفع الكود المصدري لأي أمر إلى خدمة Pastebin وإرجاع رابط خام.",
    category: "utility",
    guide: "{pn} <اسم الأمر>"
  },

  onStart: async function ({ api, event, args, message }) {
    // حماية المؤلف - تم تحديثها لـ Acard
    const encodedAuthor = 'QWNhcmQ=';
    const correctAuthor = Buffer.from(encodedAuthor, 'base64').toString('utf8');

    if (this.config.author !== correctAuthor) {
      return message.reply("❌ | تم تغيير اسم المؤلف. هذا الأمر لن يعمل.");
    }

    const cmdName = args[0];
    if (!cmdName) {
      return message.reply("❌ | يرجى إدخال اسم الأمر لرفعه.");
    }

    const cmdPath = path.join(__dirname, `${cmdName}.js`);

    if (!fs.existsSync(cmdPath) || !cmdPath.startsWith(__dirname)) {
      return message.reply(`❌ | الأمر "${cmdName}" غير موجود في هذا المجلد.`);
    }

    try {
      const code = fs.readFileSync(cmdPath, "utf8");
      
      // رابط API محمي بالتشفير
      const encodedApiKey = 'aHR0cHM6Ly9hcnlhbmFwaS51cC5yYWlsd2F5LmFwcC9hcGkvcGFzdGViaW4=';
      const apiUrl = Buffer.from(encodedApiKey, 'base64').toString('utf8');

      const response = await axios.get(apiUrl, {
        params: {
          content: code,
          title: `${cmdName}.js source code`
        }
      });

      const { status, raw } = response.data;
      if (status === 0 && raw) {
        return message.reply(`✅ | رابط الكود الخام لـ "${cmdName}.js":\n🔗 الرابط: ${raw}`);
      } else {
        return message.reply(`❌ | فشل رفع المحتوى إلى Pastebin. يرجى المحاولة لاحقاً.`);
      }
    } catch (error) {
      console.error(error);
      return message.reply("❌ | حدث خطأ أثناء محاولة قراءة ورفع ملف الأمر.");
    }
  }
};
