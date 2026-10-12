const axios = require("axios");

module.exports = {
	config: {
		name: "youai",
		aliases: ["you", "youchat", "ai", "gpt", "gemini"],
		version: "2.0",
		author: "Acard",
		countDown: 5,
		role: 0,
		shortDescription: "محادثة مع You AI",
		longDescription: "أرسل رسالة واحصل على رد ذكي مع أسئلة ذات صلة",
		category: "ai",
		guide: {
			ar: "{pn} <رسالتك>"
		}
	},

	langs: {
		ar: {
			noInput: "⚠️ يرجى كتابة شيء للسؤال.",
			loading: "🧠 جارٍ التفكير...",
			error: "❌ فشل الحصول على رد من You AI."
		}
	},

	onStart: async function ({ message, args, getLang }) {
		const input = args.join(" ");
		if (!input) return message.reply(getLang("noInput"));

		message.reply(getLang("loading"));

		try {
			const apiUrl = `https://betadash-api-swordslush-production.up.railway.app/you?chat=${encodeURIComponent(input)}`;
			const res = await axios.get(apiUrl);

			const data = res.data;
			if (!data || !data.response) return message.reply(getLang("error"));

			const related = data.relatedSearch?.length
				? "\n\n💡 ذات صلة:\n" + data.relatedSearch.map((r, i) => `• ${r}`).join("\n")
				: "";

			return message.reply(`🧠 ${data.response}${related}`);
		} catch (err) {
			console.error("خطأ YouAI:", err.message || err);
			return message.reply(getLang("error"));
		}
	}
};
