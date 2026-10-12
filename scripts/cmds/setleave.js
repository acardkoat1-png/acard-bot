const { drive, getStreamFromURL, getExtFromUrl, getTime } = global.utils;

module.exports = {
	config: {
		name: "setleave",
		aliases: ["setl"],
		version: "2.0",
		author: "Acard",
		countDown: 5,
		role: 0,
		description: { ar: "تعديل رسالة مغادرة الأعضاء للمجموعة" },
		category: "custom",
		guide: {
			ar: {
				body: "   {pn} on: تشغيل رسالة المغادرة"
					+ "\n   {pn} off: إيقاف رسالة المغادرة"
					+ "\n   {pn} text [<محتوى> | reset]: تعديل نص الرسالة"
					+ "\n  + {userName}: اسم العضو المغادر"
					+ "\n  + {userNameTag}: اسم العضو المغادر (منشن)"
					+ "\n  + {boxName}: اسم المجموعة"
					+ "\n  + {type}: خرج/طرد"
					+ "\n\n   مثال: {pn} text {userName} غادر المجموعة، وداعاً 🤧"
			}
		}
	},

	langs: {
		ar: {
			turnedOn: "✅ تم تشغيل رسالة المغادرة",
			turnedOff: "✅ تم إيقاف رسالة المغادرة",
			missingContent: "⚠️ يرجى إدخال محتوى الرسالة",
			edited: "✅ تم تعديل رسالة المغادرة إلى:\n%1",
			reseted: "✅ تم إعادة تعيين رسالة المغادرة",
			noFile: "⚠️ لا يوجد ملف مرفق لإعادة التعيين",
			resetedFile: "✅ تم إعادة تعيين الملف المرفق",
			missingFile: "⚠️ يرجى الرد على هذه الرسالة بملف صورة/فيديو/صوت",
			addedFile: "✅ تمت إضافة %1 ملف مرفق إلى رسالة المغادرة"
		}
	},

	onStart: async function ({ args, threadsData, message, event, commandName, getLang }) {
		const { threadID, senderID, body } = event;
		const { data, settings } = await threadsData.get(threadID);

		switch (args[0]) {
			case "text": {
				if (!args[1]) return message.reply(getLang("missingContent"));
				else if (args[1] == "reset") delete data.leaveMessage;
				else data.leaveMessage = body.slice(body.indexOf(args[0]) + args[0].length).trim();
				await threadsData.set(threadID, { data });
				message.reply(data.leaveMessage ? getLang("edited", data.leaveMessage) : getLang("reseted"));
				break;
			}
			case "file": {
				if (args[1] == "reset") {
					const { leaveAttachment } = data;
					if (!leaveAttachment) return message.reply(getLang("noFile"));
					try { await Promise.all(data.leaveAttachment.map(fileId => drive.deleteFile(fileId))); delete data.leaveAttachment; } catch (e) { }
					await threadsData.set(threadID, { data });
					message.reply(getLang("resetedFile"));
				} else if (event.attachments.length == 0 && (!event.messageReply || event.messageReply.attachments.length == 0)) {
					return message.reply(getLang("missingFile"), (err, info) => { global.GoatBot.onReply.set(info.messageID, { messageID: info.messageID, author: senderID, commandName }); });
				} else { saveChanges(message, event, threadID, senderID, threadsData, getLang); }
				break;
			}
			case "on": case "off": {
				settings.sendLeaveMessage = args[0] == "on";
				await threadsData.set(threadID, { settings });
				message.reply(getLang(args[0] == "on" ? "turnedOn" : "turnedOff"));
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
	if (!data.leaveAttachment) data.leaveAttachment = [];
	await Promise.all(attachments.map(async attachment => {
		const { url } = attachment;
		const ext = getExtFromUrl(url);
		const fileName = `${getTime()}.${ext}`;
		const infoFile = await drive.uploadFile(`setleave_${threadID}_${senderID}_${fileName}`, await getStreamFromURL(url));
		data.leaveAttachment.push(infoFile.id);
	}));
	await threadsData.set(threadID, { data });
	message.reply(getLang("addedFile", attachments.length));
}
