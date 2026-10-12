const axios = require("axios");

module.exports.config = {
  name: "quiz",
  version: "3.0",
  author: "Acard",
  role: 0,
  category: "economy",
  countDown: 10,
  shortDescription: "مسابقة أسئلة عربية - اربح عملات",
  guide: "{prefix}quiz"
};

const usedQuestions = new Map();

// 🎯 أسئلة عربية متنوعة (ثقافة، تاريخ، علوم، جغرافيا، دين)
const arabicQuestions = [
  // ثقافة وتاريخ
  { question: "ما هي عاصمة المملكة العربية السعودية؟", options: ["أ. الرياض", "ب. جدة", "ج. مكة المكرمة", "د. الدمام"], answer: "أ" },
  { question: "من هو مؤسس الدولة الأموية؟", options: ["أ. عمر بن الخطاب", "ب. معاوية بن أبي سفيان", "ج. علي بن أبي طالب", "د. عثمان بن عفان"], answer: "ب" },
  { question: "في أي عام هاجر النبي محمد ﷺ إلى المدينة؟", options: ["أ. 620 م", "ب. 622 م", "ج. 624 م", "د. 626 م"], answer: "ب" },
  { question: "من هو أول الخلفاء الراشدين؟", options: ["أ. عمر بن الخطاب", "ب. عثمان بن عفان", "ج. أبو بكر الصديق", "د. علي بن أبي طالب"], answer: "ج" },
  { question: "في أي معركة انتصر صلاح الدين الأيوبي على الصليبيين؟", options: ["أ. مؤتة", "ب. حطين", "ج. اليرموك", "د. القادسية"], answer: "ب" },
  { question: "ما هي أطول حضارة في التاريخ؟", options: ["أ. الرومانية", "ب. الفرعونية", "ج. اليونانية", "د. الفارسية"], answer: "ب" },
  { question: "من هو مؤلف كتاب 'الجمهورية'؟", options: ["أ. أرسطو", "ب. سقراط", "ج. أفلاطون", "د. ابن رشد"], answer: "ج" },
  { question: "كم عدد السور في القرآن الكريم؟", options: ["أ. 99 سورة", "ب. 114 سورة", "ج. 120 سورة", "د. 104 سورة"], answer: "ب" },
  { question: "ما هي عاصمة الدولة العباسية؟", options: ["أ. دمشق", "ب. بغداد", "ج. القاهرة", "د. الكوفة"], answer: "ب" },
  { question: "من هو القائد الذي فتح القدس؟", options: ["أ. صلاح الدين الأيوبي", "ب. عمر بن الخطاب", "ج. خالد بن الوليد", "د. عمرو بن العاص"], answer: "ب" },
  
  // علوم
  { question: "ما هو أكبر كوكب في المجموعة الشمسية؟", options: ["أ. الأرض", "ب. المريخ", "ج. المشتري", "د. زحل"], answer: "ج" },
  { question: "ما هو الغاز الأكثر وفرة في الغلاف الجوي للأرض؟", options: ["أ. الأكسجين", "ب. الهيدروجين", "ج. النيتروجين", "د. ثاني أكسيد الكربون"], answer: "ج" },
  { question: "ما هو العنصر الكيميائي الذي رمزه O؟", options: ["أ. الذهب", "ب. الأكسجين", "ج. الفضة", "د. الحديد"], answer: "ب" },
  { question: "كم عدد العظام في جسم الإنسان البالغ؟", options: ["أ. 186 عظمة", "ب. 206 عظمة", "ج. 226 عظمة", "د. 246 عظمة"], answer: "ب" },
  { question: "ما هي وحدة قياس شدة التيار الكهربائي؟", options: ["أ. الفولت", "ب. الأمبير", "ج. الواط", "د. الأوم"], answer: "ب" },
  { question: "ما هو أسرع حيوان بري في العالم؟", options: ["أ. الأسد", "ب. الفهد", "ج. الغزال", "د. الحصان"], answer: "ب" },
  { question: "كم عدد أسنان الإنسان البالغ؟", options: ["أ. 28 سن", "ب. 30 سن", "ج. 32 سن", "د. 34 سن"], answer: "ج" },
  { question: "ما هو الكوكب الأحمر؟", options: ["أ. الزهرة", "ب. المشتري", "ج. المريخ", "د. عطارد"], answer: "ج" },
  
  // جغرافيا
  { question: "ما هو أطول نهر في العالم؟", options: ["أ. الأمازون", "ب. النيل", "ج. المسيسيبي", "د. اليانغتسي"], answer: "ب" },
  { question: "ما هي أكبر قارة في العالم؟", options: ["أ. أفريقيا", "ب. أوروبا", "ج. آسيا", "د. أمريكا الشمالية"], answer: "ج" },
  { question: "ما هي عاصمة اليابان؟", options: ["أ. سيول", "ب. بكين", "ج. طوكيو", "د. بانكوك"], answer: "ج" },
  { question: "كم عدد دول العالم العربي؟", options: ["أ. 20 دولة", "ب. 22 دولة", "ج. 24 دولة", "د. 26 دولة"], answer: "ب" },
  { question: "أين يوجد البحر الميت؟", options: ["أ. بين مصر والسودان", "ب. بين السعودية واليمن", "ج. بين الأردن وفلسطين", "د. بين العراق وإيران"], answer: "ج" },
  { question: "ما هي أكبر جزيرة في العالم؟", options: ["أ. مدغشقر", "ب. جرينلاند", "ج. بورنيو", "د. غينيا الجديدة"], answer: "ب" },
  { question: "ما هي الدولة التي يمر بها خط الإستواء؟", options: ["أ. المغرب", "ب. مصر", "ج. الصومال", "د. تونس"], answer: "ج" },
  
  // متنوع
  { question: "من هي أول امرأة حصلت على جائزة نوبل؟", options: ["أ. ماري كوري", "ب. فلورنس نايتنغيل", "ج. روزا باركس", "د. الأم تيريزا"], answer: "أ" },
  { question: "ما هي اللغة الأكثر تحدثاً في العالم؟", options: ["أ. الإنجليزية", "ب. الإسبانية", "ج. الصينية الماندرين", "د. العربية"], answer: "ج" },
  { question: "في أي عام تم اكتشاف النفط في السعودية؟", options: ["أ. 1932", "ب. 1938", "ج. 1945", "د. 1950"], answer: "ب" },
  { question: "كم عدد ألوان قوس قزح؟", options: ["أ. 5 ألوان", "ب. 6 ألوان", "ج. 7 ألوان", "د. 8 ألوان"], answer: "ج" },
  { question: "ما هو أعمق محيط في العالم؟", options: ["أ. الأطلسي", "ب. الهندي", "ج. الهادئ", "د. المتجمد الشمالي"], answer: "ج" },
  { question: "ما هو الحيوان الذي ينام واقفاً؟", options: ["أ. الجمل", "ب. الفيل", "ج. الحصان", "د. الكلب"], answer: "ج" },
  { question: "كم عدد الساعات في اليوم على كوكب الزهرة؟", options: ["أ. 24 ساعة", "ب. 48 ساعة", "ج. 243 ساعة", "د. 5832 ساعة"], answer: "د" },
  { question: "ما هو أثقل حيوان في العالم؟", options: ["أ. الفيل الأفريقي", "ب. الحوت الأزرق", "ج. فرس النهر", "د. وحيد القرن"], answer: "ب" },
  { question: "ما هي عاصمة أستراليا؟", options: ["أ. سيدني", "ب. ملبورن", "ج. كانبرا", "د. بريسبان"], answer: "ج" },
  { question: "في أي عام سقطت الأندلس؟", options: ["أ. 1453", "ب. 1492", "ج. 1517", "د. 1258"], answer: "ب" },
];

