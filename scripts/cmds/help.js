const fs = require("fs-extra");
const path = require("path");
const https = require("https");

module.exports = {
  config: {
    name: "help",
    aliases: ["menu", "commands"],
    version: "6.2",
    author: "Acard",
    shortDescription: "عرض جميع الأوامر",
    longDescription: "عرض جميع الأوامر بواجهة نظيفة",
    category: "system",
    guide: "{pn}help [اسم الأمر]"
  },

  onStart: async function ({ message, args, prefix }) {
    const allCommands = global.GoatBot.commands;

    const cleanCategoryName = (text) => text ? text.toLowerCase() : "others";

    if (args[0]) {
      const cmdName = args[0].toLowerCase();
      const cmd = allCommands.get(cmdName) || [...allCommands.values()].find(c => c.config.aliases?.includes(cmdName));
      if (!cmd) return message.reply(`❌ الأمر '${cmdName}' غير موجود!`);

      const usage = typeof cmd.config.guide === "string" ? cmd.config.guide.replace("{pn}", cmd.config.name) : cmd.config.name;
      const infoMsg =
`╭─ معلومات الأمر
│ 🧩 ${cmd.config.name}
│ 🔗 ${cmd.config.aliases?.join(", ") || "لا يوجد"}
│ 📁 ${(cmd.config.category || "أخرى").toUpperCase()}
│ ⚙️ v${cmd.config.version || "1.0"}
│ 👑 ${cmd.config.author || "غير معروف"}
│ 📝 ${(cmd.config.longDescription || cmd.config.shortDescription || "لا يوجد وصف").slice(0, 40)}
│ 🚀 ${prefix}${usage}
╰────────────`;
      return message.reply(infoMsg);
    }

    const categories = {};
    for (const [name, cmd] of allCommands) {
      const cat = cleanCategoryName(cmd.config.category);
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(name);
    }

    const formatCommands = (cmds) => cmds.sort().map(c => `• ${c}`).join("\n");

    let msg = `╭─ الأوامر\n│ 🔧 ${prefix}\n│ 📊 ${allCommands.size} أمر\n╰────────────\n`;
    for (const cat of Object.keys(categories)) {
      msg += `\n${cat.toUpperCase()}\n`;
      msg += formatCommands(categories[cat]) + "\n";
    }
    msg += `\nاستخدم: ${prefix}help <اسم الأمر>`;

    const gifURLs = ["https://i.imgur.com/Xw6JTfn.gif", "https://i.imgur.com/mW0yjZb.gif", "https://i.imgur.com/KQBcxOV.gif"];
    const randomGifURL = gifURLs[Math.floor(Math.random() * gifURLs.length)];
    const gifFolder = path.join(__dirname, "cache");
    if (!fs.existsSync(gifFolder)) fs.mkdirSync(gifFolder, { recursive: true });
    const gifName = path.basename(randomGifURL);
    const gifPath = path.join(gifFolder, gifName);
    if (!fs.existsSync(gifPath)) await downloadGif(randomGifURL, gifPath);

    return message.reply({ body: msg, attachment: fs.createReadStream(gifPath) });
  }
};

function downloadGif(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      if (res.statusCode !== 200) { fs.unlink(dest, () => {}); return reject(); }
      res.pipe(file);
      file.on("finish", () => file.close(resolve));
    }).on("error", (err) => { fs.unlink(dest, () => {}); reject(err); });
  });
}