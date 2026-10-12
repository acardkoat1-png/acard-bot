const fs = require("fs-extra");

module.exports = {
	config: {
		name: "jsontomongodb",
		aliases: ["jsontomongo"],
		version: "2.0",
		author: "Acard",
		countDown: 5,
		role: 2,
		description: { ar: "مزامنة البيانات من JSON إلى MongoDB" },
		category: "owner",
		guide: {
			ar: "   {pn} <thread | user | dashboard | global | all>: مزامنة البيانات من مجلد database/data إلى mongodb"
		}
	},

	langs: {
		ar: {
			invalidDatabase: "❌ يرجى تبديل قاعدة البيانات إلى mongodb في الإعدادات ثم إعادة تشغيل البوت",
			missingFile: "❌ لم تقم بنسخ ملف %1 إلى مجلد database/data",
			formatInvalid: "❌ تنسيق البيانات غير صالح",
			error: "❌ حدث خطأ:\n%1: %2",
			successThread: "✅ تمت مزامنة بيانات المجموعات بنجاح!",
			successUser: "✅ تمت مزامنة بيانات المستخدمين بنجاح!",
			successDashboard: "✅ تمت مزامنة بيانات لوحة التحكم بنجاح!",
			successGlobal: "✅ تمت مزامنة البيانات العامة بنجاح!"
		}
	},

	onStart: async function ({ args, message, threadModel, userModel, dashBoardModel, globalModel, getLang }) {
		if (global.GoatBot.config.database.type !== "mongodb")
			return message.reply(getLang("invalidDatabase"));

		switch (args[0]) {
			case "thread": return syncThreadData(message, threadModel, getLang);
			case "user": return syncUserData(message, userModel, getLang);
			case "dashboard": return syncDashBoardData(message, dashBoardModel, getLang);
			case "global": return syncGlobalData(message, globalModel, getLang);
			case "all": {
				await syncThreadData(message, threadModel, getLang);
				await syncUserData(message, userModel, getLang);
				await syncDashBoardData(message, dashBoardModel, getLang);
				await syncGlobalData(message, globalModel, getLang);
				return;
			}
			default: return message.SyntaxError();
		}
	}
};

async function syncThreadData(message, threadModel, getLang) {
	let oldThreadsData;
	const pathThreadData = `${process.cwd()}/database/data/threadsData.json`;
	if (!fs.existsSync(pathThreadData)) return message.reply(getLang("missingFile", pathThreadData.split("/").pop()));
	try { oldThreadsData = require(pathThreadData); delete require.cache[require.resolve(pathThreadData)]; }
	catch (err) { return message.reply(getLang("formatInvalid")); }
	try {
		const bulkOperations = [];
		for (const thread of oldThreadsData) {
			const threadIndex = global.db.allThreadData.findIndex(item => item.threadID == thread.threadID);
			if (threadIndex === -1) bulkOperations.push({ insertOne: { document: thread } });
			else bulkOperations.push({ updateOne: { filter: { threadID: thread.threadID }, update: thread } });
		}
		if (bulkOperations.length > 0) { await threadModel.bulkWrite(bulkOperations); global.db.allThreadData = await threadModel.find({}).lean(); }
		return message.reply(getLang("successThread"));
	} catch (err) { return message.reply(getLang("error", err.name, err.message)); }
}

async function syncUserData(message, userModel, getLang) {
	let oldUsersData;
	const pathUsersData = `${process.cwd()}/database/data/usersData.json`;
	if (!fs.existsSync(pathUsersData)) return message.reply(getLang("missingFile", pathUsersData.split("/").pop()));
	try { oldUsersData = require(pathUsersData); delete require.cache[require.resolve(pathUsersData)]; }
	catch (err) { return message.reply(getLang("formatInvalid")); }
	try {
		const bulkOperations = [];
		for (const user of oldUsersData) {
			const userIndex = global.db.allUserData.findIndex(item => item.userID == user.userID);
			if (userIndex === -1) bulkOperations.push({ insertOne: { document: user } });
			else bulkOperations.push({ updateOne: { filter: { userID: user.userID }, update: user } });
		}
		if (bulkOperations.length > 0) { await userModel.bulkWrite(bulkOperations); global.db.allUserData = await userModel.find({}).lean(); }
		return message.reply(getLang("successUser"));
	} catch (err) { return message.reply(getLang("error", err.name, err.message)); }
}

async function syncDashBoardData(message, dashBoardModel, getLang) {
	let oldDashBoardData;
	const pathDashBoardData = `${process.cwd()}/database/data/dashBoardData.json`;
	if (!fs.existsSync(pathDashBoardData)) return message.reply(getLang("missingFile", pathDashBoardData.split("/").pop()));
	try { oldDashBoardData = require(pathDashBoardData); delete require.cache[require.resolve(pathDashBoardData)]; }
	catch (err) { return message.reply(getLang("formatInvalid")); }
	try {
		const bulkOperations = [];
		for (const dashboard of oldDashBoardData) {
			const dashboardIndex = global.db.allDashBoardData.findIndex(item => item.email == dashboard.email);
			if (dashboardIndex === -1) bulkOperations.push({ insertOne: { document: dashboard } });
			else bulkOperations.push({ updateOne: { filter: { email: dashboard.email }, update: dashboard } });
		}
		if (bulkOperations.length > 0) { await dashBoardModel.bulkWrite(bulkOperations); global.db.allDashBoardData = await dashBoardModel.find({}).lean(); }
		return message.reply(getLang("successDashboard"));
	} catch (err) { return message.reply(getLang("error", err.name, err.message)); }
}

async function syncGlobalData(message, globalModel, getLang) {
	let oldGlobalData;
	const pathGlobalData = `${process.cwd()}/database/data/globalData.json`;
	if (!fs.existsSync(pathGlobalData)) return message.reply(getLang("missingFile", pathGlobalData.split("/").pop()));
	try { oldGlobalData = require(pathGlobalData); delete require.cache[require.resolve(pathGlobalData)]; }
	catch (err) { return message.reply(getLang("formatInvalid")); }
	try {
		const bulkOperations = [];
		for (const global_ of oldGlobalData) {
			const globalIndex = global.db.allGlobalData.findIndex(item => item.key == global_.key);
			if (globalIndex === -1) bulkOperations.push({ insertOne: { document: global_ } });
			else bulkOperations.push({ updateOne: { filter: { key: global_.key }, update: global_ } });
		}
		if (bulkOperations.length > 0) { await globalModel.bulkWrite(bulkOperations); global.db.allGlobalData = await globalModel.find({}).lean(); }
		return message.reply(getLang("successGlobal"));
	} catch (err) { return message.reply(getLang("error", err.name, err.message)); }
}
