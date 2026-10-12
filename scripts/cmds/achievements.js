const { createCanvas, loadImage, registerFont } = require("canvas");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

// ═══════════════════════════════════════════
// ✅ 1. مكتبة الإنجازات العشرة
// ═══════════════════════════════════════════
const ACHIEVEMENTS = [
  { id: 1, name: "كسرت الصمت", desc: "أرسل أول رسالة في المجموعة", prize: "10,000", icon: "❝", tier: "bronze" },
  { id: 2, name: "مدمن القمار", desc: "لعب 1,000 مرة في ألعاب الحظ", prize: "100M", icon: "♠", tier: "bronze" },
  { id: 3, name: "ملياردير صعلوك", desc: "وصل رصيدك إلى 1,000,000,000", prize: "200M", icon: "♦", tier: "bronze" },
  { id: 4, name: "شيخ الشيوخ", desc: "وصل إلى المستوى 100", prize: "150M", icon: "♚", tier: "silver" },
  { id: 5, name: "ملك القلوب", desc: "احتلال المركز الأول في لوحة الأغنياء", prize: "300M", icon: "♥", tier: "silver" },
  { id: 6, name: "ابن الحظ", desc: "100 فوز متتالي في ألعاب الحظ", prize: "400M", icon: "♛", tier: "silver" },
  { id: 7, name: "مدمن تسوق", desc: "اشترى 5 ألقاب من المتجر", prize: "120M", icon: "♞", tier: "gold" },
  { id: 8, name: "مخرب الكنيات", desc: "غير كنية 3 أشخاص مختلفين", prize: "180M", icon: "♟", tier: "gold" },
  { id: 9, name: "ثرثار الكون", desc: "أرسل 10,000 رسالة", prize: "250M", icon: "♤", tier: "gold" },
  { id: 10, name: "الأسطورة الخالدة", desc: "أكمل جميع الإنجازات التسعة", prize: "1B", icon: "♢", tier: "diamond" }
];

function getTierColors(tier) {
    if (tier === "bronze") return { main: "#cd7f32", glow: "rgba(205,127,50,0.4)", bg: "#2d1f0f" };
    if (tier === "silver") return { main: "#a0a0a0", glow: "rgba(160,160,160,0.4)", bg: "#1a1a1a" };
    if (tier === "gold")   return { main: "#ffd700", glow: "rgba(255,215,0,0.4)", bg: "#2d2600" };
    return { main: "#b9f2ff", glow: "rgba(185,242,255,0.6)", bg: "#0a1a2e" }; // diamond
}

// ═══════════════════════════════════════════
// ✅ 2. دالة فحص الإنجازات
// ═══════════════════════════════════════════
function checkAchievements(userData, allUsers) {
    const data = userData?.data || {};
    const money = data.money || 0;
    const games = data.gamesPlayed || 0;
    const level = data.level || 0;
    const msgCount = data.msgCount || 0;
    const inventory = data.inventory || [];
    const nickChanges = data.nickChanges || 0;
    const consecutiveWins = data.consecutiveWins || 0;
    const wasFirst = data.wasFirst || false;
    const wasFirstPlace = data.wasFirstPlace || false;

    const completed = [];
    const progress = {};

    progress[1] = wasFirst ? 100 : 0;
    if (wasFirst) completed.push(1);

    progress[2] = Math.min(100, Math.floor((games / 1000) * 100));
    if (games >= 1000) completed.push(2);

    progress[3] = Math.min(100, Math.floor((money / 1000000000) * 100));
    if (money >= 1000000000) completed.push(3);

    progress[4] = Math.min(100, Math.floor((level / 100) * 100));
    if (level >= 100) completed.push(4);

    progress[5] = wasFirstPlace ? 100 : 0;
    if (wasFirstPlace) completed.push(5);

    progress[6] = Math.min(100, Math.floor((consecutiveWins / 100) * 100));
    if (consecutiveWins >= 100) completed.push(6);

    const titlesCount = inventory.filter(i => i.type === "title").length;
    progress[7] = Math.min(100, Math.floor((titlesCount / 5) * 100));
    if (titlesCount >= 5) completed.push(7);

    progress[8] = Math.min(100, Math.floor((nickChanges / 3) * 100));
    if (nickChanges >= 3) completed.push(8);

    progress[9] = Math.min(100, Math.floor((msgCount / 10000) * 100));
    if (msgCount >= 10000) completed.push(9);

    progress[10] = completed.length >= 9 ? 100 : Math.floor((completed.length / 9) * 100);
    if (completed.length >= 9) completed.push(10);

    return { completed, progress };
}

