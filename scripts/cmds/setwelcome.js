const { drive, getStreamFromURL, getExtFromUrl, getTime } = global.utils;

module.exports = {
	config: {
		name: "setwelcome",
		aliases: ["setwc"],
		version: "2.0",
		author: "Acard",
		countDown: 5,
		role: 1,
		description: { ar: "تخصيص رسالة الترحيب بالأعضاء الجدد" },
		category: "custom",
		guide: {
			ar: {
				body: "   {pn} text [<محتوى> | reset]: تعديل نص الترحيب"
					+ "\n  + {userName}: اسم العضو الجديد"
					+ "\n  + {userNameTag}: اسم العضو الجديد (منشن)"
					+ "\n  + {boxName}: اسم المجموعة"
					+ "\n  + {multiple}: أنت || أنتم"
					+ "\n  + {session}: الفترة من اليوم"
					+ "\n\n   {pn} file: إضافة مرفقات (صورة، فيديو، صوت)"
					+ "\n   {pn} on/off: تشغيل/إيقاف رسالة الترحيب"
			}
		}
	},

	langs: {
		ar: {
			turnedOn: "✅ تم تشغيل رسالة الترحيب",
			turnedOff: "✅ تم إيقاف رسالة الترحيب",
			missingContent: "⚠️ يرجى إدخال محتوى الرسالة",
			edited: "✅ تم تعديل رسالة الترحيب إلى:\n%1",
			reseted: "✅ تم إعادة تعيين رسالة الترحيب",
			noFile: "⚠️ لا يوجد ملف مرفق للحذف",
			resetedFile: "✅ تم إعادة تعيين المرفقات",
			missingFile: "⚠️ يرجى الرد على هذه الرسالة بملف صورة/فيديو/صوت",
			addedFile: "✅ تمت إضافة %1 ملف مرفق إلى رسالة الترحيب"
		}
	},

	onStart: async function ({ args, threadsData, message, event, commandName, getLang }) {
		const { threadID, senderID, body } = event;
		const { data, settings } = await threadsData.get(threadID);

		switch (args[0]) {
			case "text": {
				if (!args[1]) return message.reply(getLang("missingContent"));
				else if (args[1] == "reset") delete data.welcomeMessage;
				else data.welcomeMessage = body.slice(body.indexOf(args[0]) + args[0].length).trim();
				await threadsData.set(threadID, { data });
				message.reply(data.welcomeMessage ? getLang("edited", data.welcomeMessage) : getLang("reseted"));
				break;
			}
			case "file": {
				if (args[1] == "reset") {
					const { welcomeAttachment } = data;
					if (!welcomeAttachment) return message.reply(getLang("noFile"));
					try { await Promise.all(data.welcomeAttachment.map(fileId => drive.deleteFile(fileId))); delete data.welcomeAttachment; } catch (e) { }
					await threadsData.set(threadID, { data });
					message.reply(getLang("resetedFile"));
				} else if (event.attachments.length == 0 && (!event.messageReply || event.messageReply.attachments.length == 0))
					return message.reply(getLang("missingFile"), (err, info) => { global.GoatBot.onReply.set(info.messageID, { messageID: info.messageID, author: senderID, commandName }); });
				else { saveChanges(message, event, threadID, senderID, threadsData, getLang); }
				break;
			}
			case "on": case "off": {
				settings.sendWelcomeMessage = args[0] == "on";
				await threadsData.set(threadID, { settings });
				message.reply(settings.sendWelcomeMessage ? getLang("turnedOn") : getLang("turnedOff"));
				break;
			}
			default: message.SyntaxError();
		}
	},

	onReply: async function ({ event, Reply, message, threadsData, getLang }) {
		const { threadID, senderID } = event;
		if (senderID != Reply.author) return;
		if (event.attachments.length == 0 && (!event.messageReply || event.messageReply.attachments.length == 0)) return message.reply(getLang("missingFile"));
		saveChanges(message, event, threadID, senderID, threadsData, getLang);
	}
};

async function saveChanges(message, event, threadID, senderID, threadsData, getLang) {
	const { data } = await threadsData.get(threadID);
	const attachments = [...event.attachments, ...(event.messageReply?.attachments || [])].filter(item => ["photo", 'png', "animated_image", "video", "audio"].includes(item.type));
	if (!data.welcomeAttachment) data.welcomeAttachment = [];
	await Promise.all(attachments.map(async attachment => {
		const { url } = attachment;
		const ext = getExtFromUrl(url);
		const fileName = `${getTime()}.${ext}`;
		const infoFile = await drive.uploadFile(`setwelcome_${threadID}_${senderID}_${fileName}`, await getStreamFromURL(url));
		data.welcomeAttachment.push(infoFile.id);
	}));
	await threadsData.set(threadID, { data });
	message.reply(getLang("addedFile", attachments.length));
}
