module.exports.config = {
  name: "daily",
  version: "2.0",
  author: "Acard",
  role: 0,
  category: "economy",
  shortDescription: "المكافأة اليومية العشوائية"
};

module.exports.onStart = async function ({ api, event, usersData }) {
  const { senderID, threadID, messageID } = event;

  // جلب جميع بيانات المستخدم
  const userData = await usersData.get(senderID);
  
  // الرصيد الحالي
  let money = userData?.data?.money ?? 100;
  
  // وقت آخر مكافأة
  let lastDaily = userData?.data?.lastDaily ?? 0;

  const now = Date.now();
  const cooldown = 24 * 60 * 60 * 1000; // 24 ساعة

  // التحقق من وقت الاستخدام السابق
  if (now - lastDaily < cooldown) {
    const remaining = cooldown - (now - lastDaily);
    const hour = Math.floor(remaining / 3600000);
    const minute = Math.floor((remaining % 3600000) / 60000);

    return api.sendMessage(
      `⏳ | لقد حصلت على مكافأتك اليومية بالفعل!\n\n⏰ | عد بعد: ${hour} ساعة و ${minute} دقيقة`,
      threadID,
      messageID
    );
  }

  // 🎲 جائزة عشوائية بين 500 و 5000 (مضاعفات 500)
  const min = 1;
  const max = 10;
  const randomMultiplier = Math.floor(Math.random() * (max - min + 1)) + min;
  const bonus = randomMultiplier * 500;

  // إضافة الجائزة للرصيد
  money += bonus;

  // ✅ حفظ بنفس طريقة الأوامر الأخرى
  await usersData.set(senderID, {
    ...userData,
    data: {
      ...userData.data,
      money: money,
      lastDaily: now
    }
  });

  api.sendMessage(
    `🎁 | المكافأة اليومية!\n━━━━━━━━━━━━━━━━━\n💰 | ربحت: +${bonus} دولار\n💳 | رصيدك الجديد: ${money} دولار\n\n🎲 | الجائزة عشوائية بين 500 و 5000`,
    threadID,
    messageID
  );
};