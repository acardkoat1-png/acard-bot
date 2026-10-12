const axios = require("axios");
const fs = require('fs');
const path = require('path');
const GoatStor = "https://goatstore.vercel.app";

module.exports = {
  config: {
    name: "goatstore",
    aliases: ["gs", "market", "cmdstore"],
    version: "2.0",
    role: 2,
    author: "Acard",
    shortDescription: {
      ar: "📌 متجر الأوامر"
    },
    longDescription: {
      ar: "📌 تصفح، ابحث، ارفع، وأدر أوامرك في متجر GoatStore."
    },
    category: "market",
    cooldowns: 0,
  },

  onStart: async ({ api, event, args, message }) => {
    const sendBeautifulMessage = (content) => {
      const header = "╭──『 🐐 متجر الأوامر 』──╮\n";
      const footer = "\n╰──────────────╯";
      return message.reply(header + content + footer);
    };

    try {
      if (!args[0]) {
        return sendBeautifulMessage(
          "\n" +
          `╭─❯ ${event.body} show <ID>\n├ 📦 عرض كود الأمر\n╰ مثال: show 1\n\n` +
          `╭─❯ ${event.body} page <رقم>\n├ 📄 تصفح الأوامر\n╰ مثال: page 1\n\n` +
          `╭─❯ ${event.body} search <استعلام>\n├ 🔍 بحث عن أوامر\n╰ مثال: search music\n\n` +
          `╭─❯ ${event.body} trending\n├ 🔥 عرض الشائع\n╰ الأوامر الأكثر شعبية\n\n` +
          `╭─❯ ${event.body} status\n├ 📊 عرض الإحصائيات\n╰ معلومات المتجر\n\n` +
          `╭─❯ ${event.body} like <ID>\n├ 💝 إعجاب بأمر\n╰ مثال: like 1\n\n` +
          `╭─❯ ${event.body} upload <اسم>\n├ ⬆️ رفع أمر\n╰ مثال: upload أمر\n\n` +
          "💫 نصيحة: استخدم `مساعدة متجر الأوامر` للتفاصيل"
        );
      }

      const command = args[0].toLowerCase();

      switch (command) {
        case "show": {
          const itemID = parseInt(args[1]);
          if (isNaN(itemID)) return sendBeautifulMessage("\n[⚠️]➜ يرجى إدخال معرف صحيح.");
          const response = await axios.get(`${GoatStor}/api/item/${itemID}`);
          const item = response.data;
          
          const bangladeshTime = new Date(item.createdAt).toLocaleString('en-US', { timeZone: 'Asia/Dhaka' });

          return sendBeautifulMessage(
            "\n" +
            `╭─❯ 👑 الاسم\n╰ ${item.itemName}\n\n` +
            `╭─❯ 🆔 المعرف\n╰ ${item.itemID}\n\n` +
            `╭─❯ ⚙️ النوع\n╰ ${item.type || 'غير معروف'}\n\n` +
            `╭─❯ 📝 الوصف\n╰ ${item.description}\n\n` +
            `╭─❯ 👨‍💻 المؤلف\n╰ ${item.authorName}\n\n` +
            `╭─❯ 📅 أُضيف\n╰ ${bangladeshTime}\n\n` +
            `╭─❯ 👀 المشاهدات\n╰ ${item.views}\n\n` +
            `╭─❯ 💝 الإعجابات\n╰ ${item.likes}\n\n` +
            `╭─❯ 🔗 الرابط الخام\n╰ ${GoatStor}/raw/${item.rawID}`
          );
        }

        case "page": {
          const page = parseInt(args[1]) || 1;
          const { data: { items, total } } = await axios.get(`${GoatStor}/api/items?page=${page}&limit=5`);
          const totalPages = Math.ceil(total / 5);
          if (page <= 0 || page > totalPages) {
            return sendBeautifulMessage("\n[⚠️]➜ رقم صفحة غير صالح.");
          }
          const itemsList = items.map((item, index) =>
            `╭─❯ ${index + 1}. 📦 ${item.itemName}\n` +
            `├ 🆔 المعرف: ${item.itemID}\n` +
            `├ ⚙️ النوع: ${item.type}\n` +
            `├ 📝 الوصف: ${item.description}\n` +
            `├ 👀 المشاهدات: ${item.views}\n` +
            `├ 💝 الإعجابات: ${item.likes}\n` +
            `╰ 👨‍💻 المؤلف: ${item.authorName}\n`
          ).join("\n");
          return sendBeautifulMessage(`\n📄 الصفحة ${page}/${totalPages}\n\n${itemsList}`);
        }

        case "search": {
          const query = args.slice(1).join(" ");
          if (!query) return sendBeautifulMessage("\n[⚠️]➜ يرجى إدخال كلمة بحث.");
          const { data } = await axios.get(`${GoatStor}/api/items?search=${encodeURIComponent(query)}`);
          const results = data.items;
          if (!results.length) return sendBeautifulMessage("\n❌ لا توجد نتائج مطابقة.");
          const searchList = results.slice(0, 5).map((item, index) =>
            `╭─❯ ${index + 1}. 📦 ${item.itemName}\n` +
            `├ 🆔 المعرف: ${item.itemID}\n` +
            `├ ⚙️ النوع: ${item.type}\n` +
            `├ 👀 المشاهدات: ${item.views}\n` +
            `├ 💝 الإعجابات: ${item.likes}\n` +
            `╰ 👨‍💻 المؤلف: ${item.authorName}\n`
          ).join("\n");
          return sendBeautifulMessage(`\n📝 بحث: "${query}"\n\n${searchList}`);
        }

        case "trending": {
          const { data } = await axios.get(`${GoatStor}/api/trending`);
          const trendingList = data.slice(0, 5).map((item, index) =>
            `╭─❯ ${index + 1}. 🔥 ${item.itemName}\n` +
            `├ 💝 الإعجابات: ${item.likes}\n` +
            `╰ 👀 المشاهدات: ${item.views}\n`
          ).join("\n");
          return sendBeautifulMessage(`\n${trendingList}`);
        }

        case "status": {
          const { data: stats } = await axios.get(`${GoatStor}/api/stats`);
          const { hosting, totalCommands, totalLikes, dailyActiveUsers, popularTags, topAuthors, topViewed } = stats;
          const uptimeStr = `${hosting?.uptime?.years}س ${hosting?.uptime?.months}ش ${hosting?.uptime?.days}ي ${hosting?.uptime?.hours}س ${hosting?.uptime?.minutes}د ${hosting?.uptime?.seconds}ث`;
          const tagList = popularTags.map((tag, i) =>
            `${i + 1}. ${tag._id || 'غير معروف'} (${tag.count})`
          ).join('\n');
          const authorList = topAuthors.map((a, i) =>
            `${i + 1}. ${a._id || 'غير معروف'} (${a.count})`
          ).join('\n');
          const viewedList = topViewed.map((v, i) =>
            `${i + 1}. ${v.itemName} المعرف: ${v.itemID}\n المشاهدات: ${v.views}`
          ).join('\n\n');
          return sendBeautifulMessage(
            `\n╭─❯ 📦 إجمالي الأوامر: ${totalCommands}\n` +
            `├─❯ 💝 إجمالي الإعجابات: ${totalLikes}\n` +
            `├─❯ 👥 المستخدمين اليوميين: ${dailyActiveUsers}\n` +
            `╰─❯ ⏰ وقت التشغيل: ${uptimeStr}\n\n` +
            `══『 🌟 أفضل المؤلفين 』══\n╰${authorList}\n\n` +
            `══『 🔥 الأكثر مشاهدة 』══\n╰${viewedList}`
          );
        }

        case "like": {
          const likeItemId = parseInt(args[1]);
          if (isNaN(likeItemId)) return sendBeautifulMessage("\n[⚠️]➜ يرجى إدخال معرف صحيح.");
          const { data } = await axios.post(`${GoatStor}/api/items/${likeItemId}/like`);
          if (data.success) {
            return sendBeautifulMessage(
              `\n╭─❯ ✨ الحالة\n╰ تم الإعجاب بنجاح!\n\n╭─❯ 💝 إجمالي الإعجابات\n╰ ${data.likes}`
            );
          } else {
            return sendBeautifulMessage("\n[⚠️]➜ فشل الإعجاب بالأمر.");
          }
        }

        case "upload": {
          const commandName = args[1];
          if (!commandName) return sendBeautifulMessage("\n[⚠️]➜ يرجى إدخال اسم الأمر.");
          const commandPath = path.join(process.cwd(), 'scripts', 'cmds', `${commandName}.js`);
          if (!fs.existsSync(commandPath)) return sendBeautifulMessage(`\n❌ الملف'${commandName}.js' غير موجود`);
          try {
            const code = fs.readFileSync(commandPath, 'utf8');
            let commandFile;
            try {
              commandFile = require(commandPath);
            } catch (err) {
              return sendBeautifulMessage("\n[⚠️]➜ ملف أمر غير صالح.");
            }
            const uploadData = {
              itemName: commandFile.config?.name || commandName,
              description: commandFile.config?.longDescription?.ar || commandFile.config?.shortDescription?.ar || "لا يوجد وصف",
              type: "GoatBot",
              code,
              authorName: commandFile.config?.author || event.senderID || "غير معروف"
            };
            const response = await axios.post(`${GoatStor}/v1/paste`, uploadData);
            if (response.data.success) {
              const { itemID, link } = response.data;
              return sendBeautifulMessage(
                "\n" +
                `╭─❯ ✅ الحالة\n╰ تم رفع الأمر بنجاح\n\n` +
                `╭─❯ 👑 الاسم\n╰ ${uploadData.itemName}\n\n` +
                `╭─❯ 🆔 المعرف\n╰ ${itemID}\n\n` +
                `╭─❯ 👨‍💻 المؤلف\n╰ ${uploadData.authorName}\n\n`  +
                `╭─❯ 🔗 الرابط\n╰ ${link}`
              );
            }
            return sendBeautifulMessage("\n[⚠️]➜ فشل رفع الأمر.");
          } catch (error) {
            console.error("خطأ في الرفع:", error);
            return sendBeautifulMessage("\n[⚠️]➜ حدث خطأ غير متوقع أثناء رفع الأمر.");
          }
        }

        default:
          return sendBeautifulMessage("\n[⚠️]➜ أمر فرعي غير صالح. استخدم `مساعدة` للخيارات");
      }
    } catch (err) {
      console.error("خطأ متجر الأوامر:", err);
      return sendBeautifulMessage("\n[⚠️]➜ حدث خطأ غير متوقع.");
    }
  }
};
