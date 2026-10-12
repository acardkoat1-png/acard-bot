const itunes = require("searchitunes");
const { getStreamFromURL } = global.utils;

module.exports = {
	config: {
		name: "appstore",
		version: "2.0",
		author: "Acard",
		countDown: 5,
		role: 0,
		description: {
			ar: "البحث عن تطبيق في متجر أبل"
		},
		category: "software",
		guide: "   {pn}: <كلمة البحث>"
			+ "\n   - مثال:"
			+ "\n   {pn} PUBG",
		envConfig: {
			limitResult: 3
		}
	},

	langs: {
		ar: {
			missingKeyword: "⚠️ لم تقم بإدخال كلمة البحث",
			noResult: "❌ لا توجد نتائج للكلمة %1"
		}
	},

	onStart: async function ({ message, args, commandName, envCommands, getLang }) {
		if (!args[0])
			return message.reply(getLang("missingKeyword"));
		let results = [];
		try {
			results = (await itunes({
				entity: "software",
				country: "VN",
				term: args.join(" "),
				limit: envCommands[commandName].limitResult
			})).results;
		}
		catch (err) {
			return message.reply(getLang("noResult", args.join(" ")));
		}

		if (results.length > 0) {
			let msg = "";
			const pedningImages = [];
			for (const result of results) {
				msg += `\n\n- ${result.trackCensoredName} من ${result.artistName}، ${result.formattedPrice} والتقييم ${"🌟".repeat(result.averageUserRating)} (${result.averageUserRating.toFixed(1)}/5)`
					+ `\n- ${result.trackViewUrl}`;
				pedningImages.push(await getStreamFromURL(result.artworkUrl512 || result.artworkUrl100 || result.artworkUrl60));
			}
			message.reply({
				body: msg,
				attachment: await Promise.all(pedningImages)
			});
		}
		else {
			message.reply(getLang("noResult", args.join(" ")));
		}
	}
};