module.exports = {
	config: {
		name: "kick",
		version: "2.0",
		author: "Acard",
		countDown: 5,
		role: 1,
		description: { ar: "طرد عضو من المجموعة" },
		category: "owner",
		guide: { ar: "   {pn} @منشنات: طرد الأعضاء المذكورين" }
	},

	langs: {
		ar: { needAdmin: "يرجى إضافة البوت كمشرف للمجموعة قبل استخدام هذه الميزة" }
	},

	onStart: async function ({ message, event, args, threadsData, api, getLang }) {
		const adminIDs = await threadsData.get(event.threadID, "adminIDs");
		if (!adminIDs.includes(api.getCurrentUserID()))
			return message.reply(getLang("needAdmin"));
		async function kickAndCheckError(uid) {
			try { await api.removeUserFromGroup(uid, event.threadID); }
			catch (e) { message.reply(getLang("needAdmin")); return "ERROR"; }
		}
		if (!args[0]) {
			if (!event.messageReply) return message.SyntaxError();
			await kickAndCheckError(event.messageReply.senderID);
		}
		else {
			const uids = Object.keys(event.mentions);
			if (uids.length === 0) return message.SyntaxError();
			if (await kickAndCheckError(uids.shift()) === "ERROR") return;
			for (const uid of uids) api.removeUserFromGroup(uid, event.threadID);
		}
	}
};
