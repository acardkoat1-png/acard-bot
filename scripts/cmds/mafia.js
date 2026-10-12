const activeGames = {};

// ✅ تسجيل mafia في onChat تلقائياً
if (global.GoatBot && global.GoatBot.onChat) {
    if (!global.GoatBot.onChat.includes("mafia")) {
        global.GoatBot.onChat.push("mafia");
    }
}

module.exports = {
  config: {
    name: "mafia",
    aliases: ["مافيا", "maf"],
    version: "9.1",
    author: "Acard",
    countDown: 3,
    role: 0,
    shortDescription: { ar: "🕵️ لعبة المافيا - بوابات دائمة" },
    category: "game",
    guide: {
      ar: "1. /mafia portal : أنشئ بوابتك (أول مرة)\n2. /mafia start : بدء لعبة\n3. /mafia join : انضم\n4. /mafia begin : ابدأ\n5. رد على رسالة + vote : تصويت\n6. votes : عرض الأصوات"
    }
  },

  langs: {
    ar: {
      portalCreated: "✅ | تم إنشاء بوابتك!\n📩 | ستستلم أدوار المافيا هنا دائماً",
      portalExists: "⚠️ | لديك بوابة بالفعل!",
      noPortal: "❌ | ليس لديك بوابة!\n💡 | اكتب /mafia portal لإنشائها",
      gameAlreadyExists: "⚠️ | توجد لعبة بالفعل!",
      recruiting: "🕵️ | جــارٍ تــجــنــيــد الــلاعــبــيــن\n━━━━━━━━━━━━━━━━━━━\n⏰ | 5 دقائق للانضمام\n💡 | اكتب /mafia join\n⚡ | /mafia begin للبدء فوراً\n👥 | %1 لاعبين\n\n⚠️ | تأكد من إنشاء بوابتك: /mafia portal",
      gameStarted: "🕵️ | لــعــبــة الــمــافــيــا\n━━━━━━━━━━━━━━━━━━━\n👥 | %1 لاعبين\n🔪 | مافيا: %2\n🩺 | طبيب: 1\n🔍 | محقق: 1\n👤 | مواطن: %3\n\n📩 | تم إرسال الأدوار إلى بواباتكم!\n🌙 | الليل بعد 5 ثوانٍ...",
      gameStartedNight: "🌙 | حــل الــلــيــل - جولة %1\n😴 | الجميع ينام...\n📩 | تحقق من بوابتك الخاصة!\n⏰ | 60 ثانية للقرارات",
      youAreMafia: "🔪 | أنت الــمــافــيــا!\n━━━━━━━━━━━━━━━━━━━\n👥 | زملاؤك: %1\n\n🎯 | اكتب اسم ضحيتك:\n%2\n⏰ | 60 ثانية",
      youAreDoctor: "🩺 | أنت الــطــبــيــب!\n━━━━━━━━━━━━━━━━━━━\n🛡️ | اكتب اسم من تحمي:\n%1\n⏰ | 60 ثانية",
      youAreDetective: "🔍 | أنت الــمــحــقــق!\n━━━━━━━━━━━━━━━━━━━\n🔎 | اكتب اسم من تتحرى عنه:\n%1\n⏰ | 60 ثانية",
      youAreCitizen: "👤 | أنت مــواطــن\n━━━━━━━━━━━━━━━━━━━\n😴 | نم جيداً...\n💡 | النهار: رد على رسالة + vote",
      nightResult: "☀️ | الــنــهــار - جولة %1\n━━━━━━━━━━━━━━━━━━━\n%2\n━━━━━━━━━━━━━━━━━━━\n👥 | الناجون: %3\n💬 | نقاش: 3 دقائق\n🗳️ | تصويت: رد + vote\n⚡ | ينتهي إذا صوت الجميع",
      killedMsg: "🪦 | %1 قُتل! كان %2",
      savedMsg: "🛡️ | الطبيب أنقذ %1!",
      quietNight: "😴 | ليلة هادئة...",
      voteRegistered: "✅ | %1 صوت ضد %2 (%3/%4)",
      voteResult: "🗳️ | نــتــيــجــة الــتــصــويــت\n%1\n🪦 | %2 طُرد! كان %3",
      allVoted: "⚡ | الجميع صوت! جارٍ الفرز...",
      gameOverCitizens: "🏆 | فــوز الــمــواطــنــيــن!\n💰 | +50,000$ لكل مواطن",
      gameOverMafia: "🏆 | فــوز الــمــافــيــا!\n💰 | +100,000$ لكل مافيا",
      alreadyJoined: "⚠️ | منضم بالفعل!",
      gameNotStarted: "❌ | لا لعبة نشطة",
      needMorePlayers: "❌ | تحتاج %1 لاعبين (حالياً %2)",
      notInGame: "⚠️ | ليس في اللعبة",
      joinSuccess: "✅ | انضممت! (%1 لاعبين)",
      alreadyVoted: "⚠️ | لقد صوت بالفعل!",
      voteByReply: "⚠️ | رد على رسالة الشخص + vote",
      actionRecorded: "✅ | تم تسجيل قرارك! (%1)"
    }
  },

  onStart: async function ({ message, event, args, usersData, getLang, api }) {
    const { senderID, threadID } = event;
    const action = args[0]?.toLowerCase();

    // ═══════════ إنشاء البوابة ═══════════
    if (action === "portal" || action === "بوابة") {
      const userData = await usersData.get(senderID);
      const existingPortal = userData?.data?.mafiaPortal;
      
      if (existingPortal) {
        try {
          await api.sendMessage("✅ | بوابتك جاهزة! ستستلم الأدوار هنا", existingPortal);
          return message.reply(getLang("portalExists"));
        } catch (e) {
          await usersData.set(senderID, {
            ...userData,
            data: { ...userData.data, mafiaPortal: null }
          });
        }
      }

      try {
        const botID = api.getCurrentUserID();
        const groupID = await api.createNewGroup([senderID, botID]);
        await new Promise(resolve => setTimeout(resolve, 2000));
        await api.sendMessage("✅ | تم إنشاء بوابتك!\n📩 | ستستلم أدوار المافيا هنا دائماً\n💡 | اكتب قرارك هنا عندما يحل الليل", groupID);
        
        try {
          await api.changeThreadName(`🎮 مافيا - ${await usersData.getName(senderID)}`, groupID);
        } catch (e) {}
        
        await usersData.set(senderID, {
          ...userData,
          data: { ...userData.data, mafiaPortal: groupID }
        });

        return message.reply(getLang("portalCreated"));
      } catch (e) {
        return message.reply("❌ | فشل إنشاء البوابة.\n💡 | جرب مرة أخرى");
      }
    }

    // ═══════════ بدء لعبة ═══════════
    if (action === "start") {
      if (activeGames[threadID]) return message.reply(getLang("gameAlreadyExists"));

      const userData = await usersData.get(senderID);
      const portal = userData?.data?.mafiaPortal;
      if (!portal) return message.reply(getLang("noPortal"));

      activeGames[threadID] = {
        players: [senderID],
        roles: {},
        phase: "joining",
        mafia: [],
        doctor: null,
        detective: null,
        killed: null,
        saved: null,
        investigated: null,
        votes: {},
        round: 0,
        mafiaVotes: {},
        nightReplies: {},
        playerNames: {},
        playerPortals: {},
        timer: null
      };

      const game = activeGames[threadID];
      game.playerNames[senderID] = (await usersData.getName(senderID)) || senderID;
      game.playerPortals[senderID] = portal;
      await message.reply(getLang("recruiting", game.players.length));

      game.timer = setTimeout(() => beginGame(threadID, message, api, usersData, getLang), 300000);
      return;
    }

    const game = activeGames[threadID];
    if (!game) return message.reply(getLang("gameNotStarted"));

    if (action === "join") {
      if (game.phase !== "joining") return message.reply("⚠️ | انتهى وقت الانضمام!");
      if (game.players.includes(senderID)) return message.reply(getLang("alreadyJoined"));

      const userData = await usersData.get(senderID);
      const portal = userData?.data?.mafiaPortal;
      if (!portal) return message.reply(getLang("noPortal"));

      game.players.push(senderID);
      game.playerNames[senderID] = (await usersData.getName(senderID)) || senderID;
      game.playerPortals[senderID] = portal;
      return message.reply(getLang("joinSuccess", game.players.length));
    }

    if (action === "begin" || action === "ابدأ") {
      if (game.phase !== "joining") return message.reply("⚠️ | اللعبة بدأت!");
      if (game.players.length < 5) return message.reply(getLang("needMorePlayers", 5, game.players.length));

      for (const playerID of game.players) {
        if (!game.playerPortals[playerID]) {
          const userData = await usersData.get(playerID);
          game.playerPortals[playerID] = userData?.data?.mafiaPortal;
        }
      }

      clearTimeout(game.timer);
      await beginGame(threadID, message, api, usersData, getLang);
      return;
    }
  }
};

