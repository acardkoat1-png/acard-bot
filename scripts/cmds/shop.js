/**
 * /shop — متجر حقيقي: كتم الأعضاء + درع ضد السرقة
 * مسار الملف: scripts/cmds/shop.js
 *
 * كل ما يُشترى هنا يعمل فعلياً:
 *  - الكتم: يمنع العضو من استخدام أوامر البوت حتى انتهاء المدة (يُفحص في handlerEvents.js)
 *  - الدرع: يمنع سرقة رصيدك في أمر rob
 */

const eco = require("../../func/economy.js");

module.exports.config = {
	name: "shop",
	aliases: ["متجر", "store", "buy", "شراء"],
	version: "4.0",
	author: "Acard",
	countDown: 3,
	role: 0,
	category: "economy",
	shortDescription: "المتجر: كتم عضو أو درع ضد السرقة",
	guide: {
		ar: "{pn} — عرض المتجر\n" +
			"{pn} buy <رقم> (بالرد أو المنشن للكتم)\n" +
			"{pn} status — مفعولاتك الحالية\n" +
			"{pn} unmute (أدمن البوت) — فك الكتم"
	}
};

const ITEMS = [
	{ id: 1, name: "🔇 كتم ساعة", price: 5000, type: "mute", hours: 1 },
	{ id: 2, name: "🔇 كتم 6 ساعات", price: 15000, type: "mute", hours: 6 },
	{ id: 3, name: "🔇 كتم 24 ساعة", price: 40000, type: "mute", hours: 24 },
	{ id: 4, name: "🛡️ درع ضد السرقة (24 ساعة)", price: 8000, type: "shield", hours: 24 }
];

function itemList() {
	return ITEMS.map(item => `${item.id}️⃣ ${item.name} — ${eco.fmt(item.price)}$`).join("\n");
}

function resolveTarget(event, args) {
	const reply = event.messageReply;
	if (reply && reply.senderID) return String(reply.senderID);
	const mentions = event.mentions || {};
	const keys = Object.keys(mentions);
	if (keys.length > 0) return String(keys[0]);
	const numeric = String(args[1] || "").trim();
	if (/^\d{6,}$/.test(numeric)) return numeric;
	return null;
}

function timeLeftText(ms) {
	const total = Math.max(0, Math.ceil(ms / 1000));
	const h = Math.floor(total / 3600);
	const m = Math.floor((total % 3600) / 60);
	if (h > 0) return `${h} ساعة و ${m} دقيقة`;
	return `${m} دقيقة`;
}

function isBotAdmin(userID) {
	const admins = (global.GoatBot.config.adminBot || []).map(String);
	return admins.includes(String(userID));
}

/** يخصم الثمن فقط. تُستدعى قبل تطبيق المفعول (بدون أقفال متداخلة) */
async function charge(usersData, userID, price) {
	return eco.withWallet(usersData, userID, async (buyer) => {
		if (buyer.money < price) return { error: `رصيدك غير كافٍ! السعر: ${eco.fmt(price)}$`, balance: buyer.money };
		buyer.add(-price);
		buyer.stat("shopPurchases", price);
		return { balance: buyer.money };
	});
}

