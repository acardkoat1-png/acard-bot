const axios = require("axios");
const moment = require("moment-timezone");
const Canvas = require("canvas");
const fs = require("fs-extra");

Canvas.registerFont(__dirname + "/assets/font/BeVietnamPro-SemiBold.ttf", { family: "BeVietnamPro-SemiBold" });
Canvas.registerFont(__dirname + "/assets/font/BeVietnamPro-Regular.ttf", { family: "BeVietnamPro-Regular" });

function convertFtoC(F) { return Math.floor((F - 32) / 1.8); }
function formatHours(hours) { return moment(hours).tz("Asia/Ho_Chi_Minh").format("HH[h]mm[p]"); }

module.exports = {
	config: {
		name: "weather",
		version: "2.0",
		author: "Acard",
		countDown: 5,
		role: 0,
		description: { ar: "عرض توقعات الطقس الحالية والأيام القادمة" },
		category: "ai",
		guide: { ar: "{pn} <المدينة>" },
		envGlobal: { weatherApiKey: "d7e795ae6a0d44aaa8abb1a0a7ac19e4" }
	},

	langs: {
		ar: {
			syntaxError: "⚠️ يرجى إدخال اسم المدينة",
			notFound: "❌ لم يتم العثور على: %1",
			error: "❌ حدث خطأ: %1",
			today: "🌤 طقس اليوم: %1\n%2\n🌡 درجة الحرارة %3°C - %4°C\n🌡 الإحساس بالحرارة %5°C - %6°C\n🌅 الشروق %7\n🌄 الغروب %8\n🌃 شروق القمر %9\n🏙️ غروب القمر %10\n🌞 النهار: %11\n🌙 الليل: %12"
		}
	},

	onStart: async function ({ args, message, envGlobal, getLang }) {
		const apikey = envGlobal.weatherApiKey;
		const area = args.join(" ");
		if (!area) return message.reply(getLang("syntaxError"));
		let areaKey, dataWeather, areaName;

		try {
			const response = (await axios.get(`https://api.accuweather.com/locations/v1/cities/search.json?q=${encodeURIComponent(area)}&apikey=${apikey}&language=ar`)).data;
			if (response.length == 0) return message.reply(getLang("notFound", area));
			areaKey = response[0].Key; areaName = response[0].LocalizedName;
		} catch (err) { return message.reply(getLang("error", err.response.data.Message)); }

		try { dataWeather = (await axios.get(`http://api.accuweather.com/forecasts/v1/daily/10day/${areaKey}?apikey=${apikey}&details=true&language=ar`)).data; }
		catch (err) { return message.reply(`❌ حدث خطأ: ${err.response.data.Message}`); }

		const dataWeatherToday = dataWeather.DailyForecasts[0];
		const msg = getLang("today", areaName, dataWeather.Headline.Text, convertFtoC(dataWeatherToday.Temperature.Minimum.Value), convertFtoC(dataWeatherToday.Temperature.Maximum.Value), convertFtoC(dataWeatherToday.RealFeelTemperature.Minimum.Value), convertFtoC(dataWeatherToday.RealFeelTemperature.Maximum.Value), formatHours(dataWeatherToday.Sun.Rise), formatHours(dataWeatherToday.Sun.Set), formatHours(dataWeatherToday.Moon.Rise), formatHours(dataWeatherToday.Moon.Set), dataWeatherToday.Day.LongPhrase, dataWeatherToday.Night.LongPhrase);

		const bg = await Canvas.loadImage(__dirname + "/assets/image/bgWeather.jpg");
		const { width, height } = bg;
		const canvas = Canvas.createCanvas(width, height);
		const ctx = canvas.getContext("2d");
		ctx.drawImage(bg, 0, 0, width, height);
		let X = 100;
		ctx.fillStyle = "#ffffff";
		for (const item of dataWeather.DailyForecasts.slice(0, 7)) {
			const icon = await Canvas.loadImage("http://vortex.accuweather.com/adc2010/images/slate/icons/" + item.Day.Icon + ".svg");
			ctx.drawImage(icon, X, 210, 80, 80);
			ctx.font = "30px BeVietnamPro-SemiBold";
			ctx.fillText(`${convertFtoC(item.Temperature.Maximum.Value)}°C `, X, 366);
			ctx.font = "30px BeVietnamPro-Regular";
			ctx.fillText(`${convertFtoC(item.Temperature.Minimum.Value)}°C`, X, 445);
			ctx.fillText(moment(item.Date).format("DD"), X + 20, 140);
			X += 135;
		}

		const pathSaveImg = `${__dirname}/tmp/weather_${areaKey}.jpg`;
		fs.writeFileSync(pathSaveImg, canvas.toBuffer());
		return message.reply({ body: msg, attachment: fs.createReadStream(pathSaveImg) }, () => fs.unlinkSync(pathSaveImg));
	}
};