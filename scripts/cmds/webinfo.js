const axios = require("axios");
const dns = require("dns").promises;
const https = require("https");

module.exports = {
  config: {
    name: "webinfo",
    version: "2.0",
    author: "Acard",
    countDown: 5,
    role: 0,
    shortDescription: { ar: "معلومات تفصيلية عن أي موقع" },
    description: { ar: "جلب معلومات كاملة مثل IP, SSL, الخادم, الاستجابة, الدولة" },
    category: "ai",
    guide: { ar: "{p}webinfo <رابط>\nمثال: {p}webinfo https://google.com" }
  },

  langs: { ar: { missing: "⚠️ يرجى إدخال رابط صالح\n📌 مثال: webinfo google.com", loading: "🔍 جارٍ تحليل الموقع...\n🌐 %1", error: "❌ فشل جلب معلومات الموقع" } },

  onStart: async function ({ message, args, getLang }) {
    if (!args[0]) return message.reply(getLang("missing"));
    try {
      let input = args[0].trim().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");
      const domain = input, url = `https://${domain}`;
      await message.reply(getLang("loading", domain));

      let ip = "غير معروف";
      try { const dnsRes = await dns.lookup(domain); ip = dnsRes.address; } catch {}

      let ssl = "🔴 غير آمن";
      try { await new Promise((resolve) => { const req = https.request({ host: domain, method: "HEAD", port: 443 }, () => resolve((ssl = "🟢 صالح"))); req.on("error", () => resolve()); req.end(); }); } catch {}

      let responseTime = "غير معروف", server = "غير معروف";
      try { const start = Date.now(); const res = await axios.get(url, { timeout: 10000 }); responseTime = Date.now() - start; server = res.headers["server"] || "غير معروف"; } catch {}

      let country = "غير معروف";
      try { const geo = await axios.get(`https://ipapi.co/${ip}/json/`); country = geo.data.country_name || "غير معروف"; } catch {}

      const output = "🌐 معلومات الموقع\n\n" + `🔗 النطاق: ${domain}\n📍 IP: ${ip}\n🛡️ الأمان: ${ssl}\n⚡ الاستجابة: ${responseTime} ms\n🧠 الخادم: ${server}\n🌍 الدولة: ${country}`;
      message.reply(output);
    } catch (err) { console.error(err); message.reply(getLang("error")); }
  }
};
