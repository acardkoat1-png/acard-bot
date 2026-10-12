const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const ytSearch = require("yt-search");

const nix = "https://raw.githubusercontent.com/aryannix/stuffs/master/raw/apis.json";
const cacheDir = path.join(__dirname, "cache");

module.exports = {
  config: {
    name: "mp3",
    aliases: ["ytmp3"],
    version: "3.0",
    role: 0,
    author: "Acard",
    shortDescription: "تحميل أغنية أو فيديو يوتيوب كـ MP3",
    category: "media",
    guide: "{p}mp3 <اسم الأغنية أو رابط يوتيوب>"
  },

  onStart: async function({ api, args, event }) {
    const { threadID, messageID } = event;

    const q = args.join(" ");
    if (!q) return api.sendMessage("⚠️ يرجى إدخال اسم أغنية أو رابط يوتيوب!", threadID, messageID);

    api.sendMessage("⏳ جارٍ البحث والتحميل يرجى الانتظار...", threadID, messageID);

    try {
      await fs.ensureDir(cacheDir);

      let url = q;
      if (!q.startsWith("http")) {
        const r = await ytSearch(q);
        const v = r.videos[0];
        if (!v) return api.sendMessage("❌ لم يتم العثور على الأغنية!", threadID, messageID);
        url = v.url;
      }

      const D = await axios.get(nix);
      const apiBase = D.data.api;
      if (!apiBase) throw new Error("خطأ في إعدادات API");

      const F = await axios.get(`${apiBase}/ytdl`, { params: { url, type: "audio" }, timeout: 30000 });
      if (!F.data.status || !F.data.downloadUrl) throw new Error("فشل جلب رابط التحميل");

      const title = F.data.title || "audio";
      const filePath = path.join(cacheDir, `mp3_${Date.now()}.mp3`);

      const res = await axios.get(F.data.downloadUrl, { responseType: "arraybuffer", timeout: 60000 });
      await fs.outputFile(filePath, Buffer.from(res.data));

      await api.sendMessage({
        body: `🎵 ${title}`,
        attachment: fs.createReadStream(filePath)
      }, threadID, () => { fs.remove(filePath).catch(() => {}); }, messageID);

    } catch (err) {
      console.log(err);
      api.sendMessage("⚠️ فشل التحميل! تأكد من اسم الأغنية أو الرابط.", threadID, messageID);
    }
  }
};
