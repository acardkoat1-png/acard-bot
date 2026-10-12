const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "sad",
    version: "2.0",
    author: "Acard",
    countDown: 5,
    role: 0,
    shortDescription: "مرسل فيديوهات حزينة 😢",
    longDescription: "يرسل فيديو حزين عشوائي مع عبارات مؤثرة 💔",
    category: "media",
    guide: { ar: "{pn}" }
  },

  onStart: async function ({ api, event }) {
    const captions = [
      "كنت أجمل فصل في قصتي 💔",
      "لم أجد الحب، فقط وجدت الخوف من الفقد 🥀",
      "لا أحد ينتظرني الآن، فقط أنا أنتظر... 😔",
      "حتى الدموع لها قصة، لكن لا أحد يراها 💧",
      "خلف الابتسامة يختبئ ألم لا يوصف 😅💔",
      "ذكرياتك ما زالت توقظني 🌙",
      "لم أنسَ، فقط توقفت عن التذكر 💭",
      "أحياناً الصمت هو أبلغ إجابة 😶‍🌫️",
      "من أريده، هو الأبعد دائماً 💔",
      "أقول أنا بخير، لكن القلب ليس كذلك 🥀"
    ];

    const caption = captions[Math.floor(Math.random() * captions.length)];

    const links = [
      "https://drive.google.com/uc?id=16KeE4J7L2Pd8cCKIBvlwEPP07A92b-eb",
      "https://drive.google.com/uc?id=16MhNPi_H0-tEe5PQrrqkx_l7SrC_l0kd",
      "https://drive.google.com/uc?id=15w4cvYmKrCW2Hul2AcvPEk5S4b-CH3EE",
      "https://drive.google.com/uc?id=16Xa6thSHdEGCiypaetbAEqVCwEAzFnKX",
      "https://drive.google.com/uc?id=16BnRPvKQd7gd3YLR_rB9QNZymotMqHu7",
      "https://drive.google.com/uc?id=15fDe2735O50z-3G4yQ5tDT9J873x5izm",
      "https://drive.google.com/uc?id=16HgiGU7_Cdh8NtpsKi92dTJmALJCV8jD",
      "https://drive.google.com/uc?id=16KTSrInqvioGnT7RrAskjHYqz8R6RgNY",
      "https://drive.google.com/uc?id=162yWrNRRTeN4tFEjQEtsR4p-4gWbTFaS",
      "https://drive.google.com/uc?id=16-q768c6nXstZEjQhWa1pZUPL2Xpjwo9"
    ];

    const link = links[Math.floor(Math.random() * links.length)];
    const cachePath = path.join(__dirname, "cache", "sad.mp4");

    try {
      const response = await axios({ url: encodeURI(link), method: "GET", responseType: "stream" });
      await fs.ensureDir(path.join(__dirname, "cache"));
      const writer = fs.createWriteStream(cachePath);
      response.data.pipe(writer);

      writer.on("finish", async () => {
        await api.sendMessage({ body: `「 ${caption} 」`, attachment: fs.createReadStream(cachePath) }, event.threadID);
        fs.unlinkSync(cachePath);
      });

      writer.on("error", (err) => { console.error(err); api.sendMessage("❌ فشل إرسال الفيديو!", event.threadID); });
    } catch (error) {
      console.error(error);
      api.sendMessage("❌ حدث خطأ ما.", event.threadID);
    }
  }
};
