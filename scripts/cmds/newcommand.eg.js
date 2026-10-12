module.exports = {
	config: {
		name: "commandName",
		version: "1.1",
		author: "Acard",
		countDown: 5,
		role: 0,
		shortDescription: { ar: "هذا وصف قصير للأمر" },
		description: { ar: "هذا وصف طويل للأمر" },
		category: "categoryName",
		guide: { ar: "هذا دليل استخدام الأمر" }
	},

	langs: {
		ar: {
			hello: "مرحباً",
			helloWithName: "مرحباً، معرف الفيسبوك الخاص بك هو %1"
		}
	},

	onStart: async function ({ api, args, message, event, threadsData, usersData, dashBoardData, globalData, threadModel, userModel, dashBoardModel, globalModel, role, commandName, getLang }) {
		message.reply(getLang("hello"));
	}
};