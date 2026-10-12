const axios = require("axios");

const MC_HOST = "In9ilab.aternos.me";
const MC_PORT = 19531;

module.exports = {
	config: {
		name: "mcstatus",
		aliases: ["mc", "server"],
		version: "1.0",
		author: "Acard",
		countDown: 10,
		role: 0,
		description: { ar: "عرض حالة سيرفر ماين كرافت" },
		category: "minecraft",
		guide: { ar: "{pn}" }
	},

	langs: {
		ar: {
			online: "✅ السيرفر شغّال",
			offline: "❌ السيرفر متوقف",
			players: "👥 اللاعبين: %1 / %2",
			version: "🎮 الإصدار: %1",
			latency: "📶 البينج: %1ms",
			ip: "🌐 الآيبي: %1",
			port: "🔌 البورت: %2",
			error: "❌ تعذّر الاتصال بالسيرفر"
		}
	},

	onStart: async function ({ message, getLang }) {
		try {
			const res = await axios.get(`https://api.mcsrvstat.us/3/${MC_HOST}:${MC_PORT}`, { timeout: 10000 });
			const data = res.data;

			if (!data.online) {
				return message.reply(
					`${getLang("offline")}\n\n${getLang("ip", MC_HOST, MC_PORT)}\n🔌 البورت: ${MC_PORT}`
				);
			}

			const online = data.players?.online ?? 0;
			const max = data.players?.max ?? 0;
			const version = data.version || "غير معروف";
			const latency = data.debug?.ping ?? "—";

			return message.reply(
				`${getLang("online")}\n\n` +
				`${getLang("players", online, max)}\n` +
				`${getLang("version", version)}\n` +
				`${getLang("latency", latency)}\n` +
				`${getLang("ip", MC_HOST, MC_PORT)}\n` +
				`🔌 البورت: ${MC_PORT}`
			);
		} catch (e) {
			return message.reply(getLang("error"));
		}
	}
};
