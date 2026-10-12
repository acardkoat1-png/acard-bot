// ═══════════════════════════════════════════
// 🎮 لعبة السؤال (Q) - نظام النجوم
// ═══════════════════════════════════════════

global.activeQuestions = global.activeQuestions || {};
const activeQuestions = global.activeQuestions;
const STARS_TO_DOLLARS_RATE = 5000;

// ═══════════════════════════════════════════
// 📚 قاعدة بيانات الأسئلة والتلميحات
// ═══════════════════════════════════════════
const QUESTIONS_DB = {
    anime: [
        { answer: "ناروتو", hints: ["نينجا أشقر", "قرية الورق المخفية", "راسبينغان", "هوكاغي", "صديقه ساسكي"] },
        { answer: "ون بيس", hints: ["قبعة قش", "طريق القرصان", "فاكهة الشيطان", "لوفي", "الكنز العظيم"] },
        { answer: "هجوم العمالقة", hints: ["جدران", "عمالقة يأكلون البشر", "إرين", "ميكاسا", "فيلق الاستطلاع"] },
        { answer: "ديث نوت", hints: ["دفتر الموت", "شينيغامي", "رايتو", "لام", "قاتل كيرا"] },
        { answer: "دراغون بول", hints: ["غوكو", "سيان", "سوبر سايان", "كرات التنين", "فيجيتا"] },
        { answer: "فول ميتال ألكيميست", hints: ["إدوارد", "ألفونس", "حجر الفلاسفة", "التكافؤ المكافئ", "الخيمياء"] },
        { answer: "ماي هيرو أكاديميا", hints: ["ديكو", "وان فور أول", "كويرك", "باكوغو", "مدرسة الأبطال"] },
        { answer: "جوجوتسو كايسن", hints: ["إيتادوري", "سكونا", "تعويذة", "غوجو", "طاقة ملعونة"] },
        { answer: "كيميتسو نو يايبا", hints: ["تانجيرو", "نيزوكو", "شياطين", "تنفس الماء", "قتلة الشياطين"] },
        { answer: "بليتش", hints: ["إيتشيغو", "شينيغامي", "زانباكتو", "هولو", "مجتمع الأرواح"] }
    ],
    character: [
        { answer: "لوفي", hints: ["قبعة قش", "مطاط", "ملك القراصنة", "غومو غومو", "طاقم قبعة القش"] },
        { answer: "ناروتو", hints: ["أشقر", "رامين", "هوكاغي", "شادو كلون", "الوحش ذو الذيول"] },
        { answer: "غوكو", hints: ["سايان", "سحابة", "كاميهاميها", "كرات التنين", "أشقر"] },
        { answer: "زورو", hints: ["ثلاث سيوف", "سيف", "طاقم لوفي", "نوم", "خصم ميهوك"] },
        { answer: "إيتاشي", hints: ["أوتشيها", "مانغيكيو", "كاكاشي", "شينوبي", "مذبح"] },
        { answer: "ميكاسا", hints: ["أكرمان", "وشاح", "جيش", "إرين", "عمالقة"] },
        { answer: "ليفاي", hints: ["أقوى جندي", "فيلق", "عمالقة", "نظافة", "ريث"] },
        { answer: "إرين", hints: ["عمالقة", "متحرر", "جدران", "مفتاح", "أب"] },
        { answer: "لايت", hints: ["كيرا", "دفتر", "ذكي", "شينيغامي", "موت"] },
        { answer: "إل", hints: ["محقق", "حلويات", "غريب", "خصم كيرا", "ذكي"] }
    ],
    football: [
        { answer: "ميسي", hints: ["أرجنتيني", "برشلونة", "كأس العالم", "10", "قدم يسرى"] },
        { answer: "رونالدو", hints: ["برتغالي", "ريال مدريد", "يويفا", "7", "صاروخ"] },
        { answer: "نيمار", hints: ["برازيلي", "باريس", "رقص", "10", "سانتوس"] },
        { answer: "مبابي", hints: ["فرنسي", "باريس", "سريع", "كأس العالم", "صغير"] },
        { answer: "صلاح", hints: ["مصري", "ليفربول", "ملك", "قدم يسرى", "بريميرليغ"] },
        { answer: "بنزيما", hints: ["فرنسي", "ريال مدريد", "كرة ذهبية", "9", "مهاجم"] },
        { answer: "ليفاندوفسكي", hints: ["بولندي", "برشلونة", "هداف", "9", "بايرن"] },
        { answer: "هالاند", hints: ["نرويجي", "مانشستر سيتي", "عملاق", "هداف", "بريميرليغ"] },
        { answer: "دي بروين", hints: ["بلجيكي", "مانشستر سيتي", "تمريرات", "وسط", "شعر أحمر"] },
        { answer: "مودريتش", hints: ["كرواتي", "ريال مدريد", "كرة ذهبية", "وسط", "كأس العالم"] }
    ],
    country: [
        { answer: "المغرب", hints: ["شمال أفريقيا", "الدار البيضاء", "الكسكس", "الأطلس", "العربية"] },
        { answer: "مصر", hints: ["شمال أفريقيا", "القاهرة", "الأهرامات", "النيل", "الفراعنة"] },
        { answer: "السعودية", hints: ["شبه الجزيرة العربية", "الرياض", "الكعبة", "نفط", "الصحراء"] },
        { answer: "اليابان", hints: ["شرق آسيا", "طوكيو", "ساموراي", "أنمي", "سوشي"] },
        { answer: "فرنسا", hints: ["أوروبا", "باريس", "برج إيفل", "كرواسون", "ثورة"] },
        { answer: "البرازيل", hints: ["أمريكا الجنوبية", "برازيليا", "سامبا", "أمازون", "قهوة"] },
        { answer: "كندا", hints: ["أمريكا الشمالية", "أوتاوا", "قيقب", "ثلج", "بحيرات"] },
        { answer: "ألمانيا", hints: ["أوروبا", "برلين", "جدار", "بيرة", "سيارات"] },
        { answer: "إيطاليا", hints: ["أوروبا", "روما", "بيتزا", "كولوسيوم", "موضة"] },
        { answer: "إسبانيا", hints: ["أوروبا", "مدريد", "مصارعة ثيران", "باييا", "لامركزية"] }
    ],
    games: [
        { answer: "ماينكرافت", hints: ["مكعبات", "ستيف", "كريبر", "نجاة", "بناء"] },
        { answer: "فورتنايت", hints: ["باتل رويال", "بناء", "رقصات", "جزيرة", "باص"] },
        { answer: "فيفا", hints: ["كرة قدم", "أولتيميت تيم", "فريق", "هدف", "إي آ سبورتس"] },
        { answer: "كول أوف ديوتي", hints: ["حرب", "مودرن وورفير", "طور", "أسلحة", "فريق"] },
        { answer: "ببجي", hints: ["باتل رويال", "دجاجة", "جوال", "طور", "إسقاط"] },
        { answer: "ليج أوف ليجيندز", hints: ["موبا", "أبطال", "سومونر", "ممر", "طور"] },
        { answer: "فالورانت", hints: ["تكتيكي", "أبطال", "قنابل", "تصويب", "رايت"] },
        { answer: "جينشين إمباكت", hints: ["أنمي", "عالم مفتوح", "شخصيات", "عناصر", "غاشا"] },
        { answer: "إلدن رينغ", hints: ["سولز", "عالم مفتوح", "قاتل", "زعيم", "جرس"] },
        { answer: "ذا ليجند أوف زيلدا", hints: ["مغامرة", "لينك", "سيف", "هيرول", "أميرة"] }
    ]
};