// ═══════════════════════════════════════════
// ✅ 3. دالة رسم كل الإنجازات
// ═══════════════════════════════════════════
async function drawAllAchievements(userID, userName, userData, allUsers, usersData, api) {
    const { completed, progress } = checkAchievements(userData, allUsers);
    const cols = 5, rows = 2;
    const cardW = 320, cardH = 300, gap = 20;
    const padding = 30;
    const W = cols * cardW + (cols - 1) * gap + padding * 2;
    const H = rows * cardH + (rows - 1) * gap + padding * 2 + 100;

    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext("2d");

    // خلفية
    ctx.fillStyle = "#0d1117"; ctx.fillRect(0, 0, W, H);
    ctx.font = "bold 46px Tahoma"; ctx.fillStyle = "#ffffff"; ctx.textAlign = "center";
    ctx.fillText(`🏆 إنجـازات ${userName}`, W/2, 65);

    for (let i = 0; i < 10; i++) {
        const ach = ACHIEVEMENTS[i];
        const col = i % cols, row = Math.floor(i / cols);
        const x = padding + col * (cardW + gap), y = 100 + row * (cardH + gap);
        const isCompleted = completed.includes(ach.id);
        const pct = progress[ach.id] || 0;
        const { main, glow, bg } = getTierColors(ach.tier);

        // بطاقة
        ctx.fillStyle = isCompleted ? bg : "#161b22";
        ctx.fillRect(x, y, cardW, cardH);
        ctx.strokeStyle = isCompleted ? main : "#30363d";
        ctx.lineWidth = isCompleted ? 4 : 1;
        ctx.strokeRect(x, y, cardW, cardH);
        if (isCompleted) {
            ctx.shadowColor = glow; ctx.shadowBlur = 12;
            ctx.strokeRect(x, y, cardW, cardH);
            ctx.shadowColor = "transparent"; ctx.shadowBlur = 0;
        }

        // أيقونة
        ctx.font = "bold 64px Tahoma"; ctx.fillStyle = isCompleted ? main : "#555";
        ctx.textAlign = "center";
        ctx.fillText(ach.icon, x + cardW/2, y + 85);

        // اسم
        ctx.font = "bold 24px Tahoma"; ctx.fillStyle = isCompleted ? "#ffffff" : "#8b949e";
        ctx.fillText(ach.name, x + cardW/2, y + 140);

        // شريط تقدم
        const barX = x + 30, barY = y + 170, barW = cardW - 60, barH = 16;
        ctx.fillStyle = "#21262d"; ctx.fillRect(barX, barY, barW, barH);
        ctx.fillStyle = isCompleted ? main : "#58a6ff";
        ctx.fillRect(barX, barY, barW * (pct / 100), barH);
        ctx.font = "bold 16px Tahoma"; ctx.fillStyle = "#ffffff";
        ctx.fillText(`${pct}%`, x + cardW/2, barY + 32);

        // جائزة
        ctx.font = "bold 20px Tahoma"; ctx.fillStyle = main;
        ctx.fillText(`💰 ${ach.prize}`, x + cardW/2, y + cardH - 30);

        if (isCompleted) {
            ctx.fillStyle = main; ctx.font = "bold 18px Tahoma";
            ctx.fillText("✅ مكتمل", x + cardW/2, y + cardH - 65);
        }
    }

    const dir = path.join(__dirname, "cache");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const fp = path.join(dir, `ach_all_${userID}.png`);
    fs.writeFileSync(fp, canvas.toBuffer("image/png"));
    return fp;
}

