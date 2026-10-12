const delay = (ms) => new Promise(res => setTimeout(res, ms));

module.exports = {
  config: {
    name: "buzz",
    version: "3.2.0",
    role: 2,
    author: "Acard",
    description: "إرسال سلسلة رسائل مزعجة لشخص معين",
    category: "fun",
    usages: "@منشن",
    cooldowns: 5,
  },

  onStart: async function({ message, event, args, api }) {
    try {
      const mention = Object.keys(event.mentions)[0];
      if (!mention) {
        return message.reply("😅 يجب عليك منشن الشخص الذي تريد إزعاجه أولاً!");
      }

      const name = event.mentions[mention];
      const arraytag = [{ id: mention, tag: name }];

      const messages = [
        `أحبك كثيراً ${name} ❤️`,
        `أنا دائماً بجانبك ${name} 🫶`,
        `اشتقت إليك كثيراً ${name} 😘`,
        `أفكر فيك ${name} 🌸`,
        `أريدك أن تبتسم دائماً ${name} 😊`,
        `أنت مميز جداً عندي ${name} 💝`,
        `أفعل أي شيء من أجلك ${name} 💌`,
        `دائماً أفكر فيك ${name} 🥰`,
        `لا أريد سواك ${name} 💖`,
        `لا أستطيع التفكير بدونك ${name} 😍`,
        `سأحبك للأبد ${name} 💛`,
        `أنتظرك ${name} 🌹`,
        `أنت جميل اليوم أيضاً ${name} 🌸`,
        `أريد رؤية ابتسامتك ${name} 😄`,
        `أريد أن أكون قريباً منك ${name} 🫶`,
        `أتابع أخبارك دائماً ${name} ❤️`,
        `أحلم بك ${name} 🌙`,
        `أريد حبك ${name} 💖`,
        `مازلت أتذكرك اليوم ${name} 💌`,
        `دائماً أفكر بكلامك ${name} 🥰`,
        `أذكرك في كل وقت ${name} 💛`,
        `أريد قضاء الوقت معك ${name} 🌹`,
        `أنت عزيز علي ${name} 💝`,
        `أنا هنا فقط من أجلك ${name} 🫶`,
        `أريد الضحك معك ${name} 😄`,
        `أريد سعادتك ${name} ❤️`,
        `اشتقت إليك كثيراً ${name} 💌`,
        `أدعو لك ${name} 🌸`,
        `أريد مقابلتك ${name} 💖`,
        `سأعود إليك دائماً ${name} 💛`,
        `أشعر بالسعادة عندما أفكر بك ${name} 🥰`,
        `أريد مشاركة أحلامي معك ${name} 🌙`,
        `لن أنساك أبداً ${name} 💝`,
        `ابتسامتك تمنحني القوة ${name} 😄`,
        `سأنتظرك دائماً ${name} 🌹`,
        `أريد مواساتك ${name} 🫶`,
        `أريد حبك للأبد ${name} ❤️`,
        `أتذكرك مراراً ${name} 💌`,
        `أريد القرب منك دوماً ${name} 💖`,
        `قلبي مفتوح لك ${name} 💛`,
        `سأذكرك للأبد ${name} 🥰`,
        `أنت تستحق الحب ${name} 🌸`,
        `سأبقى بجانبك دائماً ${name} 🌙`,
        `أفكر بك كل يوم ${name} 💝`,
        `لا أعرف كلمات تصف حبي لك ${name} 💌`,
        `أريد إضحاكك دائماً ${name} 😄`,
        `أصلي من أجلك ${name} 🌹`,
        `أريد الاستمتاع بكل لحظة معك ${name} 🫶`,
        `سأذكرك إلى الأبد ${name} ❤️`,
        `أنا مليء بحبك ${name} 💖`
      ];

      message.reply(`😎 جاري البدء بإزعاج ${name}...`);

      for (const msg of messages) {
        await delay(3000);
        message.reply({ body: msg, mentions: arraytag });
      }

      message.reply(`💘 انتهى! تم إيصال جميع رسائل الحب إلى ${name} 😅`);
    } catch (err) {
      console.error(err);
      message.reply("❌ حدث خطأ ما، حاول مرة أخرى.");
    }
  }
};