function getRandomItem(category) {
    const items = QUESTIONS_DB[category];
    if (!items) return null;
    return items[Math.floor(Math.random() * items.length)];
}

function getCategoryName(category) {
    const names = { anime: "🎌 أنمي", character: "👤 شخصية أنمي", football: "⚽ لاعب كرة قدم", country: "🌍 دولة", games: "🎮 لعبة فيديو" };
    return names[category] || category;
}

// ═══════════════════════════════════════════
// ⏱️ دالة التلميح التالي
// ═══════════════════════════════════════════
async function nextHint(gameId, message) {
    const game = activeQuestions[gameId];
    if (!game) return;

    if (game.currentHint >= game.totalHints) {
        await message.reply(`⏰ | انتهت الجولة! الإجابة: ${game.answer}`);
        delete activeQuestions[gameId];
        return;
    }

    const hint = game.hints[game.currentHint];
    const hintNum = game.currentHint + 1;
    await message.reply(`💡 | التلميح ${hintNum}/${game.totalHints}\n🔍 ${hint}\n⏰ | 30 ثانية للتلميح التالي`);
    game.currentHint++;

    if (game.currentHint < game.totalHints) {
        game.timer = setTimeout(() => nextHint(gameId, message), 30000);
    } else {
        game.timer = setTimeout(() => nextHint(gameId, message), 30000);
    }
}

