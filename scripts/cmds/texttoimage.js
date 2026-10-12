const { GoatBotApis } = global.utils;

module.exports = {
	config: {
		name: "texttoimage",
		aliases: ["midjourney", "openjourney", "text2image"],
		version: "2.0",
		author: "Acard",
		countDown: 5,
		role: 0,
		description: { ar: "إنشاء صورة من النص" },
		category: "info",
		guide: { ar: "   {pn} <وصف>: إنشاء صورة من وصفك" }
	},

	langs: {
		ar: {
			syntaxError: "⚠️ يرجى إدخال وصف",
			error: "❗ حدث خطأ، يرجى المحاولة لاحقاً:\n%1",
			serverError: "❗ الخادم مشغول، يرجى المحاولة لاحقاً",
			missingGoatApiKey: "❗ لم يتم تعيين apikey لـ GoatBot"
		}
	},

	onStart: async function ({ message, args, getLang, envGlobal }) {
		const goatBotApi = new GoatBotApis(envGlobal.goatbotApikey);
		if (!goatBotApi.isSetApiKey()) return message.reply(getLang("missingGoatApiKey"));
		const prompt = args.join(" ");
		if (!prompt) return message.reply(getLang("syntaxError"));

		try {
			const { data: imageStream } = await goatBotApi.api({
				url: "/image/mdjrny", method: "GET",
				params: { prompt, style_id: 28, aspect_ratio: "1:1" },
				responseType: "stream"
			});
			imageStream.path = "image.jpg";
			return message.reply({ attachment: imageStream });
		} catch (err) {
			return message.reply(getLang("error", err.data?.message || err.message));
		}
	}
};