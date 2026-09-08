// أدوات التنسيق العامة

export function formatMoney(amount: number | string | null | undefined, currency = "ر.س"): string {
  const n = Number(amount ?? 0);
  const formatted = (Number.isFinite(n) ? n : 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return currency ? `${formatted} ${currency}` : formatted;
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toISOString().slice(0, 10);
  } catch {
    return String(dateStr);
  }
}

export const PAYMENT_TYPES: Record<string, string> = {
  trip: "مصروف نقلة / رحلة",
  advance: "سلفة سائق / موظف",
  vehicle: "مصروف شاحنة / صيانة",
  general: "مصروف عمومي وإداري",
  supplier: "سداد مورد / مشتريات",
  purchase: "فاتورة مشتريات نقدية",
  owner: "مسحوبات شخصية / شركاء",
};

export const EXPENSE_TYPES: Record<string, string> = {
  trip: "كارتات ومصروفات طريق",
  fuel: "وقود وديزل",
  card: "كارتة وميزان",
  other: "نثريات أخرى",
};

export const PURCHASE_EXPENSE_CATEGORIES: Record<string, string> = {
  fuel: "وقود وزيوت",
  spare_parts: "قطع غيار وصيانة",
  tires: "إطارات وبطاريات",
  stationery: "مطبوعات وأدوات مكتبية",
  utilities: "كهرباء ومياه وهاتف",
  rent: "إيجارات",
  other: "مشتريات متنوعة أخرى",
};

export const EXPENSE_SOURCE_LABELS: Record<string, string> = {
  cash: "نقداً من الخزينة / البنك",
  driver: "عهدة السائق",
  supplier: "آجل على حساب المورد",
  customer: "يتحملها العميل",
};
