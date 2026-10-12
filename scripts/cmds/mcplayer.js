const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
	config: {
		name: "mcplayer",
		aliases: ["skin", "mcskin"],
		version: "1.0",
		author: "Acard",
		countDown: 10,
		role: 0,
		description: { ar: "عرض معلومات وسكن لاعب ماين كرافت" },
		category: "minecraft",
		guide: { ar: "{pn} <اسم اللاعب>" }
	},

	langs: {
		ar: {
			noName: "⚠️ يرجى كتابة اسم اللاعب\nمثال: /mcplayer Notch",
			notFound: "❌ اللاعب '%1' غير موجود أو الاسم خاطئ",
			info: "👤 معلومات اللاعب\n\n🎮 الاسم: %1\n🆔 UUID: %2\n\n🖼️ السكن:",
			error: "❌ حدث خطأ، حاول مرة أخرى"
		}
	},

	onStart: async function ({ message, args, getLang }) {
		const username = args[0];
		if (!username) return message.reply(getLang("noName"));

		try {
			const profileRes = await axios.get(`https://api.mojang.com/users/profiles/minecraft/${username}`, { timeout: 8000 });
			if (!profileRes.data || !profileRes.data.id) return message.reply(getLang("notFound", username));

			const uuid = profileRes.data.id;
			const name = profileRes.data.name;

			const skinUrl = `https://visage.surgeplay.com/full/512/${uuid}`;
			const skinRes = await axios.get(skinUrl, { responseType: "arraybuffer", timeout: 10000 });

			const tmpPath = path.join(__dirname, `../tmp/skin_${uuid}.png`);
			await fs.ensureDir(path.join(__dirname, "../tmp"));
			await fs.writeFile(tmpPath, skinRes.data);

			await message.reply({
				body: getLang("info", name, uuid),
				attachment: fs.createReadStream(tmpPath)
			});

			fs.remove(tmpPath).catch(() => {});
		} catch (e) {
			if (e.response && e.response.status === 404) return message.reply(getLang("notFound", username));
			return message.reply(getLang("error"));
		}
	}
};
