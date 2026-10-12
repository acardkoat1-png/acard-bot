const A = require("axios"), B = require("fs"), C = require("path"), D = require("yt-search"), E = require("node-fetch");
const F = "https://raw.githubusercontent.com/aryannix/stuffs/master/raw/apis.json";

module.exports = {
  config: { name: "video", aliases: ["v"], version: "2.0", author: "Acard", countDown: 5, role: 0, shortDescription: "تحميل فيديو يوتيوب", category: "MUSIC", guide: "/video [اسم الفيديو]" },

  onStart: async function ({ api, event, args }) {
    if (!args.length) return api.sendMessage("❌ أدخل اسم الفيديو.", event.threadID, event.messageID);
    const G = args.join(" ");
    try {
      const H = await D(G);
      if (!H || !H.videos.length) throw new Error("لا يوجد فيديو.");
      const I = H.videos.slice(0, 6);
      let J = "🔎 تم العثور على 6 فيديوهات. رد بالرقم للتحميل:\n\n";
      const K = [], L = [];
      for (let i = 0; i < I.length; i++) {
        const M = I[i];
        const N = await A.get(M.thumbnail, { responseType: 'stream' });
        L.push(N.data);
        const O = M.views.toLocaleString();
        J += `${i + 1}. ${M.title}\nالمدة: ${M.timestamp}\nالقناة: ${M.author.name}\nالمشاهدات: ${O}\n\n`;
        K.push({ title: M.title, url: M.url, channel: M.author.name, views: O });
      }
      const P = await api.sendMessage({ body: J, attachment: L }, event.threadID);
      global.GoatBot.onReply.set(P.messageID, { commandName: this.config.name, author: event.senderID, videos: K, listMessageID: P.messageID });
    } catch (err) { api.sendMessage(`❌ خطأ: ${err.message.includes("لا يوجد") ? "لم يتم العثور على فيديو." : "خطأ في البحث."}`, event.threadID, event.messageID); }
  },
  
  onReply: async function({ api, event, Reply }) {
    if (event.senderID !== Reply.author) return;
    if (Reply.listMessageID) api.unsendMessage(Reply.listMessageID);
    global.GoatBot.onReply.delete(event.messageReply.messageID);
    const R = parseInt(event.body.trim());
    if (isNaN(R) || R < 1 || R > Reply.videos.length) return api.sendMessage("❌ اختيار غير صالح. اختر 1-6.", event.threadID, event.messageID);
    const S = Reply.videos[R - 1], T = S.url;
    let U;
    try { const V = await A.get(F); U = V.data && V.data.nixtube; if (!U) throw new Error("خطأ في الإعدادات."); }
    catch (error) { return api.sendMessage("❌ خطأ في جلب الإعدادات.", event.threadID, event.messageID); }
    try {
      const W = `${U}?url=${encodeURIComponent(T)}&type=video`;
      const X = await A.get(W);
      if (!X.data.status || !X.data.downloadUrl) throw new Error("خطأ في جلب الرابط.");
      const Y = X.data.downloadUrl;
      const Z = await E(Y); if (!Z.ok) throw new Error("فشل التحميل.");
      const a = await Z.buffer();
      const b = `${S.title}.mp4`.replace(/[\/\\:*?"<>|]/g, "").substring(0, 100);
      const c = C.join(__dirname, b);
      B.writeFileSync(c, a);
      const d = `• العنوان: ${S.title}\n• القناة: ${S.channel}\n• الجودة: ${X.data.quality || 'غير معروف'}\n• المشاهدات: ${S.views || 'غير معروف'}`;
      await api.sendMessage({ body: d, attachment: B.createReadStream(c) }, event.threadID, () => { B.unlinkSync(c); }, event.messageID);
    } catch (err) { api.sendMessage(`❌ خطأ: ${err.message}`, event.threadID, event.messageID); }
  }
};
