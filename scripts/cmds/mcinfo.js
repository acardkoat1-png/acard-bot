module.exports = {
	config: {
		name: "mcinfo",
		aliases: ["serverinfo", "mcip"],
		version: "1.0",
		author: "Acard",
		countDown: 5,
		role: 0,
		description: { ar: "عرض معلومات سيرفر ماين كرافت" },
		category: "minecraft",
		guide: { ar: "{pn}" }
	},

	langs: {
		ar: {
			info: `
╔══════════════════════╗
      🌍 معلومات السيرفر
╚══════════════════════╝

🎮 اسم السيرفر: In9ilab
━━━━━━━━━━━━━━━━━━━━━━━

📌 الآيبي (Java):
   In9ilab.aternos.me

📌 الآيبي (Bedrock):
   In9ilab.aternos.me
🔌 البورت: 19531

━━━━━━━━━━━━━━━━━━━━━━━
🎮 يدعم: Java + Bedrock

━━━━━━━━━━━━━━━━━━━━━━━
📋 قوانين السيرفر:

1️⃣ احترم جميع اللاعبين
2️⃣ ممنوع الشتم والإهانة
3️⃣ ممنوع الغش والهاكس
4️⃣ ممنوع تدمير بناء الآخرين
5️⃣ أطع أوامر الإدارة

━━━━━━━━━━━━━━━━━━━━━━━
🔍 للتحقق من الحالة: /mcstatus
👥 لرؤية اللاعبين: /mcplayers`
		}
	},

	onStart: async function ({ message, getLang }) {
		return message.reply(getLang("info"));
	}
};