module.exports.onStart = async function ({ api, event, usersData }) {
  const { senderID, threadID, messageID } = event;

  // اختيار سؤال عربي عشوائي
  const used = usedQuestions.get(senderID) || new Set();
  
  let quizData = null;
  
  // محاولة اختيار سؤال غير مستخدم
  const availableQuestions = arabicQuestions.filter(q => !used.has(q.question));
  
  if (availableQuestions.length > 0) {
    quizData = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
    used.add(quizData.question);
  } else {
    // إذا تم استخدام كل الأسئلة، نعيد التعيين
    used.clear();
    quizData = arabicQuestions[Math.floor(Math.random() * arabicQuestions.length)];
    used.add(quizData.question);
  }
  
  if (used.size > 100) {
    const first = used.values().next().value;
    used.delete(first);
  }
  usedQuestions.set(senderID, used);

  if (!quizData) {
    return api.sendMessage("❌ حدث خطأ. حاول مرة أخرى.", threadID, messageID);
  }

  const msg = `📝 | مــســابــقــة الــمــعــرفــة\n━━━━━━━━━━━━━━━━━━━━━\n\n❓ سؤال:\n${quizData.question}\n\n🔤 اختر الإجابة الصحيحة:\n\n${quizData.options.join("\n")}\n\n━━━━━━━━━━━━━━━━━━━━━\n⏱ | أجب بأحد الحروف: A - B - C - D\n✅ | الإجابة الصحيحة = +500 دولار\n❌ | الإجابة الخاطئة = -50 دولار`;

  api.sendMessage(msg, threadID, (err, info) => {
    if (err) return;
    global.GoatBot.onReply.set(info.messageID, {
      commandName: "quiz",
      messageID: info.messageID,
      answer: quizData.answer,
      senderID
    });

    // المهلة 60 ثانية
    setTimeout(() => {
      if (global.GoatBot.onReply.has(info.messageID)) {
        global.GoatBot.onReply.delete(info.messageID);
        api.sendMessage("⏰ | انتهى الوقت! لم يجب أحد.", threadID, info.messageID);
      }
    }, 60000);
  }, messageID);
};

