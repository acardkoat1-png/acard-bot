const fs = require("fs-extra");
const nullAndUndefined = [undefined, null];
const activeGames = {};

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
	for (const key of ["onChat", "onStart", "onReaction", "onReply"]) { if (roleConfig[key] == undefined) roleConfig[key] = roleConfig.onStart; }
	return roleConfig;
}

function isBannedOrOnlyAdmin(userData, threadData, senderID, threadID, isGroup, commandName, message, lang) {
	const config = global.GoatBot.config;
	const { adminBot, hideNotiMessage } = config;
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
	const commandType = command.config.countDown ? "command" : "command event";
	const commandName = command.config.name;
	let customLang = {};
	let getText2 = () => { };
	if (fs.existsSync(pathCustomLang)) customLang = require(pathCustomLang)[commandName]?.text || {};
	if (command.langs || customLang || {}) {
		getText2 = function (key, ...args) {
			let lang = command.langs?.[langCode]?.[key] || customLang[key] || "";
			lang = replaceShortcutInLang(lang, prefix, commandName);
			for (let i = args.length - 1; i >= 0; i--) lang = lang.replace(new RegExp(`%${i + 1}`, "g"), args[i]);
			return lang || `❌ Can't find text`;
		};
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
				} catch (e) {}
			})();

			const blacklist = await threadsData.get(threadID, "data.blacklist", []);
			if (blacklist.includes(senderID)) return;

			const slowmodeCmd = GoatBot.commands.get("slowmode");
			if (slowmodeCmd && slowmodeCmd.checkCooldown) {
				const blocked = slowmodeCmd.checkCooldown({
					senderID, threadID, message,
					getLang: (key, ...a) => { let lang = slowmodeCmd.langs?.ar?.[key] || ""; for (let i = a.length - 1; i >= 0; i--) lang = lang.replace(new RegExp(`%${i + 1}`, "g"), a[i]); return lang; }
				});
				if (blocked) return;
			}

			if (isBannedOrOnlyAdmin(userData, threadData, senderID, threadID, isGroup, commandName, message, langCode)) return;
			if (!command) return;
			
			const roleConfig = getRoleConfig(utils, command, isGroup, threadData, commandName);
			if (roleConfig.onStart > role) return;
			if (!client.countDown[commandName]) client.countDown[commandName] = {};
			const timestamps = client.countDown[commandName];
			let getCoolDown = command.config.countDown || 1;
			if (timestamps[senderID] && dateNow < timestamps[senderID] + getCoolDown * 1000) return;
			try {
				const getText2 = createGetText2(langCode, `${process.cwd()}/languages/cmds/${langCode}.js`, prefix, command);
				await command.onStart({ ...parameters, args, commandName, getLang: getText2 });
				timestamps[senderID] = dateNow;
			} catch (err) {}
		}

		async function onChat() {
			// ✅ فحص الإجابات للعبة Q
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

			// ✅ دعم /hint
			if (body?.trim().toLowerCase() === "/hint" || body?.trim().toLowerCase() === "hint") {
				const qCmd = GoatBot.commands.get("q");
				if (qCmd?.onChat) await qCmd.onChat({ event, message, api, usersData });
			}

			// ✅ المافيا
			const mg = activeGames[threadID];
			if (mg?.phase === "day" && body) {
				const bl = body.trim().toLowerCase();
				if ((bl === "vote" || bl === "صوت") && event.messageReply) {
					const tid = event.messageReply.senderID;
					if (mg.players.includes(senderID) && mg.players.includes(tid) && tid !== senderID) {
						if (!mg.votes) mg.votes = {};
						mg.votes[senderID] = tid;
						await message.reply(`✅ | صوت (${Object.keys(mg.votes).length}/${mg.players.length})`);
					}
				}
			}

			// ✅ MBTI
			if (body && global.activeMBTITests?.[senderID]) {
				const ans = body.trim().toUpperCase();
				if (ans === "A" || ans === "B") {
					const mbtiCmd = GoatBot.commands.get("MBTI") || GoatBot.commands.get("شخصية");
					if (mbtiCmd?.onChat) await mbtiCmd.onChat({ event, message, api, usersData });
				}
			}
		}

		return {
			onStart, onChat,
			onReply: async () => {},
			onReaction: async () => {},
			onEvent: async () => {},
			handlerEvent: async () => {},
			onAnyEvent: async () => {},
			onFirstChat: async () => {},
			presence: async () => {},
			read_receipt: async () => {},
			typ: async () => {}
		};
	};
};