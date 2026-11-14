/**
 * /wallet — بطاقة المحفظة (صورة) + ملخّص نصّي
 * مسار الملف: scripts/cmds/wallet.js
 */

const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");
const axios = require("axios");
const eco = require("../../func/economy.js");

module.exports.config = {
	name: "wallet",
	aliases: ["محفظة", "ecohelp", "flous"],
	version: "3.0",
	author: "Acard",
	countDown: 5,
	role: 0,
	category: "economy",
	shortDescription: "بطاقة محفظتك بالصورة: الرصيد، الجولات، نسبة الفوز، السلسلة",
	guide: { ar: "{pn}" }
};

const AVATAR_TOKEN = "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662";
const WIDTH = 900;
const HEIGHT = 520;

const CYAN = "#4fc3f7";
const GREEN = "#7ee0a1";
const GOLD = "#f5c542";
const PURPLE = "#b388ff";

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

async function loadAvatar(userID) {
	try {
		const url = `https://graph.facebook.com/${userID}/picture?height=240&width=240&access_token=${AVATAR_TOKEN}`;
		const response = await axios.get(url, { responseType: "arraybuffer", timeout: 15000 });
		return await loadImage(Buffer.from(response.data));
	}
	catch (error) {
		return null;
	}
}

function fitText(ctx, text, maxWidth) {
	let value = String(text || "");
	if (ctx.measureText(value).width <= maxWidth) return value;
	while (value.length > 1 && ctx.measureText(value + "…").width > maxWidth) value = value.slice(0, -1);
	return value + "…";
}

function drawAvatar(ctx, avatar, name, x, y, size, ring) {
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
		ctx.fillStyle = "#1b2a45";
		ctx.fillRect(x, y, size, size);
		ctx.fillStyle = "#ffffff";
		ctx.font = `bold ${Math.floor(size * 0.42)}px Arial`;
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillText((String(name || "?").trim().charAt(0) || "?").toUpperCase(), x + radius, y + radius + 2);
		ctx.textBaseline = "alphabetic";
	}
	ctx.restore();

	ctx.beginPath();
	ctx.arc(x + radius, y + radius, radius + 2, 0, Math.PI * 2);
	ctx.strokeStyle = ring;
	ctx.lineWidth = 3;
	ctx.stroke();
}

function drawTile(ctx, x, y, w, h, label, value, accent) {
	ctx.fillStyle = "rgba(255,255,255,0.05)";
	roundRect(ctx, x, y, w, h, 16);
	ctx.fill();

	ctx.fillStyle = accent;
	roundRect(ctx, x + 16, y + 14, w - 32, 4, 2);
	ctx.fill();

	ctx.textAlign = "center";
	ctx.fillStyle = "#ffffff";
	ctx.font = "bold 32px Arial";
	ctx.fillText(String(value), x + w / 2, y + 58);

	ctx.fillStyle = "rgba(255,255,255,0.5)";
	ctx.font = "bold 12px Arial";
	ctx.fillText(label, x + w / 2, y + 88);
}

/* ————————————————— رسم البطاقة ————————————————— */

