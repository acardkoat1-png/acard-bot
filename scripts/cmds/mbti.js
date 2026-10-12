const axios = require("axios");

const questions = [
  { q: "في حفلة كبيرة، تفضل:", a: "التحدث مع الجميع وتكوين صداقات جديدة", b: "البقاء مع أصدقائك المقربين فقط", trait: "EI" },
  { q: "عندما تتعلم شيئاً جديداً، تفضل:", a: "التطبيق العملي الفوري", b: "فهم النظرية والمفاهيم أولاً", trait: "SN" },
  { q: "عند اتخاذ قرار مهم، تعتمد على:", a: "المنطق والحقائق الموضوعية", b: "مشاعرك وتأثير القرار على الآخرين", trait: "TF" },
  { q: "أسلوب حياتك اليومي:", a: "منظم ومخطط له مسبقاً", b: "مرن وعفوي حسب الظروف", trait: "JP" },
  { q: "بعد يوم طويل، تستعيد طاقتك بـ:", a: "الخروج مع الأصدقاء", b: "قضاء وقت هادئ بمفردك", trait: "EI" },
  { q: "تهتم أكثر بـ:", a: "التفاصيل والحقائق الملموسة", b: "الصورة الكبيرة والاحتمالات", trait: "SN" },
  { q: "عندما يأتيك شخص بمشكلة:", a: "تقدم له حلولاً عملية مباشرة", b: "تستمع وتتفهم مشاعره أولاً", trait: "TF" },
  { q: "تفضل المشاريع التي:", a: "لها مواعيد وخطوات محددة", b: "تتيح لك الحرية والمرونة", trait: "JP" },
  { q: "في النقاشات الجماعية:", a: "تشارك بنشاط وتعبر عن رأيك فوراً", b: "تفكر جيداً قبل أن تتكلم", trait: "EI" },
  { q: "تثق أكثر في:", a: "التجربة والخبرة المباشرة", b: "الحدس والإلهام الداخلي", trait: "SN" },
  { q: "عند انتقاد عملك، تشعر:", a: "بأنه أمر طبيعي ومفيد للتطوير", b: "بضيق شخصي ولو قليلاً", trait: "TF" },
  { q: "قوائم المهام اليومية:", a: "ضرورية جداً وتلتزم بها", b: "مقيدة وتفضل التدفق الطبيعي", trait: "JP" },
  { q: "بيئة العمل المثالية:", a: "صاخبة وفيها تعاون مستمر", b: "هادئة تستطيع التركيز فيها", trait: "EI" },
  { q: "تصف نفسك بأنك:", a: "واقعي وعملي", b: "خيالي وإبداعي", trait: "SN" },
  { q: "عند خلاف مع صديق:", a: "تناقش الأمر بموضوعية وبرود", b: "تراعي مشاعره وتتجنب الصدام", trait: "TF" },
  { q: "السفر بالنسبة لك:", a: "رحلة مخططة بتفاصيل دقيقة", b: "مغامرة عفوية بلا قيود", trait: "JP" },
  { q: "تجد الطاقة في:", a: "التفاعل مع الناس والأماكن المزدحمة", b: "الأفكار والتأمل الداخلي", trait: "EI" },
  { q: "تهتم أكثر بـ:", a: "ما هو موجود وحقيقي الآن", b: "ما يمكن أن يكون في المستقبل", trait: "SN" },
  { q: "القرار العادل هو:", a: "الذي يطبق القواعد بالتساوي على الجميع", b: "الذي يراعي ظروف كل شخص", trait: "TF" },
  { q: "تشعر بالراحة عندما:", a: "تنهي مهامك وتغلق الملفات", b: "تبقي خياراتك مفتوحة", trait: "JP" }
];

