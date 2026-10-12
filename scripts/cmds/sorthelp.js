module.exports = {
	config: {
		name: "sorthelp",
		version: "2.0",
		author: "Acard",
		countDown: 5,
		role: 0,
		description: { ar: "ترتيب قائمة المساعدة" },
		category: "image",
		guide: { ar: "{pn} [name | category]" }
	},

	langs: {
		ar: {
			savedName: "✅ تم حفظ ترتيب المساعدة حسب الاسم",
			savedCategory: "✅ تم حفظ ترتيب المساعدة حسب الفئة"
		}
	},

	onStart: async function ({ message, event, args, threadsData, getLang }) {
		if (args[0] == "name") { await threadsData.set(event.threadID, "name", "settings.sortHelp"); message.reply(getLang("savedName")); }
		else if (args[0] == "category") { threadsData.set(event.threadID, "category", "settings.sortHelp"); message.reply(getLang("savedCategory")); }
		else message.SyntaxError();
	}
};