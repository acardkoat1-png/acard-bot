module.exports = {
  config: {
    name: "delete",
    aliases: ["del"],
    author: "Acard",
    role: 2,
    category: "system"
  },

  onStart: async function ({ api, event, args }) {
    const fs = require('fs');
    const path = require('path');

    const fileName = args[0];

    if (!fileName) {
      api.sendMessage("يرجى إدخال اسم الملف المراد حذفه.", event.threadID);
      return;
    }

    const filePath = path.join(__dirname, fileName);

    fs.unlink(filePath, (err) => {
      if (err) {
        console.error(err);
        api.sendMessage(`❎ | فشل حذف ${fileName}.`, event.threadID);
        return;
      }
      api.sendMessage(`✅ | تم حذف ( ${fileName} ) بنجاح!`, event.threadID);
    });
  }
};