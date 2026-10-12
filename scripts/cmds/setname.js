async function checkShortCut(nickname, uid, usersData) {
	try {
		/\{userName\}/gi.test(nickname) ? nickname = nickname.replace(/\{userName\}/gi, await usersData.getName(uid)) : null;
		/\{userID\}/gi.test(nickname) ? nickname = nickname.replace(/\{userID\}/gi, uid) : null;
		return nickname;
	} catch (e) { return nickname; }
}

module.exports = {
	config: {
		name: "setname",
		version: "2.0",
		author: "Acard",
		countDown: 5,
		role: 0,
		description: { ar: "تغيير الأسماء المستعارة للأعضاء" },
		category: "box chat",
		guide: {
			ar: {
				body: "   {pn} <اسم مستعار>: تغيير اسمك"
					+ "\n   {pn} @منشنات <اسم مستعار>: تغيير أسماء المذكورين"
					+ "\n   {pn} all <اسم مستعار>: تغيير أسماء جميع الأعضاء"
					+ "\n\n   الاختصارات المتاحة:"
					+ "\n   + {userName}: اسم العضو"
					+ "\n   + {userID}: معرف العضو"
			}
		}
	},

	langs: { ar: { error: "❌ حدث خطأ، حاول إيقاف رابط الدعوة في المجموعة ثم حاول مجدداً" } },

	onStart: async function ({ args, message, event, api, usersData, getLang }) {
		const mentions = Object.keys(event.mentions);
		let uids = [];
		let nickname = args.join(" ");

		if (args[0] === "all" || mentions.includes(event.threadID)) {
			uids = (await api.getThreadInfo(event.threadID)).participantIDs;
			nickname = args[0] === "all" ? args.slice(1).join(" ") : nickname.replace(event.mentions[event.threadID], "").trim();
		} else if (mentions.length) {
			uids = mentions;
			const allName = new RegExp(Object.values(event.mentions).map(name => name.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")).join("|"), "g");
			nickname = nickname.replace(allName, "").trim();
		} else { uids = [event.senderID]; nickname = nickname.trim(); }

		try {
			const uid = uids.shift();
			await api.changeNickname(await checkShortCut(nickname, uid, usersData), event.threadID, uid);
		} catch (e) { return message.reply(getLang("error")); }

		for (const uid of uids) await api.changeNickname(await checkShortCut(nickname, uid, usersData), event.threadID, uid);
	}
};