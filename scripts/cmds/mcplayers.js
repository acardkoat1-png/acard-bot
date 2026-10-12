const axios = require("axios");

const MC_HOST = "In9ilab.aternos.me";
const MC_PORT = 19531;

module.exports = {
	config: {
		name: "mcplayers",
		aliases: ["mclist", "players"],
		version: "1.0",
		author: "Acard",
		countDown: 10,
		role: 0,
		description: { ar: "عرض قائمة اللاعبين المتصلين بالسيرفر" },
		category: "minecraft",
		guide: { ar: "{pn}" }
	},

	langs: {
		ar: {
			offline: "❌ السيرفر متوقف حالياً",
			noPlayers: "🏜️ لا يوجد لاعبون متصلون حالياً",
			header: "👥 اللاعبون المتصلون (%1/%2):\n",
			error: "❌ تعذّر الاتصال بالسيرفر"
		}
	},

	onStart: async function ({ message, getLang }) {
		try {
			const res = await axios.get(`https://api.mcsrvstat.us/3/${MC_HOST}:${MC_PORT}`, { timeout: 10000 });
			const data = res.data;

			if (!data.online) return message.reply(getLang("offline"));

			const online = data.players?.online ?? 0;
			const max = data.players?.max ?? 0;
			const list = data.players?.list || [];

			if (online === 0 || list.length === 0) {
				return message.reply(
					`${getLang("noPlayers")}\n\n👥 السيرفر يتسع لـ ${max} لاعب`
				);
			}

			const playerNames = list.map((p, i) => `${i + 1}. ${p.name}`).join("\n");
			return message.reply(
				getLang("header", online, max) + playerNames
			);
		} catch (e) {
			return message.reply(getLang("error"));
		}
	}
};
