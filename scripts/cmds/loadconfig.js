const fs = require("fs-extra");

module.exports = {
	config: {
		name: "loadconfig",
		aliases: ["loadcf"],
		version: "2.0",
		author: "Acard",
		countDown: 5,
		role: 2,
		description: { ar: "إعادة تحميل إعدادات البوت" },
		category: "owner",
		guide: "{pn}"
	},

	langs: { ar: { success: "✅ تم إعادة تحميل الإعدادات بنجاح" } },

	onStart: async function ({ message, getLang }) {
		global.GoatBot.config = fs.readJsonSync(global.client.dirConfig);
		global.GoatBot.configCommands = fs.readJsonSync(global.client.dirConfigCommands);
		message.reply(getLang("success"));
	}
};