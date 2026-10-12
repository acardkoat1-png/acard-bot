const fs = require("fs-extra");
const nullAndUndefined = [undefined, null];
const activeGames = {};
// حالة اللعب في الذاكرة (تُفقد عند إعادة تشغيل البوت — سجلات الألعاب الجارية)
const activeQuestions = global.activeQuestions = global.activeQuestions || {};

function getType(obj) {
	return Object.prototype.toString.call(obj).slice(8, -1);
}

function getRole(threadData, senderID) {
	const adminBot = global.GoatBot.config.adminBot || [];
	if (!senderID) return 0;
	const adminBox = threadData ? threadData.adminIDs || [] : [];
	return adminBot.includes(senderID) ? 2 : adminBox.includes(senderID) ? 1 : 0;
}

function getText(type, reason, time, targetID, lang) {
	const utils = global.utils;
	if (type == "userBanned") return utils.getText({ lang, head: "handlerEvents" }, "userBanned", reason, time, targetID);
	else if (type == "threadBanned") return utils.getText({ lang, head: "handlerEvents" }, "threadBanned", reason, time, targetID);
	else if (type == "onlyAdminBox") return utils.getText({ lang, head: "handlerEvents" }, "onlyAdminBox");
	else if (type == "onlyAdminBot") return utils.getText({ lang, head: "handlerEvents" }, "onlyAdminBot");
}

function replaceShortcutInLang(text, prefix, commandName) {
	return text.replace(/\{(?:p|prefix)\}/g, prefix).replace(/\{(?:n|name)\}/g, commandName).replace(/\{pn\}/g, `${prefix}${commandName}`);
}

function getRoleConfig(utils, command, isGroup, threadData, commandName) {
	let roleConfig;
	if (utils.isNumber(command.config.role)) { roleConfig = { onStart: command.config.role }; }
	else if (typeof command.config.role == "object" && !Array.isArray(command.config.role)) {
		if (!command.config.role.onStart) command.config.role.onStart = 0;
		roleConfig = command.config.role;
	} else { roleConfig = { onStart: 0 }; }
	if (isGroup) roleConfig.onStart = threadData.data.setRole?.[commandName] ?? roleConfig.onStart;
	for (const key of ["onChat", "onStart", "onReaction", "onReply", "onEvent"]) { if (roleConfig[key] == undefined) roleConfig[key] = roleConfig.onStart; }
	return roleConfig;
}

function isBannedOrOnlyAdmin(userData, threadData, senderID, threadID, isGroup, commandName, message, lang) {
	const config = global.GoatBot.config;
	const { adminBot, hideNotiMessage = {} } = config;
	const infoBannedUser = userData.banned;
	if (infoBannedUser.status == true) { if (hideNotiMessage.userBanned == false) message.reply(getText("userBanned", infoBannedUser.reason, infoBannedUser.date, senderID, lang)); return true; }
	if (config.adminOnly.enable == true && !adminBot.includes(senderID) && !config.adminOnly.ignoreCommand.includes(commandName)) { if (hideNotiMessage.adminOnly == false) message.reply(getText("onlyAdminBot", null, null, null, lang)); return true; }
	if (isGroup == true) {
		if (threadData.data.onlyAdminBox === true && !threadData.adminIDs.includes(senderID) && !(threadData.data.ignoreCommanToOnlyAdminBox || []).includes(commandName)) { if (!threadData.data.hideNotiMessageOnlyAdminBox) message.reply(getText("onlyAdminBox", null, null, null, lang)); return true; }
		const infoBannedThread = threadData.banned;
		if (infoBannedThread.status == true) { if (hideNotiMessage.threadBanned == false) message.reply(getText("threadBanned", infoBannedThread.reason, infoBannedThread.date, threadID, lang)); return true; }
	}
	return false;
}

function createGetText2(langCode, pathCustomLang, prefix, command) {
	const commandName = command.config.name;
	let customLang = {};
	let getText2 = () => { };
	try {
		if (fs.existsSync(pathCustomLang)) customLang = require(pathCustomLang)[commandName]?.text || {};
	}
	catch (e) { customLang = {}; }
	if (command.langs || customLang || {}) {
		getText2 = function (key, ...args) {
			let lang = command.langs?.[langCode]?.[key] || customLang[key] || "";
			lang = replaceShortcutInLang(lang, prefix, commandName);
			for (let i = args.length - 1; i >= 0; i--) lang = lang.replace(new RegExp(`%${i + 1}`, "g"), args[i]);
			return lang || `❌ Can't find text`;
		}
	}
	return getText2;
}

