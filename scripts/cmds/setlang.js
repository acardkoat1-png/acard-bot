const fs = require("fs-extra");

module.exports = {
	config: {
		name: "setlang",
		version: "2.0",
		author: "Acard",
		countDown: 5,
		role: 0,
		description: { ar: "تعيين لغة البوت للمجموعة الحالية أو جميع المجموعات" },
		category: "owner",
		guide: { ar: "   {pn} <كود اللغة ISO 639-1>\n   مثال:\n    {pn} ar\n    {pn} en" }
	},

	langs: {
		ar: {
			setLangForAll: "✅ تم تعيين لغة البوت إلى: %1",
			setLangForCurrent: "✅ تم تعيين لغة المجموعة إلى: %1",
			noPermission: "⚠️ المشرف العام فقط يمكنه استخدام هذا الأمر",
			langNotFound: "❌ اللغة غير موجودة: %1"
		}
	},

	onStart: async function ({ message, args, getLang, threadsData, role, event }) {
		if (!args[0]) return message.SyntaxError;
		let langCode = args[0].toLowerCase();
		if (langCode == "default" || langCode == "reset") langCode = null;

		if (["-g", "-global", "all"].includes(args[1]?.toLowerCase())) {
			if (role < 2) return message.reply(getLang("noPermission"));
			const pathLanguageFile = `${process.cwd()}/languages/${langCode}.lang`;
			if (!fs.existsSync(pathLanguageFile)) return message.reply(getLang("langNotFound", langCode));
			const readLanguage = fs.readFileSync(pathLanguageFile, "utf-8");
			const languageData = readLanguage.split(/\r?\n|\r/).filter(line => line && !line.trim().startsWith("#") && !line.trim().startsWith("//") && line != "");

			global.language = {};
			for (const sentence of languageData) {
				const getSeparator = sentence.indexOf('=');
				const itemKey = sentence.slice(0, getSeparator).trim();
				const itemValue = sentence.slice(getSeparator + 1, sentence.length).trim();
				const head = itemKey.slice(0, itemKey.indexOf('.'));
				const key = itemKey.replace(head + '.', '');
				const value = itemValue.replace(/\\n/gi, '\n');
				if (!global.language[head]) global.language[head] = {};
				global.language[head][key] = value;
			}
			global.GoatBot.config.language = langCode;
			fs.writeFileSync(global.client.dirConfig, JSON.stringify(global.GoatBot.config, null, 2));
			return message.reply(getLang("setLangForAll", langCode));
		}

		await threadsData.set(event.threadID, langCode, "data.lang");
		return message.reply((global.GoatBot.commands.get("setlang")?.langs[langCode]?.setLangForCurrent || "تم تعيين لغة المجموعة إلى: %1").replace("%1", langCode));
	}
};