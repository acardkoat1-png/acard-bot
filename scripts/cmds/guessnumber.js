const { randomString, getTime, convertTime } = global.utils;
const { createCanvas } = require('canvas');
const rows = [
	{ col: 4, row: 10, rewardPoint: 1 },
	{ col: 5, row: 12, rewardPoint: 2 },
	{ col: 6, row: 15, rewardPoint: 3 }
];

module.exports = {
	config: {
		name: "guessnumber",
		aliases: ["guessnum"],
		version: "2.0",
		author: "Acard",
		countDown: 5,
		role: 0,
		description: { ar: "لعبة تخمين الرقم" },
		category: "game",
		guide: {
			ar: "  {pn} [4 | 5 | 6] [single | multi]: إنشاء لعبة جديدة"
				+ "\n   {pn} rank <صفحة>: عرض الترتيب"
				+ "\n   {pn} info [<uid> | <@tag> | <رد>]: عرض معلومات الترتيب"
				+ "\n   {pn} reset: إعادة تعيين الترتيب (للمشرفين فقط)"
		}
	},

	langs: {
		ar: {
			charts: "🏆 | الترتيب:\n%1",
			pageInfo: "صفحة %1/%2",
			noScore: "⭕ | لا يوجد أي لاعب سجل نقاطاً بعد.",
			noPermissionReset: "⚠️ | لا تملك صلاحية إعادة تعيين الترتيب.",
			notFoundUser: "⚠️ | لم يتم العثور على مستخدم بمعرف %1 في الترتيب.",
			userRankInfo: "🏆 | معلومات الترتيب:\nالاسم: %1\nالنقاط: %2\nعدد مرات اللعب: %3\nعدد مرات الفوز: %4\n%5\nعدد مرات الخسارة: %6\nنسبة الفوز: %7%\nإجمالي وقت اللعب: %8",
			digits: "%1 أرقام: %2",
			resetRankSuccess: "✅ | تم إعادة تعيين الترتيب بنجاح.",
			invalidCol: "⚠️ | يرجى إدخال عدد أرقام 4 أو 5 أو 6",
			invalidMode: "⚠️ | يرجى إدخال وضع اللعب single أو multi",
			created: "✅ | تم إنشاء اللعبة بنجاح.",
			gameName: "لعبة تخمين الرقم",
			gameGuide: "⏳ | طريقة اللعب:\nلديك %1 محاولة.\nبعد كل محاولة ستحصل على تلميحات.",
			gameNote: "📄 | ملاحظة:\nالرقم مكون من أرقام من 0 إلى 9، كل رقم يظهر مرة واحدة فقط.",
			replyToPlayGame: "🎮 | قم بالرد على هذه الرسالة مع %1 أرقام للتخمين.",
			invalidNumbers: "⚠️ | يرجى إدخال %1 أرقام للتخمين",
			win: "🎉 | مبروك! لقد خمنت الرقم %1 بعد %2 محاولة وحصلت على %3 نقاط.",
			loss: "🤦‍♂️ | لقد خسرت، الرقم الصحيح هو %1."
		}
	},

	onStart: async function ({ message, event, getLang, commandName, args, globalData, usersData, role }) {
		if (args[0] == "rank") {
			const rankGuessNumber = await globalData.get("rankGuessNumber", "data", []);
			if (!rankGuessNumber.length) return message.reply(getLang("noScore"));
			const page = parseInt(args[1]) || 1;
			const maxUserOnePage = 30;
			let rankGuessNumberHandle = await Promise.all(rankGuessNumber.slice((page - 1) * maxUserOnePage, page * maxUserOnePage).map(async item => {
				const userName = await usersData.getName(item.id);
				return { ...item, userName, winNumber: item.wins?.length || 0, lossNumber: item.losses?.length || 0 };
			}));
			rankGuessNumberHandle = rankGuessNumberHandle.sort((a, b) => b.winNumber - a.winNumber);
			const medals = ["🥇", "🥈", "🥉"];
			const rankGuessNumberText = rankGuessNumberHandle.map((item, index) => {
				const medal = medals[index] || index + 1;
				return `${medal} ${item.userName} - ${item.winNumber} فوز - ${item.lossNumber} خسارة`;
			}).join("\n");
			return message.reply(getLang("charts", rankGuessNumberText || getLang("noScore")) + "\n" + getLang("pageInfo", page, Math.ceil(rankGuessNumber.length / maxUserOnePage)));
		}
		else if (args[0] == "info") {
			const rankGuessNumber = await globalData.get("rankGuessNumber", "data", []);
			let targetID;
			if (Object.keys(event.mentions).length) targetID = Object.keys(event.mentions)[0];
			else if (event.messageReply) targetID = event.messageReply.senderID;
			else if (!isNaN(args[1])) targetID = args[1];
			else targetID = event.senderID;
			const userDataGuessNumber = rankGuessNumber.find(item => item.id == targetID);
			if (!userDataGuessNumber) return message.reply(getLang("notFoundUser", targetID));
			const userName = await usersData.getName(targetID);
			const pointsReceived = userDataGuessNumber.points;
			const winNumber = userDataGuessNumber.wins?.length || 0;
			const playNumber = winNumber + (userDataGuessNumber.losses?.length || 0);
			const lossNumber = userDataGuessNumber.losses?.length || 0;
			const winRate = (winNumber / playNumber * 100).toFixed(2);
			const winInfo = {};
			for (const item of userDataGuessNumber.wins || []) winInfo[item.col] = winInfo[item.col] ? winInfo[item.col] + 1 : 1;
			const playTime = convertTime(userDataGuessNumber.wins.reduce((a, b) => a + b.timeSuccess, 0) + userDataGuessNumber.losses.reduce((a, b) => a + b.timeSuccess, 0));
			return message.reply(getLang("userRankInfo", userName, pointsReceived, playNumber, winNumber, Object.keys(winInfo).map(item => `  + ${getLang("digits", item, winInfo[item])}`).join("\n"), lossNumber, winRate, playTime));
		}
		else if (args[0] == "reset") {
			if (role < 2) return message.reply(getLang("noPermissionReset"));
			await globalData.set("rankGuessNumber", [], "data");
			return message.reply(getLang("resetRankSuccess"));
		}

		const col = parseInt(args.join(" ").match(/(\d+)/)?.[1] || 4);
		const levelOfDifficult = rows.find(item => item.col == col);
		if (!levelOfDifficult) return message.reply(getLang("invalidCol"));
		const mode = args.join(" ").match(/(single|multi|-s|-m)/)?.[1] || "single";
		const row = levelOfDifficult.row || 10;

		const options = {
			col, row,
			timeStart: parseInt(getTime("x")),
			numbers: [], tryNumber: 0, ctx: null, canvas: null,
			answer: randomString(col, true, "0123456789"),
			gameName: getLang("gameName"),
			gameGuide: getLang("gameGuide", row),
			gameNote: getLang("gameNote")
		};

		const gameData = guessNumberGame(options);
		gameData.mode = mode;
		const messageData = message.reply(`${getLang("created")}\n\n${getLang("gameGuide", row)}\n\n${getLang("gameNote")}\n\n${getLang("replyToPlayGame", col)}`);
		gameData.messageData = messageData;

		message.reply({ attachment: gameData.imageStream }, (err, info) => {
			global.GoatBot.onReply.set(info.messageID, { commandName, messageID: info.messageID, author: event.senderID, gameData });
		});
	},

	onReply: async ({ message, Reply, event, getLang, commandName, globalData }) => {
		const { gameData: oldGameData } = Reply;
		if (event.senderID != Reply.author && oldGameData.mode == "single") return;
		const numbers = (event.body || "").split("").map(item => item.trim()).filter(item => item != "" && !isNaN(item));
		if (numbers.length != oldGameData.col) return message.reply(getLang("invalidNumbers", oldGameData.col));
		global.GoatBot.onReply.delete(Reply.messageID);
		oldGameData.numbers = numbers;
		const gameData = guessNumberGame(oldGameData);
		if (gameData.isWin == null) {
			message.reply({ attachment: gameData.imageStream }, (err, info) => {
				message.unsend(Reply.messageID);
				global.GoatBot.onReply.set(info.messageID, { commandName, messageID: info.messageID, author: event.senderID, gameData });
			});
		} else {
			const rankGuessNumber = await globalData.get("rankGuessNumber", "data", []);
			const rewardPoint = rows.find(item => item.col == gameData.col)?.rewardPoint || 0;
			const messageText = gameData.isWin ? getLang("win", gameData.answer, gameData.tryNumber - 1, rewardPoint) : getLang("loss", gameData.answer);
			message.unsend((await oldGameData.messageData).messageID);
			message.unsend(Reply.messageID);
			message.reply({ body: messageText, attachment: gameData.imageStream });

			if (gameData.isWin != null) {
				const userIndex = rankGuessNumber.findIndex(item => item.id == event.senderID);
				const data = { tryNumber: gameData.tryNumber - 1, timeSuccess: parseInt(getTime("x") - oldGameData.timeStart), date: getTime(), col: gameData.col };
				if (gameData.isWin == true) {
					if (userIndex == -1) rankGuessNumber.push({ id: event.senderID, wins: [data], losses: [], points: rewardPoint });
					else { rankGuessNumber[userIndex].wins.push(data); rankGuessNumber[userIndex].points += rewardPoint; }
				} else {
					delete data.tryNumber;
					if (userIndex == -1) rankGuessNumber.push({ id: event.senderID, wins: [], losses: [data], points: 0 });
					else rankGuessNumber[userIndex].losses.push(data);
				}
				await globalData.set("rankGuessNumber", rankGuessNumber, "data");
			}
		}
	}
};

// (الدوال المساعدة guessNumberGame, wrapText, drawBorderSquareRadius إلخ تبقى كما هي دون تغيير)