async function beginGame(threadID, message, api, usersData, getLang) {
  const game = activeGames[threadID];
  if (!game || game.phase !== "joining") return;
  if (game.players.length < 5) { delete activeGames[threadID]; return; }

  const shuffled = [...game.players].sort(() => Math.random() - 0.5);
  const mafiaCount = Math.max(1, Math.floor(game.players.length / 3));

  game.mafia = shuffled.slice(0, mafiaCount);
  game.doctor = shuffled[mafiaCount];
  game.detective = shuffled[mafiaCount + 1];

  game.players.forEach(id => {
    if (game.mafia.includes(id)) game.roles[id] = "mafia";
    else if (id === game.doctor) game.roles[id] = "doctor";
    else if (id === game.detective) game.roles[id] = "detective";
    else game.roles[id] = "citizen";
  });

  const citizens = game.players.length - mafiaCount - 2;
  game.phase = "starting";
  await message.reply(getLang("gameStarted", game.players.length, mafiaCount, citizens));
  setTimeout(() => startNight(threadID, message, api, usersData, getLang), 5000);
}

async function startNight(threadID, message, api, usersData, getLang) {
  const game = activeGames[threadID];
  if (!game) return;

  game.phase = "night";
  game.votes = {};
  game.killed = null;
  game.saved = null;
  game.investigated = null;
  game.nightReplies = {};
  game.mafiaVotes = {};
  game.round++;

  await message.reply(getLang("gameStartedNight", game.round));

  for (const playerID of game.players) {
    const role = game.roles[playerID];
    const allNames = game.players.map(id => `• ${game.playerNames[id]}`).join("\n");
    const portalID = game.playerPortals[playerID];
    let msg;

    if (role === "mafia") {
      const partners = game.mafia.filter(id => id !== playerID);
      const partnersNames = partners.length > 0 ? partners.map(id => game.playerNames[id]).join("، ") : "أنت وحدك";
      msg = getLang("youAreMafia", partnersNames, allNames);
    } else if (role === "doctor") {
      msg = getLang("youAreDoctor", allNames);
    } else if (role === "detective") {
      msg = getLang("youAreDetective", allNames);
    } else {
      msg = getLang("youAreCitizen");
    }

    if (portalID) {
      try { await api.sendMessage(msg, portalID); } catch (e) {}
    }
  }

  setTimeout(() => endNight(threadID, message, api, usersData, getLang), 60000);
}

