exports.config = {
  name: "fork",
  version: "2.0",
  author: "Acard",
  countDown: 0,
  role: 0,
  shortDescription: "رابط المستودع",
  longDescription: "يرد برابط مستودع GitHub عند ذكر 'fork' أو 'repository'.",
  category: "system",
  guide: {
    ar: "اكتب 'fork' أو 'repository'"
  }
};

const last = {};
const cool = 10000;

exports.onStart = async function(){};

exports.onChat = async function({event: z, api: y}){
  const t = z.threadID;
  const n = Date.now();
  if(last[t] && n - last[t] < cool) return;

  const m = (z.body || "").toLowerCase().trim();
  if(!m) return;

  const fork = m.includes("fork") || m.includes("repository");

  if(fork){
    y.sendMessage(
`🔗 رابط مستودع GitHub:
https://github.com/EryXenX/GOAT-MESSENGER.git

🎬 شرح التثبيت👇🏼
https://youtu.be/gPf_BFhQz_w?si=T1N6sB2DefeTGq2R`,
      t,
      z.messageID
    );

    last[t] = n;
  }
};