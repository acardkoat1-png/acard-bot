const fs = require("fs-extra");
const { utils } = global;

module.exports = {
	config: {
		name: "prefix",
		version: "2.0",
		author: "Acard",
		countDown: 5,
		role: 0,
		description: "تغيير بادئة الأوامر في مجموعتك أو النظام بالكامل",
		category: "config",
		guide: {
			ar: "   {pn} <بادئة جديدة>: تغيير البادئة في مجموعتك"
				+ "\n   {pn} <بادئة جديدة> -g: تغيير البادئة في النظام بالكامل (للمشرفين فقط)"
				+ "\n   {pn} reset: إعادة البادئة في مجموعتك إلى الافتراضي"
		}
	},

	langs: {
		ar: {
			reset: "تم إعادة بادئتك إلى الافتراضي: %1",
			onlyAdmin: "المشرف العام فقط يمكنه تغيير بادئة النظام",
			confirmGlobal: "يرجى التفاعل مع هذه الرسالة لتأكيد تغيير بادئة النظام بالكامل",
			confirmThisThread: "يرجى التفاعل مع هذه الرسالة لتأكيد تغيير البادئة في مجموعتك",
			successGlobal: "تم تغيير بادئة النظام إلى: %1",
			successThisThread: "تم تغيير البادئة في مجموعتك إلى: %1",
			myPrefix: "🌐 بادئة النظام: %1\n🛸 بادئة مجموعتك: %2"
		}
	},

	onStart: async function ({ message, role, args, commandName, event, threadsData, getLang }) {
		if (!args[0]) return message.SyntaxError();

		if (args[0] == 'reset') {
			await threadsData.set(event.threadID, null, "data.prefix");
			return message.reply(getLang("reset", global.GoatBot.config.prefix));
		}

		const newPrefix = args[0];
		const formSet = { commandName, author: event.senderID, newPrefix };

		if (args[1] === "-g")
			if (role < 2) return message.reply(getLang("onlyAdmin"));
			else formSet.setGlobal = true;
		else formSet.setGlobal = false;

		return message.reply(args[1] === "-g" ? getLang("confirmGlobal") : getLang("confirmThisThread"), (err, info) => {
			formSet.messageID = info.messageID;
			global.GoatBot.onReaction.set(info.messageID, formSet);
		});
	},

	onReaction: async function ({ message, threadsData, event, Reaction, getLang }) {
		const { author, newPrefix, setGlobal } = Reaction;
		if (event.userID !== author) return;
		if (setGlobal) {
			global.GoatBot.config.prefix = newPrefix;
			fs.writeFileSync(global.client.dirConfig, JSON.stringify(global.GoatBot.config, null, 2));
			return message.reply(getLang("successGlobal", newPrefix));
		} else {
			await threadsData.set(event.threadID, newPrefix, "data.prefix");
			return message.reply(getLang("successThisThread", newPrefix));
		}
	},

	onChat: async function ({ event, message, getLang }) {
		if (event.body && event.body.toLowerCase() === "prefix")
			return () => { return message.reply(getLang("myPrefix", global.GoatBot.config.prefix, utils.getPrefix(event.threadID))); };
	}
};
