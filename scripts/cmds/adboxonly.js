module.exports = {
	config: {
		name: "onlyadminbox",
		aliases: ["onlyadbox", "adboxonly", "adminboxonly"],
		version: "2.0",
		author: "Acard",
		countDown: 5,
		role: 2,
		description: {
			ar: "تشغيل/إيقاف وضع اقتصار استخدام البوت على مشرفي المجموعة فقط"
		},
		category: "box chat",
		guide: {
			ar: "   {pn} [on | off]: تشغيل/إيقاف وضع اقتصار استخدام البوت على المشرفين فقط"
				+ "\n   {pn} noti [on | off]: تشغيل/إيقاف الإشعار عند محاولة عضو عادي استخدام البوت"
		}
	},

	langs: {
		ar: {
			turnedOn: "✅ تم تفعيل وضع المشرفين فقط - الآن المشرفون فقط يمكنهم استخدام البوت",
			turnedOff: "✅ تم إلغاء وضع المشرفين فقط - الآن جميع الأعضاء يمكنهم استخدام البوت",
			turnedOnNoti: "✅ تم تفعيل الإشعار عند محاولة الأعضاء العاديين استخدام البوت",
			turnedOffNoti: "✅ تم إيقاف الإشعار عند محاولة الأعضاء العاديين استخدام البوت",
			syntaxError: "⚠️ خطأ في الصيغة. استخدم {pn} on أو {pn} off"
		}
	},

	onStart: async function ({ args, message, event, threadsData, getLang }) {
		let isSetNoti = false;
		let value;
		let keySetData = "data.onlyAdminBox";
		let indexGetVal = 0;

		if (args[0] == "noti") {
			isSetNoti = true;
			indexGetVal = 1;
			keySetData = "data.hideNotiMessageOnlyAdminBox";
		}

		if (args[indexGetVal] == "on")
			value = true;
		else if (args[indexGetVal] == "off")
			value = false;
		else
			return message.reply(getLang("syntaxError"));

		await threadsData.set(event.threadID, isSetNoti ? !value : value, keySetData);

		if (isSetNoti)
			return message.reply(value ? getLang("turnedOnNoti") : getLang("turnedOffNoti"));
		else
			return message.reply(value ? getLang("turnedOn") : getLang("turnedOff"));
	}
};