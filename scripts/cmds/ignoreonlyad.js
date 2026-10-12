const ignoreList = global.GoatBot.config.adminOnly.ignoreCommand;
const fs = require("fs-extra");

module.exports = {
	config: {
		name: "ignoreonlyad",
		aliases: ["ignoreadonly", "ignoreonlyadmin", "ignoreadminonly"],
		version: "2.0",
		author: "Acard",
		countDown: 5,
		role: 2,
		description: { ar: "تجاهل أمر في وضع المشرف العام" },
		category: "owner",
		guide: {
			ar: "   {pn} add <اسم الأمر>: إضافة أمر لقائمة التجاهل"
				+ "\n   {pn} del <اسم الأمر>: حذف أمر من قائمة التجاهل"
				+ "\n   {pn} list: عرض قائمة التجاهل"
		}
	},

	langs: {
		ar: {
			missingCommandNameToAdd: "⚠️ يرجى إدخال اسم الأمر لإضافته لقائمة التجاهل",
			missingCommandNameToDelete: "⚠️ يرجى إدخال اسم الأمر لحذفه من قائمة التجاهل",
			commandNotFound: "❌ الأمر \"%1\" غير موجود في قائمة أوامر البوت",
			commandAlreadyInList: "❌ الأمر \"%1\" موجود مسبقاً في قائمة التجاهل",
			commandAdded: "✅ تمت إضافة الأمر \"%1\" لقائمة التجاهل",
			commandNotInList: "❌ الأمر \"%1\" غير موجود في قائمة التجاهل",
			commandDeleted: "✅ تم حذف الأمر \"%1\" من قائمة التجاهل",
			ignoreList: "📑 قائمة التجاهل في وضع المشرف العام:\n%1"
		}
	},

	onStart: async function ({ args, message, getLang }) {
		switch (args[0]) {
			case "add": {
				if (!args[1]) return message.reply(getLang("missingCommandNameToAdd"));
				const commandName = args[1].toLowerCase();
				const command = global.GoatBot.commands.get(commandName);
				if (!command) return message.reply(getLang("commandNotFound", commandName));
				if (ignoreList.includes(commandName)) return message.reply(getLang("commandAlreadyInList", commandName));
				ignoreList.push(commandName);
				fs.writeFileSync(global.client.dirConfig, JSON.stringify(global.GoatBot.config, null, 2));
				return message.reply(getLang("commandAdded", commandName));
			}
			case "del": case "delete": case "remove": case "rm": case "-d": {
				if (!args[1]) return message.reply(getLang("missingCommandNameToDelete"));
				const commandName = args[1].toLowerCase();
				const command = global.GoatBot.commands.get(commandName);
				if (!command) return message.reply(getLang("commandNotFound", commandName));
				if (!ignoreList.includes(commandName)) return message.reply(getLang("commandNotInList", commandName));
				ignoreList.splice(ignoreList.indexOf(commandName), 1);
				fs.writeFileSync(global.client.dirConfig, JSON.stringify(global.GoatBot.config, null, 2));
				return message.reply(getLang("commandDeleted", commandName));
			}
			case "list": return message.reply(getLang("ignoreList", ignoreList.join(", ")));
			default: return message.SyntaxError();
		}
	}
};