// ═══════════════════════════════════════════
// ✅ 4. دالة رسم إنجاز واحد مكبر
// ═══════════════════════════════════════════
async function drawSingleAchievement(userID, userName, ach, allUsers, usersData, api) {
    const W = 750, H = 700;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext("2d");
    const { main, glow, bg } = getTierColors(ach.tier);

    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    
    // توهج خلفي
    ctx.shadowColor = glow; ctx.shadowBlur = 40;
    ctx.font = "bold 160px Tahoma"; ctx.fillStyle = main; ctx.textAlign = "center";
    ctx.fillText(ach.icon, W/2, 240);
    ctx.shadowColor = "transparent"; ctx.shadowBlur = 0;

    ctx.font = "bold 46px Tahoma"; ctx.fillStyle = "#ffffff";
    ctx.fillText(ach.name, W/2, 330);
    ctx.font = "26px Tahoma"; ctx.fillStyle = "#aaaaaa";
    ctx.fillText(ach.desc, W/2, 380);

    // عدد المكملين
    let completedCount = 0;
    for (const u of allUsers) {
        const { completed: uc } = checkAchievements(u, allUsers);
        if (uc.includes(ach.id)) completedCount++;
    }
    const totalUsers = allUsers.length || 1;
    const globalPct = Math.round((completedCount / totalUsers) * 100);

    const barX = 100, barY = 440, barW = W - 200, barH = 30;
    ctx.fillStyle = "#21262d"; ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = main;
    ctx.fillRect(barX, barY, barW * (globalPct / 100), barH);
    ctx.font = "bold 22px Tahoma"; ctx.fillStyle = "#ffffff";
    ctx.fillText(`👥 ${completedCount}/${totalUsers} لاعباً (${globalPct}%)`, W/2, barY + 55);

    ctx.font = "bold 34px Tahoma"; ctx.fillStyle = main;
    ctx.fillText(`💰 الجائزة: ${ach.prize}`, W/2, 560);

    ctx.font = "20px Tahoma"; ctx.fillStyle = "#555555";
    ctx.fillText("Acard Bot • Achievements", W/2, H - 30);

    const dir = path.join(__dirname, "cache");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const fp = path.join(dir, `ach_single_${userID}_${ach.id}.png`);
    fs.writeFileSync(fp, canvas.toBuffer("image/png"));
    return fp;
}

// ═══════════════════════════════════════════
// ✅ 5. الأوامر
// ═══════════════════════════════════════════
module.exports = {
    config: {
        name: "achievements",
        aliases: ["achieve", "انجازات", "اتشيفمنت"],
        version: "2.0",
        author: "Acard",
        countDown: 5,
        role: 0,
        shortDescription: { ar: "🏆 نظام الإنجازات الشخصية" },
        category: "economy",
        guide: { ar: "{pn} : كل الإنجازات\n{pn} 1-10 : تفاصيل إنجاز" }
    },

    onStart: async function ({ message, event, args, usersData, api }) {
        const { senderID } = event;
        const userData = await usersData.get(senderID);
        const userName = userData?.name || "لاعب";
        const allUsers = await usersData.getAll();

        const choice = args[0];

        if (choice && !isNaN(choice) && parseInt(choice) >= 1 && parseInt(choice) <= 10) {
            const ach = ACHIEVEMENTS.find(a => a.id === parseInt(choice));
            const filePath = await drawSingleAchievement(senderID, userName, ach, allUsers, usersData, api);
            await message.reply({ attachment: fs.createReadStream(filePath) });
            setTimeout(() => { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); }, 15000);
            return;
        }

        const filePath = await drawAllAchievements(senderID, userName, userData, allUsers, usersData, api);
        await message.reply({ attachment: fs.createReadStream(filePath) });
        setTimeout(() => { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); }, 15000);
    }
};