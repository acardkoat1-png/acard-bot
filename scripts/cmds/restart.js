const fs = require("fs-extra");

module.exports = {
	config: {
		name: "restart",
		version: "2.0",
		author: "Acard",
		countDown: 5,
		role: 2,
		description: { ar: "إعادة تشغيل البوت" },
		category: "Owner",
		guide: { ar: "   {pn}: إعادة تشغيل البوت" }
	},

	langs: { ar: { restartting: "🔄 | جارٍ إعادة تشغيل البوت..." } },

	onLoad: function ({ api }) {
		const pathFile = `${__dirname}/tmp/restart.txt`;
		if (fs.existsSync(pathFile)) {
			const [tid, time] = fs.readFileSync(pathFile, "utf-8").split(" ");
			api.sendMessage(`✅ | تمت إعادة تشغيل البوت\n⏰ | الوقت: ${(Date.now() - time) / 1000}ث`, tid);
			fs.unlinkSync(pathFile);
		}
	},

	onStart: async function ({ message, event, getLang }) {
		const pathFile = `${__dirname}/tmp/restart.txt`;
		fs.writeFileSync(pathFile, `${event.threadID} ${Date.now()}`);
		await message.reply(getLang("restartting"));
		process.exit(2);
	}
};