const mbtiDescriptions = {
  "INTJ": { name: "المهندس المعماري", emoji: "🏛️", desc: "استراتيجي عبقري، يرى الصورة الكبيرة ويخطط بدقة متناهية." },
  "INTP": { name: "المنطقي", emoji: "🔬", desc: "مفكر مبدع يحب النظريات والتحليل العميق." },
  "ENTJ": { name: "القائد", emoji: "👑", desc: "قائد جريء يرى الإمكانيات ويحول الرؤى إلى واقع." },
  "ENTP": { name: "المناظر", emoji: "⚡", desc: "مبتكر ذكي يحب التحديات الفكرية والنقاشات." },
  "INFJ": { name: "المناضل", emoji: "🌟", desc: "حالم عملي يسعى لإلهام الآخرين وتغيير العالم." },
  "INFP": { name: "الوسيط", emoji: "🌸", desc: "شاعري رومانسي يبحث دائماً عن المعنى والهدف." },
  "ENFJ": { name: "البطل", emoji: "🦁", desc: "كاريزمي ملهم يضع مصلحة الآخرين فوق كل شيء." },
  "ENFP": { name: "المحارب", emoji: "🦋", desc: "متحمس مبدع يرى الإمكانيات في كل مكان." },
  "ISTJ": { name: "اللوجستي", emoji: "🏆", desc: "موثوق ومنظم، يؤمن بالواجب والمسؤولية." },
  "ISFJ": { name: "المدافع", emoji: "🛡️", desc: "حامٍ دافئ يهتم بمن يحب ويخدمهم بصمت." },
  "ESTJ": { name: "المدير التنفيذي", emoji: "💼", desc: "منظم قوي يؤمن بالنظام والتقاليد والكفاءة." },
  "ESFJ": { name: "القنصل", emoji: "🤝", desc: "اجتماعي حنون يهتم بانسجام المجموعة." },
  "ISTP": { name: "الفيرتوسو", emoji: "🔧", desc: "عملي هادئ يحل المشاكل بيده بكفاءة عالية." },
  "ISFP": { name: "المغامر", emoji: "🎨", desc: "فنان حساس يعيش اللحظة ويتبع قلبه." },
  "ESTP": { name: "رجل الأعمال", emoji: "🚀", desc: "جريء عملي يحب الإثارة والتصرف الفوري." },
  "ESFP": { name: "المسلي", emoji: "🎭", desc: "مرح عفوي يحب الحياة ويجعل الآخرين سعداء." }
};

module.exports = {
  config: {
    name: "mbti",
    version: "3.0",
    author: "Acard",
    countDown: 5,
    role: 0,
    shortDescription: { ar: "🧠 اختبار شخصية MBTI" },
    category: "اختبارات",
    guide: { ar: "{pn} - ابدأ اختبار الشخصية" }
  },

  onStart: async function ({ message, event, getLang }) {
    const { senderID, threadID } = event;
    const q = questions[0];
    const text = `🧠 اختبار الشخصية MBTI\n━━━━━━━━━━━━━━━━━━━\n📊 20 سؤالاً لاكتشاف شخصيتك\n\n❓ السؤال 1/20:\n${q.q}\n\n🅰️ ${q.a}\n🅱️ ${q.b}\n\nاكتب A أو B للإجابة`;

    message.reply(text, (err, info) => {
      if (err || !info) return;
      global.GoatBot.onReply.set(info.messageID, {
        commandName: "mbti",
        messageID: info.messageID,
        author: senderID,
        threadID,
        answers: [],
        currentQ: 0
      });
    });
  },

  onReply: async function ({ event, Reply, message, api }) {
    const { senderID, body, threadID } = event;

    if (senderID !== Reply.author) return;

    const answer = body.trim().toUpperCase();
    if (!["A", "B"].includes(answer)) {
      return message.reply("⚠️ أجب فقط بـ A أو B");
    }

    Reply.answers.push(answer);
    const nextIndex = Reply.currentQ + 1;

    if (nextIndex < questions.length) {
      Reply.currentQ = nextIndex;
      const q = questions[nextIndex];
      const text = `❓ السؤال ${nextIndex + 1}/20:\n${q.q}\n\n🅰️ ${q.a}\n🅱️ ${q.b}\n\nاكتب A أو B`;

      message.reply(text, (err, info) => {
        if (err || !info) return;
        global.GoatBot.onReply.set(info.messageID, {
          commandName: "mbti",
          messageID: info.messageID,
          author: Reply.author,
          threadID,
          answers: Reply.answers,
          currentQ: nextIndex
        });
      });
    } else {
      // حساب النتيجة
      const scores = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
      Reply.answers.forEach((ans, i) => {
        const trait = questions[i].trait;
        if (ans === "A") scores[trait[0]]++;
        else scores[trait[1]]++;
      });

      const type =
        (scores.E >= scores.I ? "E" : "I") +
        (scores.S >= scores.N ? "S" : "N") +
        (scores.T >= scores.F ? "T" : "F") +
        (scores.J >= scores.P ? "J" : "P");

      const info = mbtiDescriptions[type];

      try {
        const imgUrl = `https://www.16personalities.com/static/images/personality-types/avatars/${type.toLowerCase()}.svg`;
        const imgRes = await axios.get(imgUrl, { responseType: "stream" });
        await message.reply({
          body: `🎯 نتيجتك: ${type}\n${info.emoji} ${info.name}\n━━━━━━━━━━━━━━━━━━━\n${info.desc}\n\n✅ انتهى الاختبار!`,
          attachment: imgRes.data
        });
      } catch (e) {
        message.reply(`🎯 نتيجتك: ${type}\n${info.emoji} ${info.name}\n━━━━━━━━━━━━━━━━━━━\n${info.desc}\n\n✅ انتهى الاختبار!`);
      }
    }
  }
};
