/**
 * /leaderboard — لوحة الصدارة (تصميم جديد: منصة تتويج + ترتيب + شريط تقدم)
 * مسار الملف: scripts/cmds/leaderboard.js
 */

const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");
const axios = require("axios");
const eco = require("../../func/economy.js");

module.exports.config = {
	name: "leaderboard",
	aliases: ["lb", "top", "الصدارة", "ترتيب"],
	version: "9.0",
	author: "Acard",
	countDown: 10,
	role: 0,
	category: "economy",
	shortDescription: "لوحة أغنى 10 أعضاء في المجموعة",
	guide: { ar: "{pn}" }
};

const WIDTH = 900;
const HEADER = 168;
const PODIUM_H = 290;
const ROW_H = 68;
const FOOTER = 86;
const AVATAR_TOKEN = "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662";

const GOLD = "#f5c542";
const SILVER = "#c9d1dc";
const BRONZE = "#d08b4a";

/* ————————————————— أدوات الرسم ————————————————— */

function roundRect(ctx, x, y, w, h, r) {
	ctx.beginPath();
	ctx.moveTo(x + r, y);
	ctx.lineTo(x + w - r, y);
	ctx.quadraticCurveTo(x + w, y, x + w, y + r);
	ctx.lineTo(x + w, y + h - r);
	ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
	ctx.lineTo(x + r, y + h);
	ctx.quadraticCurveTo(x, y + h, x, y + h - r);
	ctx.lineTo(x, y + r);
	ctx.quadraticCurveTo(x, y, x + r, y);
	ctx.closePath();
}

async function loadAvatar(uid) {
	try {
		const url = `https://graph.facebook.com/${uid}/picture?height=240&width=240&access_token=${AVATAR_TOKEN}`;
		const response = await axios.get(url, { responseType: "arraybuffer", timeout: 15000 });
		return await loadImage(Buffer.from(response.data));
	}
	catch (error) {
		return null;
	}
}

function drawAvatar(ctx, avatar, name, x, y, size, ringColor) {
	const radius = size / 2;
	ctx.save();
	ctx.beginPath();
	ctx.arc(x + radius, y + radius, radius, 0, Math.PI * 2);
	ctx.closePath();
	ctx.clip();
	if (avatar) {
		ctx.drawImage(avatar, x, y, size, size);
	}
	else {
		const palette = ["#1565c0", "#6a1b9a", "#00695c", "#bf360c", "#4e342e", "#37474f"];
		const letter = (name || "?").trim().charAt(0).toUpperCase();
		ctx.fillStyle = palette[letter.charCodeAt(0) % palette.length];
		ctx.fillRect(x, y, size, size);
		ctx.fillStyle = "#ffffff";
		ctx.font = `bold ${Math.floor(size * 0.42)}px Arial`;
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillText(letter, x + radius, y + radius + 2);
		ctx.textBaseline = "alphabetic";
	}
	ctx.restore();

	ctx.beginPath();
	ctx.arc(x + radius, y + radius, radius + 2, 0, Math.PI * 2);
	ctx.strokeStyle = ringColor;
	ctx.lineWidth = 3;
	ctx.stroke();
}

function fitText(ctx, text, maxWidth) {
	let value = String(text || "");
	if (ctx.measureText(value).width <= maxWidth) return value;
	while (value.length > 1 && ctx.measureText(value + "…").width > maxWidth) value = value.slice(0, -1);
	return value + "…";
}

/* ————————————————— الرسم ————————————————— */

