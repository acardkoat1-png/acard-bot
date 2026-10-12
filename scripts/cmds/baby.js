const axios = require("axios");
const simsim = "https://simsimi-api-tjb1.onrender.com";
const chatMemory = {};
const userLevels = {};

const typing = async (api, threadID, ms = 2000) => {
  try {
    if (typeof api.sendTypingIndicator === "function") {
      await api.sendTypingIndicator(threadID, true);
      await new Promise(resolve => setTimeout(resolve, ms));
      await api.sendTypingIndicator(threadID, false);
    }
  } catch {}
};

module.exports = {
  config: {
    name: "baby",
    aliases: ["بوت", "bby", "bbz", "صديق", "friend"],
    version: "6.0",
    author: "Acard",
    countDown: 0,
    role: 0,
    shortDescription: "صديق ذكي بالدارجة",
    longDescription: "مساعد ذكي كيتعلم وكيتفاعل معاك",
    category: "ai",
    guide: {
      ar: "كلم البوت مباشرة!\n{pn} teach سؤال - جواب : علمو\n{pn} list : شحال تعلم\n{pn} forget : ينسى المحادثة"
    }
  },

  onStart: async function ({ api, event, args, message, usersData }) {
    const senderID = event.senderID;
    const senderName = await usersData.getName(senderID);
    const threadID = event.threadID;
    const query = args.join(" ").trim().toLowerCase();

    try {
      if (!query || args[0] === "list") {
        try {
          const res = await axios.get(`${simsim}/list`, { timeout: 20000 });
          return message.reply(
            `╭─╼🌟 صاحبك الذكي\n├ 📝 الأسئلة: ${res.data.totalQuestions || 0}\n├ 📦 الأجوبة: ${res.data.totalReplies || 0}\n├ 🧠 المحادثات: ${Object.keys(chatMemory).length}\n╰─╼👤 Acard`
          );
        } catch (e) {
          return message.reply("🧠 | أنا هنا! شنو كاين؟ 😊");
        }
      }

      if (args[0] === "level" || args[0] === "مستوى") {
        const level = userLevels[senderID] || 1;
        const emojis = ["🐣", "🐥", "🦊", "🦉", "🧠"];
        const titles = ["مبتدئ", "صديق", "ذكي", "حكيم", "عبقري"];
        return message.reply(`🧠 | مستواك: ${emojis[level-1]} ${titles[level-1]} (Lv.${level})`);
      }

      if (args[0] === "forget" || args[0] === "نسيان") {
        delete chatMemory[senderID];
        return message.reply("✅ | نسيت كلشي!");
      }

      if (args[0] === "teach" || args[0] === "تعلم" || args[0] === "علم") {
        const parts = query.replace(/^(teach|تعلم|علم)\s+/i, "").split(" - ");
        if (parts.length < 2) return message.reply("💡 | استعمل: baby teach السؤال - الجواب");
        const [ask, ans] = parts.map(s => s.trim());
        try {
          const res = await axios.get(`${simsim}/teach?ask=${encodeURIComponent(ask)}&ans=${encodeURIComponent(ans)}&senderName=${encodeURIComponent(senderName)}`, { timeout: 20000 });
          return message.reply(res.data.message || "✅ | تعلمت!");
        } catch (e) {
          return message.reply("✅ | تعلمت! جرب تسألني");
        }
      }

      await typing(api, threadID, 2000);
      const memory = chatMemory[senderID] || [];
      const context = memory.slice(-3).join(" | ");
      const fullQuery = context ? `${context} | ${query}` : query;
      
      const res = await axios.get(`${simsim}/simsimi?text=${encodeURIComponent(fullQuery)}&senderName=${encodeURIComponent(senderName)}`, { timeout: 25000 });
      let responses = Array.isArray(res.data.response) ? res.data.response : [res.data.response || "همم، عاود قوليا 😊"];
      
      for (const r of responses) {
        await message.reply(r);
      }

      if (!chatMemory[senderID]) chatMemory[senderID] = [];
      chatMemory[senderID].push(query);
      if (chatMemory[senderID].length > 5) chatMemory[senderID].shift();
      if (!userLevels[senderID]) userLevels[senderID] = 1;
      userLevels[senderID] = Math.min(5, userLevels[senderID] + 0.1);

    } catch (err) {
      message.reply("😅 | معليش، عاود قوليا مافهمتكش");
    }
  },

  onChat: async function ({ api, event, message, usersData }) {
    const raw = event.body ? event.body.toLowerCase().trim() : "";
    if (!raw) return;

    const senderID = event.senderID;
    const senderName = await usersData.getName(senderID);
    const threadID = event.threadID;

    // الرد على المنشن
    if (event.mentions && Object.keys(event.mentions).includes(api.getCurrentUserID())) {
      const cleanText = raw.replace(/@البوت|@بوت|@baby|@صديق/gi, "").trim();
      const query = cleanText || "ها أنا";
      
      await typing(api, threadID, 2000);
      const memory = chatMemory[senderID] || [];
      const context = memory.slice(-3).join(" | ");
      const fullQuery = context ? `${context} | ${query}` : query;
      
      try {
        const res = await axios.get(`${simsim}/simsimi?text=${encodeURIComponent(fullQuery)}&senderName=${encodeURIComponent(senderName)}`, { timeout: 20000 });
        const replies = Array.isArray(res.data.response) ? res.data.response : [res.data.response || "شنو كاين؟ 😊"];
        for (const r of replies) {
          await message.reply(r);
        }
      } catch (e) {
        const defaults = [
          "ها أنا! شنو بغيتي؟ 🙋‍♂️",
          "جيت جيت! شنو كاين؟ 😎",
          "سمعت منشن... شنو خبار؟ 🫡",
          "أنا هنا! عطيني أمر 🤔",
          "ها أنا ذا! شنو كاين؟ 😊"
        ];
        await message.reply(defaults[Math.floor(Math.random() * defaults.length)]);
      }

      if (!chatMemory[senderID]) chatMemory[senderID] = [];
      chatMemory[senderID].push(raw);
      if (chatMemory[senderID].length > 5) chatMemory[senderID].shift();
      if (!userLevels[senderID]) userLevels[senderID] = 1;
      userLevels[senderID] = Math.min(5, userLevels[senderID] + 0.1);
      return;
    }

    // كلمات مفتاحية بالدارجة
    const triggers = {
      "صباح": ["صباح النور! ☀️", "صباحو! شنو كاين؟ 😊", "صباح الخير! طاقتك كيف؟ ⚡"],
      "مساء": ["مساء النور! 🌙", "مساء الخير! نهارك كان كيف؟ 😴"],
      "سلام": ["وعليكم السلام! 🙋‍♂️", "سلام! شنو خبار؟ 😊", "أهلاً! كيفاش نتينا؟ 💫"],
      "ليل": ["تصبح على خير! 🌙", "ليلة سعيدة! نعس مزيان 😴"],
      "شنو": ["شنو شنو؟ 😂", "ها أنا كانفكر... 🤔"],
      "نكتة": ["واحد قلو ليه نتا غبي قالو أنا فنان 😂", "جوج حيطان... لا ماشي هي 😅"],
      "حزين": ["علاش؟ شنو وقع؟ 🥺", "الله يفرجها عليك 🙏"],
      "فرحان": ["مالا خبر مزيان! 🎉", "هات شي فرحة 💃"],
      "اكل": ["شنو كليتي؟ 🍽️", "أنا جوعان ونتا كاتكلم على الأكل 😋"],
      "نعس": ["سير نعس مزيان 😴", "تصبح على خير! 🌙"],
      "باي": ["بالسلامة! تهلا فراسك 👋", "الله يحفظك! 💫"],
      "كيفاش": ["ها أنا مزيان! ونتا؟ 😊", "الحمد لله! ونتا؟ 🙏"],
      "شكرا": ["بلاجميل! 😊", "مرحبا! 💕"],
      "ههه": ["😂😂😂", "شنو كيضحك؟ 🤣"]
    };

    for (const [keyword, replies] of Object.entries(triggers)) {
      if (raw.includes(keyword)) {
        const reply = replies[Math.floor(Math.random() * replies.length)];
        await message.reply(reply);
        return;
      }
    }
  }
};