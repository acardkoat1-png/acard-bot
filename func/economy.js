/**
 * نواة الاقتصاد — Acard Economy v2
 * ---------------------------------------------------------------
 * كل أوامر الاقتصاد تمر من هنا: قفل لكل مستخدم (لمنع الاستغلال
 * بالطلبات المتزامنة)، قراءة/كتابة موحّدة، أزمنة انتظار، وجداول
 * جوائز محسوبة رياضياً بحيث لا يتجاوز مردود اللعبة 96% (لا فوز مضمون).
 *
 * مسار الملف: func/economy.js
 * من الأوامر: require("../../func/economy.js")
 */

"use strict";

const START_BALANCE = 100;
const MIN_BET = 10;
const MAX_BET = 1e9;
const MIN_TRANSFER = 10;
const MAX_TRANSFER = 1e9;
const HARD_CAP = 1e15;

/* ————————————————— أدوات عامة ————————————————— */

function num(value, fallback) {
	const n = Number(value);
	return Number.isFinite(n) ? n : fallback;
}

function toMoney(value) {
	const n = Math.floor(num(value, START_BALANCE));
	if (!Number.isFinite(n)) return START_BALANCE;
	if (n < 0) return 0;
	if (n > HARD_CAP) return HARD_CAP;
	return n;
}