async function endNight(threadID, message, api, usersData, getLang) {
  const game = activeGames[threadID];
  if (!game) return;

  if (!game.killed && game.mafia.length > 0) {
    const targets = game.players.filter(id => !game.mafia.includes(id));
    if (targets.length > 0) game.killed = targets[Math.floor(Math.random() * targets.length)];
  }

  game.phase = "day";
  game.votes = {};

  let nightMsg = "";
  if (game.killed) {
    if (game.killed === game.saved) {
      nightMsg = getLang("savedMsg", game.playerNames[game.killed]);
    } else {
      const killedRole = game.roles[game.killed] === "mafia" ? "🔪 مافيا" : game.roles[game.killed] === "doctor" ? "🩺 طبيب" : game.roles[game.killed] === "detective" ? "🔍 محقق" : "👤 مواطن";
      nightMsg = getLang("killedMsg", game.playerNames[game.killed], killedRole);
      game.players = game.players.filter(id => id !== game.killed);
    }
  } else {
    nightMsg = getLang("quietNight");
  }

  if (game.investigated && game.detective && game.players.includes(game.detective)) {
    const isMafia = game.mafia.includes(game.investigated);
    const portalID = game.playerPortals[game.detective];
    if (portalID) {
      try { await api.sendMessage(`🔍 | نتيجة التحري: ${game.playerNames[game.investigated]} هو ${isMafia ? "🔪 مافيا!" : "👤 مواطن"}`, portalID); } catch (e) {}
    }
  }

  const survivors = game.players.map(id => game.playerNames[id]);
  const aliveMafia = game.mafia.filter(id => game.players.includes(id));
  const aliveCitizens = game.players.filter(id => !game.mafia.includes(id));

  if (aliveMafia.length === 0) { delete activeGames[threadID]; return message.reply(getLang("gameOverCitizens")); }
  if (aliveMafia.length >= aliveCitizens.length) { delete activeGames[threadID]; return message.reply(getLang("gameOverMafia")); }

  await message.reply(getLang("nightResult", game.round, nightMsg, survivors.join("، ")));
  game.voteTimeout = setTimeout(() => tallyVotes(threadID, message, api, usersData, getLang), 180000);
}

