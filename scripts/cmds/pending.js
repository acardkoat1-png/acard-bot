"use strict";

module.exports = {
  config: {
    name: "pending",
    version: "2.0",
    author: "Acard",
    aliases: [],
    role: 2,
    shortDescription: "إدارة مجموعات البوت المعلقة",
    longDescription: "قبول أو إلغاء المجموعات المعلقة",
    category: "owner",
    countDown: 10
  },

  languages: {
    ar: {
      invaildNumber: "%1 ليس رقماً صالحاً",
      cancelSuccess: "❌ تم إلغاء %1 مجموعة",
      approveSuccess: "✅ تمت الموافقة على %1 مجموعة",
      cantGetPendingList: "⚠️ تعذر الحصول على قائمة المعلقة",
      returnListClean: "لا توجد مجموعات معلقة"
    }
  },

  _getText(key, ...args) {
    const text = this.languages.ar[key] || key;
    return args.length ? text.replace("%1", args[0]).replace("%2", args[1] || "") : text;
  },

  onStart: async function ({ api, event }) {
    const { threadID, messageID, senderID } = event;
    let pendingList = [];

    try {
      const other = await api.getThreadList(100, null, ["OTHER"]);
      const pending = await api.getThreadList(100, null, ["PENDING"]);
      pendingList = [...other, ...pending].filter(g => g.isGroup && g.isSubscribed);
    } catch {
      return api.sendMessage(this._getText("cantGetPendingList"), threadID, messageID);
    }

    if (!pendingList.length) return api.sendMessage(this._getText("returnListClean"), threadID, messageID);

    const prefix = global.GoatBot?.config?.prefix || "!";
    let msg = "";
    pendingList.forEach((g, i) => { msg += `${i + 1}. ${g.name}\nID: ${g.threadID}\n\n`; });

    const finalMsg = `المجموعات المعلقة: ${pendingList.length}\n\n${msg}\nموافقة: ${prefix}pending 1 2 3\nإلغاء: ${prefix}pending c 1 2`;

    return api.sendMessage(finalMsg, threadID, (err, info) => {
      global.GoatBot.onReply.set(info.messageID, { commandName: this.config.name, author: senderID, pending: pendingList });
    }, messageID);
  },

  onReply: async function ({ event, Reply, api }) {
    const { author, pending } = Reply;
    if (String(event.senderID) !== String(author)) return;

    const input = event.body.trim().toLowerCase().split(/\s+/);
    const botID = api.getCurrentUserID();
    const prefix = global.GoatBot?.config?.prefix || "!";
    let count = 0;

    if (input[0] === "c" || input[0] === "cancel") {
      for (let i = 1; i < input.length; i++) {
        const idx = parseInt(input[i]);
        if (isNaN(idx) || idx <= 0 || idx > pending.length) return api.sendMessage(this._getText("invaildNumber", input[i]), event.threadID);
        await api.removeUserFromGroup(botID, pending[idx - 1].threadID);
        count++;
      }
      return api.sendMessage(this._getText("cancelSuccess", count), event.threadID);
    }

    for (const v of input) {
      const idx = parseInt(v);
      if (isNaN(idx) || idx <= 0 || idx > pending.length) return api.sendMessage(this._getText("invaildNumber", v), event.threadID);
      const tID = pending[idx - 1].threadID;

      await api.sendMessage(`🎉 تمت الموافقة على المجموعة\n\n👋 مرحباً بالجميع!\n🤖 أنا الآن نشط في هذه المجموعة.\n\n⚙️ البادئة: ${prefix}\n📜 اكتب ${prefix}help لرؤية جميع الأوامر\n\n🚀 البوت جاهز لخدمتكم!`, tID);

      const nickNameBot = global.GoatBot?.config?.nickNameBot;
      if (nickNameBot) await api.changeNickname(nickNameBot, tID, botID);
      count++;
    }

    return api.sendMessage(this._getText("approveSuccess", count), event.threadID);
  }
};