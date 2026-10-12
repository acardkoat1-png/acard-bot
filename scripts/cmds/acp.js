const moment = require("moment-timezone");

module.exports = {
  config: {
    name: "accept",
    aliases: ['acp'],
    version: "2.0",
    author: "Acard",
    countDown: 8,
    role: 2,
    shortDescription: "قبول أو حذف طلبات الصداقة",
    longDescription: "أمر لقبول أو حذف طلبات الصداقة المعلقة في حسابك",
    category: "Utility",
  },

  onReply: async function ({ message, Reply, event, api, commandName }) {
    const { author, listRequest, messageID } = Reply;
    if (author !== event.senderID) return;

    const args = event.body.trim().toLowerCase().split(" ");
    clearTimeout(Reply.unsendTimeout);

    const form = {
      av: api.getCurrentUserID(),
      fb_api_caller_class: "RelayModern",
      variables: {
        input: {
          source: "friends_tab",
          actor_id: api.getCurrentUserID(),
          client_mutation_id: Math.random().toString(36).substring(2, 15)
        },
        scale: 3,
        refresh_num: 0
      }
    };

    const success = [];
    const failed = [];

    if (args[0] === "add") {
      form.fb_api_req_friendly_name = "FriendingCometFriendRequestConfirmMutation";
      form.doc_id = "3147613905362928";
    } else if (args[0] === "del") {
      form.fb_api_req_friendly_name = "FriendingCometFriendRequestDeleteMutation";
      form.doc_id = "4108254489275063";
    } else {
      return api.sendMessage("⚠️ يرجى اختيار <add | del> متبوعاً بـ <الرقم | all>", event.threadID, event.messageID);
    }

    let targetIDs = args[1] === "all" ? listRequest.map((_, idx) => idx + 1) : args.slice(1);
    const promiseFriends = [];

    for (const stt of targetIDs) {
      const index = parseInt(stt) - 1;
      const user = listRequest[index];

      if (!user) {
        failed.push(`⚠️ لم يتم العثور على الطلب رقم ${stt}`);
        continue;
      }

      form.variables.input.friend_requester_id = user.node.id;
      promiseFriends.push(api.httpPost("https://www.facebook.com/api/graphql/", {
        ...form,
        variables: JSON.stringify(form.variables)
      }));

      success.push({ name: user.node.name, id: user.node.id });
    }

    const finalSuccess = [];
    const finalFailed = [];

    for (let i = 0; i < promiseFriends.length; i++) {
      try {
        const res = await promiseFriends[i];
        const data = JSON.parse(res);
        if (data.errors) {
          finalFailed.push(success[i].name);
        } else {
          finalSuccess.push(success[i].name);
        }
      } catch {
        finalFailed.push(success[i].name);
      }
    }

    let resultMsg = "";
    if (finalSuccess.length) {
      resultMsg += `✅ ${args[0] === "add" ? "تم قبول" : "تم حذف"}: ${finalSuccess.length} طلب(طلبات)\n${finalSuccess.join("\n")}`;
    }
    if (finalFailed.length) {
      resultMsg += `\n❌ فشل: ${finalFailed.length} طلب(طلبات)\n${finalFailed.join("\n")}`;
    }
    if (!resultMsg) {
      resultMsg = "ℹ️ لم تتم معالجة أي طلبات.";
    }

    api.unsendMessage(messageID);
    return api.sendMessage(resultMsg, event.threadID);
  },

  onStart: async function ({ event, api, commandName }) {
    const form = {
      av: api.getCurrentUserID(),
      fb_api_req_friendly_name: "FriendingCometFriendRequestsRootQueryRelayPreloader",
      fb_api_caller_class: "RelayModern",
      doc_id: "4499164963466303",
      variables: JSON.stringify({ input: { scale: 3 } })
    };

    try {
      const response = await api.httpPost("https://www.facebook.com/api/graphql/", form);
      const listRequest = JSON.parse(response)?.data?.viewer?.friending_possibilities?.edges || [];

      if (listRequest.length === 0) {
        return api.sendMessage("ℹ️ لا توجد طلبات صداقة معلقة حالياً.", event.threadID);
      }

      let msg = "";
      listRequest.forEach((user, i) => {
        msg += `\n${i + 1}. الاسم: ${user.node.name}`
          + `\nالمعرف: ${user.node.id}`
          + `\nالرابط: ${user.node.url.replace("www.facebook", "fb")}`
          + `\nالتوقيت: ${moment().tz("Asia/Manila").format("DD/MM/YYYY HH:mm:ss")}\n`;
      });

      api.sendMessage(
        `${msg}\n📝 قم بالرد على هذه الرسالة مع: <add | del> <الرقم | all>`,
        event.threadID,
        (e, info) => {
          global.GoatBot.onReply.set(info.messageID, {
            commandName,
            messageID: info.messageID,
            listRequest,
            author: event.senderID,
            unsendTimeout: setTimeout(() => {
              api.unsendMessage(info.messageID);
              global.GoatBot.onReply.delete(info.messageID);
            }, this.config.countDown * 1000)
          });
        },
        event.messageID
      );
    } catch (error) {
      console.error(error);
      api.sendMessage("❌ حدث خطأ أثناء جلب قائمة طلبات الصداقة. يرجى المحاولة لاحقاً.", event.threadID);
    }
  }
};