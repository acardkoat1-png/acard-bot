const { getPrboxx } = global.utils;

module.exports = {
	config: {
		name: "rules",
		version: "2.0",
		author: "Acard",
		countDown: 5,
		role: 0,
		description: { ar: "إنشاء/عرض/إضافة/تعديل/حذف قوانين مجموعتك" },
		category: "box chat",
		guide: {
			ar: "   {pn} [add | -a] <القانون>: إضافة قانون"
				+ "\n   {pn}: عرض القوانين"
				+ "\n   {pn} [edit | -e] <رقم> <المحتوى>: تعديل قانون"
				+ "\n   {pn} [move | -m] <رقم1> <رقم2>: تبديل موقع قانونين"
				+ "\n   {pn} [delete | -d] <رقم>: حذف قانون"
				+ "\n   {pn} [remove | -r]: حذف جميع القوانين"
		}
	},

	langs: {
		ar: {
			yourRules: "📜 قوانين مجموعتك\n%1",
			noRules: "📜 لا توجد قوانين في مجموعتك بعد. أضف قوانين باستخدام `%1rules add`",
			noPermissionAdd: "⚠️ المشرفون فقط يمكنهم إضافة القوانين",
			noContent: "⚠️ يرجى إدخال نص القانون",
			success: "✅ تمت إضافة القانون بنجاح",
			noPermissionEdit: "⚠️ المشرفون فقط يمكنهم تعديل القوانين",
			invalidNumber: "⚠️ يرجى إدخال رقم صحيح",
			rulesNotExist: "❌ القانون رقم %1 غير موجود",
			numberRules: "📜 المجموعة لديها %1 قوانين فقط",
			noContentEdit: "⚠️ يرجى إدخال المحتوى الجديد للقانون %1",
			successEdit: "✅ تم تعديل القانون %1 إلى: %2",
			noPermissionMove: "⚠️ المشرفون فقط يمكنهم تبديل مواقع القوانين",
			invalidNumberMove: "⚠️ يرجى إدخال رقمي قانونين للتبديل",
			sameNumberMove: "⚠️ لا يمكن تبديل نفس القانون",
			rulesNotExistMove2: "❌ القانون %1 و %2 غير موجودين",
			successMove: "✅ تم تبديل القانونين %1 و %2",
			noPermissionDelete: "⚠️ المشرفون فقط يمكنهم حذف القوانين",
			invalidNumberDelete: "⚠️ يرجى إدخال رقم القانون للحذف",
			rulesNotExistDelete: "❌ القانون رقم %1 غير موجود",
			successDelete: "✅ تم حذف القانون %1: %2",
			noPermissionRemove: "⚠️ المشرفون فقط يمكنهم حذف جميع القوانين",
			confirmRemove: "⚠️ تفاعل مع هذه الرسالة لتأكيد حذف جميع القوانين",
			successRemove: "✅ تم حذف جميع القوانين بنجاح"
		}
	},

	onStart: async function ({ role, args, message, event, threadsData, getLang, commandName }) {
		const { threadID, senderID } = event;
		const type = args[0];
		const rulesOfThread = await threadsData.get(threadID, "data.rules", []);
		const totalRules = rulesOfThread.length;

		if (!type) {
			let i = 1;
			const msg = rulesOfThread.reduce((text, rules) => text += `${i++}. ${rules}\n`, "");
			message.reply(msg ? getLang("yourRules", msg) : getLang("noRules", getPrefix(threadID)), (err, info) => {
				global.GoatBot.onReply.set(info.messageID, { commandName, author: senderID, rulesOfThread, messageID: info.messageID });
			});
		}
		else if (["add", "-a"].includes(type)) {
			if (role < 1) return message.reply(getLang("noPermissionAdd"));
			if (!args[1]) return message.reply(getLang("noContent"));
			rulesOfThread.push(args.slice(1).join(" "));
			try { await threadsData.set(threadID, rulesOfThread, "data.rules"); message.reply(getLang("success")); }
			catch (err) { message.err(err); }
		}
		else if (["edit", "-e"].includes(type)) {
			if (role < 1) return message.reply(getLang("noPermissionEdit"));
			const stt = parseInt(args[1]);
			if (isNaN(stt)) return message.reply(getLang("invalidNumber"));
			if (!rulesOfThread[stt - 1]) return message.reply(`${getLang("rulesNotExist", stt)}, ${totalRules == 0 ? getLang("noRules") : getLang("numberRules", totalRules)}`);
			if (!args[2]) return message.reply(getLang("noContentEdit", stt));
			const newContent = args.slice(2).join(" ");
			rulesOfThread[stt - 1] = newContent;
			try { await threadsData.set(threadID, rulesOfThread, "data.rules"); message.reply(getLang("successEdit", stt, newContent)); }
			catch (err) { message.err(err); }
		}
		else if (["move", "-m"].includes(type)) {
			if (role < 1) return message.reply(getLang("noPermissionMove"));
			const num1 = parseInt(args[1]), num2 = parseInt(args[2]);
			if (isNaN(num1) || isNaN(num2)) return message.reply(getLang("invalidNumberMove"));
			if (!rulesOfThread[num1 - 1] || !rulesOfThread[num2 - 1]) return message.reply(getLang("rulesNotExistMove2", num1, num2));
			if (num1 == num2) return message.reply(getLang("sameNumberMove"));
			[rulesOfThread[num1 - 1], rulesOfThread[num2 - 1]] = [rulesOfThread[num2 - 1], rulesOfThread[num1 - 1]];
			try { await threadsData.set(threadID, rulesOfThread, "data.rules"); message.reply(getLang("successMove", num1, num2)); }
			catch (err) { message.err(err); }
		}
		else if (["delete", "del", "-d"].includes(type)) {
			if (role < 1) return message.reply(getLang("noPermissionDelete"));
			const rulesDel = rulesOfThread[parseInt(args[1]) - 1];
			if (!rulesDel) return message.reply(`${getLang("rulesNotExistDelete", args[1])}`);
			rulesOfThread.splice(parseInt(args[1]) - 1, 1);
			await threadsData.set(threadID, rulesOfThread, "data.rules");
			message.reply(getLang("successDelete", args[1], rulesDel));
		}
		else if (["remove", "reset", "-r", "-rm"].includes(type)) {
			if (role < 1) return message.reply(getLang("noPermissionRemove"));
			message.reply(getLang("confirmRemove"), (err, info) => { global.GoatBot.onReaction.set(info.messageID, { commandName: "rules", messageID: info.messageID, author: senderID }); });
		}
		else message.SyntaxError();
	},

	onReply: async function ({ message, event, getLang, Reply }) {
		const { author, rulesOfThread } = Reply;
		if (author != event.senderID) return;
		const num = parseInt(event.body || "");
		if (isNaN(num) || num < 1) return message.reply("⚠️ يرجى إدخال رقم صحيح");
		const totalRules = rulesOfThread.length;
		if (num > totalRules) return message.reply(`${getLang("rulesNotExist", num)}, ${getLang("numberRules", totalRules)}`);
		message.reply(`${num}. ${rulesOfThread[num - 1]}`, () => message.unsend(Reply.messageID));
	},

	onReaction: async ({ threadsData, message, Reaction, event, getLang }) => {
		const { author } = Reaction;
		if (author != event.userID) return;
		await threadsData.set(event.threadID, [], "data.rules");
		message.reply(getLang("successRemove"));
	}
};
