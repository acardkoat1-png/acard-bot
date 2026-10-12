module.exports = {
	config: {
		name: "grouptag",
		aliases: ["grtag"],
		version: "2.0",
		author: "Acard",
		countDown: 5,
		role: 0,
		description: {
			ar: "منشن الأعضاء حسب المجموعة"
		},
		category: "info",
		guide: {
			ar: "   {pn} add <اسم المجموعة> <@منشنات>: إضافة مجموعة منشن جديدة أو أعضاء لمجموعة موجودة"
				+ "\n   {pn} del <اسم المجموعة> <@منشنات>: حذف أعضاء من مجموعة المنشن"
				+ "\n   {pn} remove <اسم المجموعة>: حذف مجموعة المنشن"
				+ "\n   {pn} tag <اسم المجموعة>: منشن مجموعة"
				+ "\n   {pn} rename <اسم قديم> | <اسم جديد>: إعادة تسمية مجموعة"
				+ "\n   {pn} [list | all]: عرض قائمة مجموعات المنشن"
				+ "\n   {pn} info <اسم المجموعة>: عرض معلومات مجموعة المنشن"
		}
	},

	langs: {
		ar: {
			noGroupTagName: "يرجى إدخال اسم مجموعة المنشن",
			noMention: "لم تقم بمنشن أي عضو لإضافته",
			addedSuccess: "تمت إضافة الأعضاء إلى مجموعة \"%1\":\n%2",
			addedSuccess2: "تمت إضافة مجموعة \"%1\" مع الأعضاء:\n%2",
			existedInGroupTag: "الأعضاء:\n%1\nموجودون مسبقاً في مجموعة \"%2\"",
			notExistedInGroupTag: "الأعضاء:\n%1\nغير موجودين في مجموعة \"%2\"",
			noExistedGroupTag: "مجموعة \"%1\" غير موجودة في مجموعتك",
			noExistedGroupTag2: "لم تتم إضافة أي مجموعة منشن في مجموعتك",
			noMentionDel: "يرجى منشن الأعضاء لحذفهم من مجموعة \"%1\"",
			deletedSuccess: "تم حذف الأعضاء:\n%1\nمن مجموعة \"%2\"",
			deletedSuccess2: "تم حذف مجموعة \"%1\"",
			tagged: "منشن مجموعة \"%1\":\n%2",
			noGroupTagName2: "يرجى إدخال اسم المجموعة القديم والجديد مفصولين بـ \"|\"",
			renamedSuccess: "تمت إعادة تسمية \"%1\" إلى \"%2\"",
			infoGroupTag: "📑 | اسم المجموعة: %1\n👥 | عدد الأعضاء: %2\n👨‍👩‍👧‍👦 | قائمة الأعضاء:\n %3"
		}
	},

	onStart: async function ({ message, event, args, threadsData, getLang }) {
		const { threadID, mentions } = event;
		for (const uid in mentions)
			mentions[uid] = mentions[uid].replace("@", "");
		const groupTags = await threadsData.get(threadID, "data.groupTags", []);

		switch (args[0]) {
			case "add": {
				const mentionsID = Object.keys(event.mentions);
				const content = (args.slice(1) || []).join(" ");
				const groupTagName = content.slice(0, content.indexOf(event.mentions[mentionsID[0]]) - 1).trim();
				if (!groupTagName)
					return message.reply(getLang("noGroupTagName"));
				if (mentionsID.length === 0)
					return message.reply(getLang("noMention"));

				const oldGroupTag = groupTags.find(tag => tag.name.toLowerCase() === groupTagName.toLowerCase());
				if (oldGroupTag) {
					const usersIDExist = [];
					const usersIDNotExist = [];
					for (const uid in mentions) {
						if (oldGroupTag.users.hasOwnProperty(uid)) {
							usersIDExist.push(uid);
						}
						else {
							oldGroupTag.users[uid] = mentions[uid];
							usersIDNotExist.push(uid);
						}
					}
					await threadsData.set(threadID, groupTags, "data.groupTags");

					let msg = "";
					if (usersIDNotExist.length > 0)
						msg += getLang("addedSuccess", oldGroupTag.name, usersIDNotExist.map(uid => mentions[uid]).join("\n")) + "\n";
					if (usersIDExist.length > 0)
						msg += getLang("existedInGroupTag", usersIDExist.map(uid => mentions[uid]).join("\n"));
					message.reply(msg);
				}
				else {
					const newGroupTag = {
						name: groupTagName,
						users: mentions
					};
					groupTags.push(newGroupTag);
					await threadsData.set(threadID, groupTags, "data.groupTags");
					message.reply(getLang("addedSuccess2", groupTagName, Object.values(mentions).join("\n")));
				}
				break;
			}
			case "list":
			case "all": {
				if (args[1]) {
					const groupTagName = args.slice(1).join(" ");
					if (!groupTagName)
						return message.reply(getLang("noGroupTagName"));
					const groupTag = groupTags.find(tag => tag.name.toLowerCase() === groupTagName.toLowerCase());
					if (!groupTag)
						return message.reply(getLang("noExistedGroupTag", groupTagName));
					return showInfoGroupTag(message, groupTag, getLang);
				}
				const msg = groupTags.reduce((msg, group) => msg + `\n\n${group.name}:\n ${Object.values(group.users).map(name => name).join("\n ")}`, "");
				message.reply(msg || getLang("noExistedGroupTag2"));
				break;
			}
			case "info": {
				const groupTagName = args.slice(1).join(" ");
				if (!groupTagName)
					return message.reply(getLang("noGroupTagName"));
				const groupTag = groupTags.find(tag => tag.name.toLowerCase() === groupTagName.toLowerCase());
				if (!groupTag)
					return message.reply(getLang("noExistedGroupTag", groupTagName));
				return showInfoGroupTag(message, groupTag, getLang);
			}
			case "del": {
				const content = (args.slice(1) || []).join(" ");
				const mentionsID = Object.keys(event.mentions);
				const groupTagName = content.slice(0, content.indexOf(mentions[mentionsID[0]]) - 1).trim();
				if (!groupTagName)
					return message.reply(getLang("noGroupTagName"));
				if (mentionsID.length === 0)
					return message.reply(getLang("noMention", groupTagName));
				const oldGroupTag = groupTags.find(tag => tag.name.toLowerCase() === groupTagName.toLowerCase());
				if (!oldGroupTag)
					return message.reply(getLang("noExistedGroupTag", groupTagName));
				const usersIDExist = [];
				const usersIDNotExist = [];
				for (const uid in mentions) {
					if (oldGroupTag.users.hasOwnProperty(uid)) {
						delete oldGroupTag.users[uid];
						usersIDExist.push(uid);
					}
					else {
						usersIDNotExist.push(uid);
					}
				}
				await threadsData.set(threadID, groupTags, "data.groupTags");

				let msg = "";
				if (usersIDNotExist.length > 0)
					msg += getLang("notExistedInGroupTag", usersIDNotExist.map(uid => mentions[uid]).join("\n"), groupTagName) + "\n";
				if (usersIDExist.length > 0)
					msg += getLang("deletedSuccess", usersIDExist.map(uid => mentions[uid]).join("\n"));
				message.reply(msg);
				break;
			}
			case "remove":
			case "rm": {
				const content = (args.slice(1) || []).join(" ");
				const groupTagName = content.trim();
				if (!groupTagName)
					return message.reply(getLang("noGroupTagName"));
				const index = groupTags.findIndex(group => group.name.toLowerCase() === groupTagName.toLowerCase());
				if (index === -1)
					return message.reply(getLang("noExistedGroupTag", groupTagName));
				groupTags.splice(index, 1);
				await threadsData.set(threadID, groupTags, "data.groupTags");
				message.reply(getLang("deletedSuccess2", groupTagName));
				break;
			}
			case "rename": {
				const content = (args.slice(1) || []).join(" ");
				const [oldGroupTagName, newGroupTagName] = content.split("|").map(str => str.trim());
				if (!oldGroupTagName || !newGroupTagName)
					return message.reply(getLang("noGroupTagName2"));
				const oldGroupTag = groupTags.find(tag => tag.name.toLowerCase() === oldGroupTagName.toLowerCase());
				if (!oldGroupTag)
					return message.reply(getLang("noExistedGroupTag", oldGroupTagName));
				oldGroupTag.name = newGroupTagName;
				await threadsData.set(threadID, groupTags, "data.groupTags");
				message.reply(getLang("renamedSuccess", oldGroupTagName, newGroupTagName));
				break;
			}
			case "tag":
			default: {
				const content = (args.slice(args[0] === "tag" ? 1 : 0) || []).join(" ");
				const groupTagName = content.trim();
				if (!groupTagName)
					return message.reply(getLang("noGroupTagName"));
				const oldGroupTag = groupTags.find(tag => tag.name.toLowerCase() === groupTagName.toLowerCase());
				if (!oldGroupTag)
					return message.reply(getLang("noExistedGroupTag", groupTagName));
				const { users } = oldGroupTag;
				const mentions = [];
				let msg = "";
				for (const uid in users) {
					const userName = users[uid];
					mentions.push({
						id: uid,
						tag: userName
					});
					msg += `${userName}\n`;
				}
				message.reply({
					body: getLang("tagged", groupTagName, msg),
					mentions
				});
				break;
			}
		}
	}
};

function showInfoGroupTag(message, groupTag, getLang) {
	message.reply(getLang("infoGroupTag", groupTag.name, Object.keys(groupTag.users).length, Object.keys(groupTag.users).map(uid => groupTag.users[uid]).join("\n ")));
}