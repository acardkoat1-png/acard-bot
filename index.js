const { spawn } = require("child_process");
const log = require("./logger/log.js");

function startProject() {
	const child = spawn("node", ["Goat.js"], {
		cwd: __dirname,
		stdio: "inherit",
		shell: true
	});

	child.on("close", (code) => {
		if (code == 2) {
			log.info("Restarting Project...");
			startProject();
		}
	});
}

startProject();

// ————————————————————————————————————————————————
// سيرفر صغير للصحة (Health) — يستمع على المنفذ الذي تعطيه منصة الاستضافة
// Railway / Render / Replit تعطي المنفذ في المتغير PORT
// ————————————————————————————————————————————————
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Bot is running!');
});

app.get('/uptime', (req, res) => {
  res.status(200).json({ ok: true, uptime: process.uptime() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Uptime server running on port ${PORT}`);
});