module.exports.onStart = async function ({ api, event, args, usersData, role }) {
	const { senderID, threadID, messageID } = event;
	const action = String(args[0] || "").toLowerCase();

	/* ————— الحالة ————— */
	if (["status", "حالة", "مفعولات"].includes(action)) {
		const me = await usersData.get(senderID);
		const data = (me && me.data) || {};
		const muteLeft = eco.num(data.muteUntil, 0) - Date.now();
		const shieldLeft = eco.num(data.shieldUntil, 0) - Date.now();
		return api.sendMessage(
			`👤 | مفعولاتك\n━━━━━━━━━━━━━━━━━━━\n` +
			`🔇 | الكتم: ${muteLeft > 0 ? "مكتوم — " + timeLeftText(muteLeft) : "لا شيء"}\n` +
			`🛡️ | الدرع: ${shieldLeft > 0 ? "مفعّل — " + timeLeftText(shieldLeft) : "غير مفعّل"}\n` +
			eco.balanceLine(eco.toMoney(data.money)),
			threadID, messageID
		);
	}

	/* ————— فك الكتم (أدمن البوت) ————— */
	if (["unmute", "فك", "الغاء"].includes(action)) {
		if (Number(role) < 2) return api.sendMessage("⛔ | فك الكتم للأدمن فقط.", threadID, messageID);
		const target = resolveTarget(event, args);
		if (!target) return api.sendMessage("📌 | ردّ على رسالة العضو أو منشنه.", threadID, messageID);
		const name = await eco.withWallet(usersData, target, async (w) => {
			w.set("muteUntil", 0);
			const userName = w.user.name || "العضو";
			return userName;
		});
		return api.sendMessage(`✅ | تم فك الكتم عن ${name}.`, threadID, messageID);
	}

	/* ————— عرض المتجر ————— */
	if (action !== "buy" && action !== "شراء" && action !== "اشتري") {
		return api.sendMessage(
			`🛒 | المتجر\n━━━━━━━━━━━━━━━━━━━\n` +
			`${itemList()}\n` +
			`━━━━━━━━━━━━━━━━━━━\n` +
			`📌 | shop buy <رقم>\n` +
			`🔇 | للكتم: ردّ على رسالة الشخص أو منشنه\n` +
			`🛡️ | للدرع: اكتب shop buy 4\n` +
			`━━━━━━━━━━━━━━━━━━━\n` +
			`💡 | الكتم يمنع العضو من استخدام البوت فوراً\n` +
			`💡 | لا يمكن كتم أدمن البوت`,
			threadID, messageID
		);
	}

	/* ————— الشراء ————— */
	const item = ITEMS.find(entry => String(entry.id) === String(args[1]));
	if (!item) return api.sendMessage(`❌ | رقم غير موجود.\n\n${itemList()}`, threadID, messageID);

	if (item.type === "mute") {
		const target = resolveTarget(event, args);
		if (!target) return api.sendMessage("📌 | للكتم: ردّ على رسالة العضو أو منشنه.", threadID, messageID);
		if (target === String(senderID)) return api.sendMessage("🤨 | لا يمكنك كتم نفسك.", threadID, messageID);
		if (isBotAdmin(target)) return api.sendMessage("🛡️ | هذا العضو أدمن البوت — لا يمكن كتمه.", threadID, messageID);

		const botID = global.GoatBot.botID;
		if (botID && String(target) === String(botID)) return api.sendMessage("🤖 | لا يمكن كتم البوت.", threadID, messageID);

		const paid = await charge(usersData, senderID, item.price);
		if (paid.error) return api.sendMessage(`❌ | ${paid.error}`, threadID, messageID);

		const outcome = await eco.withWallet(usersData, target, async (victim) => {
			const now = Date.now();
			const current = eco.num(victim.get("muteUntil", 0), 0);
			const base = current > now ? current : now;
			const until = base + item.hours * 3600 * 1000;
			victim.set("muteUntil", until);
			victim.stat("timesMuted", 1);
			return { until, name: victim.user.name || "العضو" };
		});

		return api.sendMessage(
			`🔇 | تم كتم ${outcome.name}!\n━━━━━━━━━━━━━━━━━━━\n` +
			`⏳ | المدة: ${item.hours} ساعة\n` +
			`📅 | ينتهي: ${new Date(outcome.until).toISOString().replace("T", " ").slice(0, 16)} UTC\n` +
			`💸 | الثمن: ${eco.fmt(item.price)}$\n` +
			eco.balanceLine(paid.balance) +
			`\n\n💡 | الآن لا يستطيع استخدام أوامر البوت`,
			threadID, messageID
		);
	}

	// الدرع
	const paid = await charge(usersData, senderID, item.price);
	if (paid.error) return api.sendMessage(`❌ | ${paid.error}`, threadID, messageID);

	const outcome = await eco.withWallet(usersData, senderID, async (buyer) => {
		const now = Date.now();
		const current = eco.num(buyer.get("shieldUntil", 0), 0);
		const base = current > now ? current : now;
		const until = base + item.hours * 3600 * 1000;
		buyer.set("shieldUntil", until);
		return { until, balance: buyer.money };
	});

	return api.sendMessage(
		`🛡️ | تم تفعيل الدرع!\n━━━━━━━━━━━━━━━━━━━\n` +
		`⏳ | المدة: ${item.hours} ساعة\n` +
		`📅 | ينتهي: ${new Date(outcome.until).toISOString().replace("T", " ").slice(0, 16)} UTC\n` +
		`💸 | الثمن: ${eco.fmt(item.price)}$\n` +
		eco.balanceLine(outcome.balance) +
		`\n\n💡 | لا يمكن لأحد سرقة رصيدك الآن`,
		threadID, messageID
	);
};