module.exports = function (api, threadModel, userModel, dashBoardModel, globalModel, usersData, threadsData, dashBoardData, globalData) {
	return async function (event, message) {
		const { utils, client, GoatBot } = global;
		const { getPrefix, removeHomeDir, log, getTime } = utils;
		const { config, configCommands: { envGlobal, envCommands, envEvents } } = GoatBot;
		const { autoRefreshThreadInfoFirstTime } = config.database;
		let { hideNotiMessage = {} } = config;
		const { body, messageID, threadID, isGroup } = event;
		if (!threadID) return;
		const senderID = event.userID || event.senderID || event.author;
		let threadData = global.db.allThreadData.find(t => t.threadID == threadID);
		let userData = global.db.allUserData.find(u => u.userID == senderID);
		if (!userData && !isNaN(senderID)) userData = await usersData.create(senderID);
		if (!threadData && !isNaN(threadID)) {
			if (global.temp.createThreadDataError.includes(threadID)) return;
			threadData = await threadsData.create(threadID);
			global.db.receivedTheFirstMessage[threadID] = true;
		} else {
			if (autoRefreshThreadInfoFirstTime === true && !global.db.receivedTheFirstMessage[threadID]) {
				global.db.receivedTheFirstMessage[threadID] = true;
				await threadsData.refreshInfo(threadID);
			}
		}
		if (typeof threadData.settings.hideNotiMessage == "object") hideNotiMessage = threadData.settings.hideNotiMessage;
		const prefix = getPrefix(threadID);
		const role = getRole(threadData, senderID);
		const parameters = {
			api, usersData, threadsData, message, event,
			userModel, threadModel, prefix, dashBoardModel,
			globalModel, dashBoardData, globalData, envCommands,
			envEvents, envGlobal, role,
			removeCommandNameFromBody: function removeCommandNameFromBody(body_, prefix_, commandName_) {
				if ([body_, prefix_, commandName_].every(x => nullAndUndefined.includes(x))) throw new Error("Need body, prefix, commandName");
				return body_.replace(new RegExp(`^${prefix_}(\\s+|)${commandName_}`, "i"), "").trim();
			}
		};
		const langCode = threadData.data.lang || config.language || "en";

		// ⬇️ إصلاح مهم: هذا الجزء كان محذوفاً، وبسببه كانت أوامر كثيرة تفشل بصمت
		// (أكثر من 40 أمراً تستعمل message.SyntaxError)
		function createMessageSyntaxError(commandName) {
			message.SyntaxError = async function () {
				return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "commandSyntaxError", prefix, commandName));
			};
		}

		// تقصير نص الخطأ حتى لا تُرسل رسالة ضخمة للمجموعة
		function shortenError(err) {
			const text = err && err.stack ? err.stack.split("\n").slice(0, 4).join("\n") : JSON.stringify(err, null, 2);
			return removeHomeDir(String(text || err));
		}

		// تنظيف دوري لخريطة الكولداون (لمنع تسرّب الذاكرة عند العمل 24/7)
		function cleanCountDown(now) {
			client.__cdTick = (client.__cdTick || 0) + 1;
			if (client.__cdTick % 300 !== 0) return;
			for (const cmdName in client.countDown) {
				const map = client.countDown[cmdName];
				for (const uid in map) if (now - map[uid] > 3600000) delete map[uid];
			}
		}

		async function onStart() {
			if (!body) return;
			const noPrefixEnable = global.GoatBot.config.noPrefix?.enable === true;
			const isAdminBot = (global.GoatBot.config.adminBot || []).includes(senderID);
			let usedPrefix = prefix;
			let bodyToParse = body;
			if (body.startsWith(prefix)) { bodyToParse = body; usedPrefix = prefix; }
			else if (noPrefixEnable && isAdminBot) {
				const possibleCmd = body.trim().split(/ +/)[0].toLowerCase();
				const cmdExists = GoatBot.commands.has(possibleCmd) || GoatBot.commands.has(GoatBot.aliases.get(possibleCmd));
				if (!cmdExists) return;
				usedPrefix = ""; bodyToParse = body;
			} else { return; }

			const dateNow = Date.now();
			cleanCountDown(dateNow);
			const args = bodyToParse.slice(usedPrefix.length).trim().split(/ +/);

			for (let i = 0; i < args.length; i++) {
				const a = args[i].toLowerCase();
				if (/^\d+\.?\d*k$/.test(a)) args[i] = String(Math.floor(parseFloat(a) * 1000));
				else if (/^\d+\.?\d*m$/.test(a)) args[i] = String(Math.floor(parseFloat(a) * 1000000));
				else if (/^\d+\.?\d*b$/.test(a)) args[i] = String(Math.floor(parseFloat(a) * 1000000000));
				else if (/^\d+\.?\d*t$/.test(a)) args[i] = String(Math.floor(parseFloat(a) * 1000000000000));
			}

			let commandName = args.shift().toLowerCase();
			let command = GoatBot.commands.get(commandName) || GoatBot.commands.get(GoatBot.aliases.get(commandName));
			if (command) commandName = command.config.name;

			(async () => {
				try {
					let uData = await usersData.get(senderID);
					if (!uData.data) uData.data = {};
					uData.data.msgCount = (uData.data.msgCount || 0) + 1;
					if (uData.data.msgCount === 1) uData.data.wasFirst = true;
					await usersData.set(senderID, uData);
				} catch (e) { }
			})();

			const blacklist = await threadsData.get(threadID, "data.blacklist", []);
			if (blacklist.includes(senderID)) return;

			const slowmodeCmd = GoatBot.commands.get("slowmode");
			if (slowmodeCmd && slowmodeCmd.checkCooldown) {
				const blocked = slowmodeCmd.checkCooldown({
					senderID, threadID, message,
					getLang: (key, ...a) => { let lang = slowmodeCmd.langs?.ar?.[key] || slowmodeCmd.langs?.en?.[key] || ""; for (let i = a.length - 1; i >= 0; i--) lang = lang.replace(new RegExp(`%${i + 1}`, "g"), a[i]); return lang; }
				});
				if (blocked) return;
			}

			if (isBannedOrOnlyAdmin(userData, threadData, senderID, threadID, isGroup, commandName, message, langCode)) return;
			if (!command) return;

			const roleConfig = getRoleConfig(utils, command, isGroup, threadData, commandName);
			if (roleConfig.onStart > role) {
				if (roleConfig.onStart == 1) return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "onlyAdmin", commandName));
				else if (roleConfig.onStart == 2) return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "onlyAdminBot2", commandName));
				return;
			}
			if (!client.countDown[commandName]) client.countDown[commandName] = {};
			const timestamps = client.countDown[commandName];
			const getCoolDown = command.config.countDown || 1;
			if (timestamps[senderID] && dateNow < timestamps[senderID] + getCoolDown * 1000) {
				// ⬇️ كان الرفض صامتاً بلا أي رسالة — الآن يُخبر المستخدم بكم ينتظر
				const left = Math.ceil((timestamps[senderID] + getCoolDown * 1000 - dateNow) / 1000);
				if (!hideNotiMessage.waitingForCommand)
					return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "waitingForCommand", left));
				return;
			}
			const getText2 = createGetText2(langCode, `${process.cwd()}/languages/cmds/${langCode}.js`, prefix, command);
			createMessageSyntaxError(commandName);
			const time = getTime("DD/MM/YYYY HH:mm:ss");
			try {
				await command.onStart({ ...parameters, args, commandName, getLang: getText2 });
				timestamps[senderID] = dateNow;
			}
			catch (err) {
				// ⬇️ كان الخطأ يُبتلع بلا أي أثر — الآن يُسجَّل ويُرسل للمستخدم
				log.err(commandName, `Error when executing command ${commandName} in thread ${threadID} by ${senderID}`, err);
				await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "errorOccurred", time, commandName, shortenError(err)));
			}
		}

		async function onChat() {
			if (!body) return;
			const args = body.split(/ +/);
			const allOnChat = GoatBot.onChat || [];

			// ————— تشغيل أوامر onChat (كانت معطّلة بالكامل: rank / rankup / autoreact / badwords ...) —————
			for (const key of allOnChat) {
				const command = GoatBot.commands.get(key);
				if (!command || typeof command.onChat !== "function") continue;
				const commandName = command.config.name;
				const roleConfig = getRoleConfig(utils, command, isGroup, threadData, commandName);
				if (roleConfig.onChat > role) continue;
				const getText2 = createGetText2(langCode, `${process.cwd()}/languages/cmds/${langCode}.js`, prefix, command);
				createMessageSyntaxError(commandName);
				try {
					await command.onChat({ ...parameters, args, commandName, getLang: getText2 });
				}
				catch (err) {
					log.err("onChat", `An error occurred when calling the command onChat ${commandName}`, err);
				}
			}

			// ————— ألعاب المجموعة (مافيا / لعبة التخمين / MBTI) —————
			const aq = global.activeQuestions;
			if (aq && body) {
				for (const gameId in aq) {
					const game = aq[gameId];
					if (game.threadID === threadID && body.trim().toLowerCase() === game.answer.toLowerCase()) {
						clearTimeout(game.timer);
						const winnerData = await usersData.get(senderID);
						const stars = (winnerData?.data?.stars || 0) + (game.prize || game.totalHints * 2);
						await usersData.set(senderID, { ...winnerData, data: { ...winnerData.data, stars } });
						await message.reply(`🎉 | ${winnerData?.name || "لاعب"} ربح ${game.prize || game.totalHints * 2} ⭐! الإجابة: ${game.answer}`);
						delete aq[gameId];
						return;
					}
				}
			}

			const mg = activeGames[threadID];
			if (mg?.phase === "day" && body) {
				const bl = body.trim().toLowerCase();
				if ((bl === "vote" || bl === "صوت") && event.messageReply) {
					const tid = event.messageReply.senderID;
					if (mg.players.includes(senderID) && mg.players.includes(tid) && tid !== senderID) {
						if (!mg.votes) mg.votes = {};
						if (mg.votes[senderID]) return;
						mg.votes[senderID] = tid;
						await message.reply(`✅ | صوت (${Object.keys(mg.votes).length}/${mg.players.length})`);
					}
				}
			}
		}

		async function onAnyEvent() {
			const allOnAnyEvent = GoatBot.onAnyEvent || [];
			const args = typeof event.body == "string" ? event.body.split(/ +/) : [];
			for (const key of allOnAnyEvent) {
				if (typeof key !== "string") continue;
				const command = GoatBot.commands.get(key);
				if (!command || typeof command.onAnyEvent !== "function") continue;
				const commandName = command.config.name;
				const getText2 = createGetText2(langCode, `${process.cwd()}/languages/events/${langCode}.js`, prefix, command);
				try {
					await command.onAnyEvent({ ...parameters, args, commandName, getLang: getText2 });
				}
				catch (err) {
					log.err("onAnyEvent", `An error occurred when calling the command onAnyEvent ${commandName}`, err);
				}
			}
		}

		async function onFirstChat() {
			const allOnFirstChat = GoatBot.onFirstChat || [];
			const args = body ? body.split(/ +/) : [];
			for (const itemOnFirstChat of allOnFirstChat) {
				const { commandName, threadIDsChattedFirstTime } = itemOnFirstChat;
				if (threadIDsChattedFirstTime.includes(threadID)) continue;
				const command = GoatBot.commands.get(commandName);
				if (!command || typeof command.onFirstChat !== "function") continue;
				threadIDsChattedFirstTime.push(threadID);
				const getText2 = createGetText2(langCode, `${process.cwd()}/languages/cmds/${langCode}.js`, prefix, command);
				try {
					await command.onFirstChat({ ...parameters, args, commandName, getLang: getText2 });
				}
				catch (err) {
					log.err("onFirstChat", `An error occurred when calling the command onFirstChat ${commandName}`, err);
				}
			}
		}

		async function onReply() {
			if (!event.messageReply) return;
			const { onReply } = GoatBot;
			const Reply = onReply.get(event.messageReply.messageID);
			if (!Reply) return;
			Reply.delete = () => onReply.delete(messageID);
			const commandName = Reply.commandName;
			if (!commandName) {
				await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "cannotFindCommandName"));
				return log.err("onReply", `Can't find command name to execute this reply!`, Reply);
			}
			const command = GoatBot.commands.get(commandName);
			if (!command) {
				await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "cannotFindCommand", commandName));
				return log.err("onReply", `Command "${commandName}" not found`, Reply);
			}
			const roleConfig = getRoleConfig(utils, command, isGroup, threadData, commandName);
			if (roleConfig.onReply > role) {
				if (!hideNotiMessage.needRoleToUseCmdOnReply) {
					if (roleConfig.onReply == 1) return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "onlyAdminToUseOnReply", commandName));
					else if (roleConfig.onReply == 2) return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "onlyAdminBot2ToUseOnReply", commandName));
				}
				return;
			}
			const getText2 = createGetText2(langCode, `${process.cwd()}/languages/cmds/${langCode}.js`, prefix, command);
			const time = getTime("DD/MM/YYYY HH:mm:ss");
			createMessageSyntaxError(commandName);
			try {
				if (isBannedOrOnlyAdmin(userData, threadData, senderID, threadID, isGroup, commandName, message, langCode)) return;
				const args = body ? body.split(/ +/) : [];
				await command.onReply({ ...parameters, Reply, args, commandName, getLang: getText2 });
			}
			catch (err) {
				log.err("onReply", `An error occurred when calling the command onReply ${commandName}`, err);
				await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "errorOccurred3", time, commandName, shortenError(err)));
			}
		}

		async function onReaction() {
			const { onReaction } = GoatBot;
			const Reaction = onReaction.get(messageID);
			if (!Reaction) return;
			Reaction.delete = () => onReaction.delete(messageID);
			const commandName = Reaction.commandName;
			if (!commandName) {
				await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "cannotFindCommandName"));
				return log.err("onReaction", `Can't find command name to execute this reaction!`, Reaction);
			}
			const command = GoatBot.commands.get(commandName);
			if (!command) {
				await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "cannotFindCommand", commandName));
				return log.err("onReaction", `Command "${commandName}" not found`, Reaction);
			}
			const roleConfig = getRoleConfig(utils, command, isGroup, threadData, commandName);
			if (roleConfig.onReaction > role) {
				if (!hideNotiMessage.needRoleToUseCmdOnReaction) {
					if (roleConfig.onReaction == 1) return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "onlyAdminToUseOnReaction", commandName));
					else if (roleConfig.onReaction == 2) return await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "onlyAdminBot2ToUseOnReaction", commandName));
				}
				return;
			}
			const getText2 = createGetText2(langCode, `${process.cwd()}/languages/cmds/${langCode}.js`, prefix, command);
			const time = getTime("DD/MM/YYYY HH:mm:ss");
			createMessageSyntaxError(commandName);
			try {
				await command.onReaction({ ...parameters, Reaction, commandName, getLang: getText2 });
			}
			catch (err) {
				log.err("onReaction", `An error occurred when calling the command onReaction ${commandName}`, err);
				await message.reply(utils.getText({ lang: langCode, head: "handlerEvents" }, "errorOccurred4", time, commandName, shortenError(err)));
			}
		}

		// أوامر الأحداث: ترحيب / مغادرة / تولي مشرف / سجلات البوت ...
		async function handlerEvent() {
			const { author } = event;
			for (const [key, getEvent] of GoatBot.eventCommands.entries()) {
				if (!getEvent) continue;
				const commandName = getEvent.config.name;
				const getText2 = createGetText2(langCode, `${process.cwd()}/languages/events/${langCode}.js`, prefix, getEvent);
				const time = getTime("DD/MM/YYYY HH:mm:ss");
				try {
					const handler = await getEvent.onStart({ ...parameters, commandName, getLang: getText2 });
					if (typeof handler == "function") await handler();
				}
				catch (err) {
					log.err("EVENT COMMAND", `An error occurred when calling the command event ${commandName}`, err);
				}
			}
		}

		async function onEvent() {
			const allOnEvent = GoatBot.onEvent || [];
			const args = [];
			const { author } = event;
			for (const key of allOnEvent) {
				if (typeof key !== "string") continue;
				const command = GoatBot.commands.get(key);
				if (!command || typeof command.onEvent !== "function") continue;
				const commandName = command.config.name;
				const getText2 = createGetText2(langCode, `${process.cwd()}/languages/events/${langCode}.js`, prefix, command);
				createMessageSyntaxError(commandName);
				try {
					await command.onEvent({ ...parameters, args, commandName, getLang: getText2 });
				}
				catch (err) {
					log.err("onEvent", `An error occurred when calling the command onEvent ${commandName}`, err);
				}
			}
		}

		return {
			onStart, onChat,
			onReply,
			onReaction,
			onEvent,
			handlerEvent,
			onAnyEvent,
			onFirstChat,
			presence: async () => { },
			read_receipt: async () => { },
			typ: async () => { }
		};
	};
};
