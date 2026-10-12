const { getExtFromUrl, drive, getStreamFromURL } = global.utils;

module.exports = {
	config: {
		name: 'shortcut',
		aliases: ['short'],
		version: '2.0',
		author: 'Acard',
		countDown: 5,
		role: 2,
		description: { ar: 'إضافة اختصارات للرسائل في مجموعتك' },
		category: 'custom',
		guide: {
			ar: '   {pn} add <كلمة> => <محتوى>: إضافة اختصار'
				+ '\n   {pn} del <كلمة>: حذف اختصار'
				+ '\n   {pn} remove: حذف جميع الاختصارات'
				+ '\n   {pn} list: عرض قائمة الاختصارات'
		}
	},

	langs: {
		ar: {
			missingContent: '⚠️ يرجى إدخال محتوى الرسالة',
			shortcutExists: '⚠️ الاختصار "%1" موجود مسبقاً، تفاعل لاستبدال المحتوى',
			shortcutExistsByOther: '⚠️ الاختصار %1 مضاف من قبل عضو آخر',
			added: '✅ تمت إضافة الاختصار %1 => %2',
			addedAttachment: ' مع %1 مرفق',
			missingKey: '⚠️ يرجى إدخال كلمة الاختصار للحذف',
			notFound: '❌ لا يوجد اختصار للكلمة %1',
			onlyAdmin: '⚠️ المشرفون فقط يمكنهم حذف اختصارات الآخرين',
			deleted: '✅ تم حذف الاختصار %1',
			empty: '📋 لا توجد اختصارات في مجموعتك',
			message: 'رسالة',
			attachment: 'مرفق',
			list: '📋 قائمة الاختصارات',
			listWithTypeStart: 'اختصارات تبدأ بـ "%1"',
			listWithTypeEnd: 'اختصارات تنتهي بـ "%1"',
			listWithTypeContain: 'اختصارات تحتوي "%1"',
			listWithTypeStartNot: 'لا توجد اختصارات تبدأ بـ "%1"',
			listWithTypeEndNot: 'لا توجد اختصارات تنتهي بـ "%1"',
			listWithTypeContainNot: 'لا توجد اختصارات تحتوي "%1"',
			onlyAdminRemoveAll: '⚠️ المشرفون فقط يمكنهم حذف جميع الاختصارات',
			confirmRemoveAll: '⚠️ هل أنت متأكد من حذف جميع الاختصارات؟ (تفاعل للتأكيد)',
			removedAll: '✅ تم حذف جميع الاختصارات'
		}
	},

	onStart: async function ({ args, threadsData, message, event, role, usersData, getLang, commandName }) {
		const { threadID, senderID, body } = event;
		const shortCutData = await threadsData.get(threadID, 'data.shortcut', []);

		switch (args[0]) {
			case 'add': {
				const split = body.split(' ').slice(2).join(' ').split('=>');
				const attachments = [...event.attachments, ...(event.messageReply?.attachments || [])].filter(item => ["photo", 'png', "animated_image", "video", "audio"].includes(item.type));
				let key = split[0]; let content = split.slice(1).join('=>');
				if (!key || !content && attachments.length === 0) return message.reply(getLang('missingContent'));
				key = key.trim().toLowerCase(); content = (content || "").trim();
				const alreadyExists = shortCutData.find(item => item.key == key);
				if (alreadyExists) {
					if (alreadyExists.author == senderID) return message.reply(getLang('shortcutExists', key), async (err, info) => {
						if (err) return;
						global.GoatBot.onReaction.set(info.messageID, { commandName, messageID: info.messageID, author: senderID, type: 'replaceContent', newShortcut: await createShortcut(key, content, attachments, threadID, senderID) });
					});
					else return message.reply(getLang('shortcutExistsByOther'));
				}
				const newShortcut = await createShortcut(key, content, attachments, threadID, senderID);
				shortCutData.push(newShortcut);
				await threadsData.set(threadID, shortCutData, 'data.shortcut');
				let msg = `${getLang('added', key, content)}\n`;
				if (newShortcut.attachments.length > 0) msg += getLang('addedAttachment', newShortcut.attachments.length);
				message.reply(msg);
				break;
			}
			case 'del': case 'delete': {
				const key = args.slice(1).join(' ')?.trim()?.toLowerCase();
				if (!key) return message.reply(getLang('missingKey'));
				const index = shortCutData.findIndex(x => x.key === key);
				if (index === -1) return message.reply(getLang('notFound', key));
				if (senderID != shortCutData[index].author && role < 1) return message.reply(getLang('onlyAdmin'));
				shortCutData.splice(index, 1);
				await threadsData.set(threadID, shortCutData, 'data.shortcut');
				message.reply(getLang('deleted', key));
				break;
			}
			case 'list': {
				if (shortCutData.length === 0) return message.reply(getLang('empty'));
				let shortCutList = shortCutData; let stringType = getLang('list');
				if (args[1]) {
					const type = args[1]; const keyword = args.slice(2).join(' ');
					if (type == "start") { shortCutList = shortCutData.filter(x => x.key.startsWith(keyword)); stringType = getLang('listWithTypeStart', keyword); }
					else if (type == "end") { shortCutList = shortCutData.filter(x => x.key.endsWith(keyword)); stringType = getLang('listWithTypeEnd', keyword); }
					else if (["contain", "has", "have", "include", "in"].includes(type)) { shortCutList = shortCutData.filter(x => x.key.includes(keyword)); stringType = getLang('listWithTypeContain', keyword); }
					else { shortCutList = shortCutData.filter(x => x.key.startsWith(type)); stringType = getLang('listWithTypeStart', type); }
					if (shortCutList.length === 0) {
						if (type == "start") return message.reply(getLang('listWithTypeStartNot', keyword));
						else if (type == "end") return message.reply(getLang('listWithTypeEndNot', keyword));
						else return message.reply(getLang('listWithTypeContainNot', keyword));
					}
				}
				const list = (await Promise.all(shortCutList.map(async (x, index) => {
					const num = index + 1; const keyword = x.key; const numMessage = x.content ? 1 : 0;
					const msgContent = numMessage ? `${numMessage} ${getLang("message")}, ` : "";
					const numAttachments = x.attachments.length; const msgAttachments = numAttachments ? `${x.attachments.length} ${getLang('attachment')}` : "";
					const authorName = await usersData.getName(x.author);
					return `[${num}] ${keyword} => ${msgContent}${msgAttachments} (${authorName})`;
				}))).join('\n');
				message.reply(stringType + '\n' + list);
				break;
			}
			case 'remove': case '-rm': case 'reset': case 'rm': {
				if (threadID != senderID && role < 1) return message.reply(getLang('onlyAdminRemoveAll'));
				message.reply(getLang('confirmRemoveAll'), (err, info) => { if (err) return; global.GoatBot.onReaction.set(info.messageID, { commandName, messageID: info.messageID, author: senderID, type: 'removeAll' }); });
				break;
			}
			default: message.SyntaxError();
		}
	},

	onReaction: async function ({ event, message, threadsData, getLang, Reaction }) {
		const { author } = Reaction; const { threadID, userID } = event;
		if (author != userID) return;
		if (Reaction.type == 'removeAll') { await threadsData.set(threadID, [], "data.shortcut"); return message.reply(getLang('removedAll')); }
		else if (Reaction.type == 'replaceContent') {
			const shortCutData = await threadsData.get(threadID, 'data.shortcut', []);
			const index = shortCutData.findIndex(x => x.key === Reaction.newShortcut.key);
			if (index == -1) shortCutData.push(Reaction.newShortcut); else shortCutData[index] = Reaction.newShortcut;
			await threadsData.set(threadID, shortCutData, 'data.shortcut');
			return message.reply(getLang('added', Reaction.newShortcut.key, Reaction.newShortcut.content) + (Reaction.newShortcut.attachments.length > 0 ? `\n${getLang('addedAttachment', Reaction.newShortcut.attachments.length)} ` : ''));
		}
	},

	onChat: async ({ threadsData, message, event }) => {
		const { threadID } = event;
		const body = (event.body || '').toLowerCase();
		const dataShortcut = await threadsData.get(threadID, 'data.shortcut', []);
		const findShortcut = dataShortcut.find(x => x.key === body);
		let attachments = [];
		if (findShortcut) {
			if (findShortcut.attachments.length > 0) { for (const id of findShortcut.attachments) attachments.push(drive.getFile(id, 'stream', true)); attachments = await Promise.all(attachments); }
			message.reply({ body: findShortcut.content, attachment: attachments });
		}
	}
};

async function createShortcut(key, content, attachments, threadID, senderID) {
	let attachmentIDs = [];
	if (attachments.length > 0) attachmentIDs = attachments.map(attachment => new Promise(async (resolve) => {
		const ext = attachment.type == "audio" ? "mp3" : getExtFromUrl(attachment.url);
		const fileName = `${Date.now()}.${ext}`;
		const infoFile = await drive.uploadFile(`shortcut_${threadID}_${senderID}_${fileName}`, attachment.type == "audio" ? "audio/mpeg" : undefined, await getStreamFromURL(attachment.url));
		resolve(infoFile.id);
	}));
	return { key: key.trim().toLowerCase(), content, attachments: await Promise.all(attachmentIDs), author: senderID };
}
