// قواعد المنع والتحقق المحاسبي والمدخلات

export class RuleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RuleError";
  }
}

/** تقريب المبالغ المالية إلى منزلتين عشريتين مع تجنب أخطاء الفاصلة العائمة */
export function roundMoney(amount: unknown): number {
  const n = Number(amount ?? 0);
  if (!Number.isFinite(n)) return 0;
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** التحقق من صحة المعرّف الموجب */
export function positiveId(id: unknown, label = "المعرّف"): number {
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) {
    throw new RuleError(`${label} غير صالح.`);
  }
  return n;
}

/** التحقق من النص غير الفارغ وإزالة المسافات الزائدة */
export function txt(value: unknown, label: string, maxLen = 255, required = false): string {
  const str = String(value ?? "").trim();
  if (required && !str) {
    throw new RuleError(`${label} مطلوب ولا يمكن تركه فارغاً.`);
  }
  if (str.length > maxLen) {
    throw new RuleError(`${label} يجب ألا يتجاوز ${maxLen} حرفاً.`);
  }
  return str;
}

/** التحقق من الأرقام وضبط حدودها */
export function boundedNumber(
  value: unknown,
  label: string,
  min = 0,
  max = 1000000000,
  integer = false
): number {
  const n = Number(value);
  if (Number.isNaN(n) || !Number.isFinite(n)) {
    throw new RuleError(`${label} يجب أن يكون رقماً صالحاً.`);
  }
  if (n < min) {
    throw new RuleError(`${label} لا يمكن أن يكون أقل من ${min}.`);
  }
  if (n > max) {
    throw new RuleError(`${label} لا يمكن أن يتجاوز ${max}.`);
  }
  return integer ? Math.round(n) : roundMoney(n);
}

/** التحقق من صحة تاريخ بصيغة YYYY-MM-DD */
export function validIsoDate(dateStr: unknown, label = "التاريخ"): string {
  const str = String(dateStr ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    throw new RuleError(`${label} يجب أن يكون بصيغة تاريخ صحيحة (YYYY-MM-DD).`);
  }
  const d = new Date(str);
  if (isNaN(d.getTime())) {
    throw new RuleError(`${label} غير صالح.`);
  }
  return str;
}