function drawCard(ctx, user, rank, x, y, w, h, accent) {
	ctx.fillStyle = "rgba(255,255,255,0.055)";
	roundRect(ctx, x, y, w, h, 18);
	ctx.fill();

	ctx.strokeStyle = accent;
	ctx.lineWidth = rank === 1 ? 2.5 : 1.6;
	roundRect(ctx, x, y, w, h, 18);
	ctx.stroke();

	// شريط علوي بلون الميدالية
	ctx.fillStyle = accent;
	roundRect(ctx, x + 16, y + 14, w - 32, 4, 2);
	ctx.fill();

	// الرقم
	ctx.textAlign = "center";
	ctx.fillStyle = accent;
	ctx.font = rank === 1 ? "bold 30px Arial" : "bold 24px Arial";
	ctx.fillText(`#${rank}`, x + w / 2, y + 56);

	// الصورة
	const size = rank === 1 ? 96 : 82;
	const avatarY = y + 62;
	drawAvatar(ctx, user.avatar, user.name, x + (w - size) / 2, avatarY, size, accent);

	// الاسم
	const nameBaseline = avatarY + size + 28;
	ctx.textAlign = "center";
	ctx.fillStyle = "#ffffff";
	ctx.font = rank === 1 ? "bold 22px Arial" : "bold 19px Arial";
	ctx.fillText(fitText(ctx, user.name, w - 36), x + w / 2, nameBaseline);

	// المال
	ctx.fillStyle = accent;
	ctx.font = rank === 1 ? "bold 24px Arial" : "bold 20px Arial";
	ctx.fillText("$" + eco.short(user.money), x + w / 2, nameBaseline + 32);
}

function drawRow(ctx, user, rank, y, maxMoney, width) {
	const x = 40;
	const w = width - 80;

	ctx.fillStyle = "rgba(255,255,255,0.04)";
	roundRect(ctx, x, y, w, ROW_H - 12, 14);
	ctx.fill();

	ctx.textAlign = "center";
	ctx.fillStyle = "rgba(255,255,255,0.55)";
	ctx.font = "bold 20px Arial";
	ctx.fillText(String(rank), x + 34, y + 36);

	const avatarSize = 38;
	drawAvatar(ctx, user.avatar, user.name, x + 66, y + 9, avatarSize, "rgba(255,255,255,0.25)");

	ctx.textAlign = "left";
	ctx.fillStyle = "#ffffff";
	ctx.font = "bold 19px Arial";
	ctx.fillText(fitText(ctx, user.name, 420), x + 118, y + 32);

	// شريط تقدم مقارنةً بالمتصرّد
	const barX = x + 118;
	const barY = y + 42;
	const barW = 380;
	const barH = 6;
	const ratio = maxMoney > 0 ? Math.min(1, user.money / maxMoney) : 0;
	ctx.fillStyle = "rgba(255,255,255,0.10)";
	roundRect(ctx, barX, barY, barW, barH, 3);
	ctx.fill();
	ctx.fillStyle = "#4fc3f7";
	roundRect(ctx, barX, barY, Math.max(4, barW * ratio), barH, 3);
	ctx.fill();

	ctx.textAlign = "right";
	ctx.fillStyle = "#7ee0a1";
	ctx.font = "bold 19px Arial";
	const label = user.money >= 1e9 ? "$" + eco.short(user.money) : "$" + eco.fmt(user.money);
	ctx.fillText(label, x + w - 24, y + 35);
}

