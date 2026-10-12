module.exports = {
  config: {
    name: "clear",
    aliases: [],
    author: "Acard",
    version: "2.0",
    cooldowns: 5,
    role: 0,
    shortDescription: {
      ar: ""
    },
    longDescription: {
      ar: "حذف جميع الرسائل التي أرسلها البوت"
    },
    category: "owner",
    guide: {
      ar: "{p}{n}"
    }
  },
  onStart: async function ({ api, event }) {

    const unsendBotMessages = async () => {
      const threadID = event.threadID;

      const botMessages = await api.getThreadHistory(threadID, 100);

      const botSentMessages = botMessages.filter(message => message.senderID === api.getCurrentUserID());

      for (const message of botSentMessages) {
        await api.unsendMessage(message.messageID);
      }
    };

    await unsendBotMessages();
  }
};