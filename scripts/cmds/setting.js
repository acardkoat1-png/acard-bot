const fs = require("fs");
const path = require("path");

module.exports = {
	config: {
		name: "setting",
		version: "2.0",
		author: "Acard",
		countDown: 5,
		role: 2,
		shortDescription: "إعدادات البوت",
		longDescription: "التحكم في إعدادات البوت",
		category: "admin",
		guide: "{prefix}setting"
	},

	onStart: async function ({ api, event, args, message }) {
		const mainMenu = [
			"⚙️ إعدادات البوت",
			"━━━━━━━━━━━━━━━━━",
			"1. إعدادات البوت",
			"2. إدارة المشرفين",
			"3. القائمة البيضاء",
			"4. بدون بادئة",
			"5. تفاعل الحذف",
			"6. اللقب",
			"7. خيارات FCA",
			"━━━━━━━━━━━━━━━━━",
			"› رد بـ 1-7 للدخول"
		].join("\n");

		const sent = await message.reply(mainMenu);
		global.GoatBot.onReply.set(sent.messageID, { commandName: "setting", messageID: sent.messageID, author: event.senderID, state: "main" });
	},

	onReply: async function ({ api, event, Reply, message }) {
		const { author, state } = Reply;
		if (event.senderID !== author) return;

		const configPath = path.join(process.cwd(), "config.json");
		const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
		const input = event.body.trim();
		const num = parseInt(input);

		function saveConfig() { fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8"); }
		function status(val) { return val ? "مفعل ✦" : "معطل ◌"; }

		async function sendAndListen(text, newState, extra = {}) {
			const sent = await message.reply(text);
			global.GoatBot.onReply.set(sent.messageID, { commandName: "setting", messageID: sent.messageID, author, state: newState, ...extra });
		}

		if (state === "main") {
			if (num === 1) return await sendAndListen(["⚙️ إعدادات البوت", "━━━━━━━━━━━━━━━━━", `1. مشرف فقط — ${status(config.adminOnly?.enable)}`, `2. إعادة تلقائية — ${status(config.autoRestart?.enable)}`, `3. منع الخاص — ${status(config.antiInbox?.enable)}`, `4. مشرف المجموعة فقط — ${status(config.onlyAdminBox)}`, "━━━━━━━━━━━━━━━━━", "› رد بـ 1-4 للتبديل"].join("\n"), "botConfig");
			if (num === 2) return await sendAndListen(["⚙️ إدارة المشرفين", "━━━━━━━━━━━━━━━━━", "1. إضافة مشرف", "2. إزالة مشرف", "3. قائمة المشرفين", "━━━━━━━━━━━━━━━━━", "› رد بـ 1-3"].join("\n"), "adminManage");
			if (num === 3) return await sendAndListen(["⚙️ القائمة البيضاء", "━━━━━━━━━━━━━━━━━", `1. قائمة المجموعات — ${status(config.whiteListModeThread?.enable)}`, "2. إضافة مجموعة", "3. إزالة مجموعة", `4. قائمة المستخدمين — ${status(config.whiteListMode?.enable)}`, "5. إضافة مستخدم", "6. إزالة مستخدم", "━━━━━━━━━━━━━━━━━", "› رد بـ 1-6"].join("\n"), "whitelist");
			if (num === 4) { config.noPrefix = config.noPrefix || {}; config.noPrefix.enable = !config.noPrefix.enable; saveConfig(); return message.reply(`✦ بدون بادئة — ${status(config.noPrefix.enable)}`); }
			if (num === 5) return await sendAndListen(["⚙️ تفاعل الحذف", "━━━━━━━━━━━━━━━━━", `1. تبديل — ${status(config.reactUnsend?.enable)}`, `2. مشرف فقط — ${status(config.reactUnsend?.onlyAdmin)}`, "3. إضافة إيموجي", "4. إزالة إيموجي", "5. قائمة الإيموجيات", "━━━━━━━━━━━━━━━━━", "› رد بـ 1-5"].join("\n"), "reactUnsend");
			if (num === 6) { const current = config.nickNameBot || "غير محدد"; return await sendAndListen(["⚙️ اللقب", "━━━━━━━━━━━━━━━━━", `› الحالي: ${current}`, "━━━━━━━━━━━━━━━━━", "1. تعيين اللقب (هذه المجموعة)", "2. تعيين اللقب (كل المجموعات)", "3. إعادة تعيين", "━━━━━━━━━━━━━━━━━", "› رد بـ 1-3"].join("\n"), "nickname"); }
			if (num === 7) { const o = config.optionsFca || {}; return await sendAndListen(["⚙️ خيارات FCA", "━━━━━━━━━━━━━━━━━", `1.强制登录 — ${status(o.forceLogin)}`, `2. Listen Events — ${status(o.listenEvents)}`, `3. Update Presence — ${status(o.updatePresence)}`, `4. Listen Typing — ${status(o.listenTyping)}`, `5. Self Listen — ${status(o.selfListen)}`, `6. Self Listen Event — ${status(o.selfListenEvent)}`, `7. Auto Mark Delivery — ${status(o.autoMarkDelivery)}`, `8. Auto Reconnect — ${status(o.autoReconnect)}`, "━━━━━━━━━━━━━━━━━", "› رد بـ 1-8 للتبديل"].join("\n"), "fcaOptions"); }
		}

		if (state === "botConfig") {
			if (num === 1) { config.adminOnly = config.adminOnly || {}; config.adminOnly.enable = !config.adminOnly.enable; saveConfig(); return message.reply(`✦ مشرف فقط — ${status(config.adminOnly.enable)}`); }
			if (num === 2) { config.autoRestart = config.autoRestart || {}; config.autoRestart.enable = !config.autoRestart.enable; saveConfig(); return message.reply(`✦ إعادة تلقائية — ${status(config.autoRestart.enable)}`); }
			if (num === 3) { config.antiInbox = config.antiInbox || {}; config.antiInbox.enable = !config.antiInbox.enable; saveConfig(); return message.reply(`✦ منع الخاص — ${status(config.antiInbox.enable)}`); }
			if (num === 4) { config.onlyAdminBox = !config.onlyAdminBox; saveConfig(); return message.reply(`✦ مشرف المجموعة فقط — ${status(config.onlyAdminBox)}`); }
		}

		if (state === "adminManage") {
			if (num === 1) return await sendAndListen("› رد بمعرف المستخدم أو منشن لإضافته كمشرف:", "adminAdd");
			if (num === 2) { const admins = config.adminBot || []; if (!admins.length) return message.reply("❌ لا يوجد مشرفين."); const list = admins.map((id, i) => `${i + 1}. ${id}`).join("\n"); await message.reply(`⚙️ اختر مشرفاً للإزالة:\n${list}`); return await sendAndListen("› انتظار...", "adminRemoveSelect"); }
			if (num === 3) { const admins = config.adminBot || []; if (!admins.length) return message.reply("❌ لا يوجد مشرفين."); return message.reply(`⚙️ المشرفون:\n› ${admins.join("\n› ")}`); }
		}

		if (state === "adminAdd") {
			let uid = input;
			if (event.mentions && Object.keys(event.mentions).length > 0) uid = Object.keys(event.mentions)[0];
			if (!uid || isNaN(uid)) return message.reply("❌ معرف غير صالح.");
			config.adminBot = config.adminBot || [];
			if (config.adminBot.includes(uid)) return message.reply("❌ موجود مسبقاً.");
			config.adminBot.push(uid); saveConfig();
			return message.reply(`✦ تمت إضافة ${uid} كمشرف.`);
		}

		if (state === "adminRemoveSelect") {
			const admins = config.adminBot || [];
			const idx = num - 1;
			if (isNaN(num) || !admins[idx]) return message.reply("❌ اختيار غير صالح.");
			const removed = admins.splice(idx, 1)[0];
			config.adminBot = admins; saveConfig();
			return message.reply(`✦ تمت إزالة ${removed} من المشرفين.`);
		}

		if (state === "whitelist") {
			if (num === 1) { config.whiteListModeThread = config.whiteListModeThread || {}; config.whiteListModeThread.enable = !config.whiteListModeThread.enable; saveConfig(); return message.reply(`✦ قائمة المجموعات — ${status(config.whiteListModeThread.enable)}`); }
			if (num === 2) return await sendAndListen("› رد بمعرف المجموعة للإضافة:", "threadAdd");
			if (num === 3) { const threads = config.whiteListModeThread?.whiteListThreadIds || []; if (!threads.length) return message.reply("❌ لا توجد مجموعات."); const list = threads.map((id, i) => `${i + 1}. ${id}`).join("\n"); await message.reply(`⚙️ اختر مجموعة للإزالة:\n${list}`); return await sendAndListen("› انتظار...", "threadRemoveSelect"); }
			if (num === 4) { config.whiteListMode = config.whiteListMode || {}; config.whiteListMode.enable = !config.whiteListMode.enable; saveConfig(); return message.reply(`✦ قائمة المستخدمين — ${status(config.whiteListMode.enable)}`); }
			if (num === 5) return await sendAndListen("› رد بمعرف المستخدم أو منشن للإضافة:", "userAdd");
			if (num === 6) { const users = config.whiteListMode?.whiteListIds || []; if (!users.length) return message.reply("❌ لا يوجد مستخدمين."); const list = users.map((id, i) => `${i + 1}. ${id}`).join("\n"); await message.reply(`⚙️ اختر مستخدماً للإزالة:\n${list}`); return await sendAndListen("› انتظار...", "userRemoveSelect"); }
		}

		if (state === "threadAdd") { const tid = input; if (!tid || isNaN(tid)) return message.reply("❌ معرف غير صالح."); config.whiteListModeThread = config.whiteListModeThread || {}; config.whiteListModeThread.whiteListThreadIds = config.whiteListModeThread.whiteListThreadIds || []; if (config.whiteListModeThread.whiteListThreadIds.includes(tid)) return message.reply("❌ موجود مسبقاً."); config.whiteListModeThread.whiteListThreadIds.push(tid); saveConfig(); return message.reply(`✦ تمت إضافة المجموعة ${tid}.`); }
		if (state === "threadRemoveSelect") { const threads = config.whiteListModeThread?.whiteListThreadIds || []; const idx = num - 1; if (isNaN(num) || !threads[idx]) return message.reply("❌ اختيار غير صالح."); const removed = threads.splice(idx, 1)[0]; config.whiteListModeThread.whiteListThreadIds = threads; saveConfig(); return message.reply(`✦ تمت إزالة المجموعة ${removed}.`); }
		if (state === "userAdd") { let uid = input; if (event.mentions && Object.keys(event.mentions).length > 0) uid = Object.keys(event.mentions)[0]; if (!uid || isNaN(uid)) return message.reply("❌ معرف غير صالح."); config.whiteListMode = config.whiteListMode || {}; config.whiteListMode.whiteListIds = config.whiteListMode.whiteListIds || []; if (config.whiteListMode.whiteListIds.includes(uid)) return message.reply("❌ موجود مسبقاً."); config.whiteListMode.whiteListIds.push(uid); saveConfig(); return message.reply(`✦ تمت إضافة المستخدم ${uid}.`); }
		if (state === "userRemoveSelect") { const users = config.whiteListMode?.whiteListIds || []; const idx = num - 1; if (isNaN(num) || !users[idx]) return message.reply("❌ اختيار غير صالح."); const removed = users.splice(idx, 1)[0]; config.whiteListMode.whiteListIds = users; saveConfig(); return message.reply(`✦ تمت إزالة المستخدم ${removed}.`); }

		if (state === "reactUnsend") {
			if (num === 1) { config.reactUnsend = config.reactUnsend || {}; config.reactUnsend.enable = !config.reactUnsend.enable; saveConfig(); return message.reply(`✦ تفاعل الحذف — ${status(config.reactUnsend.enable)}`); }
			if (num === 2) { config.reactUnsend = config.reactUnsend || {}; config.reactUnsend.onlyAdmin = !config.reactUnsend.onlyAdmin; saveConfig(); return message.reply(`✦ مشرف فقط — ${status(config.reactUnsend.onlyAdmin)}`); }
			if (num === 3) return await sendAndListen("› رد بالإيموجي للإضافة:", "emojiAdd");
			if (num === 4) { const emojis = config.reactUnsend?.emojis || []; if (!emojis.length) return message.reply("❌ لا توجد إيموجيات."); const list = emojis.map((e, i) => `${i + 1}. ${e}`).join("\n"); await message.reply(`⚙️ اختر إيموجي للإزالة:\n${list}`); return await sendAndListen("› انتظار...", "emojiRemoveSelect"); }
			if (num === 5) { const emojis = config.reactUnsend?.emojis || []; if (!emojis.length) return message.reply("❌ لا توجد إيموجيات."); return message.reply(`⚙️ الإيموجيات:\n› ${emojis.join("  ")}`); }
		}

		if (state === "emojiAdd") { const emoji = input.trim(); if (!emoji) return message.reply("❌ إيموجي غير صالح."); config.reactUnsend = config.reactUnsend || {}; config.reactUnsend.emojis = config.reactUnsend.emojis || []; if (config.reactUnsend.emojis.includes(emoji)) return message.reply("❌ مضاف مسبقاً."); config.reactUnsend.emojis.push(emoji); saveConfig(); return message.reply(`✦ تمت إضافة ${emoji}.`); }
		if (state === "emojiRemoveSelect") { const emojis = config.reactUnsend?.emojis || []; const idx = num - 1; if (isNaN(num) || !emojis[idx]) return message.reply("❌ اختيار غير صالح."); const removed = emojis.splice(idx, 1)[0]; config.reactUnsend.emojis = emojis; saveConfig(); return message.reply(`✦ تمت إزالة ${removed}.`); }

		if (state === "nickname") {
			if (num === 1) return await sendAndListen("› رد باللقب الجديد:", "nicknameSet");
			if (num === 2) return await sendAndListen("› رد باللقب الجديد (سيتم تعيينه في كل المجموعات):", "nicknameSetAll");
			if (num === 3) { config.nickNameBot = ""; saveConfig(); try { await api.changeNickname("", event.threadID, api.getCurrentUserID()); } catch (e) {} return message.reply("✦ تم إعادة تعيين اللقب."); }
		}

		if (state === "nicknameSet") { const nickname = input; if (!nickname) return message.reply("❌ لقب غير صالح."); config.nickNameBot = nickname; saveConfig(); try { await api.changeNickname(nickname, event.threadID, api.getCurrentUserID()); } catch (e) {} return message.reply(`✦ تم تعيين اللقب: ${nickname}`); }
		if (state === "nicknameSetAll") { const nickname = input; if (!nickname) return message.reply("❌ لقب غير صالح."); config.nickNameBot = nickname; saveConfig(); const threads = await api.getThreadList(100, null, ["INBOX"]); let success = 0; for (const thread of threads) { if (!thread.isGroup) continue; try { await api.changeNickname(nickname, thread.threadID, api.getCurrentUserID()); success++; } catch (e) {} } return message.reply(`✦ تم تعيين اللقب: ${nickname}\n› تم التحديث في ${success} مجموعة.`); }

		if (state === "fcaOptions") {
			const keys = ["forceLogin", "listenEvents", "updatePresence", "listenTyping", "selfListen", "selfListenEvent", "autoMarkDelivery", "autoReconnect"];
			const key = keys[num - 1];
			if (!key) return message.reply("❌ اختيار غير صالح.");
			config.optionsFca = config.optionsFca || {};
			config.optionsFca[key] = !config.optionsFca[key];
			saveConfig();
			api.setOptions({ [key]: config.optionsFca[key] });
			return message.reply(`✦ ${key} — ${status(config.optionsFca[key])}`);
		}
	}
};
