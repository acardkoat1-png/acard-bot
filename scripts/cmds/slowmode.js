let slowmodeEnabled = true;
let slowmodeTime = 60;
const userCooldowns = {};

function isAdmin(senderID) {
  const adminList = global.GoatBot?.config?.adminBot || [];
  return adminList.includes(senderID);
}

module.exports = {
  config: {
    name: "slowmode",
    aliases: ["slow", "تاكيس"],
    version: "4.0",
    author: "Acard",
    countDown: 0,
    role: 1,
    shortDescription: { en: "Slow mode - admins are exempt", ar: "وضع التباطؤ - الأدمن معفيون" },
    category: "box chat",
    guide: {
      en: "{pn} on/off : enable/disable\n{pn} set <seconds> : change duration\n{pn} : show status",
      ar: "{pn} on/off : تشغيل/إيقاف\n{pn} set <ثواني> : تعديل المدة\n{pn} : عرض الحالة"
    }
  },

  langs: {
    en: {
      turnedOn: "⏱️ | Slow mode enabled (%1 seconds)\n🛡️ | Admins are exempt",
      turnedOff: "✅ | Slow mode disabled",
      setSuccess: "⏱️ | Slow mode duration set to %1 seconds",
      setMin: "⚠️ | Duration must be at least 5 seconds",
      status: "⏱️ | Slow mode: %1\n⏰ | Duration: %2 seconds\n🛡️ | Admins are exempt",
      cooldownMsg: "⏱️ | Slow down!\n🤚 | Wait %1 before sending again"
    },
    ar: {
      turnedOn: "⏱️ | تم تشغيل التباطؤ (%1 ثانية)\n🛡️ | الأدمن معفيون من التباطؤ",
      turnedOff: "✅ | تم إيقاف التباطؤ",
      setSuccess: "⏱️ | تم تعيين مدة التباطؤ إلى %1 ثانية",
      setMin: "⚠️ | المدة يجب أن تكون 5 ثوانٍ على الأقل",
      status: "⏱️ | التباطؤ: %1\n⏰ | المدة: %2 ثانية\n🛡️ | الأدمن معفيون",
      cooldownMsg: "⏱️ | تاكيس شوية!\n🤚 | مغنجاوبك تا تدوز %1"
    }
  },

  onStart: async function ({ message, event, args, getLang }) {
    const action = args[0]?.toLowerCase();

    if (action === "on") {
      slowmodeEnabled = true;
      return message.reply(getLang("turnedOn", slowmodeTime));
    }

    if (action === "off") {
      slowmodeEnabled = false;
      for (const uid in userCooldowns) delete userCooldowns[uid];
      return message.reply(getLang("turnedOff"));
    }

    if (action === "set") {
      const newTime = parseInt(args[1]);
      if (!newTime || newTime < 5) return message.reply(getLang("setMin"));
      slowmodeTime = newTime;
      return message.reply(getLang("setSuccess", slowmodeTime));
    }

    const status = slowmodeEnabled ? "مشغل ✅" : "مطفي ❌";
    return message.reply(getLang("status", status, slowmodeTime));
  },

  checkCooldown: function ({ senderID, threadID, message, getLang }) {
    if (isAdmin(senderID)) return false;
    if (!slowmodeEnabled) return false;

    const now = Date.now();
    const cooldownTime = slowmodeTime * 1000;
    const key = `${threadID}_${senderID}`;

    if (userCooldowns[key]) {
      const remaining = userCooldowns[key] + cooldownTime - now;
      if (remaining > 0) {
        if (userCooldowns[key + "_notified"]) return true;
        const seconds = Math.floor(remaining / 1000);
        message.reply(getLang("cooldownMsg", `${seconds} ثانية`));
        userCooldowns[key + "_notified"] = true;
        return true;
      } else {
        delete userCooldowns[key];
        delete userCooldowns[key + "_notified"];
      }
    }

    userCooldowns[key] = now;
    delete userCooldowns[key + "_notified"];
    return false;
  }
};
