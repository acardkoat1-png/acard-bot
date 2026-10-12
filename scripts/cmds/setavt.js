const axios = require("axios");

module.exports = {
	config: {
		name: "setavt",
		aliases: ["changeavt", "setavatar"],
		version: "2.0",
		author: "Acard",
		countDown: 5,
		role: 2,
		description: { ar: "تغيير صورة البوت" },
		category: "owner",
		guide: {
			ar: "   {pn} [<رابط صورة> | <رد على صورة>] [<تعليق>] [<مدة مؤقتة بالثواني>]"
		}
	},

	langs: {
		ar: {
			cannotGetImage: "❌ | حدث خطأ أثناء جلب الصورة",
			invalidImageFormat: "❌ | تنسيق الصورة غير صالح",
			changedAvatar: "✅ | تم تغيير صورة البوت بنجاح"
		}
	},

	onStart: async function ({ message, event, api, args, getLang }) {
		const imageURL = (args[0] || "").startsWith("http") ? args.shift() : event.attachments[0]?.url || event.messageReply?.attachments[0]?.url;
		const expirationAfter = !isNaN(args[args.length - 1]) ? args.pop() : null;
		const caption = args.join(" ");
		if (!imageURL) return message.SyntaxError();
		let response;
		try { response = (await axios.get(imageURL, { responseType: "stream" })); }
		catch (err) { return message.reply(getLang("cannotGetImage")); }
		if (!response.headers["content-type"].includes("image")) return message.reply(getLang("invalidImageFormat"));
		response.data.path = "avatar.jpg";

		api.changeAvatar(response.data, caption, expirationAfter ? expirationAfter * 1000 : null, (err) => {
			if (err) return message.err(err);
			return message.reply(getLang("changedAvatar"));
		});
	}
};