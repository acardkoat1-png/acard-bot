function checkShortCut(nickname, uid, userName) {
	/\{userName\}/gi.test(nickname) ? nickname = nickname.replace(/\{userName\}/gi, userName) : null;
	/\{userID\}/gi.test(uid) ? nickname = nickname.replace(/\{userID\}/gi, uid) : null;
	return nickname;
}

module.exports = {
	config: {
		name: "autosetname",
		version: "2.0",
		author: "Acard",
		cooldowns: 5,
		role: 1,
		description: {
			ar: "تغيير تلقائي للاسم المستعار للأعضاء الجدد"
		},
		category: "box chat",
		guide: {
			ar: '   {pn} set <الاسم المستعار>: لتعيين التكوين لتغيير الاسم المستعار تلقائياً، مع الاختصارات المتاحة:'
				+ '\n   + {userName}: اسم العضو المنضم'
				+ '\n   + {userID}: معرف العضو'
				+ '\n   مثال:'
				+ '\n    {pn} set {userName} 🚀'
				+ '\n\n   {pn} [on | off]: لتشغيل/إيقاف هذه الميزة'
				+ '\n\n   {pn} [view | info]: عرض التكوين الحالي'
		}
	},

	langs: {
		ar: {
			missingConfig: "⚠️ يرجى إدخال التكوين المطلوب",
			configSuccess: "✅ تم تعيين التكوين بنجاح",
			currentConfig: "التكوين الحالي لـ autoSetName في مجموعتك هو:\n%1",
			notSetConfig: "⚠️ لم يتم تعيين تكوين autoSetName في مجموعتك بعد",
			syntaxError: "⚠️ خطأ في الصيغة، استخدم \"{pn} on\" أو \"{pn} off\" فقط",
			turnOnSuccess: "✅ تم تشغيل ميزة autoSetName",
			turnOffSuccess: "✅ تم إيقاف ميزة autoSetName",
			error: "❌ حدث خطأ أثناء استخدام ميزة autoSetName، جرب إيقاف رابط الدعوة في المجموعة ثم حاول مرة أخرى"
		}
	},

	onStart: async function ({ message, event, args, threadsData, getLang }) {
		switch (args[0]) {
			case "set":
			case "add":
			case "config": {
				if (args.length < 2)
					return message.reply(getLang("missingConfig"));
				const configAutoSetName = args.slice(1).join(" ");
				await threadsData.set(event.threadID, configAutoSetName, "data.autoSetName");
				return message.reply(getLang("configSuccess"));
			}
			case "view":
			case "info": {
				const configAutoSetName = await threadsData.get(event.threadID, "data.autoSetName");
				return message.reply(configAutoSetName ? getLang("currentConfig", configAutoSetName) : getLang("notSetConfig"));
			}
			default: {
				const enableOrDisable = args[0];
				if (enableOrDisable !== "on" && enableOrDisable !== "off")
					return message.reply(getLang("syntaxError"));
				await threadsData.set(event.threadID, enableOrDisable === "on", "settings.enableAutoSetName");
				return message.reply(enableOrDisable == "on" ? getLang("turnOnSuccess") : getLang("turnOffSuccess"));
			}
		}
	},

	onEvent: async ({ message, event, api, threadsData, getLang }) => {
		if (event.logMessageType !== "log:subscribe")
			return;
		if (!await threadsData.get(event.threadID, "settings.enableAutoSetName"))
			return;
		const configAutoSetName = await threadsData.get(event.threadID, "data.autoSetName");

		return async function () {
			const addedParticipants = [...event.logMessageData.addedParticipants];

			for (const user of addedParticipants) {
				const { userFbId: uid, fullName: userName } = user;
				try {
					await api.changeNickname(checkShortCut(configAutoSetName, uid, userName), event.threadID, uid);
				}
				catch (e) {
					return message.reply(getLang("error"));
				}
			}
		};
	}
};