module.exports.onStart = async function ({ api, event, usersData }) {
	const { threadID, messageID } = event;

	try {
		const threadInfo = await api.getThreadInfo(threadID);
		const memberIDs = (threadInfo && threadInfo.participantIDs) || [];
		const allUsers = (global.db && global.db.allUserData) || (await usersData.getAll());

		const players = (allUsers || [])
			.filter(user => memberIDs.includes(user.userID))
			.map(user => ({
				id: user.userID,
				name: user.name || "عضو",
				money: eco.toMoney(user && user.data ? user.data.money : 0)
			}))
			.sort((a, b) => b.money - a.money)
			.slice(0, 10);

		if (players.length === 0) {
			return api.sendMessage("❌ | لا يوجد أعضاء في هذه المجموعة!", threadID, messageID);
		}

		const top = players;
		const height = HEADER + PODIUM_H + Math.max(0, top.length - 3) * ROW_H + FOOTER;
		const canvas = createCanvas(WIDTH, height);
		const ctx = canvas.getContext("2d");

		// الخلفية
		const gradient = ctx.createLinearGradient(0, 0, WIDTH, height);
		gradient.addColorStop(0, "#080c17");
		gradient.addColorStop(1, "#0f1b33");
		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, WIDTH, height);

		// هالات لونية
		ctx.fillStyle = "rgba(245,197,66,0.07)";
		ctx.beginPath();
		ctx.arc(120, 40, 180, 0, Math.PI * 2);
		ctx.fill();
		ctx.fillStyle = "rgba(79,195,247,0.06)";
		ctx.beginPath();
		ctx.arc(WIDTH - 100, 120, 200, 0, Math.PI * 2);
		ctx.fill();

		// الترويسة
		ctx.textAlign = "center";
		ctx.fillStyle = "rgba(255,255,255,0.45)";
		ctx.font = "bold 16px Arial";
		ctx.fillText("A C A R D   •   E C O N O M Y", WIDTH / 2, 52);

		ctx.fillStyle = "#ffffff";
		ctx.font = "bold 48px Arial";
		ctx.fillText("HALL OF FAME", WIDTH / 2, 106);

		ctx.fillStyle = GOLD;
		ctx.font = "bold 17px Arial";
		ctx.fillText("TOP " + top.length + " RICHEST MEMBERS", WIDTH / 2, 138);

		ctx.strokeStyle = "rgba(255,255,255,0.12)";
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(40, 154);
		ctx.lineTo(WIDTH - 40, 154);
		ctx.stroke();

		// التصميم: الأول في الوسط، الثاني يسار، الثالث يمين
		const accents = [GOLD, SILVER, BRONZE];

		// تحميل الصور بالتوازي
		const avatars = await Promise.all(top.slice(0, 3).map(user => loadAvatar(user.id)));
		top.slice(0, 3).forEach((user, index) => { user.avatar = avatars[index]; });

		top.slice(0, 3).forEach((user, index) => {
			const accent = accents[index];
			const isFirst = index === 0;
			const cardW = isFirst ? 240 : 220;
			const cardH = isFirst ? 270 : 240;
			const cardX = isFirst ? 330 : (index === 1 ? 80 : 600);
			const cardY = isFirst ? HEADER + 6 : HEADER + 36;
			drawCard(ctx, user, index + 1, cardX, cardY, cardW, cardH, accent);
		});

		// بقية اللاعبين
		const maxMoney = top[0].money;
		const rest = top.slice(3);
		const restAvatars = await Promise.all(rest.map(user => loadAvatar(user.id)));
		rest.forEach((user, index) => { user.avatar = restAvatars[index]; });

		rest.forEach((user, index) => {
			const y = HEADER + PODIUM_H + index * ROW_H;
			drawRow(ctx, user, index + 4, y, maxMoney, WIDTH);
		});

		// التذييل
		const totalWealth = top.reduce((sum, user) => sum + user.money, 0);
		ctx.textAlign = "left";
		ctx.fillStyle = "rgba(255,255,255,0.45)";
		ctx.font = "16px Arial";
		ctx.fillText("GROUP TOTAL: $" + eco.fmt(totalWealth), 40, height - 34);

		ctx.textAlign = "right";
		ctx.fillStyle = "rgba(255,255,255,0.30)";
		ctx.font = "15px Arial";
		ctx.fillText("Acard Bot • Economy v2", WIDTH - 40, height - 34);

		// حفظ وإرسال
		const cacheDir = path.join(__dirname, "cache");
		await fs.ensureDir(cacheDir);
		const filePath = path.join(cacheDir, `top_${threadID}_${Date.now()}.png`);
		await fs.writeFile(filePath, canvas.toBuffer("image/png"));

		const medals = ["🥇", "🥈", "🥉"];
		const caption =
			`🏆 | لوحة الصدارة — أغنى ${top.length} أعضاء\n━━━━━━━━━━━━━━━━━━━\n` +
			top.slice(0, 3).map((user, index) => `${medals[index]} ${user.name} — $${eco.fmt(user.money)}`).join("\n") +
			(top.length > 3 ? `\n\n💺 | بقية الترتيب في الصورة` : "") +
			`\n━━━━━━━━━━━━━━━━━━━\n💰 | مجموع ثروة المجموعة: ${eco.fmt(totalWealth)}$`;

		await api.sendMessage(
			{ body: caption, attachment: fs.createReadStream(filePath) },
			threadID,
			messageID
		);

		setTimeout(() => fs.remove(filePath).catch(() => {}), 15000);
	}
	catch (error) {
		console.error("Leaderboard Error:", error);
		api.sendMessage("❌ | تعذّر إنشاء لوحة الصدارة، حاول لاحقاً.", threadID, messageID);
	}
};
