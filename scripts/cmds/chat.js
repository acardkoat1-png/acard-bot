const axios = require("axios");

const conversations = new Map();
const MAX_HISTORY = 10;

const APIS = [
	"https://betadash-api-swordslush-production.up.railway.app/you?chat=",
	"https://api.simsimi.vn/v1/simsimi?lc=ar&text="
];

async function getAIReply(userMessage, history) {
	const contextLines = history.slice(-MAX_HISTORY).map(m =>
		`${m.role === "user" ? "المستخدم" : "المساعد"}: ${m.content}`
	).join("\n");

	const fullPrompt = contextLines
		? `هذه محادثة سابقة:\n${contextLines}\n\nالمستخدم: ${userMessage}\n\nأجب بشكل ذكي وطبيعي واحتفظ بالسياق:`
		: userMessage;

	try {
		const res = await axios.get(APIS[0] + encodeURIComponent(fullPrompt), { timeout: 15000 });
		if (res.data?.response) return res.data.response;
	} catch (_) {}

	try {
		const res2 = await axios.get(APIS[1] + encodeURIComponent(userMessage), { timeout: 10000 });
		if (res2.data?.message) return res2.data.message;
	} catch (_) {}

	return null;
}

module.exports = {
	config: {
		name: "chat",
		aliases: ["تكلم", "محادثة", "اي"],
		version: "1.0",
		author: "Acard",
		countDown: 5,
		role: 0,
		description: { ar: "ابدأ محادثة ذكية مع البوت — يرد فقط على من يرد عليه" },
		category: "ai",
		guide: {
			ar: "{pn} — يبدأ محادثة\n{pn} stop — ينهي المحادثة"
		}
	},

	langs: {
		ar: {
			greeting: "👋 أهلاً! أنا هنا للمحادثة.\nرد على هذه الرسالة وسأجيبك بذكاء 🧠\n\nللإنهاء، رد بـ: stop",
			thinking: "💭",
			error: "❌ تعذّر الاتصال بالذكاء الاصطناعي، حاول مرة أخرى.",
			stopped: "👋 تمت إنهاء المحادثة. أراك قريباً!",
			empty: "⚠️ أرسل رسالة لأجيبك!"
		}
	},

	onStart: async function ({ message, event, commandName, getLang }) {
		const greeting = getLang("greeting");

		message.reply(greeting, (err, info) => {
			if (err) return;

			const key = `${event.threadID}_${info.messageID}`;
			conversations.set(key, [
				{ role: "assistant", content: greeting }
			]);

			global.GoatBot.onReply.set(info.messageID, {
				commandName,
				messageID: info.messageID,
				threadID: event.threadID
			});
		});
	},

	onReply: async function ({ message, event, Reply, commandName, getLang }) {
		const userText = event.body?.trim();
		if (!userText) return message.reply(getLang("empty"));

		if (["stop", "وقف", "انهاء", "إنهاء", "انهي", "انتهى"].includes(userText.toLowerCase())) {
			const key = `${event.threadID}_${Reply.messageID}`;
			conversations.delete(key);
			return message.reply(getLang("stopped"));
		}

		const key = `${event.threadID}_${Reply.messageID}`;
		const history = conversations.get(key) || [];

		await message.reaction("💭");

		history.push({ role: "user", content: userText });

		const aiText = await getAIReply(userText, history);

		if (!aiText) {
			await message.reaction("❌");
			return message.reply(getLang("error"));
		}

		history.push({ role: "assistant", content: aiText });

		if (history.length > MAX_HISTORY * 2) history.splice(0, 2);
		conversations.set(key, history);

		await message.reaction("✅");

		message.reply(aiText, (err, info) => {
			if (err) return;

			const newKey = `${event.threadID}_${info.messageID}`;
			conversations.set(newKey, [...history]);

			global.GoatBot.onReply.set(info.messageID, {
				commandName,
				messageID: info.messageID,
				threadID: event.threadID
			});
		});
	}
};
