const fs = require("fs-extra");

module.exports = {
	config: {
		name: "backupdata",
		version: "2.0",
		author: "Acard",
		countDown: 5,
		role: 2,
		description: {
			ar: "نسخ احتياطي لبيانات البوت (المجموعات، المستخدمين، لوحة التحكم، البيانات العامة)"
		},
		category: "owner",
		guide: {
			ar: "   {pn}"
		}
	},

	langs: {
		ar: {
			backedUp: "✅ تم عمل نسخة احتياطية لبيانات البوت في مجلد scripts/cmds/tmp"
		}
	},

	onStart: async function ({ message, getLang, threadsData, usersData, dashBoardData, globalData }) {
		const [globalDataBackup, threadsDataBackup, usersDataBackup, dashBoardDataBackup] = await Promise.all([
			globalData.getAll(),
			threadsData.getAll(),
			usersData.getAll(),
			dashBoardData.getAll()
		]);

		const pathThreads = `${__dirname}/tmp/threadsData.json`;
		const pathUsers = `${__dirname}/tmp/usersData.json`;
		const pathDashBoard = `${__dirname}/tmp/dashBoardData.json`;
		const pathGlobal = `${__dirname}/tmp/globalData.json`;

		fs.writeFileSync(pathThreads, JSON.stringify(threadsDataBackup, null, 2));
		fs.writeFileSync(pathUsers, JSON.stringify(usersDataBackup, null, 2));
		fs.writeFileSync(pathDashBoard, JSON.stringify(dashBoardDataBackup, null, 2));
		fs.writeFileSync(pathGlobal, JSON.stringify(globalDataBackup, null, 2));

		message.reply({
			body: getLang("backedUp"),
			attachment: [
				fs.createReadStream(pathThreads),
				fs.createReadStream(pathUsers),
				fs.createReadStream(pathDashBoard),
				fs.createReadStream(pathGlobal)
			]
		});
	}
};