const { getStreamsFromAttachment, getTime } = global.utils;

module.exports = {
	config: {
		name: "sendnoti",
		version: "2.0",
		author: "Acard",
		countDown: 5,
		role: 0,
		description: { ar: "إنشاء وإرسال إشعارات للمجموعات التي تديرها" },
		category: "box chat",
		guide: {
			ar: "   {pn} create <اسم المجموعة>: إنشاء مجموعة إشعارات جديدة"
				+ "\n   {pn} add <اسم المجموعة>: إضافة هذه المجموعة لقائمة الإشعارات"
				+ "\n   {pn} list: عرض قائمة مجموعات الإشعارات"
				+ "\n   {pn} info <اسم المجموعة>: عرض معلومات مجموعة الإشعارات"
				+ "\n   {pn} delete <اسم المجموعة>: حذف هذه المجموعة من قائمة الإشعارات"
				+ "\n   {pn} send <اسم المجموعة> | <الرسالة>: إرسال إشعار لجميع مجموعات القائمة"
				+ "\n   {pn} remove <اسم المجموعة>: حذف مجموعة الإشعارات بالكامل"
		}
	},

	langs: {
		ar: {
			missingGroupName: "يرجى إدخال اسم مجموعة الإشعارات",
			groupNameExists: "مجموعة إشعارات باسم %1 موجودة مسبقاً، يرجى اختيار اسم آخر",
			createdGroup: "✅ تم إنشاء مجموعة الإشعارات:\n- الاسم: %1\n- المعرف: %2",
			missingGroupNameToAdd: "يرجى إدخال اسم مجموعة الإشعارات للإضافة",
			groupNameNotExists: "لا توجد مجموعة إشعارات باسم: %1",
			notAdmin: "يجب أن تكون مشرفاً في هذه المجموعة",
			added: "✅ تمت إضافة المجموعة الحالية إلى: %1",
			missingGroupNameToDelete: "يرجى إدخال اسم مجموعة الإشعارات للحذف منها",
			notInGroup: "المجموعة الحالية غير موجودة في %1",
			emptyList: "لا توجد لديك أي مجموعات إشعارات",
			showList: "📋 مجموعات الإشعارات:\n%1",
			deleted: "✅ تم حذف المجموعة الحالية من: %1",
			failed: "❌ فشل الإرسال إلى %1 مجموعة:\n%2",
			missingGroupNameToRemove: "يرجى إدخال اسم مجموعة الإشعارات للحذف",
			removed: "✅ تم حذف مجموعة الإشعارات: %1",
			missingGroupNameToSend: "يرجى إدخال اسم مجموعة الإشعارات للإرسال",
			groupIsEmpty: "مجموعة الإشعارات \"%1\" فارغة",
			sending: "⏳ جارٍ الإرسال إلى %1 مجموعة",
			success: "✅ تم الإرسال إلى %1 مجموعة في \"%2\" بنجاح",
			notAdminOfGroup: "لست مشرفاً في هذه المجموعة",
			missingGroupNameToView: "يرجى إدخال اسم مجموعة الإشعارات للعرض",
			groupInfo: "- الاسم: %1\n- المعرف: %2\n- تاريخ الإنشاء: %3\n%4",
			groupInfoHasGroup: "- المجموعات:\n%1",
			noGroup: "لا توجد لديك أي مجموعات إشعارات"
		}
	},

	onStart: async function ({ message, event, args, usersData, threadsData, api, getLang, role }) {
		const { threadID, senderID } = event;
		const groupsSendNotiData = await usersData.get(senderID, 'data.groupsSendNoti', []);

		switch (args[0]) {
			case "create": {
				const groupName = args.slice(1).join(' ');
				const groupID = Date.now();
				if (!groupName) return message.reply(getLang('missingGroupName'));
				if (groupsSendNotiData.some(item => item.groupName === groupName)) return message.reply(getLang('groupNameExists', groupName));
				groupsSendNotiData.push({ groupName, groupID, threadIDs: [] });
				await usersData.set(senderID, groupsSendNotiData, 'data.groupsSendNoti');
				message.reply(getLang('createdGroup', groupName, groupID));
				break;
			}
			case "add": {
				const groupName = args.slice(1).join(' ');
				if (!groupName) return message.reply(getLang('missingGroupNameToAdd'));
				const getGroup = (groupsSendNotiData || []).find(item => item.groupName == groupName);
				if (!getGroup) return message.reply(getLang('groupNameNotExists', groupName));
				if (role < 1) return message.reply(getLang('notAdmin'));
				getGroup.threadIDs.push(threadID);
				await usersData.set(senderID, groupsSendNotiData, 'data.groupsSendNoti');
				message.reply(getLang('added', groupName));
				break;
			}
			case "list": {
				if (!groupsSendNotiData.length) return message.reply(getLang('noGroup'));
				const msg = groupsSendNotiData.reduce((acc, item) => { acc += `+ ${item.groupName} - ${item.threadIDs.length}\n`; return acc; }, '');
				message.reply(getLang('showList', msg));
				break;
			}
			case "delete": {
				const groupName = args.slice(1).join(' ');
				if (!groupName) return message.reply(getLang('missingGroupNameToDelete'));
				const getGroup = (groupsSendNotiData || []).find(item => item.groupName == groupName);
				if (!getGroup) return message.reply(getLang('groupNameNotExists', groupName));
				const findIndexThread = getGroup.threadIDs.findIndex(item => item == threadID);
				if (findIndexThread == -1) return message.reply(getLang('notInGroup', groupName));
				getGroup.threadIDs.splice(findIndexThread, 1);
				await usersData.set(senderID, groupsSendNotiData, 'data.groupsSendNoti');
				message.reply(getLang('deleted', groupName));
				break;
			}
			case "remove": case "-r": {
				const groupName = args.slice(1).join(' ');
				if (!groupName) return message.reply(getLang('missingGroupNameToRemove'));
				const findIndex = (groupsSendNotiData.threadIDs || []).findIndex(item => item.groupName == groupName);
				if (findIndex == -1) return message.reply(getLang('groupNameNotExists', groupName));
				groupsSendNotiData.splice(findIndex, 1);
				await usersData.set(senderID, groupsSendNotiData, 'data.groupsSendNoti');
				message.reply(getLang('removed', groupName));
				break;
			}
			case "send": {
				const groupName = args.slice(1).join(' ').split('|')[0].trim();
				if (!groupName) return message.reply(getLang('missingGroupNameToSend'));
				const getGroup = (groupsSendNotiData || []).find(item => item.groupName == groupName);
				if (!getGroup) return message.reply(getLang('groupNameNotExists', groupName));
				if (getGroup.threadIDs.length == 0) return message.reply(getLang('groupIsEmpty', groupName));

				const messageSend = args.slice(2).join(' ').split('|').slice(1).join(' ').trim();
				const formSend = { body: messageSend };
				if (event.attachments.length || event.attachments.messageReply?.attachments.length) formSend.attachment = await getStreamsFromAttachment([...event.attachments, ...(event.messageReply?.attachments || [])].filter(item => ["photo", 'png', "animated_image", "video", "audio"].includes(item.type)));

				const success = []; const failed = []; const pendings = [];
				const { threadIDs } = getGroup;
				const msgSend = message.reply(getLang('sending', groupName, threadIDs.length));
				for (const tid of threadIDs) {
					await new Promise((r) => setTimeout(r, 1000));
					pendings.push(new Promise(async (resolve, reject) => {
						const { adminIDs, threadName } = await threadsData.get(tid);
						if (!adminIDs.includes(senderID)) return reject({ error: 'PERMISSION_DENIED', threadID: tid, threadName });
						api.sendMessage(formSend, tid, (err) => { if (err) reject({ ...err, threadID: tid, threadName }); resolve({ threadID: tid, threadName }); });
					}));
				}
				for (const item of pendings) {
					try { await item; success.push({ threadID: item.threadID, threadName: item.threadName }); }
					catch (err) { failed.push({ threadID: item.threadID, threadName: item.threadName, error: item.error }); }
				}
				api.unsendMessage((await msgSend).messageID);
				let msg = "";
				if (success.length) msg += `${getLang('success', success.length, groupName)}\n`;
				if (failed.length) msg += getLang('failed', failed.length, failed.map(item => `\n- المعرف: ${item.threadID}\n- الاسم: ${item.threadName}\n- الخطأ: ${item.error == 'PERMISSION_DENIED' ? getLang('notAdminOfGroup') : ''}`).join('\n'));
				message.reply(msg);
				break;
			}
			case "info": {
				const groupName = args.slice(1).join(' ');
				if (!groupName) return message.reply(getLang('missingGroupNameToView'));
				const getGroup = (groupsSendNotiData || []).find(item => item.groupName == groupName);
				if (!getGroup) return message.reply(getLang('groupNameNotExists', groupName));
				const { threadIDs } = getGroup;
				const allThreadData = await threadsData.getAll();
				const msg = threadIDs.reduce((acc, tid) => { const threadData = allThreadData.find(i => i.threadID == tid) || {}; acc += ` + المعرف: ${tid}\n + الاسم: ${threadData.threadName || 'غير معروف'}\n\n`; return acc; }, '');
				message.reply(getLang('groupInfo', groupName, getGroup.groupID, getTime(getGroup.groupID, 'DD/MM/YYYY HH:mm:ss'), msg ? getLang('groupInfoHasGroup', msg) : getLang('groupIsEmpty', groupName)));
				break;
			}
			default: return message.SyntaxError();
		}
	}
};