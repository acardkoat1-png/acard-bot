const fs = require("fs");
const request = require("request");
const path = require("path");

module.exports = {
  config: {
    name: "boxinfo",
    aliases: ["groupinfo"],
    version: "2.2.0",
    author: "Acard",
    role: 1,
    shortDescription: "معلومات المجموعة",
    category: "box chat",
    guide: {
      ar: "groupinfo"
    }
  },

  onStart: async function ({ api, event }) {
    const cacheDir = path.join(__dirname, "cache");
    const imgPath = path.join(cacheDir, "groupinfo.png");

    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    const info = await api.getThreadInfo(event.threadID);

    let male = 0, female = 0;
    for (const u of info.userInfo) {
      if (u.gender === "MALE") male++;
      else if (u.gender === "FEMALE") female++;
    }

    const text =
`── معلومات المجموعة ──
الاسم      : ${info.threadName || "بدون اسم"}
المعرف     : ${info.threadID}
الإيموجي   : ${info.emoji || "لا يوجد"}
الموافقة   : ${info.approvalMode ? "مفعلة" : "معطلة"}

الأعضاء    : ${info.participantIDs.length}
ذكور       : ${male}
إناث       : ${female}
المشرفون   : ${info.adminIDs.length}
الرسائل    : ${info.messageCount}

— Acard`;

    const send = () =>
      api.sendMessage(
        {
          body: text,
          attachment: fs.existsSync(imgPath)
            ? fs.createReadStream(imgPath)
            : null
        },
        event.threadID,
        () => {
          if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
        },
        event.messageID
      );

    if (!info.imageSrc) return api.sendMessage(text, event.threadID, event.messageID);

    request(encodeURI(info.imageSrc))
      .pipe(fs.createWriteStream(imgPath))
      .on("close", send);
  }
};
