module.exports = {
	config: {
		name: "badwords",
		aliases: ["badword"],
		version: "2.0",
		author: "Acard",
		countDown: 5,
		role: 1,
		description: {
			ar: "تشغيل/إيقاف/إضافة/حذف كلمات محظورة، مع نظام إنذار وطرد"
		},
		category: "box chat",
		guide: {
			ar: "   {pn} add <كلمات>: إضافة كلمات محظورة (يمكن إضافة عدة كلمات تفصل بينها فاصلة \",\" أو شرطة \"|\")"
				+ "\n   {pn} delete <كلمات>: حذف كلمات محظورة"
				+ "\n   {pn} list <hide | اتركه فارغاً>: عرض قائمة الكلمات المحظورة"
				+ "\n   {pn} unwarn [<معرف المستخدم> | <@منشن>]: إزالة إنذار واحد عن عضو"
				+ "\n   {pn} on: تشغيل نظام الحظر"
				+ "\n   {pn} off: إيقاف نظام الحظر"
		}
	},

	langs: {
		ar: {
			onText: "تشغيل",
			offText: "إيقاف",
			onlyAdmin: "⚠️ فقط المشرفون يمكنهم إضافة كلمات محظورة",
			missingWords: "⚠️ لم تقم بإدخال الكلمات المحظورة",
			addedSuccess: "✅ تمت إضافة %1 كلمة محظورة إلى القائمة",
			alreadyExist: "❌ %1 كلمة محظورة موجودة مسبقاً: %2",
			tooShort: "⚠️ %1 كلمة لا يمكن إضافتها لأنها أقل من حرفين: %2",
			onlyAdmin2: "⚠️ فقط المشرفون يمكنهم حذف كلمات محظورة",
			missingWords2: "⚠️ لم تقم بإدخال الكلمات المراد حذفها",
			deletedSuccess: "✅ تم حذف %1 كلمة محظورة من القائمة",
			notExist: "❌ %1 كلمة محظورة غير موجودة: %2",
			emptyList: "⚠️ قائمة الكلمات المحظورة فارغة حالياً",
			badWordsList: "📑 قائمة الكلمات المحظورة: %1",
			onlyAdmin3: "⚠️ فقط المشرفون يمكنهم %1 هذه الميزة",
			turnedOnOrOff: "✅ تم %1 نظام الكلمات المحظورة",
			onlyAdmin4: "⚠️ فقط المشرفون يمكنهم إزالة الإنذارات",
			missingTarget: "⚠️ لم تقم بإدخال معرف المستخدم أو منشن",
			notWarned: "⚠️ المستخدم %1 ليس لديه إنذارات سابقة",
			removedWarn: "✅ تم إزالة إنذار واحد من المستخدم %1 | %2",
			warned: "⚠️ تم اكتشاف كلمة محظورة \"%1\" في رسالتك، هذا إنذار أول، إذا تكررت سيتم طردك.",
			warned2: "⚠️ تم اكتشاف كلمة محظورة \"%1\" في رسالتك، هذا الإنذار الثاني وسيتم طردك من المجموعة.",
			needAdmin: "⚠️ يحتاج البوت صلاحية مشرف لطرد الأعضاء",
			unwarned: "✅ تم إزالة جميع إنذارات المستخدم %1 | %2"
		}
	},

	onStart: async function ({ message, event, args, threadsData, usersData, role, getLang }) {
		if (!await threadsData.get(event.threadID, "data.badWords"))
			await threadsData.set(event.threadID, {
				words: [],
				violationUsers: {}
			}, "data.badWords");

		const badWords = await threadsData.get(event.threadID, "data.badWords.words", []);

		switch (args[0]) {
			case "add": {
				if (role < 1)
					return message.reply(getLang("onlyAdmin"));
				const words = args.slice(1).join(" ").split(/[,|]/);
				if (words.length === 0)
					return message.reply(getLang("missingWords"));
				const badWordsExist = [];
				const success = [];
				const failed = [];
				for (const word of words) {
					const oldIndex = badWords.indexOf(word);
					if (oldIndex === -1) {
						badWords.push(word);
						success.push(word);
					}
					else if (oldIndex > -1) {
						badWordsExist.push(word);
					}
					else
						failed.push(word);
				}
				await threadsData.set(event.threadID, badWords, "data.badWords.words");
				message.reply(
					success.length > 0 ? getLang("addedSuccess", success.length) : ""
						+ (badWordsExist.length > 0 ? getLang("alreadyExist", badWordsExist.length, badWordsExist.map(word => hideWord(word)).join(", ")) : "")
						+ (failed.length > 0 ? getLang("tooShort", failed.length, failed.join(", ")) : "")
				);
				break;
			}
			case "delete":
			case "del":
			case "-d": {
				if (role < 1)
					return message.reply(getLang("onlyAdmin2"));
				const words = args.slice(1).join(" ").split(/[,|]/);
				if (words.length === 0)
					return message.reply(getLang("missingWords2"));
				const success = [];
				const failed = [];
				for (const word of words) {
					const oldIndex = badWords.indexOf(word);
					if (oldIndex > -1) {
						badWords.splice(oldIndex, 1);
						success.push(word);
					}
					else
						failed.push(word);
				}
				await threadsData.set(event.threadID, badWords, "data.badWords.words");
				message.reply(
					(success.length > 0 ? getLang("deletedSuccess", success.length) : "")
					+ (failed.length > 0 ? getLang("notExist", failed.length, failed.join(", ")) : "")
				);
				break;
			}
			case "list":
			case "all":
			case "-a": {
				if (badWords.length === 0)
					return message.reply(getLang("emptyList"));
				message.reply(getLang("badWordsList", args[1] === "hide" ? badWords.map(word => hideWord(word)).join(", ") : badWords.join(", ")));
				break;
			}
			case "on": {
				if (role < 1)
					return message.reply(getLang("onlyAdmin3", getLang("onText")));
				await threadsData.set(event.threadID, true, "settings.badWords");
				message.reply(getLang("turnedOnOrOff", getLang("onText")));
				break;
			}
			case "off": {
				if (role < 1)
					return message.reply(getLang("onlyAdmin3", getLang("offText")));
				await threadsData.set(event.threadID, false, "settings.badWords");
				message.reply(getLang("turnedOnOrOff", getLang("offText")));
				break;
			}
			case "unwarn": {
				if (role < 1)
					return message.reply(getLang("onlyAdmin4"));
				let userID;
				if (Object.keys(event.mentions)[0])
					userID = Object.keys(event.mentions)[0];
				else if (args[1])
					userID = args[1];
				else if (event.messageReply)
					userID = event.messageReply.senderID;
				if (isNaN(userID))
					return message.reply(getLang("missingTarget"));
				const violationUsers = await threadsData.get(event.threadID, "data.badWords.violationUsers", {});
				if (!violationUsers[userID])
					return message.reply(getLang("notWarned", userID));
				violationUsers[userID]--;
				await threadsData.set(event.threadID, violationUsers, "data.badWords.violationUsers");
				const userName = await usersData.getName(userID);
				message.reply(getLang("unwarned", userID, userName));
			}
		}
	},

	onChat: async function ({ message, event, api, threadsData, prefix, getLang }) {
		if (!event.body)
			return;
		const threadData = global.db.allThreadData.find(t => t.threadID === event.threadID) || await threadsData.create(event.threadID);
		const isEnabled = threadData.settings.badWords;
		if (!isEnabled)
			return;
		const allAliases = [...(global.GoatBot.commands.get("badwords").config.aliases || []), ...(threadData.data.aliases?.["badwords"] || [])];
		const isCommand = allAliases.some(a => event.body.startsWith(prefix + a));
		if (isCommand)
			return;
		const badWordList = threadData.data.badWords?.words;
		if (!badWordList || badWordList.length === 0)
			return;
		const violationUsers = threadData.data.badWords?.violationUsers || {};

		for (const word of badWordList) {
			if (event.body.match(new RegExp(`\\b${word}\\b`, "gi"))) {
				if ((violationUsers[event.senderID] || 0) < 1) {
					message.reply(getLang("warned", word));
					violationUsers[event.senderID] = violationUsers[event.senderID] ? violationUsers[event.senderID] + 1 : 1;
					await threadsData.set(event.threadID, violationUsers, "data.badWords.violationUsers");
					return;
				}
				else {
					await message.reply(getLang("warned2", word));
					api.removeUserFromGroup(event.senderID, event.threadID, (err) => {
						if (err)
							return message.reply(getLang("needAdmin"), (e, info) => {
								let { onEvent } = global.GoatBot;
								onEvent.push({
									messageID: info.messageID,
									onStart: ({ event }) => {
										if (event.logMessageType === "log:thread-admins" && event.logMessageData.ADMIN_EVENT == "add_admin") {
											const { TARGET_ID } = event.logMessageData;
											if (TARGET_ID == api.getCurrentUserID())
												api.removeUserFromGroup(event.senderID, event.threadID, () => onEvent = onEvent.filter(item => item.messageID != info.messageID));
										}
									}
								});
							});
					});
				}
			}
		}
	}
};


function hideWord(str) {
	return str.length == 2 ?
		str[0] + "*" :
		str[0] + "*".repeat(str.length - 2) + str[str.length - 1];
}