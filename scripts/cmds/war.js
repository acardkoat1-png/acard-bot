module.exports = {
  config: {
    name: "war",
    aliases: ["حرب", "جيش", "army"],
    version: "1.0",
    author: "Acard",
    countDown: 5,
    role: 0,
    shortDescription: { ar: "⚔️ لعبة الحرب - ابنِ جيشك واغزُ الآخرين" },
    category: "economy",
    guide: {
      ar: "{pn} : مملكتي\n{pn} build <مبنى> : بناء\n{pn} recruit <وحدة> : تجنيد\n{pn} shop buy <سلعة> : متجر\n{pn} attack @منشن : غزو\n{pn} top : الصدارة"
    }
  },

  langs: {
    ar: {
      // ═══════════ عام ═══════════
      myKingdom: "🏰 | مــمــلــكــة %1\n━━━━━━━━━━━━━━━━━━━\n⚡ | القوة: %2\n🪙 | الذهب: %3\n🏗️ | المباني: %4\n⚔️ | الجيش: %5\n🛡️ | الحماية: %6%\n🔫 | الذخيرة: %7\n\n💡 | build/recruit/shop/attack",
      
      // ═══════════ بناء ═══════════
      noBuilding: "❌ | المبنى غير موجود!\n📋 | المباني المتاحة:\n%1",
      buildSuccess: "✅ | بنيت %1!\n🏗️ | +%2 قوة\n⚡ | القوة الجديدة: %3",
      noBalanceBuild: "❌ | رصيدك غير كاف!\n💳 | رصيدك: %1$\n💰 | التكلفة: %2$",
      
      // ═══════════ تجنيد ═══════════
      noUnit: "❌ | الوحدة غير موجودة!\n📋 | الوحدات المتاحة:\n%1",
      recruitSuccess: "✅ | جندت %1!\n⚔️ | +%2 قوة\n⚡ | القوة الجديدة: %3\n🔫 | الذخيرة: %4",
      noBalanceRecruit: "❌ | رصيدك غير كاف!\n💳 | رصيدك: %1$\n💰 | التكلفة: %2$",
      
      // ═══════════ متجر ═══════════
      noItem: "❌ | السلعة غير موجودة!\n📋 | المتجر:\n%1",
      shopSuccess: "✅ | اشتريت %1!\n%2",
      alreadyHave: "❌ | لديك %1 بالفعل!",
      noBalanceShop: "❌ | رصيدك غير كاف!\n💳 | رصيدك: %1$\n💰 | التكلفة: %2$",
      
      // ═══════════ هجوم ═══════════
      noTarget: "❌ | يرجى منشن الشخص الذي تريد مهاجمته!\n📌 | مثال: war attack @محمد",
      noTargetKingdom: "❌ | %1 ليس لديه مملكة بعد!",
      cantAttackSelf: "❌ | لا يمكنك مهاجمة نفسك!",
      noAmmo: "❌ | لا تملك ذخيرة كافية!\n🔫 | ذخيرتك: %1\n💡 | جند وحدات للحصول على ذخيرة",
      attackWin: "⚔️ | هــجــوم نــاجــح!\n━━━━━━━━━━━━━━━━━━━\n🏆 | %1 انتصر على %2!\n💰 | الغنيمة: %3$\n💀 | دمرت %4 من قوته",
      attackLose: "🛡️ | هــجــوم فــاشــل!\n━━━━━━━━━━━━━━━━━━━\n💀 | %1 خسر ضد %2!\n💸 | خسرت: %3$\n📉 | قوته أقوى منك",
      
      // ═══════════ صدارة ═══════════
      topEmpty: "🏰 | لا توجد ممالك بعد!\n💡 | استخدم war build للبدء",
      topTitle: "🏰 | لــوحــة الأمــراء\n━━━━━━━━━━━━━━━━━━━\n%1"
    }
  },

  onStart: async function ({ message, event, args, usersData, getLang }) {
    const { senderID, threadID, mentions } = event;
    const action = args[0]?.toLowerCase();
    const userData = await usersData.get(senderID);
    const kingdom = userData?.data?.kingdom || { power: 0, buildings: [], units: [], items: [], ammo: 0 };

    // ═══════════ عرض المملكة ═══════════
    if (!action) {
      const name = userData?.name || "محارب";
      const defense = kingdom.items?.includes("درع") ? 20 : 0;
      const buildingsList = kingdom.buildings?.length > 0 ? kingdom.buildings.join("، ") : "لا يوجد";
      const unitsList = kingdom.units?.length > 0 ? kingdom.units.join("، ") : "لا يوجد";
      
      return message.reply(getLang("myKingdom", name, kingdom.power, kingdom.power * 100, buildingsList, unitsList, defense, kingdom.ammo));
    }

    // ═══════════ بناء ═══════════
    if (action === "build") {
      const buildingName = args.slice(1).join(" ");
      const BUILDINGS = {
        "معسكر": { cost: 5000, power: 5 },
        "ثكنة": { cost: 20000, power: 20 },
        "حصن": { cost: 100000, power: 100 },
        "قلعة": { cost: 500000, power: 500 },
        "قصر": { cost: 2000000, power: 2000 }
      };

      const building = BUILDINGS[buildingName];
      if (!building) {
        const list = Object.entries(BUILDINGS).map(([k, v]) => `• ${k} - ${v.cost.toLocaleString()}$ (+${v.power})`).join("\n");
        return message.reply(getLang("noBuilding", list));
      }

      const balance = userData?.data?.money ?? 100;
      if (balance < building.cost) return message.reply(getLang("noBalanceBuild", balance, building.cost));

      kingdom.buildings.push(buildingName);
      kingdom.power += building.power;
      await usersData.set(senderID, { ...userData, data: { ...userData.data, money: balance - building.cost, kingdom } });
      return message.reply(getLang("buildSuccess", buildingName, building.power, kingdom.power));
    }

    // ═══════════ تجنيد ═══════════
    if (action === "recruit") {
      const unitName = args.slice(1).join(" ");
      const UNITS = {
        "سياف": { cost: 1000, power: 5, ammo: 2 },
        "رامي": { cost: 3000, power: 15, ammo: 5 },
        "فارس": { cost: 10000, power: 50, ammo: 10 },
        "خيال": { cost: 50000, power: 200, ammo: 25 },
        "تنين": { cost: 500000, power: 2000, ammo: 100 }
      };

      const unit = UNITS[unitName];
      if (!unit) {
        const list = Object.entries(UNITS).map(([k, v]) => `• ${k} - ${v.cost.toLocaleString()}$ (+${v.power} ⚔️ +${v.ammo} 🔫)`).join("\n");
        return message.reply(getLang("noUnit", list));
      }

      const balance = userData?.data?.money ?? 100;
      if (balance < unit.cost) return message.reply(getLang("noBalanceRecruit", balance, unit.cost));

      kingdom.units.push(unitName);
      kingdom.power += unit.power;
      kingdom.ammo += unit.ammo;
      await usersData.set(senderID, { ...userData, data: { ...userData.data, money: balance - unit.cost, kingdom } });
      return message.reply(getLang("recruitSuccess", unitName, unit.power, kingdom.power, kingdom.ammo));
    }

    // ═══════════ متجر ═══════════
    if (action === "shop" && args[1] === "buy") {
      const itemName = args.slice(2).join(" ");
      const SHOP = {
        "درع": { cost: 25000, desc: "حماية 20% من الهجمات" },
        "لص": { cost: 100000, desc: "تسرق 10% إضافية عند الفوز" },
        "حصان": { cost: 50000, desc: "تستطيع الهجوم مرتين في اليوم" }
      };

      const item = SHOP[itemName];
      if (!item) {
        const list = Object.entries(SHOP).map(([k, v]) => `• ${k} - ${v.cost.toLocaleString()}$ (${v.desc})`).join("\n");
        return message.reply(getLang("noItem", list));
      }

      if (kingdom.items?.includes(itemName)) return message.reply(getLang("alreadyHave", itemName));

      const balance = userData?.data?.money ?? 100;
      if (balance < item.cost) return message.reply(getLang("noBalanceShop", balance, item.cost));

      kingdom.items.push(itemName);
      await usersData.set(senderID, { ...userData, data: { ...userData.data, money: balance - item.cost, kingdom } });
      return message.reply(getLang("shopSuccess", itemName, item.desc));
    }

    // ═══════════ هجوم ═══════════
    if (action === "attack") {
      const targetID = Object.keys(mentions)[0];
      if (!targetID) return message.reply(getLang("noTarget"));
      if (targetID === senderID) return message.reply(getLang("cantAttackSelf"));

      const targetData = await usersData.get(targetID);
      const targetKingdom = targetData?.data?.kingdom;
      if (!targetKingdom || targetKingdom.power === 0) return message.reply(getLang("noTargetKingdom", targetData?.name));

      if (kingdom.ammo < 1) return message.reply(getLang("noAmmo", kingdom.ammo));

      // القتال
      const myPower = kingdom.power;
      const targetPower = targetKingdom.power;
      const winChance = myPower / (myPower + targetPower);
      const won = Math.random() < winChance;

      // استخدام ذخيرة
      kingdom.ammo -= 1;

      if (won) {
        const loot = Math.floor(targetPower * 100);
        const bonus = kingdom.items?.includes("لص") ? Math.floor(loot * 0.10) : 0;
        const totalLoot = loot + bonus;
        const destroyed = Math.floor(targetPower * 0.3);
        targetKingdom.power -= destroyed;
        
        const balance = (userData?.data?.money ?? 100) + totalLoot;
        await usersData.set(senderID, { ...userData, data: { ...userData.data, money: balance, kingdom } });
        await usersData.set(targetID, { ...targetData, data: { ...targetData.data, kingdom: targetKingdom } });
        
        return message.reply(getLang("attackWin", userData?.name, targetData?.name, totalLoot, destroyed));
      } else {
        const loss = Math.floor(myPower * 50);
        const defense = kingdom.items?.includes("درع") ? Math.floor(loss * 0.20) : 0;
        const totalLoss = loss - defense;
        kingdom.power -= Math.floor(myPower * 0.10);
        
        const balance = Math.max(0, (userData?.data?.money ?? 100) - totalLoss);
        await usersData.set(senderID, { ...userData, data: { ...userData.data, money: balance, kingdom } });
        
        return message.reply(getLang("attackLose", userData?.name, targetData?.name, totalLoss));
      }
    }

    // ═══════════ صدارة ═══════════
    if (action === "top") {
      const allUsers = await usersData.getAll();
      const kingdoms = allUsers
        .filter(u => u.data?.kingdom?.power > 0)
        .sort((a, b) => (b.data?.kingdom?.power || 0) - (a.data?.kingdom?.power || 0))
        .slice(0, 5);

      if (kingdoms.length === 0) return message.reply(getLang("topEmpty"));

      const medals = ["👑", "🥈", "🥉", "🏅", "🎖️"];
      const list = kingdoms.map((u, i) => 
        `${medals[i]} ${u.name} - ⚡${u.data.kingdom.power} قوة`
      ).join("\n");

      return message.reply(getLang("topTitle", list));
    }
  }
};