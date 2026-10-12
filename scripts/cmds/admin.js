const { config } = global.GoatBot;
const { writeFileSync } = require("fs-extra");

module.exports = {
	config: {
		name: "admin",
		version: "2.0",
		author: "Acard",
		countDown: 5,
		role: 2,
		description: {
			ar: "إضافة أو إزالة أو عرض صلاحيات المشرفين"
		},
		category: "box chat",
		guide: {
			ar: '   {pn} [add | -a] <معرف | @منشن>: إضافة صلاحية مشرف لمستخدم'
				+ '\n	  {pn} [remove | -r] <معرف | @منشن>: إزالة صلاحية مشرف من مستخدم'
				+ '\n	  {pn} [list | -l]: عرض قائمة المشرفين'
		}
	},

	langs: {
		ar: {
			added: "✅ | تمت إضافة صلاحية مشرف لـ %1 مستخدم/مستخدمين:\n%2",
			alreadyAdmin: "\n⚠️ | %1 مستخدم/مستخدمين لديهم صلاحية مشرف مسبقاً:\n%2",
			missingIdAdd: "⚠️ | يرجى إدخال معرف أو الإشارة إلى المستخدم لإضافة صلاحية المشرف",
			removed: "✅ | تمت إزالة صلاحية مشرف من %1 مستخدم/مستخدمين:\n%2",
			notAdmin: "⚠️ | %1 مستخدم/مستخدمين ليس لديهم صلاحية مشرف:\n%2",
			missingIdRemove: "⚠️ | يرجى إدخال معرف أو الإشارة إلى المستخدم لإزالة صلاحية المشرف",
			listAdmin: "👑 | قائمة المشرفين:\n%1"
		}
	},

	onStart: async function ({ message, args, usersData, event, getLang }) {
		switch (args[0]) {
			case "add":
			case "-a": {
				if (args[1]) {
					let uids = [];
					if (Object.keys(event.mentions).length > 0)
						uids = Object.keys(event.mentions);
					else if (event.messageReply)
						uids.push(event.messageReply.senderID);
					else
						uids = args.filter(arg => !isNaN(arg));
					const notAdminIds = [];
					const adminIds = [];
					for (const uid of uids) {
						if (config.adminBot.includes(uid))
							adminIds.push(uid);
						else
							notAdminIds.push(uid);
					}

					config.adminBot.push(...notAdminIds);
					const getNames = await Promise.all(uids.map(uid => usersData.getName(uid).then(name => ({ uid, name }))));
					writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));
					return message.reply(
						(notAdminIds.length > 0 ? getLang("added", notAdminIds.length, getNames.map(({ uid, name }) => `• ${name} (${uid})`).join("\n")) : "")
						+ (adminIds.length > 0 ? getLang("alreadyAdmin", adminIds.length, adminIds.map(uid => `• ${uid}`).join("\n")) : "")
					);
				}
				else
					return message.reply(getLang("missingIdAdd"));
			}
			case "remove":
			case "-r": {
				if (args[1]) {
					let uids = [];
					if (Object.keys(event.mentions).length > 0)
						uids = Object.keys(event.mentions)[0];
					else
						uids = args.filter(arg => !isNaN(arg));
					const notAdminIds = [];
					const adminIds = [];
					for (const uid of uids) {
						if (config.adminBot.includes(uid))
							adminIds.push(uid);
						else
							notAdminIds.push(uid);
					}
					for (const uid of adminIds)
						config.adminBot.splice(config.adminBot.indexOf(uid), 1);
					const getNames = await Promise.all(adminIds.map(uid => usersData.getName(uid).then(name => ({ uid, name }))));
					writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));
					return message.reply(
						(adminIds.length > 0 ? getLang("removed", adminIds.length, getNames.map(({ uid, name }) => `• ${name} (${uid})`).join("\n")) : "")
						+ (notAdminIds.length > 0 ? getLang("notAdmin", notAdminIds.length, notAdminIds.map(uid => `• ${uid}`).join("\n")) : "")
					);
				}
				else
					return message.reply(getLang("missingIdRemove"));
			}
			case "list":
			case "-l": {
				const getNames = await Promise.all(config.adminBot.map(uid => usersData.getName(uid).then(name => ({ uid, name }))));
				return message.reply(getLang("listAdmin", getNames.map(({ uid, name }) => `• ${name} (${uid})`).join("\n")));
			}
			default:
				return message.SyntaxError();
		}
	}
};