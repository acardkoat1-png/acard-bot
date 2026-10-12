const { getTime } = global.utils;

module.exports = {
	config: {
		name: "user",
		version: "2.0",
		author: "Acard",
		countDown: 5,
		role: 2,
		description: { ar: "إدارة المستخدمين في نظام البوت" },
		category: "owner",
		guide: {
			ar: "   {pn} [find | -f | search | -s] <اسم>: البحث عن مستخدم"
				+ "\n   {pn} [ban | -b] [<uid> | @منشن | رد] <سبب>: حظر مستخدم"
				+ "\n   {pn} unban [<uid> | @منشن | رد]: إلغاء حظر مستخدم"
		}
	},

	langs: {
		ar: {
			noUserFound: "❌ لم يتم العثور على مستخدمين يطابقون: \"%1\"",
			userFound: "🔎 تم العثور على %1 مستخدم يطابق \"%2\":\n%3",
			uidRequired: "⚠️ معرف المستخدم مطلوب",
			reasonRequired: "⚠️ سبب الحظر مطلوب",
			userHasBanned: "⚠️ المستخدم [%1 | %2] محظور مسبقاً:\n» السبب: %3\n» الوقت: %4",
			userBanned: "✅ تم حظر المستخدم [%1 | %2].\n» السبب: %3\n» الوقت: %4",
			uidRequiredUnban: "⚠️ معرف المستخدم مطلوب",
			userNotBanned: "ℹ️ المستخدم [%1 | %2] غير محظور",
			userUnbanned: "✅ تم إلغاء حظر المستخدم [%1 | %2]"
		}
	},

	onStart: async function ({ args, usersData, message, event, prefix, getLang }) {
		const type = args[0];
		switch (type) {
			case "find": case "-f": case "search": case "-s": {
				const allUser = await usersData.getAll();
				const keyWord = args.slice(1).join(" ");
				const result = allUser.filter(item => (item.name || "").toLowerCase().includes(keyWord.toLowerCase()));
				const msg = result.reduce((i, user) => i += `\n╭الاسم: ${user.name}\n╰المعرف: ${user.userID}`, "");
				message.reply(result.length == 0 ? getLang("noUserFound", keyWord) : getLang("userFound", result.length, keyWord, msg));
				break;
			}
			case "ban": case "-b": {
				let uid, reason;
				if (event.type == "message_reply") { uid = event.messageReply.senderID; reason = args.slice(1).join(" "); }
				else if (Object.keys(event.mentions).length > 0) { const { mentions } = event; uid = Object.keys(mentions)[0]; reason = args.slice(1).join(" ").replace(mentions[uid], ""); }
				else if (args[1]) { uid = args[1]; reason = args.slice(2).join(" "); }
				else return message.SyntaxError();
				if (!uid) return message.reply(getLang("uidRequired"));
				if (!reason) return message.reply(getLang("reasonRequired", prefix));
				reason = reason.replace(/\s+/g, ' ');
				const userData = await usersData.get(uid);
				const name = userData.name;
				if (userData.banned.status) return message.reply(getLang("userHasBanned", uid, name, userData.banned.reason, userData.banned.date));
				const time = getTime("DD/MM/YYYY HH:mm:ss");
				await usersData.set(uid, { banned: { status: true, reason, date: time } });
				message.reply(getLang("userBanned", uid, name, reason, time));
				break;
			}
			case "unban": case "-u": {
				let uid;
				if (event.type == "message_reply") uid = event.messageReply.senderID;
				else if (Object.keys(event.mentions).length > 0) uid = Object.keys(event.mentions)[0];
				else if (args[1]) uid = args[1];
				else return message.SyntaxError();
				if (!uid) return message.reply(getLang("uidRequiredUnban"));
				const userData = await usersData.get(uid);
				const name = userData.name;
				if (!userData.banned.status) return message.reply(getLang("userNotBanned", uid, name));
				await usersData.set(uid, { banned: {} });
				message.reply(getLang("userUnbanned", uid, name));
				break;
			}
			default: return message.SyntaxError();
		}
	}
};