const { config } = global.GoatBot;
const { writeFileSync } = require("fs-extra");

module.exports = {
  config: {
    name: "list",
    aliases: ["wl", "bl", "whitelist", "blacklist"],
    version: "3.0",
    author: "Acard",
    countDown: 5,
    role: 0,
    shortDescription: { ar: "إدارة القائمة البيضاء والسوداء" },
    category: "owner",
    guide: {
      ar: "═══ القائمة البيضاء ═══\n{pn} wl on/off: تبديل وضع القائمة البيضاء\n{pn} wl add <@منشن|معرف>: إضافة للبيضاء\n{pn} wl remove <@منشن|معرف>: إزالة من البيضاء\n{pn} wl list: عرض البيضاء\n\n═══ القائمة السوداء ═══\n{pn} bl add: رد على رسالة الشخص لإضافته للسوداء\n{pn} bl remove: رد على رسالة الشخص لإزالته من السوداء\n{pn} bl list: عرض السوداء"
    },
  },

  langs: {
    ar: {
      // القائمة البيضاء
      wlToggledOn: "✅ | تم تشغيل القائمة البيضاء. الآن المسموح لهم فقط يمكنهم استخدام البوت",
      wlToggledOff: "❌ | تم إيقاف القائمة البيضاء. الجميع يمكنهم استخدام البوت",
      wlAdded: "✅ | تمت إضافة %1 مستخدم للقائمة البيضاء:\n%2",
      wlAlreadyIn: "\n⚠ | %1 مستخدم موجودون مسبقاً:\n%2",
      wlMissingId: "⚠ | يرجى إدخال معرف أو منشن للإضافة",
      wlRemoved: "✅ | تمت إزالة %1 مستخدم من القائمة البيضاء:\n%2",
      wlNotInList: "⚠ | %1 مستخدم غير موجودين:\n%2",
      wlMissingIdRemove: "⚠ | يرجى إدخال معرف أو منشن للإزالة",
      wlListTitle: "👑 | القائمة البيضاء (%1):\n%2",
      wlListEmpty: "📋 | القائمة البيضاء فارغة",
      wlStatus: "🔄 | حالة القائمة البيضاء: %1",
      
      // القائمة السوداء
      blNoReply: "⚠️ | يرجى الرد على رسالة الشخص لإضافته أو إزالته من القائمة السوداء",
      blAdded: "✅ | تمت إضافة %1 إلى القائمة السوداء. البوت سيتجاهله تماماً 🚫",
      blRemoved: "✅ | تمت إزالة %1 من القائمة السوداء. يمكنه استخدام البوت الآن",
      blListTitle: "🚫 | القائمة السوداء (%1):\n%2",
      blListEmpty: "📋 | القائمة السوداء فارغة",
      
      // عام
      noPermission: "❌ | فقط مالك البوت يمكنه استخدام هذا الأمر",
      invalidSubcommand: "⚠️ | أمر غير صالح. استخدم: wl on/off/add/remove/list أو bl add/remove/list",
    }
  },

  onStart: async function ({ message, args, usersData, event, getLang, api, threadsData }) {
    // ✅ أنت الأدمن الوحيد
    const permission = ["61587591788114"];
    if (!permission.includes(event.senderID)) {
      return api.sendMessage(getLang("noPermission"), event.threadID, event.messageID);
    }

    const subcommand = args[0]?.toLowerCase();
    const threadID = event.threadID;

    // ═══════════════ القائمة البيضاء ═══════════════
    if (subcommand === "wl" || subcommand === "whitelist") {
      const action = args[1]?.toLowerCase();

      switch (action) {
        case "on": {
          config.whiteListMode.status = true;
          writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));
          return message.reply(getLang("wlToggledOn"));
        }
        case "off": {
          config.whiteListMode.status = false;
          writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));
          return message.reply(getLang("wlToggledOff"));
        }
        case "add": case "-a": case "+": {
          if (!args[2] && !event.messageReply && Object.keys(event.mentions).length === 0) {
            return message.reply(getLang("wlMissingId"));
          }
          
          let uids = [];
          if (Object.keys(event.mentions).length > 0) {
            uids = Object.keys(event.mentions);
          } else if (event.messageReply) {
            uids = [event.messageReply.senderID];
          } else {
            uids = args.slice(2).filter(arg => !isNaN(arg));
          }

          if (uids.length === 0) return message.reply(getLang("wlMissingId"));

          const notAdminIds = [], authorIds = [];
          for (const uid of uids) {
            (config.whiteListMode.whiteListIds.includes(uid) ? authorIds : notAdminIds).push(uid);
          }
          config.whiteListMode.whiteListIds.push(...notAdminIds);
          const getNames = await Promise.all(uids.map(uid => usersData.getName(uid).then(name => ({ uid, name }))));
          writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));
          
          let msg = "";
          if (notAdminIds.length > 0) msg += getLang("wlAdded", notAdminIds.length, getNames.filter(n => notAdminIds.includes(n.uid)).map(n => `• ${n.name} (${n.uid})`).join("\n"));
          if (authorIds.length > 0) msg += getLang("wlAlreadyIn", authorIds.length, authorIds.map(uid => `• ${uid}`).join("\n"));
          return message.reply(msg);
        }
        case "remove": case "-r": case "-": {
          if (!args[2] && Object.keys(event.mentions).length === 0 && !event.messageReply) {
            return message.reply(getLang("wlMissingIdRemove"));
          }
          
          let uids = [];
          if (Object.keys(event.mentions).length > 0) {
            uids = Object.keys(event.mentions);
          } else if (event.messageReply) {
            uids = [event.messageReply.senderID];
          } else {
            uids = args.slice(2).filter(arg => !isNaN(arg));
          }

          const notAdminIds = [], authorIds = [];
          for (const uid of uids) {
            (config.whiteListMode.whiteListIds.includes(uid) ? authorIds : notAdminIds).push(uid);
          }
          for (const uid of authorIds) {
            config.whiteListMode.whiteListIds.splice(config.whiteListMode.whiteListIds.indexOf(uid), 1);
          }
          const getNames = await Promise.all(authorIds.map(uid => usersData.getName(uid).then(name => ({ uid, name }))));
          writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));
          
          let msg = "";
          if (authorIds.length > 0) msg += getLang("wlRemoved", authorIds.length, getNames.map(n => `• ${n.name} (${n.uid})`).join("\n"));
          if (notAdminIds.length > 0) msg += getLang("wlNotInList", notAdminIds.length, notAdminIds.map(uid => `• ${uid}`).join("\n"));
          return message.reply(msg);
        }
        case "list": case "-l": {
          const getNames = await Promise.all((config.whiteListMode.whiteListIds || []).map(uid => usersData.getName(uid).then(name => ({ uid, name }))));
          if (getNames.length === 0) return message.reply(getLang("wlListEmpty"));
          return message.reply(getLang("wlListTitle", getNames.length, getNames.map(n => `• ${n.name} (${n.uid})`).join("\n")));
        }
        default: {
          const status = config.whiteListMode.status ? "مفعلة ✅" : "معطلة ❌";
          return message.reply(getLang("wlStatus", status));
        }
      }
    }

    // ═══════════════ القائمة السوداء ═══════════════
    else if (subcommand === "bl" || subcommand === "blacklist") {
      const action = args[1]?.toLowerCase();

      switch (action) {
        case "add": case "-a": case "+": {
          if (!event.messageReply) return message.reply(getLang("blNoReply"));
          
          const targetID = event.messageReply.senderID;
          const targetName = await usersData.getName(targetID);
          const blacklist = await threadsData.get(threadID, "data.blacklist", []);

          if (blacklist.includes(targetID)) {
            return message.reply(`⚠️ | ${targetName} موجود بالفعل في القائمة السوداء`);
          }
          
          blacklist.push(targetID);
          await threadsData.set(threadID, blacklist, "data.blacklist");
          return message.reply(getLang("blAdded", targetName));
        }
        case "remove": case "-r": case "-": {
          if (!event.messageReply) return message.reply(getLang("blNoReply"));
          
          const targetID = event.messageReply.senderID;
          const targetName = await usersData.getName(targetID);
          const blacklist = await threadsData.get(threadID, "data.blacklist", []);
          const index = blacklist.indexOf(targetID);

          if (index === -1) {
            return message.reply(`⚠️ | ${targetName} غير موجود في القائمة السوداء`);
          }
          
          blacklist.splice(index, 1);
          await threadsData.set(threadID, blacklist, "data.blacklist");
          return message.reply(getLang("blRemoved", targetName));
        }
        case "list": case "-l": {
          const blacklist = await threadsData.get(threadID, "data.blacklist", []);
          if (blacklist.length === 0) return message.reply(getLang("blListEmpty"));
          
          const names = await Promise.all(blacklist.map(async (uid) => {
            const name = await usersData.getName(uid);
            return `• ${name} (${uid})`;
          }));
          
          return message.reply(getLang("blListTitle", blacklist.length, names.join("\n")));
        }
        default: {
          return message.reply(`⚠️ | استخدم: bl add (رد على رسالة) | bl remove (رد على رسالة) | bl list`);
        }
      }
    }

    else {
      return message.reply(getLang("invalidSubcommand"));
    }
  }
};