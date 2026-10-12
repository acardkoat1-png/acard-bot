module.exports = {
  config: {
    name: "autoreact",
    version: "4.4.0",
    author: "Acard",
    role: 0,
    category: "system",
    shortDescription: "تفاعل تلقائي (إيموجي + نصوص)",
    longDescription: "تفاعل تلقائي مستقر دون أخطاء API صامتة"
  },

  onStart: async function () {},

  onChat: async function ({ api, event }) {
    try {
      const { messageID, body, senderID, threadID } = event;
      if (!messageID || !body) return;

      // لا تتفاعل مع رسائل البوت نفسه
      if (senderID === api.getCurrentUserID()) return;

      // تبريد 2.5 ثانية
      global.__autoReactCooldown ??= {};
      if (
        global.__autoReactCooldown[threadID] &&
        Date.now() - global.__autoReactCooldown[threadID] < 2500
      ) return;

      global.__autoReactCooldown[threadID] = Date.now();

      const text = body.toLowerCase();
      let react = null;

      const categories = [
        { e: ["😂","🤣","😆","😄","😁"], r: "😆" },
        { e: ["😭","😢","🥺","💔"], r: "😢" },
        { e: ["❤️","💖","💘","🥰","😍"], r: "❤️" },
        { e: ["😡","🤬"], r: "😡" },
        { e: ["😮","😱","😲"], r: "😮" },
        { e: ["😎","🔥","💯"], r: "😎" },
        { e: ["👍","👌","🙏"], r: "👍" },
        { e: ["🎉","🥳"], r: "🎉" }
      ];

      const texts = [
        { k: ["haha","lol","ضحك","ههه","😂"], r: "😆" },
        { k: ["sad","حزين","cry","😢"], r: "😢" },
        { k: ["love","حب","عشق","❤️"], r: "❤️" },
        { k: ["غضب","angry","rage"], r: "😡" },
        { k: ["wow","omg","😮"], r: "😮" },
        { k: ["ok","yes","نعم","okay","hmm"], r: "👍" }
      ];

      for (const c of categories) {
        if (c.e.some(x => text.includes(x))) {
          react = c.r;
          break;
        }
      }

      if (!react) {
        for (const t of texts) {
          if (t.k.some(x => text.includes(x))) {
            react = t.r;
            break;
          }
        }
      }

      if (!react) return;

      await new Promise(r => setTimeout(r, 800));

      api.setMessageReaction(react, messageID);

    } catch (e) {}
  }
};
