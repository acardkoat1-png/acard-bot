const { getStreamsFromAttachment, log } = global.utils;

const mediaTypes = ["photo", "png", "animated_image", "video", "audio"];

module.exports = {
  config: {
    name: "callad",
    aliases: ["call", "called"],
    version: "2.0",
    author: "Acard",
    countDown: 5,
    role: 0,
    category: "contacts admin",
    description: {
      ar: "إرسال رسالة أو بلاغ مباشر إلى مشرفي البوت"
    },
    guide: {
      ar: "{pn} <رسالتك>"
    }
  },

  langs: {
    ar: {
      missingMessage: "❗ يرجى كتابة رسالة للإرسال",
      noAdmin: "⚠️ لا يوجد مشرفين للبوت",
      sentFromGroup: "\n👥 المجموعة: %1\n🧵 معرف المجموعة: %2",
      sentFromUser: "\n👤 مرسل من محادثة خاصة",
      userContent: "\n\n📩 الرسالة:\n%1\n\n↩️ رد للرد على المرسل",
      success: "✅ تم إرسال الرسالة\n\n📨 تم الإرسال إلى %1 مشرف",
      failed: "❌ فشل إرسال الرسالة إلى %1 مشرف",
      adminReply: "📍 رد المشرف\n\n👤 %1:\n%2\n\n↩️ رد للمتابعة",
      userFeedback: "📝 بلاغ مستخدم\n\n👤 %1\n🆔 %2%3\n\n📩 الرسالة:\n%4",
      replySuccess: "✅ تم إرسال الرد بنجاح"
    }
  },

  onStart: async function ({
    args, message, event, usersData, threadsData, api, commandName, getLang
  }) {
    if (!args[0])
      return message.reply(getLang("missingMessage"));

    const { senderID, threadID, isGroup } = event;
    const adminBot = global.GoatBot.config.adminBot;
    if (!adminBot.length)
      return message.reply(getLang("noAdmin"));

    const senderName = await usersData.getName(senderID);

    let body =
      "📞 مراسلة المشرف\n\n" +
      `👤 المستخدم: ${senderName}\n` +
      `🆔 المعرف: ${senderID}`;

    body += isGroup
      ? getLang("sentFromGroup", (await threadsData.get(threadID)).threadName, threadID)
      : getLang("sentFromUser");

    body += getLang("userContent", args.join(" "));

    const formMessage = {
      body,
      mentions: [{ id: senderID, tag: senderName }],
      attachment: await getStreamsFromAttachment(
        [...event.attachments, ...(event.messageReply?.attachments || [])]
          .filter(item => mediaTypes.includes(item.type))
      )
    };

    let success = 0;

    for (const uid of adminBot) {
      try {
        const info = await api.sendMessage(formMessage, uid);
        success++;
        global.GoatBot.onReply.set(info.messageID, {
          commandName,
          type: "userCallAdmin",
          threadID,
          messageIDSender: event.messageID
        });
      } catch (e) {
        log.err("CALL ADMIN", e);
      }
    }

    return message.reply(getLang("success", success));
  },

  onReply: async function ({
    args, event, api, message, Reply, usersData, commandName, getLang
  }) {
    const senderName = await usersData.getName(event.senderID);

    if (Reply.type === "userCallAdmin") {
      const body = getLang("adminReply", senderName, args.join(" "));
      api.sendMessage(
        { body },
        Reply.threadID,
        () => message.reply(getLang("replySuccess")),
        Reply.messageIDSender
      );
    }
  }
};