function fmt(value) {
	const n = Math.floor(num(value, 0));
	const sign = n < 0 ? "-" : "";
	return sign + String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function short(value) {
	const n = Math.floor(num(value, 0));
	if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
	if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
	if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
	return String(n);
}

function rint(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(list) {
	return list[Math.floor(Math.random() * list.length)];
}

/** يقرأ مبلغاً من نص: 500 / 2.5k / 1m / all — يعيد رقماً أو "all" أو null */
function parseAmount(input) {
	if (input === undefined || input === null) return null;
	const text = String(input).trim().toLowerCase().replace(/[,$_\s]/g, "");
	if (!text) return null;
	if (["all", "كل", "الكل", "كلشي"].includes(text)) return "all";
	const match = text.match(/^(\d+(?:\.\d+)?)([kmbt])?$/);
	if (!match) return null;
	const scale = { k: 1e3, m: 1e6, b: 1e9, t: 1e12 }[match[2]] || 1;
	const value = Math.floor(parseFloat(match[1]) * scale);
	if (!Number.isFinite(value) || value <= 0) return null;
	return value;
}

function timeLeft(ms) {
	const total = Math.max(0, Math.ceil(ms / 1000));
	const h = Math.floor(total / 3600);
	const m = Math.floor((total % 3600) / 60);
	const s = total % 60;
	if (h > 0) return `${h} ساعة و ${m} دقيقة`;
	if (m > 0) return `${m} دقيقة و ${s} ثانية`;
	return `${s} ثانية`;
}

/* ————————————————— أقفال لكل مستخدم ————————————————— */

const locks = new Map();

function withLock(key, fn) {
	const prev = locks.get(key) || Promise.resolve();
	const run = prev.then(fn, fn);
	const guard = run.then(() => {}, () => {});
	locks.set(key, guard);
	guard.then(() => {
		if (locks.get(key) === guard) locks.delete(key);
	});
	return run;
}

/* ————————————————— محفظة ————————————————— */

class Wallet {
	constructor(usersData, user) {
		this.usersData = usersData;
		this.user = user;
		this.data = user && user.data && typeof user.data === "object" ? { ...user.data } : {};
		this.money = toMoney(this.data.money);
		this.dirty = false;
	}

	get(key, fallback) {
		const value = this.data[key];
		return value === undefined || value === null ? fallback : value;
	}

	set(key, value) {
		this.data[key] = value;
		this.dirty = true;
		return value;
	}

	add(amount) {
		return this.setMoney(this.money + num(amount, 0));
	}

	setMoney(amount) {
		this.money = toMoney(amount);
		this.dirty = true;
		return this.money;
	}

	canAfford(amount) {
		return Number.isFinite(amount) && amount > 0 && this.money >= amount;
	}

	/** يتحقق من زمن الانتظار: { ok, left } */
	cooldown(key, ms) {
		const cd = this.data.cd && typeof this.data.cd === "object" ? this.data.cd : {};
		const last = num(cd[key], 0);
		const left = last + ms - Date.now();
		return { ok: left <= 0, left: left > 0 ? left : 0 };
	}

	/** يثبّت بداية زمن الانتظار (يُحفظ مع بقية التعديلات) */
	mark(key) {
		const cd = this.data.cd && typeof this.data.cd === "object" ? this.data.cd : {};
		cd[key] = Date.now();
		this.set("cd", cd);
	}

	/** احصاءات اللاعب */
	stat(name, amount) {
		const stats = this.data.stats && typeof this.data.stats === "object" ? this.data.stats : {};
		stats[name] = num(stats[name], 0) + num(amount, 0);
		this.set("stats", stats);
		return stats[name];
	}

	/**
	 * يسجّل جولة لعب.
	 * يحدّث أيضاً gamesPlayed / gamesWon في الجذر حتى تبقى أوامر
	 * stats و achievements و gambleboard القديمة تعمل كما هي.
	 */
	recordGame(kind, won) {
		this.set("gamesPlayed", num(this.get("gamesPlayed", 0), 0) + 1);
		if (won) this.set("gamesWon", num(this.get("gamesWon", 0), 0) + 1);
		this.stat("gamesPlayed", 1);
		if (won) this.stat("gamesWon", 1);
		if (kind) this.stat(kind + "Plays", 1);
	}

	/** يسجّل أعلى قيمة (لا يجمع) — مثل أكبر ربح */
	best(name, value) {
		const stats = this.data.stats && typeof this.data.stats === "object" ? this.data.stats : {};
		const amount = num(value, 0);
		if (amount > num(stats[name], 0)) {
			stats[name] = amount;
			this.set("stats", stats);
			return amount;
		}
		return num(stats[name], 0);
	}

	async save() {
		if (!this.dirty) return;
		const id = this.user && this.user.userID;
		const data = { ...this.data, money: this.money };
		await this.usersData.set(id, { ...this.user, data });
		this.dirty = false;
	}
}

/**
 * ينفّذ دالة على محفظة مستخدم واحد داخل قفل، ويحفظ مرة واحدة فقط.
 */
async function withWallet(usersData, userID, fn) {
	const id = String(userID);
	return withLock("wallet:" + id, async () => {
		const user = await usersData.get(id);
		const wallet = new Wallet(usersData, user || { userID: id, data: {} });
		const result = await fn(wallet);
		await wallet.save();
		return result;
	});
}

/**
 * تحويل بين عضوين داخل قفل واحد وبترتيب ثابت (لا تصادم ولا خصم مزدوج).
 */
async function transfer(usersData, fromID, toID, amount, kind) {
	const from = String(fromID);
	const to = String(toID);
	const statOut = kind === "rob" ? "robbedFrom" : "transfersOut";
	const statIn = kind === "rob" ? "robbed" : "transfersIn";
	if (from === to) return { ok: false, reason: "self" };
	if (!Number.isFinite(amount) || amount <= 0) return { ok: false, reason: "amount" };

	const [first, second] = from < to ? [from, to] : [to, from];

	return withLock("wallet:" + first, () =>
		withLock("wallet:" + second, async () => {
			const fromUser = await usersData.get(from);
			const toUser = await usersData.get(to);
			if (!fromUser) return { ok: false, reason: "no_user" };

			const fromWallet = new Wallet(usersData, fromUser);
			const toWallet = new Wallet(usersData, toUser || { userID: to, data: {} });

			if (fromWallet.money < amount) {
				return { ok: false, reason: "poor", balance: fromWallet.money };
			}

			fromWallet.setMoney(fromWallet.money - amount);
			toWallet.setMoney(toWallet.money + amount);
			fromWallet.stat(statOut, amount);
			toWallet.stat(statIn, amount);

			await fromWallet.save();
			try {
				await toWallet.save();
			}
			catch (error) {
				// استرجاع المال إن فشل تسجيل الطرف الثاني
				fromWallet.setMoney(fromWallet.money + amount);
				await fromWallet.save().catch(() => {});
				throw error;
			}

			return {
				ok: true,
				from: { id: from, name: fromUser.name || "عضو", balance: fromWallet.money },
				to: { id: to, name: (toUser && toUser.name) || "عضو", balance: toWallet.money }
			};
		})
	);
}

/* ————————————————— جداول الألعاب ————————————————— */

// عجلة المراهنة: 1000 وجه — المردود المتوقع 93.5%
const BET_TABLE = [
	{ weight: 462, multiplier: 0, label: "خسارة" },
	{ weight: 150, multiplier: 0.5, label: "نصف الرهان" },
	{ weight: 200, multiplier: 1.2, label: "ربح صغير" },
	{ weight: 120, multiplier: 2, label: "مضاعفة" },
	{ weight: 50, multiplier: 4, label: "ربح كبير" },
	{ weight: 18, multiplier: 10, label: "الجائزة الكبرى" }
];
const BET_FACES = BET_TABLE.reduce((sum, tier) => sum + tier.weight, 0);

function rollBet() {
	const roll = rint(1, BET_FACES);
	let acc = 0;
	for (const tier of BET_TABLE) {
		acc += tier.weight;
		if (roll <= acc) return { roll, faces: BET_FACES, multiplier: tier.multiplier, label: tier.label, tier };
	}
	return { roll, faces: BET_FACES, multiplier: 0, label: "خسارة", tier: BET_TABLE[0] };
}

// السلوتس: 3 بكرات بأوزان — المردود المتوقع 93.2%
const SLOT_SYMBOLS = [
	{ key: "cherry", emoji: "🍒", weight: 45 },
	{ key: "lemon", emoji: "🍋", weight: 25 },
	{ key: "bell", emoji: "🔔", weight: 15 },
	{ key: "diamond", emoji: "💎", weight: 10 },
	{ key: "seven", emoji: "7️⃣", weight: 5 }
];
const SLOT_TRIPLE = { cherry: 4, lemon: 6, bell: 12, diamond: 25, seven: 60 };
const SLOT_TWO_CHERRY = 1.2;
const SLOT_FACES = SLOT_SYMBOLS.reduce((sum, s) => sum + s.weight, 0);

function spinReel() {
	const roll = rint(1, SLOT_FACES);
	let acc = 0;
	for (const symbol of SLOT_SYMBOLS) {
		acc += symbol.weight;
		if (roll <= acc) return symbol;
	}
	return SLOT_SYMBOLS[0];
}

function spinSlot() {
	const reels = [spinReel(), spinReel(), spinReel()];
	const [a, b, c] = reels;

	let multiplier = 0;
	let line = "خسارة";

	if (a.key === b.key && b.key === c.key) {
		multiplier = SLOT_TRIPLE[a.key] || 0;
		line = `ثلاث ${a.emoji}`;
	}
	else {
		const cherries = reels.filter(r => r.key === "cherry").length;
		if (cherries === 2) {
			multiplier = SLOT_TWO_CHERRY;
			line = "كرزتان";
		}
	}

	return { reels, multiplier, line };
}

// النرد: 95% مردود متوقع
const DICE_EXACT = 5.7;
const DICE_SIDE = 1.9;

function rollDice() {
	return rint(1, 6);
}

// حقل الألغام: 25 خانة / 6 ألغام — المردود المتوقع 96%
const MINES_CELLS = 25;
const MINES_BOMBS = 6;
const MINES_EDGE = 0.96;
const MINES_MAX_PICKS = MINES_CELLS - MINES_BOMBS;

function minesMultiplier(picked) {
	if (picked <= 0) return 1;
	let m = MINES_EDGE;
	for (let i = 0; i < picked; i++) m *= (MINES_CELLS - i) / (MINES_CELLS - MINES_BOMBS - i);
	return m;
}

/* ————————————————— نصوص مساعدة ————————————————— */

function balanceLine(money) {
	return `💳 | رصيدك: ${fmt(money)}$`;
}

function header(title) {
	return `${title}\n━━━━━━━━━━━━━━━━━━━`;
}

module.exports = {
	START_BALANCE,
	MIN_BET,
	MAX_BET,
	MIN_TRANSFER,
	MAX_TRANSFER,

	num,
	toMoney,
	fmt,
	short,
	rint,
	pick,
	parseAmount,
	timeLeft,
	balanceLine,
	header,

	withLock,
	Wallet,
	withWallet,
	transfer,

	BET_TABLE,
	BET_FACES,
	rollBet,

	SLOT_SYMBOLS,
	SLOT_TRIPLE,
	SLOT_TWO_CHERRY,
	spinSlot,

	DICE_EXACT,
	DICE_SIDE,
	rollDice,

	MINES_CELLS,
	MINES_BOMBS,
	MINES_MAX_PICKS,
	minesMultiplier
};
