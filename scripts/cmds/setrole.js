module.exports = {
	config: {
		name: "setrole",
		version: "2.0",
		author: "Acard",
		countDown: 5,
		role: 1,
		description: { ar: "تعديل صلاحية الأوامر" },
		category: "info",
		guide: {
			ar: "   {pn} <اسم الأمر> <الصلاحية الجديدة>: تعيين صلاحية جديدة"
				+ "\n   0 = للجميع | 1 = للمشرفين فقط | default = الافتراضي"
				+ "\n   {pn} [viewrole|view|show]: عرض الأوامر المعدلة"
		}
	},

	langs: {
		ar: {
			noEditedCommand: "✅ لا توجد أوامر معدلة في مجموعتك",
			editedCommand: "⚠️ الأوامر المعدلة في مجموعتك:\n",
			noPermission: "❗ المشرفون فقط يمكنهم استخدام هذا الأمر",
			commandNotFound: "❌ الأمر \"%1\" غير موجود",
			noChangeRole: "❗ لا يمكن تغيير صلاحية الأمر \"%1\"",
			resetRole: "✅ تم إعادة صلاحية الأمر \"%1\" إلى الافتراضي",
			changedRole: "✅ تم تغيير صلاحية الأمر \"%1\" إلى %2"
		}
	},

	onStart: async function ({ message, event, args, role, threadsData, getLang }) {
		const { commands, aliases } = global.GoatBot;
		const setRole = await threadsData.get(event.threadID, "data.setRole", {});

		if (["view", "viewrole", "show"].includes(args[0])) {
			if (!setRole || Object.keys(setRole).length === 0) return message.reply(getLang("noEditedCommand"));
			let msg = getLang("editedCommand");
			for (const cmd in setRole) msg += `- ${cmd} => ${setRole[cmd]}\n`;
			return message.reply(msg);
		}

		let commandName = (args[0] || "").toLowerCase();
		let newRole = args[1];
		if (!commandName || (isNaN(newRole) && newRole !== "default")) return message.SyntaxError();
		if (role < 1) return message.reply(getLang("noPermission"));

		const command = commands.get(commandName) || commands.get(aliases.get(commandName));
		if (!command) return message.reply(getLang("commandNotFound", commandName));
		commandName = command.config.name;
		if (command.config.role > 1) return message.reply(getLang("noChangeRole", commandName));

		let Default = false;
		if (newRole === "default" || newRole == command.config.role) { Default = true; newRole = command.config.role; }
		else { newRole = parseInt(newRole); }

		setRole[commandName] = newRole;
		if (Default) delete setRole[commandName];
		await threadsData.set(event.threadID, setRole, "data.setRole");
		message.reply("✅ " + (Default === true ? getLang("resetRole", commandName) : getLang("changedRole", commandName, newRole)));
	}
};