module.exports = {
  config: {
    name: "shop",
    aliases: ["متجر", "store"],
    version: "3.0",
    author: "Acard",
    countDown: 3,
    role: 0,
    shortDescription: { ar: "🛒 متجر Spidy - إبداعي" },
    category: "economy",
    guide: { ar: "{pn} : المتجر\n{pn} buy <رقم> : شراء\n{pn} inventory : مشترياتك" }
  },

  langs: {
    ar: {
      shopTitle: "🛒 | مــتــجــر Spidy\n━━━━━━━━━━━━━━━━━━━━━\n%1\n━━━━━━━━━━━━━━━━━━━━━\n💡 | shop buy <الرقم>",
      buySuccess: "✅ | تم شراء %1!\n💸 | %2$\n💳 | %3$",
      noBalance: "❌ | رصيدك غير كاف!\n💳 | %1$\n💰 | %2$",
      alreadyOwned: "❌ | تملك %1 بالفعل!",
      inventoryEmpty: "📭 | لا مشتريات",
      inventoryTitle: "🎒 | مشتريات %1\n%2"
    }
  },

  onStart: async function ({ message, event, args, usersData, getLang }) {
    const { senderID } = event;
    const action = args[0]?.toLowerCase();
    const userData = await usersData.get(senderID);
    const balance = userData?.data?.money ?? 100;
    const inventory = userData?.data?.inventory || [];

    const ITEMS = [
      { id: 1, name: "🎭 VIP", price: 25000, desc: "لقب VIP", type: "title", value: "VIP" },
      { id: 2, name: "👑 أسطورة", price: 100000, desc: "لقب أسطوري", type: "title", value: "أسطورة" },
      { id: 3, name: "💎 إمبراطور", price: 500000, desc: "أعلى لقب", type: "title", value: "إمبراطور" },
      { id: 4, name: "🛡️ درع", price: 5000, desc: "حماية من تغيير الكنية", type: "shield", value: true },
      { id: 5, name: "⚡ مضاعف يومي", price: 10000, desc: "daily ×2 (3 أيام)", type: "booster", value: "daily_x2" },
      { id: 6, name: "💣 قنبلة", price: 30000, desc: "تمسح آخر 10 رسائل لشخص", type: "bomb", value: true },
      { id: 7, name: "🎟️ تغيير لقب", price: 20000, desc: "تغير لقب شخص لمرة", type: "nickchange", value: true },
      { id: 8, name: "🎁 صندوق الحظ", price: 15000, desc: "جائزة مفاجئة", type: "lootbox", value: "random" }
    ];

    if (!action) {
      const list = ITEMS.map(i => `${i.id}. ${i.name} - ${i.price.toLocaleString()}$ | ${i.desc}`).join("\n\n");
      return message.reply(getLang("shopTitle", list));
    }

    if (action === "buy") {
      const itemId = parseInt(args[1]);
      const item = ITEMS.find(i => i.id === itemId);
      if (!item) return message.reply("❌ | سلعة غير موجودة");
      if (inventory.find(i => i.id === itemId) && item.type !== "lootbox" && item.type !== "bomb" && item.type !== "nickchange") return message.reply(getLang("alreadyOwned", item.name));
      if (balance < item.price) return message.reply(getLang("noBalance", balance, item.price));

      const newBalance = balance - item.price;

      if (item.type === "lootbox") {
        const prizes = [
          { name: "100,000$", money: 100000 },
          { name: "50,000$", money: 50000 },
          { name: "لقب VIP", title: "VIP" },
          { name: "لا شيء 😢", money: 0 }
        ];
        const prize = prizes[Math.floor(Math.random() * prizes.length)];
        if (prize.money) {
          await usersData.set(senderID, { ...userData, data: { ...userData.data, money: newBalance + prize.money } });
          return message.reply(`🎁 | صندوق الحظ!\n🎉 | ${prize.name}\n💳 | ${(newBalance + prize.money).toLocaleString()}$`);
        }
        if (prize.title) {
          inventory.push({ id: 2, name: "👑 أسطورة", type: "title", value: prize.title });
          await usersData.set(senderID, { ...userData, data: { ...userData.data, money: newBalance, inventory, title: prize.title } });
          return message.reply(`🎁 | صندوق الحظ!\n🎉 | ${prize.name}!`);
        }
      }

      inventory.push({ id: item.id, name: item.name, type: item.type, value: item.value, boughtAt: Date.now() });
      const updateData = { ...userData.data, money: newBalance, inventory };
      if (item.type === "title") updateData.title = item.value;
      await usersData.set(senderID, { ...userData, data: updateData });
      return message.reply(getLang("buySuccess", item.name, item.price.toLocaleString(), newBalance.toLocaleString()));
    }

    if (action === "inventory") {
      if (inventory.length === 0) return message.reply(getLang("inventoryEmpty"));
      const list = inventory.map((i, idx) => `${idx + 1}. ${i.name}`).join("\n");
      return message.reply(getLang("inventoryTitle", userData?.name || "مستخدم", list));
    }
  }
};