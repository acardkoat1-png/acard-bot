const checkUrlRegex = /https?:\/\/.*\.(?:png|jpg|jpeg|gif)/gi;
const regExColor = /#([0-9a-f]{6})|rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)|rgba\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3}),\s*(\d+\.?\d*)\)/gi;
const { uploadImgbb } = global.utils;

module.exports = {
	config: {
		name: "customrankcard",
		aliases: ["crc", "customrank"],
		version: "2.0",
		author: "Acard",
		countDown: 5,
		role: 0,
		description: {
			ar: "تصميم بطاقة الرتبة حسب رغبتك"
		},
		category: "rank",
		guide: {
			ar: {
				body: "   {pn} [maincolor | subcolor | linecolor | expbarcolor | progresscolor | alphasubcolor | textcolor | namecolor | expcolor | rankcolor | levelcolor | reset] <value>"
					+ "\n   حيث: "
					+ "\n  + maincolor | background <value>: الخلفية الرئيسية"
					+ "\n  + subcolor <value>: الخلفية الفرعية"
					+ "\n  + linecolor <value>: لون الخط الفاصل"
					+ "\n  + expbarcolor <value>: لون شريط الخبرة"
					+ "\n  + progresscolor <value>: لون الخبرة الحالية"
					+ "\n  + alphasubcolor <value>: شفافية الخلفية الفرعية (0 -> 1)"
					+ "\n  + textcolor <value>: لون النص"
					+ "\n  + namecolor <value>: لون الاسم"
					+ "\n  + expcolor <value>: لون الخبرة"
					+ "\n  + rankcolor <value>: لون الرتبة"
					+ "\n  + levelcolor <value>: لون المستوى"
					+ "\n    • <value> يمكن أن يكون كود لون hex, rgb, rgba, gradient أو رابط صورة"
					+ "\n   {pn} reset: إعادة جميع الإعدادات إلى الافتراضي"
			}
		}
	},

	langs: {
		ar: {
			invalidImage: "رابط الصورة غير صالح، يرجى اختيار رابط صورة مباشر (jpg, jpeg, png, gif)",
			invalidAttachment: "الملف المرفق ليس صورة",
			invalidColor: "كود اللون غير صالح، يرجى إدخال كود hex color أو rgba",
			notSupportImage: "رابط الصورة غير مدعوم مع الخيار \"%1\"",
			success: "تم حفظ تغييراتك، هذا عرض مسبق",
			reseted: "تم إعادة جميع الإعدادات إلى الافتراضي",
			invalidAlpha: "يرجى اختيار رقم من 0 -> 1"
		}
	},

	onStart: async function ({ message, threadsData, event, args, getLang, usersData, envCommands }) {
		if (!args[0])
			return message.SyntaxError();

		const customRankCard = await threadsData.get(event.threadID, "data.customRankCard", {});
		const key = args[0].toLowerCase();
		let value = args.slice(1).join(" ");

		const supportImage = ["maincolor", "background", "bg", "subcolor", "expbarcolor", "progresscolor", "linecolor"];
		const notSupportImage = ["textcolor", "namecolor", "expcolor", "rankcolor", "levelcolor", "lvcolor"];

		if ([...notSupportImage, ...supportImage].includes(key)) {
			const attachmentsReply = event.messageReply?.attachments;
			const attachments = [
				...event.attachments.filter(({ type }) => ["photo", "animated_image"].includes(type)),
				...attachmentsReply?.filter(({ type }) => ["photo", "animated_image"].includes(type)) || []
			];
			if (value == 'reset') {
			}
			else if (value.match(/^https?:\/\//)) {
				const matchUrl = value.match(checkUrlRegex);
				if (!matchUrl)
					return message.reply(getLang("invalidImage"));
				const infoFile = await uploadImgbb(matchUrl[0], 'url');
				value = infoFile.image.url;
			}
			else if (attachments.length > 0) {
				if (!["photo", "animated_image"].includes(attachments[0].type))
					return message.reply(getLang("invalidAttachment"));
				const url = attachments[0].url;
				const infoFile = await uploadImgbb(url, 'url');
				value = infoFile.image.url;
			}
			else {
				const colors = value.match(regExColor);
				if (!colors)
					return message.reply(getLang("invalidColor"));
				value = colors.length == 1 ? colors[0] : colors;
			}

			if (value != "reset" && notSupportImage.includes(key) && value.startsWith?.("http"))
				return message.reply(getLang("notSupportImage", key));

			switch (key) {
				case "maincolor":
				case "background":
				case "bg":
					value == "reset" ? delete customRankCard.main_color : customRankCard.main_color = value;
					break;
				case "subcolor":
					value == "reset" ? delete customRankCard.sub_color : customRankCard.sub_color = value;
					break;
				case "linecolor":
					value == "reset" ? delete customRankCard.line_color : customRankCard.line_color = value;
					break;
				case "progresscolor":
					value == "reset" ? delete customRankCard.exp_color : customRankCard.exp_color = value;
					break;
				case "expbarcolor":
					value == "reset" ? delete customRankCard.expNextLevel_color : customRankCard.expNextLevel_color = value;
					break;
				case "textcolor":
					value == "reset" ? delete customRankCard.text_color : customRankCard.text_color = value;
					break;
				case "namecolor":
					value == "reset" ? delete customRankCard.name_color : customRankCard.name_color = value;
					break;
				case "rankcolor":
					value == "reset" ? delete customRankCard.rank_color : customRankCard.rank_color = value;
					break;
				case "levelcolor":
				case "lvcolor":
					value == "reset" ? delete customRankCard.level_color : customRankCard.level_color = value;
					break;
				case "expcolor":
					value == "reset" ? delete customRankCard.exp_text_color : customRankCard.exp_text_color = value;
					break;
			}
			try {
				await threadsData.set(event.threadID, customRankCard, "data.customRankCard");
				message.reply({
					body: getLang("success"),
					attachment: await global.client.makeRankCard(event.senderID, usersData, threadsData, event.threadID, envCommands["rank"]?.deltaNext || 5)
						.then(stream => {
							stream.path = "rankcard.png";
							return stream;
						})
				});
			}
			catch (err) {
				message.err(err);
			}
		}
		else if (["alphasubcolor", "alphasubcard"].includes(key)) {
			if (parseFloat(value) < 0 && parseFloat(value) > 1)
				return message.reply(getLang("invalidAlpha"));
			customRankCard.alpha_subcard = parseFloat(value);
			try {
				await threadsData.set(event.threadID, customRankCard, "data.customRankCard");
				message.reply({
					body: getLang("success"),
					attachment: await global.client.makeRankCard(event.senderID, usersData, threadsData, event.threadID, envCommands["rank"]?.deltaNext || 5)
						.then(stream => {
							stream.path = "rankcard.png";
							return stream;
						})
				});
			}
			catch (err) {
				message.err(err);
			}
		}
		else if (key == "reset") {
			try {
				await threadsData.set(event.threadID, {}, "data.customRankCard");
				message.reply(getLang("reseted"));
			}
			catch (err) {
				message.err(err);
			}
		}
		else
			message.SyntaxError();
	}
};