const fs = require("fs-extra");
const request = require("request");
const path = require("path");

module.exports = {
  config: {
    name: "owner",
    version: "2.0",
    author: "Acard",
    role: 0,
    shortDescription: "معلومات المطور مع صورة",
    category: "Information",
    guide: { ar: "owner" }
  },

  onStart: async function ({ api, event }) {
    const ownerText = 
`╭─ 👑 معلومات المطور 👑 ─╮
│ 👤 الاسم       : Acard
│ 🧸 اللقب       : Acard
│ 🎂 العمر        : 18+
│ 💘 الحالة       : أعزب
│ 🎓 المهنة       : كفات
│ 📚 التعليم      : معلم
│ 🏡 الموقع       : الموغريب
├─ 🔗 التواصل ─╮
│ 📘 فيسبوك     : Acard lking II
│ 💬 ماسنجر     : هيا هيا
│ 📞 واتساب     : ايلا كنتي بنت دوزي بريفي 
╰────────────────╯`;

    const cacheDir = path.join(__dirname, "cache");
    const imgPath = path.join(cacheDir, "owner.jpg");

    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

    const imgLink = "https://i.imgur.com/1G4ZhU7.jpeg";

    const send = () => {
      api.sendMessage(
        { body: ownerText, attachment: fs.createReadStream(imgPath) },
        event.threadID,
        () => fs.unlinkSync(imgPath),
        event.messageID
      );
    };

    request(encodeURI(imgLink))
      .pipe(fs.createWriteStream(imgPath))
      .on("close", send);
  }
};
