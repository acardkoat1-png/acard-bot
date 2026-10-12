module.exports = {
  config: {
    name: "chud",
    aliases: ["war2"],
    version: "2.0",
    author: "Acard",
    role: 2,
    category: "admin",
    guide: {
      ar: "war @(منشن)"
    } 
  },

  onStart: async function ({ api, event, userData, args }) {
      var mention = Object.keys(event.mentions)[0];
    if(!mention) return api.sendMessage("يجب عليك منشن الشخص الذي تريد محاربته", event.threadID);
 let name =  event.mentions[mention];
    var arraytag = []; 
        arraytag.push({id: mention, tag: name});
    var a = function (a) { api.sendMessage(a, event.threadID); }
setTimeout(() => {a({body: "هل أنت مستعد لمواجهتي؟ " + name, mentions: arraytag})}, 3000);
setTimeout(() => {a({body: "لا تعبث معي يا صديقي 🤬 " + " " + name, mentions: arraytag})}, 5000);
setTimeout(() => {a({body: "سأريك من أنا 🤤 " + " " + name, mentions: arraytag})}, 7000);
setTimeout(() => {a({body: "أنت لا شيء بالنسبة لي " + " " + name, mentions: arraytag})}, 9000);
setTimeout(() => {a({body: "هذه بداية النهاية لك " + " " + name, mentions: arraytag})}, 12000);
setTimeout(() => {a({body: "الجميع يشاهدك وأنت تنهار 🤬 " + " " + name, mentions: arraytag})}, 14000);
setTimeout(() => {a({body: "هل نسيت من أنا؟ 😂 " + " " + name, mentions: arraytag})}, 16000);
setTimeout(() => {a({body: "أنت ضعيف جداً 🖕🏿 " + " " + name, mentions: arraytag})}, 18000);
setTimeout(() => {a({body: "استسلم الآن 😂 " + " " + name, mentions: arraytag})}, 20000);
setTimeout(() => {a({body: "لا تقف في طريقي 😍 " + " " + name, mentions: arraytag})}, 22000);
setTimeout(() => {a({body: "أنت مجرد مزحة 🤬 " + " " + name, mentions: arraytag})}, 24000);
setTimeout(() => {a({body: "ما زال هناك وقت للاعتذار 🤣🤣 " + " " + name, mentions: arraytag})}, 26000);
setTimeout(() => {a({body: "كيف حال معنوياتك الآن 😍؟ " + " " + name, mentions: arraytag})}, 28000);
setTimeout(() => {a({body: "سأهزمك بكل سهولة 🥰 " + " " + name, mentions: arraytag})}, 30000);
setTimeout(() => {a({body: "أنت لا تستحق الرد 🥰 " + " " + name, mentions: arraytag})}, 32000);
setTimeout(() => {a({body: "لا تنس من أنت 🤬 " + " " + name, mentions: arraytag})}, 34000);
setTimeout(() => {a({body: "ستتذكر هذا اليوم للأبد 🤣🤣🤣 " + " " + name, mentions: arraytag})}, 36000);
setTimeout(() => {a({body: "أنت منتهي 🥰 " + " " + name, mentions: arraytag})}, 38000);
setTimeout(() => {a({body: "لا تقترب مني 🥵 " + " " + name, mentions: arraytag})}, 40000);
setTimeout(() => {a({body: "ستندم على ما فعلت 🤬🤬 " + " " + name, mentions: arraytag})}, 44000);
setTimeout(() => {a({body: "لا تقف في وجهي 😞🖕🏿 " + " " + name, mentions: arraytag})}, 46000);
setTimeout(() => {a({body: "🖕🏿🖕🏿🖕🏿🖕🏿🖕🏿🖕🏿🖕🏿 " + " " + name, mentions: arraytag})}, 48000);
setTimeout(() => {a({body: "هذه مجرد بداية 🖕🏽🖕🏽🖕🏽 " + " " + name, mentions: arraytag})} , 50000);
setTimeout(() => {a({body: "سأجعلك تندم على هذا اليوم 🤬 " + " " + name, mentions: arraytag})} , 52000);
setTimeout(() => {a({body: "أنت مضحك جداً 😂 " + " " + name, mentions: arraytag})} , 56000);
setTimeout(() => {a({body: "اخرج من هنا 🤬 " + " " + name, mentions: arraytag})} , 58000);
setTimeout(() => {a({body: "هل تشعر بالخوف الآن 🤣🤣🤣؟ " + " " + name, mentions: arraytag})} , 60000);
setTimeout(() => {a({body: "هل تريد المزيد ؟ " + " " + name, mentions: arraytag})} , 62000);
setTimeout(() => {a({body: "لا تقاوم 🤬 "+ " " + name, mentions: arraytag})} , 64000);
setTimeout(() => {a({body: "سأفوز عليك بكل الأساليب 😋😋 " + " " + name, mentions: arraytag})} , 66000);
setTimeout(() => {a({body: "انسحب الآن قبل فوات الأوان 😂😂😂 " + " " + name, mentions: arraytag})} , 68000);
setTimeout(() => {a({body: "هذه المعركة محسومة 🤣🤣🤣 " + " " + name, mentions: arraytag})} , 70000);
setTimeout(() => {a({body: "أنت ضعيف جداً 🤬🤬 " + " " + name, mentions: arraytag})} , 72000);
setTimeout(() => {a({body: "سأدمرك تماماً 🤣🤣 " + " " + name, mentions: arraytag})} , 74000);
setTimeout(() => {a({body: "من أنت لتواجهني؟ 🤬 " + " " + name, mentions: arraytag})} , 76000);
setTimeout(() => {a({body: "عد إلى حيث أتيت 🤬🤬🤬 " + " " + name, mentions: arraytag})} , 78000);
setTimeout(() => {a({body: "وداعاً أيها الضعيف 😍 " + " " + name, mentions: arraytag})} , 80000);
setTimeout(() => {a({body: "لقد هُزمت 😍😍😍 " + " " + name, mentions: arraytag})} , 82000);
setTimeout(() => {a({body: "انتهت اللعبة بالنسبة لك 🤬 " + " " + name, mentions: arraytag})} , 84000);
setTimeout(() => {a({body: "كيف كانت المواجهة يا صغيري 🤣🤣🤣؟ " + " " + name, mentions: arraytag})} , 86000);
  }
};
