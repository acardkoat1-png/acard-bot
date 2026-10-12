const axios = require('axios');

module.exports.config = {
  name: "tempmail",
  aliases: ["tm"],
  version: "4.0",
  role: 0,
  countdown: 5,
  author: "Acard",
  usePrefix: true,
  description: "بريد مؤقت وصندوق وارد",
  category: "media",
};

const API = "https://api.mail.tm";
let emailAccounts = {};

module.exports.onStart = async ({ api, event, args }) => {
  try {
    if (args[0] && args[0].toLowerCase() === "inbox") {
      const email = args[1];
      if (!email) return api.sendMessage("❌ يرجى إدخال البريد الإلكتروني", event.threadID);
      if (!emailAccounts[email]) return api.sendMessage("❌ هذا البريد لم يتم إنشاؤه بواسطة البوت.", event.threadID);

      const password = emailAccounts[email];
      const tokenRes = await axios.post(`${API}/token`, { address: email, password });
      const token = tokenRes.data.token;

      const inbox = await axios.get(`${API}/messages?page=1`, { headers: { Authorization: `Bearer ${token}` } });
      if (!inbox.data["hydra:member"] || inbox.data["hydra:member"].length === 0) return api.sendMessage("📭 لا توجد رسائل بعد!", event.threadID);

      let out = "📬 صندوق الوارد:\n\n";
      for (const msg of inbox.data["hydra:member"]) {
        out += `📩 من: ${msg.from.address}\n`;
        out += `📌 الموضوع: ${msg.subject || "بدون موضوع"}\n`;
        out += `✉️ الرسالة: ${(msg.intro || "").replace(/<[^>]+>/g, "")}\n\n`;
      }
      return api.sendMessage(out, event.threadID);
    } else {
      const domainRes = await axios.get(`${API}/domains`);
      const domain = domainRes.data["hydra:member"][0].domain;
      const randomName = Math.random().toString(36).substring(2, 10);
      const email = `${randomName}@${domain}`;
      const password = randomName + "123";
      await axios.post(`${API}/accounts`, { address: email, password });
      emailAccounts[email] = password;
      return api.sendMessage(`📩 بريدك المؤقت:\n\nالبريد: ${email}\n\nاستخدم هذا للتحقق:\n.tm inbox ${email}`, event.threadID);
    }
  } catch (err) {
    console.log(err);
    return api.sendMessage("❌ خطأ في إنشاء البريد أو جلب الصندوق.", event.threadID);
  }
};
