// تفقيط الأرقام إلى كلمات باللغة العربية للعملات المالية (ريال سعودي / هللة)

const ONES = [
  "",
  "واحد",
  "اثنان",
  "ثلاثة",
  "أربعة",
  "خمسة",
  "ستة",
  "سبعة",
  "ثمانية",
  "تسعة",
  "عشرة",
  "أحد عشر",
  "اثنا عشر",
  "ثلاثة عشر",
  "أربعة عشر",
  "خمسة عشر",
  "ستة عشر",
  "سبعة عشر",
  "ثمانية عشر",
  "تسعة عشر",
];

const TENS = [
  "",
  "",
  "عشرون",
  "ثلاثون",
  "أربعون",
  "خمسون",
  "ستون",
  "سبعون",
  "ثمانون",
  "تسعون",
];

const HUNDREDS = [
  "",
  "مائة",
  "مئتان",
  "ثلاثمائة",
  "أربعمائة",
  "خمسمائة",
  "ستمائة",
  "سبعمائة",
  "ثمانمائة",
  "تسعمائة",
];

function convertGroup(n: number): string {
  let output = "";
  const h = Math.floor(n / 100);
  const rem = n % 100;

  if (h > 0) {
    output += HUNDREDS[h];
  }

  if (rem > 0) {
    if (output) output += " و";
    if (rem < 20) {
      output += ONES[rem];
    } else {
      const o = rem % 10;
      const t = Math.floor(rem / 10);
      if (o > 0) {
        output += ONES[o] + " و" + TENS[t];
      } else {
        output += TENS[t];
      }
    }
  }

  return output;
}

export function numberToArabicWords(num: number, currency = "ريال سعودي", subCurrency = "هللة"): string {
  const rounded = Math.round((Number(num) || 0) * 100) / 100;
  if (rounded === 0) return `صفر ${currency} فقط لا غير`;

  const isNegative = rounded < 0;
  const abs = Math.abs(rounded);
  const integerPart = Math.floor(abs);
  const decimalPart = Math.round((abs - integerPart) * 100);

  const parts: string[] = [];

  // Millions
  const millions = Math.floor(integerPart / 1000000);
  const thousands = Math.floor((integerPart % 1000000) / 1000);
  const onesGroup = integerPart % 1000;

  if (millions > 0) {
    if (millions === 1) parts.push("مليون");
    else if (millions === 2) parts.push("مليونان");
    else if (millions >= 3 && millions <= 10) parts.push(`${convertGroup(millions)} ملايين`);
    else parts.push(`${convertGroup(millions)} مليون`);
  }

  if (thousands > 0) {
    if (thousands === 1) parts.push("ألف");
    else if (thousands === 2) parts.push("ألفان");
    else if (thousands >= 3 && thousands <= 10) parts.push(`${convertGroup(thousands)} آلاف`);
    else parts.push(`${convertGroup(thousands)} ألف`);
  }

  if (onesGroup > 0) {
    parts.push(convertGroup(onesGroup));
  }

  let words = parts.join(" و");
  if (words) words += ` ${currency}`;

  if (decimalPart > 0) {
    const subWords = convertGroup(decimalPart);
    words += (words ? " و" : "") + `${subWords} ${subCurrency}`;
  }

  return `${isNegative ? "سالب " : ""}${words} فقط لا غير`;
}
