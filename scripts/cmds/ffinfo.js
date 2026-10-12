const axios = require("axios");

module.exports = {
  config: {
    name: "ffinfo",
    aliases: ["freefireinfo", "ffstats"],
    version: "2.1.0",
    author: "Acard",
    role: 0,
    premium: false,
    description: "عرض معلومات لاعب فري فاير كاملة",
    category: "game",
    guide: {
      ar: "{p}ffinfo <uid>"
    }
  },

  onStart: async function ({ api, event, args }) {
    try {
      const uid = args[0];
      if (!uid) {
        return api.sendMessage(
          "⚠️ يرجى إدخال معرف لاعب فري فاير\n📌 مثال: ffinfo 3060644273",
          event.threadID,
          event.messageID
        );
      }

      const wait = await api.sendMessage(
        "⏳ جارٍ جلب معلومات اللاعب...",
        event.threadID
      );

      const url = `https://ff.mlbbai.com/info/?uid=${uid}`;
      const res = await axios.get(url);
      const data = res.data;

      if (!data || !data.basicInfo) {
        return api.editMessage(
          "❌ فشل جلب بيانات اللاعب. قد يكون المعرف غير صالح.",
          wait.messageID
        );
      }

      const b = data.basicInfo;
      const clan = data.clanBasicInfo || {};
      const pet = data.petInfo || {};
      const social = data.socialInfo || {};
      const credit = data.creditScoreInfo || {};
      const cap = data.captainBasicInfo || {};

      const msg = `
🎮 معلومات لاعب فري فاير
━━━━━━━━━━━━━━━━━━
👤 الاسم: ${b.nickname || "غير متاح"}
🆔 المعرف: ${b.accountId || uid}
🌍 المنطقة: ${b.region || "غير متاح"}
⭐ المستوى: ${b.level || "غير متاح"}
❤️ الإعجابات: ${b.liked || 0}
📈 الخبرة: ${b.exp || 0}

🏆 الرتبة: ${b.rank || "غير متاح"}
🎯 نقاط الرتبة: ${b.rankingPoints || 0}
⚔️ رتبة CS: ${b.csRank || "غير متاح"}
🎮 نقاط CS: ${b.csRankingPoints || 0}

👑 أعلى رتبة: ${b.maxRank || "غير متاح"}
👑 أعلى رتبة CS: ${b.csMaxRank || "غير متاح"}
🎟️ البطاقة النخبوية: ${b.hasElitePass ? "✅ نعم" : "❌ لا"}
🏅 الأوسمة: ${b.badgeCnt || 0}

📅 الموسم: ${b.seasonId || "غير متاح"}
🛠️ الإصدار: ${b.releaseVersion || "غير متاح"}

🛡️ معلومات العشيرة
━━━━━━━━━━━━━━━━
🏷️ اسم العشيرة: ${clan.clanName || "لا يوجد"}
🆔 معرف العشيرة: ${clan.clanId || "غير متاح"}
📊 مستوى العشيرة: ${clan.clanLevel || "غير متاح"}
👥 الأعضاء: ${clan.memberNum || 0}/${clan.capacity || 0}

🐾 معلومات الحيوان الأليف
━━━━━━━━━━━━━━━━
🐶 الاسم: ${pet.name || "لا يوجد"}
📈 المستوى: ${pet.level || "غير متاح"}

🌐 معلومات اجتماعية
━━━━━━━━━━━━━━━━
🚻 الجنس: ${social.gender?.replace("Gender_", "") || "غير متاح"}
🗣️ اللغة: ${social.language?.replace("Language_", "") || "غير متاح"}

🛡️ نقاط السمعة
━━━━━━━━━━━━━━━━
💯 النقاط: ${credit.creditScore || "غير متاح"}
`;

      await api.editMessage(msg, wait.messageID);
    } catch (err) {
      api.sendMessage(
        `❌ خطأ: ${err.message}`,
        event.threadID,
        event.messageID
      );
    }
  }
};
