const { drive, getStreamFromURL, getExtFromUrl, getTime } = global.utils;
const checkUrlRegex = /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/;

module.exports = {
	config: {
		name: "setrankup",
		version: "2.0",
		author: "Acard",
		countDown: 0,
		role: 0,
		description: { ar: "تخصيص رسالة وإرفاقات الترقية" },
		category: "owner",
		guide: {
			ar: "   {pn} text <رسالة>: تخصيص نص رسالة الترقية"
				+ "\n   الاختصارات: {userName}, {userNameTag}, {oldRank}, {currentRank}"
				+ "\n   {pn} file <رابط>: إضافة ملف مرفق للترقية"
				+ "\n   {pn} reset: إعادة التعيين للافتراضي"
		}
	},

	langs: {
		ar: {
			changedMessage: "✅ تم تغيير رسالة الترقية إلى: %1",
			missingAttachment: "⚠️ يجب إرفاق صورة أو ملف",
			changedAttachment: "✅ تمت إضافة %1 مرفق للترقية بنجاح"
		}
	},

	onStart: async function ({ args, message, event, threadsData, getLang }) {
		const { body, threadID, senderID } = event;
		switch (args[0]) {
			case "text": {
				const newContent = body.slice(body.indexOf("text") + 5);
				await threadsData.set(threadID, newContent, "data.rankup.message");
				return message.reply(getLang("changedMessage", newContent));
			}
			case "file": case "image": case "mp3": case "video": {
				const attachments = [...event.attachments, ...(event.messageReply?.attachments || [])].filter(item => ["photo", 'png', "animated_image", "video", "audio"].includes(item.type));
				if (!attachments.length && !(args[1] || '').match(checkUrlRegex)) return message.reply(getLang("missingAttachment", attachments.length));
				const { data } = await threadsData.get(threadID);
				if (!data.rankup) data.rankup = {};
				if (!data.rankup.attachments) data.rankup.attachments = [];

				for (const attachment of attachments) {
					const { url } = attachment;
					const ext = getExtFromUrl(url);
					const fileName = `${getTime()}.${ext}`;
					const infoFile = await drive.uploadFile(`setrankup_${threadID}_${senderID}_${fileName}`, await getStreamFromURL(url));
					data.rankup.attachments.push(infoFile.id);
				}
				await threadsData.set(threadID, { data });
				return message.reply(getLang("changedAttachment"));
			}
		}
	}
};
