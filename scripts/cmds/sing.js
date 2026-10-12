const A = require("axios");
const B = require("fs-extra");
const C = require("path");
const S = require("yt-search");

const nix = "https://raw.githubusercontent.com/aryannix/stuffs/master/raw/apis.json";
const cacheDir = C.join(__dirname, "cache");

module.exports = {
  config: {
    name: "sing",
    aliases: ["song", "music", "play"],
    version: "2.0",
    author: "Acard",
    countDown: 10,
    role: 0,
    category: "media"
  },

  onStart: async function ({ api, event, args }) {
    const { threadID: t, messageID: m } = event;
    const q = args.join(" ");
    if (!q) return api.sendMessage("❌ يرجى إدخال اسم أغنية أو رابط.", t, m);

    api.setMessageReaction("⏳", m, () => {}, true);

    const p = C.join(cacheDir, `sing_${Date.now()}.mp3`);

    try {
      await B.ensureDir(cacheDir);

      const D = await A.get(nix);
      const E = D.data.api;

      let u = q;
      if (!q.startsWith("http")) {
        const r = await S(q);
        const v = r.videos[0];
        if (!v) throw new Error("❌ لم يتم العثور على الأغنية");
        u = v.url;
      }

      const F = await A.get(`${E}/ytdl`, { params: { url: u, type: "audio" } });
      if (!F.data.status || !F.data.downloadUrl) throw new Error("خطأ في API");

      const DL = F.data.downloadUrl;
      const title = F.data.title || "أغنية";

      const res = await A.get(DL, { responseType: "arraybuffer" });
      await B.outputFile(p, Buffer.from(res.data));

      api.setMessageReaction("✅", m, () => {}, true);

      return api.sendMessage({ body: `🎵 العنوان: ${title}`, attachment: B.createReadStream(p) }, t, () => { if (B.existsSync(p)) B.unlinkSync(p); }, m);
    } catch (e) {
      api.setMessageReaction("❌", m, () => {}, true);
      return api.sendMessage(`❌ خطأ: ${e.message}`, t, m);
    }
  }
};
