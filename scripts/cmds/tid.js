module.exports = {
	config: {
		name: "tid",
		version: "2.0",
		author: "Acard",
		countDown: 5,
		role: 0,
		description: { ar: "عرض معرف المجموعة" },
		category: "box chat",
		guide: { ar: "{pn}" }
	},

	onStart: async function ({ message, event }) {
		message.reply(event.threadID.toString());
	}
};