function drawCard({ name, userID, money, played, won, winRate, streak, biggestWin, avatar }) {
	const canvas = createCanvas(WIDTH, HEIGHT);
	const ctx = canvas.getContext("2d");

	const background = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
	background.addColorStop(0, "#070b14");
	background.addColorStop(1, "#101d36");
	ctx.fillStyle = background;
	ctx.fillRect(0, 0, WIDTH, HEIGHT);

	ctx.fillStyle = "rgba(245,197,66,0.08)";
	ctx.beginPath();
	ctx.arc(WIDTH - 60, 40, 190, 0, Math.PI * 2);
	ctx.fill();
	ctx.fillStyle = "rgba(79,195,247,0.06)";
	ctx.beginPath();
	ctx.arc(60, HEIGHT - 40, 180, 0, Math.PI * 2);
	ctx.fill();

	// إطار البطاقة
	ctx.fillStyle = "rgba(255,255,255,0.035)";
	roundRect(ctx, 30, 30, WIDTH - 60, HEIGHT - 60, 26);
	ctx.fill();
	ctx.strokeStyle = "rgba(255,255,255,0.10)";
	ctx.lineWidth = 1.5;
	roundRect(ctx, 30, 30, WIDTH - 60, HEIGHT - 60, 26);
	ctx.stroke();

	// العنوان الصغير
	ctx.textAlign = "left";
	ctx.fillStyle = "rgba(255,255,255,0.42)";
	ctx.font = "bold 14px Arial";
	ctx.fillText("A C A R D   •   E C O N O M Y", 70, 82);

	// الصورة والاسم
	drawAvatar(ctx, avatar, name, 70, 104, 96, GOLD);

	ctx.textAlign = "left";
	ctx.fillStyle = "#ffffff";
	ctx.font = "bold 30px Arial";
	ctx.fillText(fitText(ctx, name, 380), 190, 145);

	ctx.fillStyle = "rgba(255,255,255,0.40)";
	ctx.font = "15px Arial";
	ctx.fillText(`ID ${userID}`, 190, 172);

	// الرصيد
	ctx.textAlign = "right";
	ctx.fillStyle = "rgba(255,255,255,0.42)";
	ctx.font = "bold 13px Arial";
	ctx.fillText("BALANCE", WIDTH - 70, 108);

	const balanceText = "$" + eco.fmt(money);
	let balanceSize = 46;
	ctx.font = `bold ${balanceSize}px Arial`;
	while (balanceSize > 22 && ctx.measureText(balanceText).width > 340) {
		balanceSize -= 2;
		ctx.font = `bold ${balanceSize}px Arial`;
	}
	ctx.fillStyle = GOLD;
	ctx.fillText(balanceText, WIDTH - 70, 158);

	// فاصل
	ctx.strokeStyle = "rgba(255,255,255,0.10)";
	ctx.lineWidth = 1;
	ctx.beginPath();
	ctx.moveTo(70, 228);
	ctx.lineTo(WIDTH - 70, 228);
	ctx.stroke();

	// المربّعات الأربعة
	const tileW = 185;
	const tileH = 108;
	const gap = 20;
	const tiles = [
		{ label: "GAMES PLAYED", value: eco.fmt(played), accent: CYAN },
		{ label: "GAMES WON", value: eco.fmt(won), accent: GREEN },
		{ label: "WIN RATE", value: winRate + "%", accent: GOLD },
		{ label: "BEST WIN", value: "$" + eco.short(biggestWin), accent: PURPLE }
	];
	tiles.forEach((tile, index) => {
		drawTile(ctx, 70 + index * (tileW + gap), 250, tileW, tileH, tile.label, tile.value, tile.accent);
	});

	// سلسلة daily
	ctx.textAlign = "left";
	ctx.fillStyle = "rgba(255,255,255,0.42)";
	ctx.font = "bold 13px Arial";
	ctx.fillText("DAILY STREAK", 70, 400);

	ctx.textAlign = "right";
	ctx.fillStyle = GOLD;
	ctx.font = "bold 15px Arial";
	ctx.fillText(`${streak} / 7`, WIDTH - 70, 400);

	const barX = 70;
	const barY = 412;
	const barW = WIDTH - 140;
	const segments = 7;
	const segGap = 10;
	const segW = (barW - (segments - 1) * segGap) / segments;

	for (let i = 0; i < segments; i++) {
		const x = barX + i * (segW + segGap);
		ctx.fillStyle = i < streak ? GOLD : "rgba(255,255,255,0.08)";
		roundRect(ctx, x, barY, segW, 12, 6);
		ctx.fill();
	}

	// التذييل
	ctx.textAlign = "left";
	ctx.fillStyle = "rgba(255,255,255,0.30)";
	ctx.font = "13px Arial";
	ctx.fillText("PLAY • bet | slot | dice | mines", 70, HEIGHT - 52);

	ctx.textAlign = "right";
	ctx.fillStyle = "rgba(255,255,255,0.30)";
	ctx.font = "13px Arial";
	ctx.fillText("Acard Bot • Economy v2", WIDTH - 70, HEIGHT - 52);

	return canvas;
}

/* ————————————————— المنطق ————————————————— */

module.exports.onStart = async function ({ api, event, usersData }) {
	const { senderID, threadID, messageID } = event;

	const me = await usersData.get(senderID);
	const data = (me && me.data) || {};
	const stats = data.stats || {};

	const money = eco.toMoney(data.money);
	const played = eco.num(data.gamesPlayed, eco.num(stats.gamesPlayed, 0));
	const won = eco.num(data.gamesWon, eco.num(stats.gamesWon, 0));
	const winRate = played > 0 ? Math.round((won / played) * 100) : 0;
	const streak = Math.min(7, Math.max(0, eco.num(data.dailyStreak, 0)));
	const biggestWin = eco.num(stats.biggestWin, 0);
	const name = (me && me.name) || "عضو";

	const caption =
		`💰 | بطاقة المحفظة\n━━━━━━━━━━━━━━━━━━━\n` +
		`👤 | ${name}\n` +
		`💳 | الرصيد: ${eco.fmt(money)}$\n` +
		`🎮 | الجولات: ${eco.fmt(played)} — الفوز: ${eco.fmt(won)} (${winRate}%)\n` +
		`🔥 | سلسلة daily: ${streak} / 7\n` +
		`🏆 | أكبر ربح: ${eco.fmt(biggestWin)}$\n` +
		`━━━━━━━━━━━━━━━━━━━\n` +
		`💡 | أقصى رهان = 20% من رصيدك`;

	try {
		const avatar = await loadAvatar(senderID);
		const canvas = drawCard({ name, userID: senderID, money, played, won, winRate, streak, biggestWin, avatar });

		const cacheDir = path.join(__dirname, "cache");
		await fs.ensureDir(cacheDir);
		const filePath = path.join(cacheDir, `wallet_${senderID}_${Date.now()}.png`);
		await fs.writeFile(filePath, canvas.toBuffer("image/png"));

		await api.sendMessage({ body: caption, attachment: fs.createReadStream(filePath) }, threadID, messageID);
		setTimeout(() => fs.remove(filePath).catch(() => {}), 15000);
	}
	catch (error) {
		console.error("Wallet image error:", error);
		return api.sendMessage(caption, threadID, messageID);
	}
};