async function tallyVotes(threadID, message, api, usersData, getLang) {
  const game = activeGames[threadID];
  if (!game) return;
  clearTimeout(game.voteTimeout);

  const voteCount = {};
  Object.values(game.votes).forEach(t => voteCount[t] = (voteCount[t] || 0) + 1);

  let maxVotes = 0, eliminated = null;
  Object.entries(voteCount).forEach(([id, c]) => { if (c > maxVotes) { maxVotes = c; eliminated = id; } });

  if (!eliminated) {
    await message.reply("🗳️ | لا أحد طُرد!\n🌙 | الليل...");
    return setTimeout(() => startNight(threadID, message, api, usersData, getLang), 3000);
  }

  const eliminatedRole = game.roles[eliminated] === "mafia" ? "🔪 مافيا" : game.roles[eliminated] === "doctor" ? "🩺 طبيب" : game.roles[eliminated] === "detective" ? "🔍 محقق" : "👤 مواطن";
  game.players = game.players.filter(id => id !== eliminated);

  const voteList = Object.entries(voteCount).map(([id, c]) => `• ${game.playerNames[id]}: ${c} أصوات`);
  await message.reply(getLang("voteResult", voteList.join("\n"), game.playerNames[eliminated], eliminatedRole));

  const aliveMafia = game.mafia.filter(id => game.players.includes(id));
  const aliveCitizens = game.players.filter(id => !game.mafia.includes(id));

  if (aliveMafia.length === 0) { delete activeGames[threadID]; return message.reply(getLang("gameOverCitizens")); }
  if (aliveMafia.length >= aliveCitizens.length) { delete activeGames[threadID]; return message.reply(getLang("gameOverMafia")); }

  setTimeout(() => startNight(threadID, message, api, usersData, getLang), 3000);
}

// ═══════════ استقبال القرارات والتصويت ═══════════
module.exports.onChat = async function ({ event, message, api, getLang }) {
  const { body, senderID, threadID, messageReply } = event;
  if (!body) return;

  // 🌙 قرارات الليل من البوابات
  for (const tid in activeGames) {
    const game = activeGames[tid];
    if (!game || game.phase !== "night") continue;

    const playerID = Object.keys(game.playerPortals).find(id => game.playerPortals[id] === threadID);
    if (!playerID) continue;
    if (game.nightReplies[playerID]) continue;

    const targetName = body.trim();
    const target = game.players.find(id =>
      game.playerNames[id]?.toLowerCase().includes(targetName.toLowerCase())
    );
    if (!target || target === playerID) continue;

    game.nightReplies[playerID] = target;
    const role = game.roles[playerID];

    if (role === "mafia") {
      game.mafiaVotes[playerID] = target;
      try { await api.sendMessage(getLang("actionRecorded", game.playerNames[target]), threadID); } catch (e) {}
      if (Object.keys(game.mafiaVotes).length === game.mafia.length) {
        const vc = {};
        Object.values(game.mafiaVotes).forEach(t => vc[t] = (vc[t] || 0) + 1);
        game.killed = Object.entries(vc).sort((a, b) => b[1] - a[1])[0][0];
      }
    } else if (role === "doctor") {
      game.saved = target;
      try { await api.sendMessage(getLang("actionRecorded", game.playerNames[target]), threadID); } catch (e) {}
    } else if (role === "detective") {
      game.investigated = target;
      try { await api.sendMessage(getLang("actionRecorded", game.playerNames[target]), threadID); } catch (e) {}
    }
    return;
  }

  // ☀️ تصويت النهار في المجموعة الرئيسية
  const game = activeGames[threadID];
  if (!game || game.phase !== "day") return;

  const args = body.trim().toLowerCase().split(/ +/);

  if (args[0] === "vote" || args[0] === "صوت") {
    if (!messageReply) return message.reply(getLang("voteByReply"));
    if (!game.players.includes(senderID)) return;

    const targetID = messageReply.senderID;
    if (!game.players.includes(targetID)) return message.reply(getLang("notInGame"));
    if (targetID === senderID) return;
    if (game.votes[senderID]) return message.reply(getLang("alreadyVoted"));

    game.votes[senderID] = targetID;
    const totalVotes = Object.keys(game.votes).length;
    await message.reply(getLang("voteRegistered", game.playerNames[senderID], game.playerNames[targetID], totalVotes, game.players.length));

    if (totalVotes === game.players.length) {
      await message.reply(getLang("allVoted"));
      clearTimeout(game.voteTimeout);
      setTimeout(() => tallyVotes(threadID, message, api, null, getLang), 2000);
    }
    return;
  }

  if (args[0] === "votes" || args[0] === "اصوات") {
    if (Object.keys(game.votes).length === 0) return message.reply("🗳️ | لا أصوات!");
    const list = Object.entries(game.votes).map(([v, t]) => `• ${game.playerNames[v]} → ${game.playerNames[t]}`);
    return message.reply(`🗳️ | الأصوات:\n${list.join("\n")}`);
  }
};