module.exports = {
    config: {
        name: "q",
        aliases: ["سؤال", "quiz2", "س"],
        version: "2.0",
        author: "Acard",
        countDown: 5,
        role: 0,
        shortDescription: { ar: "❓ لعبة التخمين - اربح نجوم" },
        category: "game",
        guide: { ar: "{pn} <الفئة> : ابدأ\n{pn} hint : تلميح فوري\n{pn} stars : رصيدك\n{pn} top : الصدارة\n{pn} convert <عدد> : تحويل" }
    },

    onStart: async function ({ message, event, args, usersData }) {
        const { senderID, threadID } = event;
        const action = args[0]?.toLowerCase();

        if (!action || action === "stars" || action === "نجوم") {
            const userData = await usersData.get(senderID);
            const stars = userData?.data?.stars || 0;
            return message.reply(`⭐ | نجومك: ${stars} (1⭐ = ${STARS_TO_DOLLARS_RATE.toLocaleString()}$)`);
        }

        if (action === "top" || action === "صدارة") {
            const allUsers = await usersData.getAll();
            const sorted = allUsers.filter(u => (u.data?.stars || 0) > 0).sort((a, b) => (b.data?.stars || 0) - (a.data?.stars || 0)).slice(0, 10);
            if (!sorted.length) return message.reply("⭐ | لا أحد يملك نجوماً!");
            const medals = ["🥇", "🥈", "🥉"];
            const list = sorted.map((u, i) => `${medals[i] || "•"} ${u.name}: ${u.data.stars} ⭐`).join("\n");
            return message.reply(`🏆 | لــوحــة الــنــجــوم\n${list}`);
        }

        if (action === "convert" || action === "تحويل") {
            const amount = parseInt(args[1]);
            if (!amount || amount <= 0) return message.reply("⚠️ | أدخل عدد النجوم");
            const userData = await usersData.get(senderID);
            const stars = userData?.data?.stars || 0;
            if (stars < amount) return message.reply(`❌ | لديك ${stars} ⭐ فقط`);
            const dollars = amount * STARS_TO_DOLLARS_RATE;
            const currentMoney = userData?.data?.money || 0;
            await usersData.set(senderID, { ...userData, data: { ...userData.data, stars: stars - amount, money: currentMoney + dollars } });
            return message.reply(`💱 | ${amount}⭐ → ${dollars.toLocaleString()}$\n💰 | رصيدك: ${(currentMoney + dollars).toLocaleString()}$`);
        }

        const validCategories = ["anime", "character", "football", "country", "games"];
        if (!validCategories.includes(action)) return message.reply("⚠️ | اختر: anime, character, football, country, games");

        for (const tid in activeQuestions) {
            if (activeQuestions[tid]?.author === senderID) return message.reply("⚠️ | لديك جولة نشطة!");
        }

        const item = getRandomItem(action);
        if (!item) return message.reply("❌ | خطأ");

        const gameId = `${threadID}_${senderID}_${Date.now()}`;
        activeQuestions[gameId] = {
            author: senderID, threadID, answer: item.answer,
            hints: item.hints, currentHint: 0, totalHints: item.hints.length,
            category: action, prize: item.hints.length * 2, timer: null, gameId
        };

        const game = activeQuestions[gameId];
        await message.reply(`🎮 | الــتــخــمــيــن\n📂 | ${getCategoryName(action)}\n💡 | 1/${game.totalHints}: ${item.hints[0]}\n⏰ | 30s\n💡 | /hint للتخطي\n🏆 | ${game.prize} ⭐`);
        game.currentHint = 1;
        game.timer = setTimeout(() => nextHint(gameId, message), 30000);
    },

    onChat: async function ({ event, message, api, usersData }) {
        const { senderID, threadID, body } = event;
        if (!body) return;
        const cmd = body.trim().toLowerCase();

        // تلميح فوري
        if (cmd === "/hint" || cmd === "hint" || cmd === "تلميح") {
            for (const gameId in activeQuestions) {
                const game = activeQuestions[gameId];
                if (game.author === senderID && game.threadID === threadID && game.currentHint < game.totalHints) {
                    clearTimeout(game.timer);
                    await nextHint(gameId, message);
                    return;
                }
            }
        }
    }
};