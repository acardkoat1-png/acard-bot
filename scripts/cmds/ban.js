const { findUid } = global.utils;
const moment = require("moment-timezone");

module.exports = {
	config: {
		name: "ban",
		version: "2.0",
		author: "Acard",
		countDown: 5,
		role: 1,
		description: {
			ar: "حظر عضو من المجموعة"
		},
		category: "box chat",
		guide: {
			ar: "   {pn} [@منشن|معرف|رابط فيسبوك|رد] [<سبب>|اتركه فارغاً]: حظر عضو من المجموعة"
				+ "\n   {pn} unban [@منشن|معرف|رابط فيسبوك|رد]: إلغاء حظر عضو"
				+ "\n   {pn} list: عرض قائمة المحظورين"
				+ "\n   {pn} check: التحقق من الأعضاء المحظورين وطردهم"
		}
	},

	langs: {
		ar: {
			notFoundTarget: "⚠️ | يرجى منشن الشخص المراد حظره أو إدخال معرفه أو رابط حسابه أو الرد على رسالته",
			notFoundTargetUnban: "⚠️ | يرجى منشن الشخص المراد إلغاء حظره أو إدخال معرفه أو رابط حسابه أو الرد على رسالته",
			userNotBanned: "⚠️ | الشخص صاحب المعرف %1 ليس محظوراً في هذه المجموعة",
			unbannedSuccess: "✅ | تم إلغاء حظر %1 من المجموعة!",
			cantSelfBan: "⚠️ | لا يمكنك حظر نفسك!",
			cantBanAdmin: "❌ | لا يمكنك حظر مشرف!",
			existedBan: "❌ | هذا الشخص محظور مسبقاً!",
			noReason: "بدون سبب",
			bannedSuccess: "✅ | تم حظر %1 من المجموعة!",
			needAdmin: "⚠️ | يحتاج البوت صلاحية مشرف لطرد الأعضاء المحظورين",
			noName: "مستخدم فيسبوك",
			noData: "📑 | لا يوجد أعضاء محظورون في هذه المجموعة",
			listBanned: "📑 | قائمة المحظورين في هذه المجموعة (صفحة %1/%2)",
			content: "%1/ %2 (%3)\nالسبب: %4\nوقت الحظر: %5\n\n",
			needAdminToKick: "⚠️ | العضو %1 (%2) محظور من المجموعة لكن البوت لا يملك صلاحية المشرف لطرده",
			bannedKick: "⚠️ | %1 محظور من المجموعة مسبقاً!\nالمعرف: %2\nالسبب: %3\nوقت الحظر: %4\n\nقام البوت بطرده تلقائياً"
		}
	},

	onStart: async function ({ message, event, args, threadsData, getLang, usersData, api }) {
		const { members, adminIDs } = await threadsData.get(event.threadID);
		const { senderID } = event;
		let target;
		let reason;

		const dataBanned = await threadsData.get(event.threadID, 'data.banned_ban', []);

		if (args[0] == 'unban') {
			if (!isNaN(args[1]))
				target = args[1];
			else if (args[1]?.startsWith('https'))
				target = await findUid(args[1]);
			else if (Object.keys(event.mentions || {}).length)
				target = Object.keys(event.mentions)[0];
			else if (event.messageReply?.senderID)
				target = event.messageReply.senderID;
			else
				return api.sendMessage(getLang('notFoundTargetUnban'), event.threadID, event.messageID);

			const index = dataBanned.findIndex(item => item.id == target);
			if (index == -1)
				return api.sendMessage(getLang('userNotBanned', target), event.threadID, event.messageID);

			dataBanned.splice(index, 1);
			await threadsData.set(event.threadID, dataBanned, 'data.banned_ban');
			const userName = members[target]?.name || await usersData.getName(target) || getLang('noName');

			return api.sendMessage(getLang('unbannedSuccess', userName), event.threadID, event.messageID);
		}
		else if (args[0] == "check") {
			if (!dataBanned.length)
				return;
			for (const user of dataBanned) {
				if (event.participantIDs.includes(user.id))
					api.removeUserFromGroup(user.id, event.threadID);
			}
		}

		if (event.messageReply?.senderID) {
			target = event.messageReply.senderID;
			reason = args.join(' ');
		}
		else if (Object.keys(event.mentions || {}).length) {
			target = Object.keys(event.mentions)[0];
			reason = args.join(' ').replace(event.mentions[target], '');
		}
		else if (!isNaN(args[0])) {
			target = args[0];
			reason = args.slice(1).join(' ');
		}
		else if (args[0]?.startsWith('https')) {
			target = await findUid(args[0]);
			reason = args.slice(1).join(' ');
		}
		else if (args[0] == 'list') {
			if (!dataBanned.length)
				return message.reply(getLang('noData'));
			const limit = 20;
			const page = parseInt(args[1] || 1) || 1;
			const start = (page - 1) * limit;
			const end = page * limit;
			const data = dataBanned.slice(start, end);
			let msg = '';
			let count = 0;
			for (const user of data) {
				count++;
				const name = members[user.id]?.name || await usersData.getName(user.id) || getLang('noName');
				const time = user.time;
				msg += getLang('content', start + count, name, user.id, user.reason, time);
			}
			return message.reply(getLang('listBanned', page, Math.ceil(dataBanned.length / limit)) + '\n\n' + msg);
		}

		if (!target)
			return message.reply(getLang('notFoundTarget'));
		if (target == senderID)
			return message.reply(getLang('cantSelfBan'));
		if (adminIDs.includes(target))
			return message.reply(getLang('cantBanAdmin'));

		const banned = dataBanned.find(item => item.id == target);
		if (banned)
			return message.reply(getLang('existedBan'));

		const name = members[target]?.name || (await usersData.getName(target)) || getLang('noName');
		const time = moment().tz(global.GoatBot.config.timeZone).format('HH:mm:ss DD/MM/YYYY');
		const data = {
			id: target,
			time,
			reason: reason || getLang('noReason')
		};

		dataBanned.push(data);
		await threadsData.set(event.threadID, dataBanned, 'data.banned_ban');
		message.reply(getLang('bannedSuccess', name), () => {
			if (members.some(item => item.userID == target)) {
				if (adminIDs.includes(api.getCurrentUserID())) {
					if (event.participantIDs.includes(target))
						api.removeUserFromGroup(target, event.threadID);
				}
				else {
					message.send(getLang('needAdmin'), (err, info) => {
						global.GoatBot.onEvent.push({
							messageID: info.messageID,
							onStart: ({ event }) => {
								if (event.logMessageType === "log:thread-admins" && event.logMessageData.ADMIN_EVENT == "add_admin") {
									const { TARGET_ID } = event.logMessageData;
									if (TARGET_ID == api.getCurrentUserID()) {
										api.removeUserFromGroup(target, event.threadID, () => global.GoatBot.onEvent = global.GoatBot.onEvent.filter(item => item.messageID != info.messageID));
									}
								}
							}
						});
					});
				}
			}
		});
	},

	onEvent: async function ({ event, api, threadsData, getLang, message }) {
		if (event.logMessageType == "log:subscribe") {
			const { threadID } = event;
			const dataBanned = await threadsData.get(threadID, 'data.banned_ban', []);
			const usersAdded = event.logMessageData.addedParticipants;

			for (const user of usersAdded) {
				const { userFbId, fullName } = user;
				const banned = dataBanned.find(item => item.id == userFbId);
				if (banned) {
					const reason = banned.reason || getLang('noReason');
					const time = banned.time;
					return api.removeUserFromGroup(userFbId, threadID, err => {
						if (err)
							return message.send(getLang('needAdminToKick', fullName, userFbId), (err, info) => {
								global.GoatBot.onEvent.push({
									messageID: info.messageID,
									onStart: ({ event }) => {
										if (event.logMessageType === "log:thread-admins" && event.logMessageData.ADMIN_EVENT == "add_admin") {
											const { TARGET_ID } = event.logMessageData;
											if (TARGET_ID == api.getCurrentUserID()) {
												api.removeUserFromGroup(userFbId, event.threadID, () => global.GoatBot.onEvent = global.GoatBot.onEvent.filter(item => item.messageID != info.messageID));
											}
										}
									}
								});
							});
						else
							message.send(getLang('bannedKick', fullName, userFbId, reason, time));
					});
				}
			}
		}
	}
};