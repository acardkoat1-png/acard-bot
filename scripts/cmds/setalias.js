module.exports = {
	config: {
		name: "setalias",
		version: "2.0",
		author: "Acard",
		countDown: 5,
		role: 0,
		description: { ar: "إضافة اسم مستعار لأي أمر في مجموعتك" },
		category: "config",
		guide: {
			ar: "   {pn} add <الاسم المستعار> <اسم الأمر>: إضافة اسم مستعار لأمر في مجموعتك"
				+ "\n   {pn} add <الاسم المستعار> <اسم الأمر> -g: إضافة اسم مستعار للنظام بالكامل (للمشرفين فقط)"
				+ "\n   {pn} [remove | rm] <الاسم المستعار> <اسم الأمر>: حذف اسم مستعار"
				+ "\n   {pn} list: عرض جميع الأسماء المستعارة في مجموعتك"
				+ "\n   {pn} list -g: عرض جميع الأسماء المستعارة في النظام"
		}
	},

	langs: {
		ar: {
			commandNotExist: "❌ الأمر \"%1\" غير موجود",
			aliasExist: "❌ الاسم المستعار \"%1\" موجود مسبقاً للأمر \"%2\"",
			addAliasSuccess: "✅ تمت إضافة الاسم المستعار \"%1\" للأمر \"%2\"",
			noPermissionAdd: "❌ لا تملك صلاحية إضافة اسم مستعار للنظام",
			aliasIsCommand: "❌ الاسم \"%1\" مطابق لأمر آخر في النظام",
			aliasExistInGroup: "❌ الاسم \"%1\" موجود مسبقاً للأمر \"%2\" في هذه المجموعة",
			addAliasToGroupSuccess: "✅ تمت إضافة الاسم المستعار \"%1\" للأمر \"%2\" في مجموعتك",
			aliasNotExist: "❌ الاسم المستعار \"%1\" غير موجود للأمر \"%2\"",
			removeAliasSuccess: "✅ تم حذف الاسم المستعار \"%1\" للأمر \"%2\"",
			noPermissionDelete: "❌ لا تملك صلاحية حذف اسم مستعار من النظام",
			noAliasInGroup: "❌ الأمر \"%1\" ليس له أسماء مستعارة في مجموعتك",
			removeAliasInGroupSuccess: "✅ تم حذف الاسم المستعار \"%1\" من الأمر \"%2\" في مجموعتك",
			aliasList: "📜 قائمة الأسماء المستعارة:\n%1",
			noAliasInSystem: "⚠️ لا توجد أسماء مستعارة في النظام",
			notExistAliasInGroup: "⚠️ لم تتم إضافة أي أسماء مستعارة في مجموعتك",
			aliasListInGroup: "📜 الأسماء المستعارة في مجموعتك:\n%1"
		}
	},

	onStart: async function ({ message, event, args, threadsData, globalData, role, getLang }) {
		const aliasesData = await threadsData.get(event.threadID, "data.aliases", {});

		switch (args[0]) {
			case "add": {
				if (!args[2]) return message.SyntaxError();
				const commandName = args[2].toLowerCase();
				if (!global.GoatBot.commands.has(commandName)) return message.reply(getLang("commandNotExist", commandName));
				const alias = args[1].toLowerCase();

				if (args[3] == '-g') {
					if (role > 1) {
						const globalAliasesData = await globalData.get('setalias', 'data', []);
						const globalAliasesExist = globalAliasesData.find(item => item.aliases.includes(alias));
						if (globalAliasesExist) return message.reply(getLang("aliasExist", alias, globalAliasesExist.commandName));
						if (global.GoatBot.aliases.has(alias)) return message.reply(getLang("aliasExist", alias, global.GoatBot.aliases.get(alias)));
						const globalAliasesThisCommand = globalAliasesData.find(aliasData => aliasData.commandName == commandName);
						if (globalAliasesThisCommand) globalAliasesThisCommand.aliases.push(alias);
						else globalAliasesData.push({ commandName, aliases: [alias] });
						await globalData.set('setalias', globalAliasesData, 'data');
						global.GoatBot.aliases.set(alias, commandName);
						return message.reply(getLang("addAliasSuccess", alias, commandName));
					} else return message.reply(getLang("noPermissionAdd", alias, commandName));
				}

				if (global.GoatBot.commands.get(alias)) return message.reply(getLang("aliasIsCommand", alias));
				if (global.GoatBot.aliases.has(alias)) return message.reply(getLang("aliasExist", alias, global.GoatBot.aliases.get(alias)));
				for (const cmdName in aliasesData) if (aliasesData[cmdName].includes(alias)) return message.reply(getLang("aliasExistInGroup", alias, cmdName));

				const oldAlias = aliasesData[commandName] || [];
				oldAlias.push(alias);
				aliasesData[commandName] = oldAlias;
				await threadsData.set(event.threadID, aliasesData, "data.aliases");
				return message.reply(getLang("addAliasToGroupSuccess", alias, commandName));
			}
			case "remove": case "rm": {
				if (!args[2]) return message.SyntaxError();
				const commandName = args[2].toLowerCase();
				const alias = args[1].toLowerCase();
				if (!global.GoatBot.commands.has(commandName)) return message.reply(getLang("commandNotExist", commandName));

				if (args[3] == '-g') {
					if (role > 1) {
						const globalAliasesData = await globalData.get('setalias', 'data', []);
						const globalAliasesThisCommand = globalAliasesData.find(aliasData => aliasData.commandName == commandName);
						if (!globalAliasesThisCommand || !globalAliasesThisCommand.aliases.includes(alias)) return message.reply(getLang("aliasNotExist", alias, commandName));
						globalAliasesThisCommand.aliases.splice(globalAliasesThisCommand.aliases.indexOf(alias), 1);
						await globalData.set('setalias', globalAliasesData, 'data');
						global.GoatBot.aliases.delete(alias);
						return message.reply(getLang("removeAliasSuccess", alias, commandName));
					} else return message.reply(getLang("noPermissionDelete", alias, commandName));
				}

				const oldAlias = aliasesData[commandName];
				if (!oldAlias) return message.reply(getLang("noAliasInGroup", commandName));
				const index = oldAlias.indexOf(alias);
				if (index === -1) return message.reply(getLang("aliasNotExist", alias, commandName));
				oldAlias.splice(index, 1);
				await threadsData.set(event.threadID, aliasesData, "data.aliases");
				return message.reply(getLang("removeAliasInGroupSuccess", alias, commandName));
			}
			case "list": {
				if (args[1] == '-g') {
					const globalAliasesData = await globalData.get('setalias', 'data', []);
					const globalAliases = globalAliasesData.map(aliasData => ({ commandName: aliasData.commandName, aliases: aliasData.aliases.join(', ') }));
					return message.reply(globalAliases.length ? getLang("aliasList", globalAliases.map(alias => `• ${alias.commandName}: ${alias.aliases}`).join('\n')) : getLang("noAliasInSystem"));
				}
				if (!Object.keys(aliasesData).length) return message.reply(getLang("notExistAliasInGroup"));
				const list = Object.keys(aliasesData).map(commandName => `\n• ${commandName}: ${aliasesData[commandName].join(", ")} `);
				return message.reply(getLang("aliasListInGroup", list.join("\n")));
			}
			default: return message.SyntaxError();
		}
	}
};