module.exports.onReply = async function ({ api, event, usersData, Reply }) {
  const { senderID, threadID, messageID, body } = event;
  const { answer } = Reply;

  const userAnswer = body.trim();

  // قبول الإجابة بالعربي أو الإنجليزي
  const validAnswers = ["أ", "ب", "ج", "د", "ا", "A", "B", "C", "D", "a", "b", "c", "d"];
  if (!validAnswers.includes(userAnswer)) {
    return api.sendMessage("⚠ | يرجى الرد بأحد الحروف: A - B - C - D", threadID, messageID);
  }

  // توحيد الإجابة
  const normalizedAnswer = 
    userAnswer === "A" || userAnswer === "a" ? "أ" :
    userAnswer === "B" || userAnswer === "b" ? "ب" :
    userAnswer === "C" || userAnswer === "c" ? "ج" :
    userAnswer === "D" || userAnswer === "d" ? "د" :
    userAnswer === "ا" ? "أ" : userAnswer;

  global.GoatBot.onReply.delete(Reply.messageID);

  const userData = await usersData.get(senderID);
  let balance = userData?.data?.money ?? 100;

  if (normalizedAnswer === answer) {
    balance += 500;
    await usersData.set(senderID, { data: { ...userData.data, money: balance } });
    return api.sendMessage(
      `✅ | إجــابــة صــحــيــحــة!\n━━━━━━━━━━━━━━━━━\n🎯 | الإجابة الصحيحة: ${answer}\n💰 | ربحت: +500 دولار\n💳 | رصيدك الحالي: ${balance} دولار`,
      threadID, messageID
    );
  } else {
    balance = Math.max(0, balance - 50);
    await usersData.set(senderID, { data: { ...userData.data, money: balance } });
    return api.sendMessage(
      `❌ | إجــابــة خــاطــئــة!\n━━━━━━━━━━━━━━━━━\n🎯 | الإجابة الصحيحة: ${answer}\n💸 | خسرت: -50 دولار\n💳 | رصيدك الحالي: ${balance} دولار`,
      threadID, messageID
    );
  }
};