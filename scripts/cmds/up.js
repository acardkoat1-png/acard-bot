const { createCanvas, registerFont } = require("canvas");
const os = require("os");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// (جميع الدوال المساعدة تبقى كما هي: ensureFont, getCPU, getDisk, getNetwork, getTemperature, roundRect, acrylicCardT, win11BarT, clipText, drawBase, drawPageHeader, renderPage, sendPage)

module.exports = {
  config: {
    name: "up",
    aliases: ["uptime", "status", "sysinfo"],
    version: "3.0",
    author: "Acard",
    role: 0,
    category: "system",
    shortDescription: "عرض حالة النظام بتصميم ويندوز 11"
  },

  onStart: async function ({ message, api, event }) {
    try { await sendPage("overview", message, api, event); }
    catch (error) { console.error("خطأ مراقب النظام:", error); message.reply("❌ فشل إنشاء مراقب النظام."); }
  },

  onChat: async function ({ event, api }) {
    if (!event.body) return;
    const body = event.body.toLowerCase().trim();
    if (body === "dark" || body === "light") {
      themeMap[event.threadID] = body;
      const fakeMsg = { reply: (data) => api.sendMessage(data, event.threadID, null, event.messageID) };
      try { await sendPage("settings", fakeMsg, api, event); }
      catch (error) { console.error("خطأ تغيير الثيم:", error); api.sendMessage(`✅ تم تغيير الثيم إلى ${body}.`, event.threadID); }
      return;
    }
    const pages = ["performance", "network", "storage", "settings", "overview"];
    if (pages.includes(body) && event.messageReply) {
      try {
        const fakeMsg = { reply: (data) => api.sendMessage(data, event.threadID, null, event.messageID) };
        await sendPage(body, fakeMsg, api, event);
      } catch (error) { console.error("خطأ تغيير الصفحة:", error); api.sendMessage("❌ فشل عرض الصفحة.", event.threadID); }
    }
  }
};