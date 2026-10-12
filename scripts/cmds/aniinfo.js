const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "aniinfo",
    aliases: ["animeinfo", "a-info"],
    version: "2.0",
    author: "Acard",
    countDown: 0,
    role: 0,
    description: "جلب معلومات أنمي باستخدام Jikan API",
    category: "anime",
    guide: {
      ar: "{pn} [اسم الأنمي] — يعرض تفاصيل الأنمي"
    }
  },

  onStart: async function ({ api, event, args }) {
    const query = args.join(" ");
    if (!query) {
      return api.sendMessage("❗ اسم الأنمي مفقود. جرب: aniinfo demon slayer", event.threadID);
    }

    try {
      const res = await axios.get(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=1`);
      const anime = res.data.data[0];

      if (!anime) return api.sendMessage("❌ لا توجد نتائج.", event.threadID);

      const {
        title,
        title_english,
        type,
        episodes,
        status,
        score,
        aired,
        synopsis,
        images,
        genres,
        url
      } = anime;

      const msg = `🎬 العنوان: ${title_english || title}
📺 النوع: ${type}
📊 التقييم: ${score || "?"}/10
📡 الحالة: ${status}
🎞 الحلقات: ${episodes || "?"}
📅 تاريخ العرض: ${aired.string || "?"}
🎭 التصنيفات: ${genres.map(g => g.name).join(", ")}

📝 الوصف:
${synopsis?.substring(0, 400) || "لا يوجد وصف متاح."}...

🔗 ${url}`;

      const imageURL = images.jpg.large_image_url;
      const imgData = (await axios.get(imageURL, { responseType: "arraybuffer" })).data;
      const filePath = path.join(__dirname, "aniinfo.jpg");
      fs.writeFileSync(filePath, imgData);

      api.sendMessage(
        {
          body: msg,
          attachment: fs.createReadStream(filePath)
        },
        event.threadID,
        () => fs.unlinkSync(filePath),
        event.messageID
      );

    } catch (err) {
      console.error(err);
      api.sendMessage("🚫 خطأ في جلب بيانات الأنمي. يرجى المحاولة لاحقاً.", event.threadID);
    }
  }
};