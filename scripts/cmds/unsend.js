module.exports = {
	config: {
		name: "unsend",
		aliases: ["u", "uns", "r"],
		version: "2.0",
		author: "Acard",
		countDown: 5,
		role: 0,
		description: { ar: "حذف رسالة البوت" },
		category: "box chat",
		guide: { ar: "قم بالرد على رسالة البوت التي تريد حذفها واكتب الأمر {pn}" }
	},

	langs: { ar: { syntaxError: "⚠️ يرجى الرد على رسالة البوت التي تريد حذفها" } },

	onStart: async function ({ message, event, api, getLang }) {
		if (!event.messageReply || event.messageReply.senderID != api.getCurrentUserID()) return message.reply(getLang("syntaxError"));
		message.unsend(event.messageReply.messageID);
	}
};
