const { getTime } = global.utils;

module.exports = {
	config: {
		name: "warn",
		version: "2.0",
		author: "Acard",
		countDown: 5,
		role: 0,
		description: { ar: "إنذار الأعضاء، عند 3 إنذارات يتم الطرد" },
		category: "box chat",
		guide: {
			ar: "   {pn} @منشن <سبب>: إنذار عضو"
				+ "\n   {pn} list: عرض قائمة المنذرين"
				+ "\n   {pn} listban: عرض قائمة المطرودين"
				+ "\n   {pn} info [@منشن | <uid> | رد]: معلومات الإنذار"
				+ "\n   {pn} unban [@منشن | <uid>]: إلغاء الطرد"
				+ "\n   {pn} unwarn [@منشن | <uid>]: إزالة إنذار"
				+ "\n   {pn} reset: إعادة تعيين جميع الإنذارات"
		}
	},

	langs: {
		ar: {
			list: "📋 قائمة المنذرين:\n%1",
			listBan: "📋 قائمة المطرودين:\n%1",
			listEmpty: "✅ لا يوجد أعضاء منذرين",
			listBanEmpty: "✅ لا يوجد أعضاء مطرودين",
			noPermission: "❌ المشرفون فقط يمكنهم إلغاء الطرد",
			notBanned: "⚠️ المستخدم %1 غير مطرود",
			unbanSuccess: "✅ تم إلغاء طرد [%1 | %2]",
			noPermission2: "❌ المشرفون فقط يمكنهم إزالة الإنذارات",
			noData2: "⚠️ المستخدم %1 ليس لديه إنذارات",
			notEnoughWarn: "❌ المستخدم %1 لديه %2 إنذار فقط",
			unwarnSuccess: "✅ تم إزالة الإنذار رقم %1 من [%2 | %3]",
			noPermission3: "❌ المشرفون فقط يمكنهم إعادة تعيين الإنذارات",
			resetWarnSuccess: "✅ تم إعادة تعيين جميع الإنذارات",
			noPermission4: "❌ المشرفون فقط يمكنهم إنذار الأعضاء",
			invalidUid4: "⚠️ يرجى منشن أو الرد على الشخص المراد إنذاره",
			warnSuccess: "⚠️ تم إنذار %1 (الإنذار %2)\n- المعرف: %3\n- السبب: %4\n- الوقت: %5\n⚠️ تم طرده لتجاوزه 3 إنذارات",
			warnSuccess2: "⚠️ تم إنذار %1 (الإنذار %2)\n- المعرف: %3\n- السبب: %4\n- الوقت: %5\n⚠️ متبقي %6 إنذار(ات) قبل الطرد",
			hasBanned: "⚠️ الأعضاء التاليون مطرودون مسبقاً:\n%1",
			noPermission5: "⚠️ البوت يحتاج صلاحية مشرف لطرد الأعضاء",
			userNotInGroup: "⚠️ المستخدم \"%1\" غير موجود في المجموعة"
		}
	},

	onStart: async function ({ message, api, event, args, threadsData, usersData, prefix, role, getLang }) {
		if (!args[0]) return message.SyntaxError();
		const { threadID, senderID } = event;
		const warnList = await threadsData.get(threadID, "data.warn", []);

		switch (args[0]) {
			case "list": {
				const msg = await Promise.all(warnList.map(async user => { const { uid, list } = user; const name = await usersData.getName(uid); return `${name} (${uid}): ${list.length}`; }));
				message.reply(msg.length ? getLang("list", msg.join("\n"), prefix) : getLang("listEmpty"));
				break;
			}
			case "listban": {
				const result = (await Promise.all(warnList.map(async user => { const { uid, list } = user; if (list.length >= 3) { const name = await usersData.getName(uid); return `${name} (${uid})`; } }))).filter(item => item);
				message.reply(result.length ? getLang("listBan", result.join("\n")) : getLang("listBanEmpty"));
				break;
			}
			case "check": case "info": {
				let uids; if (Object.keys(event.mentions).length) uids = Object.keys(event.mentions); else if (event.messageReply?.senderID) uids = [event.messageReply.senderID]; else if (args.slice(1).length) uids = args.slice(1); else uids = [senderID];
				let msg = (await Promise.all(uids.map(async uid => {
					if (isNaN(uid)) return null;
					const dataWarnOfUser = warnList.find(user => user.uid == uid);
					const userName = await usersData.getName(uid);
					if (!dataWarnOfUser || dataWarnOfUser.list.length == 0) return `المعرف: ${uid}\nالاسم: ${userName}\nلا توجد إنذارات`;
					return `المعرف: ${uid}\nالاسم: ${userName}\nالإنذارات:` + dataWarnOfUser.list.reduce((acc, warn) => acc + `\n  - السبب: ${warn.reason}\n    الوقت: ${warn.dateTime}`, "");
				}))).filter(msg => msg).join("\n\n");
				message.reply(msg || "لا توجد بيانات");
				break;
			}
			case "unban": {
				if (role < 1) return message.reply(getLang("noPermission"));
				let uidUnban; if (Object.keys(event.mentions).length) uidUnban = Object.keys(event.mentions)[0]; else if (event.messageReply?.senderID) uidUnban = event.messageReply.senderID; else if (args.slice(1).length) uidUnban = args.slice(1); else uidUnban = senderID;
				if (!uidUnban || isNaN(uidUnban)) return message.reply("⚠️ معرف غير صالح");
				const index = warnList.findIndex(user => user.uid == uidUnban && user.list.length >= 3);
				if (index === -1) return message.reply(getLang("notBanned", uidUnban));
				warnList.splice(index, 1); await threadsData.set(threadID, warnList, "data.warn");
				const userName = await usersData.getName(uidUnban);
				message.reply(getLang("unbanSuccess", uidUnban, userName));
				break;
			}
			case "unwarn": {
				if (role < 1) return message.reply(getLang("noPermission2"));
				let uid, num; if (Object.keys(event.mentions)[0]) { uid = Object.keys(event.mentions)[0]; num = args[args.length - 1]; } else if (event.messageReply?.senderID) { uid = event.messageReply.senderID; num = args[1]; } else { uid = args[1]; num = parseInt(args[2]) - 1; }
				if (isNaN(uid)) return message.reply("⚠️ معرف غير صالح");
				const dataWarnOfUser = warnList.find(u => u.uid == uid);
				if (!dataWarnOfUser?.list.length) return message.reply(getLang("noData2", uid));
				if (isNaN(num)) num = dataWarnOfUser.list.length - 1;
				const userName = await usersData.getName(uid);
				if (num > dataWarnOfUser.list.length) return message.reply(getLang("notEnoughWarn", userName, dataWarnOfUser.list.length));
				dataWarnOfUser.list.splice(parseInt(num), 1);
				if (!dataWarnOfUser.list.length) warnList.splice(warnList.findIndex(u => u.uid == uid), 1);
				await threadsData.set(threadID, warnList, "data.warn");
				message.reply(getLang("unwarnSuccess", num + 1, uid, userName));
				break;
			}
			case "reset": { if (role < 1) return message.reply(getLang("noPermission3")); await threadsData.set(threadID, [], "data.warn"); message.reply(getLang("resetWarnSuccess")); break; }
			default: {
				if (role < 1) return message.reply(getLang("noPermission4"));
				let reason, uid;
				if (event.messageReply) { uid = event.messageReply.senderID; reason = args.join(" ").trim(); }
				else if (Object.keys(event.mentions)[0]) { uid = Object.keys(event.mentions)[0]; reason = args.join(" ").replace(event.mentions[uid], "").trim(); }
				else return message.reply(getLang("invalidUid4"));
				if (!reason) reason = "بدون سبب";
				const dataWarnOfUser = warnList.find(item => item.uid == uid);
				const dateTime = getTime("DD/MM/YYYY hh:mm:ss");
				if (!dataWarnOfUser) warnList.push({ uid, list: [{ reason, dateTime, warnBy: senderID }] });
				else dataWarnOfUser.list.push({ reason, dateTime, warnBy: senderID });
				await threadsData.set(threadID, warnList, "data.warn");
				const times = dataWarnOfUser?.list.length ?? 1;
				const userName = await usersData.getName(uid);
				if (times >= 3) {
					message.reply(getLang("warnSuccess", userName, times, uid, reason, dateTime, prefix), () => {
						api.removeUserFromGroup(uid, threadID, async (err) => {
							if (err) return message.reply(getLang("noPermission5"), (e, info) => {
								const { onEvent } = global.GoatBot;
								onEvent.push({ messageID: info.messageID, onStart: async ({ event }) => { if (event.logMessageType === "log:thread-admins" && event.logMessageData.ADMIN_EVENT == "add_admin" && event.logMessageData.TARGET_ID == api.getCurrentUserID()) { api.removeUserFromGroup(uid, event.threadID, () => global.GoatBot.onEvent = onEvent.filter(item => item.messageID != info.messageID)); } } });
							});
						});
					});
				} else message.reply(getLang("warnSuccess2", userName, times, uid, reason, dateTime, 3 - (times)));
			}
		}
	}
};