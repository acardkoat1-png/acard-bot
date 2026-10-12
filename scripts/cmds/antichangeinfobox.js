const { getStreamFromURL, uploadImgbb } = global.utils;

module.exports = {
	config: {
		name: "antichangeinfobox",
		version: "2.0",
		author: "Acard",
		countDown: 5,
		role: 2,
		description: {
			ar: "تشغيل/إيقاف منع تغيير معلومات المجموعة"
		},
		category: "box chat",
		guide: {
			ar: "   {pn} avt [on | off]: منع تغيير صورة المجموعة"
				+ "\n   {pn} name [on | off]: منع تغيير اسم المجموعة"
				+ "\n   {pn} nickname [on | off]: منع تغيير الأسماء المستعارة"
				+ "\n   {pn} theme [on | off]: منع تغيير الثيم"
				+ "\n   {pn} emoji [on | off]: منع تغيير الإيموجي"
		}
	},

	langs: {
		ar: {
			antiChangeAvatarOn: "✅ تم تشغيل منع تغيير صورة المجموعة",
			antiChangeAvatarOff: "✅ تم إيقاف منع تغيير صورة المجموعة",
			missingAvt: "⚠️ لم تقم بتعيين صورة للمجموعة",
			antiChangeNameOn: "✅ تم تشغيل منع تغيير اسم المجموعة",
			antiChangeNameOff: "✅ تم إيقاف منع تغيير اسم المجموعة",
			antiChangeNicknameOn: "✅ تم تشغيل منع تغيير الأسماء المستعارة",
			antiChangeNicknameOff: "✅ تم إيقاف منع تغيير الأسماء المستعارة",
			antiChangeThemeOn: "✅ تم تشغيل منع تغيير الثيم",
			antiChangeThemeOff: "✅ تم إيقاف منع تغيير الثيم",
			antiChangeEmojiOn: "✅ تم تشغيل منع تغيير الإيموجي",
			antiChangeEmojiOff: "✅ تم إيقاف منع تغيير الإيموجي",
			antiChangeAvatarAlreadyOn: "⚠️ منع تغيير الصورة مفعّل بالفعل في هذه المجموعة",
			antiChangeAvatarAlreadyOnButMissingAvt: "⚠️ منع تغيير الصورة مفعّل لكن لم يتم تعيين صورة للمجموعة",
			antiChangeNameAlreadyOn: "⚠️ منع تغيير الاسم مفعّل بالفعل في هذه المجموعة",
			antiChangeNicknameAlreadyOn: "⚠️ منع تغيير الأسماء المستعارة مفعّل بالفعل",
			antiChangeThemeAlreadyOn: "⚠️ منع تغيير الثيم مفعّل بالفعل",
			antiChangeEmojiAlreadyOn: "⚠️ منع تغيير الإيموجي مفعّل بالفعل"
		}
	},

	onStart: async function ({ message, event, args, threadsData, getLang }) {
		if (!["on", "off"].includes(args[1]))
			return message.SyntaxError();
		const { threadID } = event;
		const dataAntiChangeInfoBox = await threadsData.get(threadID, "data.antiChangeInfoBox", {});
		async function checkAndSaveData(key, data) {
			if (args[1] === "off")
				delete dataAntiChangeInfoBox[key];
			else
				dataAntiChangeInfoBox[key] = data;

			await threadsData.set(threadID, dataAntiChangeInfoBox, "data.antiChangeInfoBox");
			message.reply(getLang(`antiChange${key.slice(0, 1).toUpperCase()}${key.slice(1)}${args[1].slice(0, 1).toUpperCase()}${args[1].slice(1)}`));
		}
		switch (args[0]) {
			case "avt":
			case "avatar":
			case "image": {
				const { imageSrc } = await threadsData.get(threadID);
				if (!imageSrc)
					return message.reply(getLang("missingAvt"));
				const newImageSrc = await uploadImgbb(imageSrc);
				await checkAndSaveData("avatar", newImageSrc.image.url);
				break;
			}
			case "name": {
				const { threadName } = await threadsData.get(threadID);
				await checkAndSaveData("name", threadName);
				break;
			}
			case "nickname": {
				const { members } = await threadsData.get(threadID);
				await checkAndSaveData("nickname", members.map(user => ({ [user.userID]: user.nickname })).reduce((a, b) => ({ ...a, ...b }), {}));
				break;
			}
			case "theme": {
				const { threadThemeID } = await threadsData.get(threadID);
				await checkAndSaveData("theme", threadThemeID);
				break;
			}
			case "emoji": {
				const { emoji } = await threadsData.get(threadID);
				await checkAndSaveData("emoji", emoji);
				break;
			}
			default: {
				return message.SyntaxError();
			}
		}
	},

	onEvent: async function ({ message, event, threadsData, role, api, getLang }) {
		const { threadID, logMessageType, logMessageData, author } = event;
		switch (logMessageType) {
			case "log:thread-image": {
				const dataAntiChange = await threadsData.get(threadID, "data.antiChangeInfoBox", {});
				if (!dataAntiChange.avatar && role < 1)
					return;
				return async function () {
					if (role < 1 && api.getCurrentUserID() !== author) {
						if (dataAntiChange.avatar != "REMOVE") {
							message.reply(getLang("antiChangeAvatarAlreadyOn"));
							api.changeGroupImage(await getStreamFromURL(dataAntiChange.avatar), threadID);
						}
						else {
							message.reply(getLang("antiChangeAvatarAlreadyOnButMissingAvt"));
						}
					}
					else {
						const imageSrc = logMessageData.url;
						if (!imageSrc)
							return await threadsData.set(threadID, "REMOVE", "data.antiChangeInfoBox.avatar");

						const newImageSrc = await uploadImgbb(imageSrc);
						await threadsData.set(threadID, newImageSrc.image.url, "data.antiChangeInfoBox.avatar");
					}
				};
			}
			case "log:thread-name": {
				const dataAntiChange = await threadsData.get(threadID, "data.antiChangeInfoBox", {});
				if (!dataAntiChange.hasOwnProperty("name"))
					return;
				return async function () {
					if (role < 1 && api.getCurrentUserID() !== author) {
						message.reply(getLang("antiChangeNameAlreadyOn"));
						api.setTitle(dataAntiChange.name, threadID);
					}
					else {
						const threadName = logMessageData.name;
						await threadsData.set(threadID, threadName, "data.antiChangeInfoBox.name");
					}
				};
			}
			case "log:user-nickname": {
				const dataAntiChange = await threadsData.get(threadID, "data.antiChangeInfoBox", {});
				if (!dataAntiChange.hasOwnProperty("nickname"))
					return;
				return async function () {
					const { nickname, participant_id } = logMessageData;

					if (role < 1 && api.getCurrentUserID() !== author) {
						message.reply(getLang("antiChangeNicknameAlreadyOn"));
						api.changeNickname(dataAntiChange.nickname[participant_id], threadID, participant_id);
					}
					else {
						await threadsData.set(threadID, nickname, `data.antiChangeInfoBox.nickname.${participant_id}`);
					}
				};
			}
			case "log:thread-color": {
				const dataAntiChange = await threadsData.get(threadID, "data.antiChangeInfoBox", {});
				if (!dataAntiChange.hasOwnProperty("theme"))
					return;
				return async function () {
					if (role < 1 && api.getCurrentUserID() !== author) {
						message.reply(getLang("antiChangeThemeAlreadyOn"));
						api.changeThreadColor(dataAntiChange.theme || "196241301102133", threadID);
					}
					else {
						const threadThemeID = logMessageData.theme_id;
						await threadsData.set(threadID, threadThemeID, "data.antiChangeInfoBox.theme");
					}
				};
			}
			case "log:thread-icon": {
				const dataAntiChange = await threadsData.get(threadID, "data.antiChangeInfoBox", {});
				if (!dataAntiChange.hasOwnProperty("emoji"))
					return;
				return async function () {
					if (role < 1 && api.getCurrentUserID() !== author) {
						message.reply(getLang("antiChangeEmojiAlreadyOn"));
						api.changeThreadEmoji(dataAntiChange.emoji, threadID);
					}
					else {
						const threadEmoji = logMessageData.thread_icon;
						await threadsData.set(threadID, threadEmoji, "data.antiChangeInfoBox.emoji");
					}
				};
			}
		}
	}
};