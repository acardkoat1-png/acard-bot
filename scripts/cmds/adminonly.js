const fs = require("fs-extra");
const { config } = global.GoatBot;
const { client } = global;

module.exports = {
	config: {
		name: "adminonly",
		aliases: ["adonly", "onlyad", "onlyadmin"],
		version: "2.0",
		author: "Acard",
		countDown: 5,
		role: 1,
		description: {
			ar: "تشغيل/إيقاف وضع اقتصار استخدام البوت على المشرفين العامين فقط"
		},
		category: "owner",
		guide: {
			ar: "   {pn} [on | off]: تشغيل/إيقاف وضع المشرفين فقط"
				+ "\n   {pn} noti [on | off]: تشغيل/إيقاف الإشعار عند محاولة غير المشرفين استخدام البوت"
		}
	},

	langs: {
		ar: {
			turnedOn: "✅ تم تشغيل وضع المشرفين فقط - الآن المشرفون العامون فقط يمكنهم استخدام البوت",
			turnedOff: "✅ تم إيقاف وضع المشرفين فقط - الآن جميع المستخدمين يمكنهم استخدام البوت",
			turnedOnNoti: "✅ تم تشغيل الإشعار عند محاولة غير المشرفين استخدام البوت",
			turnedOffNoti: "✅ تم إيقاف الإشعار عند محاولة غير المشرفين استخدام البوت"
		}
	},

	onStart: function ({ args, message, getLang }) {
		let isSetNoti = false;
		let value;
		let indexGetVal = 0;

		if (args[0] == "noti") {
			isSetNoti = true;
			indexGetVal = 1;
		}

		if (args[indexGetVal] == "on")
			value = true;
		else if (args[indexGetVal] == "off")
			value = false;
		else
			return message.SyntaxError();

		if (isSetNoti) {
			config.hideNotiMessage.adminOnly = !value;
			message.reply(getLang(value ? "turnedOnNoti" : "turnedOffNoti"));
		}
		else {
			config.adminOnly.enable = value;
			message.reply(getLang(value ? "turnedOn" : "turnedOff"));
		}

		fs.writeFileSync(client.dirConfig, JSON.stringify(config, null, 2));
	}
};
