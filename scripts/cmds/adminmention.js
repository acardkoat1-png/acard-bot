module.exports = {
  config: {
    name: "adminmention",
    version: "2.0",
    author: "Acard",
    countDown: 0,
    role: 0,
    shortDescription: "يرد تلقائياً عندما يشير أحدهم لمشرف",
    longDescription: "إذا قام أي شخص بمنشن أحد المشرفين، سيرد البوت برسالة عشوائية.",
    category: "system"
  },

  onStart: async function () {},

  onChat: async function ({ event, message }) {
    // قائمة معرفات المشرفين
    const adminIDs = ["100078049308655", "100090071683807", "100092480994957"].map(String);

    // تجاهل إذا كان المرسل مشرفاً
    if (adminIDs.includes(String(event.senderID))) return;

    // التحقق من وجود منشن للمشرفين
    const mentionedIDs = event.mentions ? Object.keys(event.mentions).map(String) : [];
    const isMentioningAdmin = adminIDs.some(id => mentionedIDs.includes(id));

    if (!isMentioningAdmin) return;

    // ردود عشوائية
    const REPLIES = [
      "🚫 لا تمنشن المشرفين رجاءً، مشغولين حالياً 😤",
      "🙄 يا رجل، لا تزعج المشرفين لو سمحت",
      "⚠️ تم التنبيه: منشن المشرفين ممنوع في هذا الوقت",
      "😑 المشرف مش فاضي لك حالياً، جرب لاحقاً",
      "👋 المشرفين في راحة حالياً، لا إزعاج من فضلك",
      "🤚 كفاية منشنات، المشرفين مشغولين",
      "💢 ممنوع منشن المشرفين بدون سبب مهم"
    ];

    const randomReply = REPLIES[Math.floor(Math.random() * REPLIES.length)];
    return message.reply(randomReply);
  }
};
