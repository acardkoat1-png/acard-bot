const { getTime } = global.utils;

module.exports = {
	config: {
		name: "thread",
		version: "2.0",
		author: "Acard",
		countDown: 5,
		role: 0,
		description: { ar: "إدارة المجموعات في نظام البوت" },
		category: "owner",
		guide: {
			ar: "   {pn} [find | -f | search | -s] <اسم>: البحث عن مجموعة"
				+ "\n   {pn} [ban | -b] [<tid>] <سبب>: حظر مجموعة"
				+ "\n   {pn} unban [<tid>]: إلغاء حظر مجموعة"
				+ "\n   {pn} info [<tid>]: معلومات مجموعة"
		}
	},

	langs: {
		ar: {
			noPermission: "⚠️ لا تملك صلاحية استخدام هذه الميزة",
			found: "🔎 تم العثور على %1 مجموعة تطابق \"%2\":\n%3",
			notFound: "❌ لم يتم العثور على مجموعات تطابق: \"%1\"",
			hasBanned: "⚠️ المجموعة [%1 | %2] محظورة مسبقاً:\n» السبب: %3\n» الوقت: %4",
			banned: "✅ تم حظر المجموعة [%1 | %2].\n» السبب: %3\n» الوقت: %4",
			notBanned: "ℹ️ المجموعة [%1 | %2] غير محظورة",
			unbanned: "✅ تم إلغاء حظر المجموعة [%1 | %2]",
			missingReason: "⚠️ سبب الحظر مطلوب",
			info: "» معرف المجموعة: %1\n» الاسم: %2\n» تاريخ الإنشاء: %3\n» إجمالي الأعضاء: %4\n» ذكور: %5\n» إناث: %6\n» إجمالي الرسائل: %7%8"
		}
	},

	onStart: async function ({ args, threadsData, message, role, event, getLang }) {
		const type = args[0];

		switch (type) {
			case "find": case "search": case "-f": case "-s": {
				if (role < 2) return message.reply(getLang("noPermission"));
				let allThread = await threadsData.getAll();
				let keyword = args.slice(1).join(" ");
				if (['-j', '-join'].includes(args[1])) {
					allThread = allThread.filter(thread => thread.members.some(member => member.userID == global.GoatBot.botID && member.inGroup));
					keyword = args.slice(2).join(" ");
				}
				const result = allThread.filter(item => item.threadID.length > 15 && (item.threadName || "").toLowerCase().includes(keyword.toLowerCase()));
				const resultText = result.reduce((i, thread) => i += `\n╭الاسم: ${thread.threadName}\n╰المعرف: ${thread.threadID}`, "");
				let msg = result.length > 0 ? getLang("found", result.length, keyword, resultText) : getLang("notFound", keyword);
				message.reply(msg);
				break;
			}
			case "ban": case "-b": {
				if (role < 2) return message.reply(getLang("noPermission"));
				let tid, reason;
				if (!isNaN(args[1])) { tid = args[1]; reason = args.slice(2).join(" "); }
				else { tid = event.threadID; reason = args.slice(1).join(" "); }
				if (!tid) return message.SyntaxError();
				if (!reason) return message.reply(getLang("missingReason"));
				reason = reason.replace(/\s+/g, ' ');
				const threadData = await threadsData.get(tid);
				const name = threadData.threadName;
				if (threadData.banned.status) return message.reply(getLang("hasBanned", tid, name, threadData.banned.reason, threadData.banned.date));
				const time = getTime("DD/MM/YYYY HH:mm:ss");
				await threadsData.set(tid, { banned: { status: true, reason, date: time } });
				return message.reply(getLang("banned", tid, name, reason, time));
			}
			case "unban": case "-u": {
				if (role < 2) return message.reply(getLang("noPermission"));
				let tid = !isNaN(args[1]) ? args[1] : event.threadID;
				if (!tid) return message.SyntaxError();
				const threadData = await threadsData.get(tid);
				const name = threadData.threadName;
				if (!threadData.banned.status) return message.reply(getLang("notBanned", tid, name));
				await threadsData.set(tid, { banned: {} });
				return message.reply(getLang("unbanned", tid, name));
			}
			case "info": case "-i": {
				let tid = !isNaN(args[1]) ? args[1] : event.threadID;
				if (!tid) return message.SyntaxError();
				const threadData = await threadsData.get(tid);
				const createdDate = getTime(threadData.createdAt, "DD/MM/YYYY HH:mm:ss");
				const valuesMember = Object.values(threadData.members).filter(item => item.inGroup);
				const totalBoy = valuesMember.filter(item => item.gender == "MALE").length;
				const totalGirl = valuesMember.filter(item => item.gender == "FEMALE").length;
				const totalMessage = valuesMember.reduce((i, item) => i += item.count, 0);
				const infoBanned = threadData.banned.status ? `\n- محظور: ${threadData.banned.status}\n- السبب: ${threadData.banned.reason}\n- الوقت: ${threadData.banned.date}` : "";
				return message.reply(getLang("info", threadData.threadID, threadData.threadName, createdDate, valuesMember.length, totalBoy, totalGirl, totalMessage, infoBanned));
			}
			default: return message.SyntaxError();
		}
	}
};