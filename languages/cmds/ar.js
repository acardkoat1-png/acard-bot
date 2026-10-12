/*
 * نصوص الأوامر بالعربية
 * -----------------------------------------------------------
 * هذا الملف يعيد كل النصوص الإنجليزية كأساس (حتى لا تظهر رسالة
 * "Can't find text" في أي أمر لم يُترجم بعد)، ثم يستبدل بالعربية
 * ما تُرجم فعلاً.
 *
 * لإضافة ترجمة أي أمر: أضف اسم الأمر ثم text: { المفتاح: "النص" }
 * (أسماء المفاتيح موجودة في languages/cmds/en.js)
 */
const en = require("./en.js");

function mergeDeep(base, extra) {
	const out = { ...base };
	for (const key in extra) {
		const b = base[key];
		const e = extra[key];
		if (b && e && typeof b === "object" && typeof e === "object" && !Array.isArray(b) && !Array.isArray(e))
			out[key] = mergeDeep(b, e);
		else
			out[key] = e;
	}
	return out;
}

const ar = {
	slowmode: {
		description: "تحديد مدة الانتظار بين الأوامر في المجموعة",
		guide: "   {pn} [الوقت بالثواني]",
		text: {
			turnedOn: "✅ تم تفعيل وضع التمهّل: %1 ثانية بين كل أمرين",
			turnedOff: "✅ تم تعطيل وضع التمهّل",
			status: "وضع التمهّل الحالي: %1 ثانية",
			setSuccess: "✅ تم ضبط مدة التمهّل على %1 ثانية",
			setMin: "⚠️ الحد الأدنى هو %1 ثانية",
			cooldownMsg: "⏳ تمهّل قليلاً، انتظر %1 ثانية قبل الأمر التالي"
		}
	},
	balance: {
		description: "عرض رصيدك أو رصيد الشخص المُشار إليه",
		guide: "   {pn}: عرض رصيدك\n   {pn} <@إشارة>: عرض رصيد الشخص المُشار إليه",
		text: {
			money: "رصيدك هو %1$",
			moneyOf: "%1 يملك %2$"
		}
	},
	uid: {
		description: "عرض معرّف المستخدم على فيسبوك",
		guide: "   {pn}: عرض معرّفك\n   {pn} @إشارة: عرض معرّف المُشار إليه\n   {pn} <رابط الحساب>: عرض معرّف الرابط",
		text: {
			syntaxError: "أشِر إلى الشخص المطلوب، أو اترك الأمر فارغاً لعرض معرّفك"
		}
	},
	tid: {
		description: "عرض معرّف هذه المجموعة",
		guide: "{pn}"
	},
	rank: {
		description: "عرض مستواك أو مستوى الشخص المُشار إليه (يمكن الإشارة لأكثر من شخص)"
	}
};

module.exports = mergeDeep(en, ar);
