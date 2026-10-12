const axios = require("axios");

module.exports = {
  config: {
    name: "manga",
    aliases: ["man", "ani-manga"],
    version: "2.0",
    author: "Acard",
    countDown: 0,
    role: 0,
    description: "بحث عن معلومات مانجا باستخدام AniList API",
    category: "anime",
    guide: { ar: "{pn} [اسم المانجا] — الحصول على معلومات المانجا من AniList" }
  },

  onStart: async function ({ api, event, args }) {
    const query = args.join(" ");
    if (!query) return api.sendMessage("🔍 | يرجى إدخال اسم المانجا.", event.threadID);

    const anilistQuery = `query ($search: String) { Media(search: $search, type: MANGA) { title { romaji english native } description(asHtml: false) status chapters volumes averageScore genres siteUrl coverImage { large } } }`;
    const variables = { search: query };

    try {
      const res = await axios.post("https://graphql.anilist.co", { query: anilistQuery, variables });
      const manga = res.data.data.Media;
      const title = manga.title.english || manga.title.romaji || manga.title.native;
      const desc = manga.description?.replace(/<br>/g, "\n").replace(/<\/?[^>]+(>|$)/g, "").substring(0, 300) || "لا يوجد وصف.";
      const msg = `📖 ${title}\n\n📌 الحالة: ${manga.status}\n📚 الفصول: ${manga.chapters || "?"}\n📘 المجلدات: ${manga.volumes || "?"}\n⭐ التقييم: ${manga.averageScore || "?"}/100\n🎭 التصنيفات: ${manga.genres.join(", ")}\n\n📝 الوصف:\n${desc}...\n\n🔗 ${manga.siteUrl}`;

      const cover = manga.coverImage.large;
      const img = (await axios.get(cover, { responseType: "arraybuffer" })).data;
      const imgPath = __dirname + "/manga.jpg";
      const fs = require("fs");
      fs.writeFileSync(imgPath, Buffer.from(img, "utf-8"));

      api.sendMessage({ body: msg, attachment: fs.createReadStream(imgPath) }, event.threadID, () => fs.unlinkSync(imgPath));
    } catch (e) {
      console.error(e);
      api.sendMessage("❌ | تعذر جلب معلومات المانجا. حاول مرة أخرى أو تحقق من الاسم.", event.threadID);
    }
  }
};