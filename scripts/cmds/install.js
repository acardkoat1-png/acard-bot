const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const cheerio = require("cheerio");

const { configCommands } = global.GoatBot;
const { log } = global.utils;

function getDomain(url) {
  const regex = /^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:/\n]+)/im;
  const match = url.match(regex);
  return match ? match[1] : null;
}

function isURL(str) {
  try { new URL(str); return true; }
  catch { return false; }
}

function extractUrlFromText(text) {
  const match = text.match(/https?:\/\/[^\s]+/i);
  return match ? match[0] : null;
}

async function fetchCodeFromUrl(url) {
  const domain = getDomain(url);
  let fixedUrl = url;

  if (domain === "pastebin.com" && !url.includes("/raw/")) {
    fixedUrl = url.replace("pastebin.com/", "pastebin.com/raw/");
  }

  if (domain === "github.com" && url.includes("/blob/")) {
    fixedUrl = url.replace("github.com", "raw.githubusercontent.com").replace("/blob/", "/");
  }

  try {
    const res = await axios.get(fixedUrl);
    let code = res.data;
    if (domain === "savetext.net") {
      const $ = cheerio.load(code);
      code = $("#content").text().trim();
    }
    return code;
  } catch { return null; }
}

function extractCommandName(code) {
  const nameMatch = code.match(/name\s*:\s*["']([^"']+)["']/);
  return nameMatch ? nameMatch[1].trim() + ".js" : null;
}

module.exports = {
  config: {
    name: "install",
    version: "3.0",
    author: "Acard",
    countDown: 3,
    role: 2,
    hasPrefix: false,
    description: "تثبيت الأمر عبر الرد / الكود / الرابط",
    category: "owner"
  },

  onStart: async function ({ args, message, event, api }) {
    let rawCode = "";
    let fileName = "";

    if (event.messageReply?.body) {
      const replyText = event.messageReply.body.trim();
      const url = extractUrlFromText(replyText);
      if (url) {
        rawCode = await fetchCodeFromUrl(url);
        if (!rawCode) return message.reply("✖ فشل جلب الكود من الرابط.\nيرجى التحقق من الرابط والمحاولة مرة أخرى.");
      } else {
        rawCode = replyText;
      }
      fileName = extractCommandName(rawCode);
    }
    else if (args[0] && isURL(args[0])) {
      rawCode = await fetchCodeFromUrl(args[0]);
      if (!rawCode) return message.reply("✖ رابط غير صالح أو غير قابل للوصول.\nتأكد من صحة الرابط وحاول مرة أخرى.");
      fileName = extractCommandName(rawCode);
    }
    else if (args.length >= 2 && args[0].endsWith(".js")) {
      fileName = args[0];
      rawCode = args.slice(1).join(" ");
    }

    if (!rawCode) return message.reply("⚠ لم يتم إدخال كود.\n\nالاستخدام:\n• الرد على رسالة تحتوي كود أو رابط\n• إدخال رابط مباشر\n• install <name.js> <code>");

    if (!fileName) return message.reply("✖ تعذر اكتشاف اسم الأمر.\nتأكد من أن الكود يحتوي على حقل اسم صالح.");

    const filePath = path.join(process.cwd(), "scripts", "cmds", fileName);

    if (fs.existsSync(filePath)) {
      return message.reply(`⚠ ${fileName} موجود مسبقاً.\n\nتفاعل مع هذه الرسالة للكتابة فوقه وإعادة التثبيت.`, (err, info) => {
        global.GoatBot.onReaction.set(info.messageID, { commandName: "install", author: event.senderID, data: { rawCode, fileName } });
      });
    }

    fs.writeFileSync(filePath, rawCode);

    const load = global.utils.loadScripts("cmds", fileName.replace(".js", ""), log, configCommands, api);
    if (load.status === "success") {
      return message.reply(`✅ تم التثبيت: ${fileName}\n📌 الحالة: محمّل وجاهز`);
    } else {
      return message.reply(`✖ فشل التثبيت: ${fileName}\n⚠ خطأ: ${load.error?.message || "خطأ غير معروف"}`);
    }
  },

  onReaction: async function ({ Reaction, event, message, api }) {
    if (event.userID !== Reaction.author) return;
    const { rawCode, fileName } = Reaction.data;
    const filePath = path.join(process.cwd(), "scripts", "cmds", fileName);
    fs.writeFileSync(filePath, rawCode);
    const load = global.utils.loadScripts("cmds", fileName.replace(".js", ""), log, configCommands, api);
    if (load.status === "success") {
      message.reply(`✅ تم الكتابة فوقه وإعادة التحميل: ${fileName}\n📌 الحالة: محمّل وجاهز`);
    } else {
      message.reply(`✖ فشلت الكتابة: ${fileName}\n⚠ خطأ: ${load.error?.message || "خطأ غير معروف"}`);
    }
  }
};
