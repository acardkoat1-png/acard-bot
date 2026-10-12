const fs = require("fs-extra");
const { sequelize } = global.db;

module.exports = {
	config: {
		name: "jsontosqlite",
		version: "2.0",
		author: "Acard",
		countDown: 5,
		role: 2,
		description: { ar: "مزامنة البيانات من JSON إلى SQLite" },
		category: "owner",
		guide: {
			ar: "   {pn} <thread | user | dashboard | global | all>: مزامنة البيانات من مجلد database/data إلى sqlite"
		}
	},

	langs: {
		ar: {
			invalidDatabase: "❌ يرجى تبديل قاعدة البيانات إلى sqlite في الإعدادات ثم إعادة تشغيل البوت",
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
		if (global.GoatBot.config.database.type !== "sqlite") return message.reply(getLang("invalidDatabase"));
		switch (args[0]) {
			case "thread": return await syncThreadData(message, threadModel, getLang);
			case "user": return await syncUserData(message, userModel, getLang);
			case "dashboard": return await syncDashBoardData(message, dashBoardModel, getLang);
			case "global": return await syncGlobalData(message, globalModel, getLang);
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
		await sequelize.transaction(async (transaction) => {
			for (const thread of oldThreadsData) {
				const threadIndex = global.db.allThreadData.findIndex(item => item.threadID == thread.threadID);
				if (threadIndex === -1) await threadModel.create(thread, { transaction });
				else await threadModel.update(thread, { where: { threadID: thread.threadID }, transaction });
			}
		});
		const allThreadData = await threadModel.findAll();
		global.db.allThreadData = allThreadData.map(thread => thread.get({ plain: true }));
		return message.reply(getLang("successThread"));
	} catch (err) { return message.reply(getLang("error", err.name, err.message)); }
}

async function syncUserData(message, userModel, getLang) {
	let oldUsersData;
	const pathUserData = `${process.cwd()}/database/data/usersData.json`;
	if (!fs.existsSync(pathUserData)) return message.reply(getLang("missingFile", pathUserData.split("/").pop()));
	try { oldUsersData = require(pathUserData); delete require.cache[require.resolve(pathUserData)]; }
	catch (err) { return message.reply(getLang("formatInvalid")); }
	try {
		await sequelize.transaction(async (transaction) => {
			for (const user of oldUsersData) {
				const userIndex = global.db.allUserData.findIndex(item => item.userID == user.userID);
				if (userIndex === -1) await userModel.create(user, { transaction });
				else await userModel.update(user, { where: { userID: user.userID }, transaction });
			}
		});
		const allUserData = await userModel.findAll();
		global.db.allUserData = allUserData.map(user => user.get({ plain: true }));
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
		await sequelize.transaction(async (transaction) => {
			for (const dashboard of oldDashBoardData) {
				const dashboardIndex = global.db.dashBoardData.findIndex(item => item.email == dashboard.email);
				if (dashboardIndex === -1) await dashBoardModel.create(dashboard, { transaction });
				else await dashBoardModel.update(dashboard, { where: { email: dashboard.email }, transaction });
			}
		});
		const allDashBoardData = await dashBoardModel.findAll();
		global.db.dashBoardData = allDashBoardData.map(dashboard => dashboard.get({ plain: true }));
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
		await sequelize.transaction(async (transaction) => {
			for (const global_ of oldGlobalData) {
				const globalIndex = global.db.allGlobalData.findIndex(item => item.key == global_.key);
				if (globalIndex === -1) await globalModel.create(global_, { transaction });
				else await globalModel.update(global_, { where: { key: global_.key }, transaction });
			}
		});
		const allGlobalData = await globalModel.findAll();
		global.db.allGlobalData = allGlobalData.map(global_ => global_.get({ plain: true }));
		return message.reply(getLang("successGlobal"));
	} catch (err) { return message.reply(getLang("error", err.name, err.message)); }
}
