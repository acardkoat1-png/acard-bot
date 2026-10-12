const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const API = "https://lyric-search-neon.vercel.app/kshitiz?keyword=";
const CACHE = path.join(__dirname, "tiktok_cache");

async function stream(url) {
  const res = await axios({ url, responseType: "stream", timeout: 180000 });
  return res.data;
}

module.exports = {
  config: {
    name: "tiktok",
    aliases: ["tt"],
    version: "2.0",
    author: "Acard",
    role: 0,
    countDown: 5,
    category: "media",
    description: { ar: "بحث وتحميل فيديوهات تيك توك" },
    guide: { ar: "{pn} <كلمة البحث>" }
  },

  onStart: async function ({ api, event, args, commandName }) {
    const query = args.join(" ");
    if (!query) return api.sendMessage("❌ أدخل كلمة بحث!", event.threadID, event.messageID);

    api.sendMessage(`🔎 جارٍ البحث في تيك توك...\n🔍 الكلمة: ❝ ${query} ❞`, event.threadID);

    try {
      const res = await axios.get(API + encodeURIComponent(query));
      const results = res.data.slice(0, 6);
      if (!results.length) return api.sendMessage("❌ لم يتم العثور على فيديوهات!", event.threadID);

      let body = "✨ نتائج تيك توك ✨\n\n";
      const imgs = [];
      results.forEach((v, i) => {
        body += `${i + 1}️⃣ ${v.title.slice(0, 50)}\n`;
        body += `👤 @${v.author.unique_id}\n`;
        body += `⏱️ ${v.duration}ث\n\n`;
        if (v.cover) imgs.push(stream(v.cover));
      });
      body += `📥 رد بـ 1-${results.length} للتحميل`;

      const atts = await Promise.all(imgs);
      api.sendMessage({ body, attachment: atts }, event.threadID, (err, info) => {
        if (err) return;
        global.GoatBot.onReply.set(info.messageID, { commandName, author: event.senderID, messageID: info.messageID, results });
      });
    } catch (e) { api.sendMessage("❌ خطأ في API تيك توك!", event.threadID); }
  },

  onReply: async function ({ api, event, Reply }) {
    const choose = parseInt(event.body);
    if (isNaN(choose)) return;
    const { results, messageID } = Reply;
    if (choose < 1 || choose > results.length) return api.sendMessage(`❌ غير صالح!\nاختر 1-${results.length}`, event.threadID, event.messageID);

    try { if (messageID) await api.unsendMessage(messageID); } catch (_) {}

    const video = results[choose - 1];
    await fs.ensureDir(CACHE);
    const name = video.title.slice(0, 25).replace(/[^a-z0-9]/gi, "_");
    const file = path.join(CACHE, `${Date.now()}_${name}.mp4`);

    api.sendMessage(`⏳ جارٍ التحميل...\n🎬 ${video.title}`, event.threadID);

    try {
      const res = await axios({ url: video.videoUrl, responseType: "stream", timeout: 300000 });
      const w = fs.createWriteStream(file);
      res.data.pipe(w);
      await new Promise((r, e) => { w.on("finish", r); w.on("error", e); });

      api.sendMessage({ body: `✅ تم التحميل!\n\n🎥 ${video.title}\n👤 @${video.author.unique_id}\n⏱️ ${video.duration}ث`, attachment: fs.createReadStream(file) }, event.threadID, () => fs.unlinkSync(file));
    } catch (e) { api.sendMessage("❌ فشل التحميل!", event.threadID); }
  }
};
