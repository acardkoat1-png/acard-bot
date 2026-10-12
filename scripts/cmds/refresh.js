module.exports = {
	config: {
		name: "refresh",
		version: "2.0",
		author: "Acard",
		countDown: 60,
		role: 0,
		description: { ar: "تحديث معلومات المجموعة أو المستخدم" },
		category: "box chat",
		guide: {
			ar: "   {pn} [thread | group]: تحديث معلومات مجموعتك"
				+ "\n   {pn} group <معرف المجموعة>: تحديث معلومات مجموعة بمعرف"
				+ "\n\n   {pn} user: تحديث معلوماتك"
				+ "\n   {pn} user [<معرف> | @منشن]: تحديث معلومات مستخدم"
		}
	},

	langs: {
		ar: {
			refreshMyThreadSuccess: "✅ | تم تحديث معلومات مجموعتك بنجاح!",
			refreshThreadTargetSuccess: "✅ | تم تحديث معلومات المجموعة %1 بنجاح!",
			errorRefreshMyThread: "❌ | خطأ في تحديث معلومات مجموعتك",
			errorRefreshThreadTarget: "❌ | خطأ في تحديث معلومات المجموعة %1",
			refreshMyUserSuccess: "✅ | تم تحديث معلوماتك بنجاح!",
			refreshUserTargetSuccess: "✅ | تم تحديث معلومات المستخدم %1 بنجاح!",
			errorRefreshMyUser: "❌ | خطأ في تحديث معلوماتك",
			errorRefreshUserTarget: "❌ | خطأ في تحديث معلومات المستخدم %1"
		}
	},

	onStart: async function ({ args, threadsData, message, event, usersData, getLang }) {
		if (args[0] == "group" || args[0] == "thread") {
			const targetID = args[1] || event.threadID;
			try {
				await threadsData.refreshInfo(targetID);
				return message.reply(targetID == event.threadID ? getLang("refreshMyThreadSuccess") : getLang("refreshThreadTargetSuccess", targetID));
			} catch (error) {
				return message.reply(targetID == event.threadID ? getLang("errorRefreshMyThread") : getLang("errorRefreshThreadTarget", targetID));
			}
		} else if (args[0] == "user") {
			let targetID = event.senderID;
			if (args[1]) {
				if (Object.keys(event.mentions).length) targetID = Object.keys(event.mentions)[0];
				else targetID = args[1];
			}
			try {
				await usersData.refreshInfo(targetID);
				return message.reply(targetID == event.senderID ? getLang("refreshMyUserSuccess") : getLang("refreshUserTargetSuccess", targetID));
			} catch (error) {
				return message.reply(targetID == event.senderID ? getLang("errorRefreshMyUser") : getLang("errorRefreshUserTarget", targetID));
			}
		} else message.SyntaxError();
	}
};