// القيم الافتراضية الحقيقية للتطبيق عند التسليم للعميل (بدون أي بيانات تجريبية أو وهمية)
// جميع القوائم فارغة تماماً؛ يُدخل العميل بياناته الخاصة من الصفر.
// لبيانات الاختبارات الآلية (Vitest) راجع sample-data.ts

import type {
  Bank,
  Cashbox,
  Company,
  CreditDebitNote,
  Customer,
  Employee,
  EmployeeDeduction,
  FinancialYear,
  Invoice,
  PaymentVoucher,
  Payroll,
  PurchaseInvoice,
  ReceiptVoucher,
  Supplier,
  Vehicle,
  AppSettings,
} from "@/types";

function generateClientCode(): string {
  return "CL-" + Math.floor(100000 + Math.random() * 899999).toString();
}

export const INITIAL_COMPANY: Company = {
  id: "comp_" + Date.now().toString(36),
  name: "اسم منشأتك (يرجى تعديله من الإعدادات)",
  phone: "",
  email: "",
  address: "",
  currency: "ر.س",
  vat_rate: 15,
  vat_note: "الأسعار خاضعة لضريبة القيمة المضافة 15%",
  commercial_reg: "",
  tax_number: "",
  plan_type: "trial",
  client_code: generateClientCode(),
  trial_start: new Date().toISOString(),
  trial_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  subscription_start: null,
  subscription_end: null,
  is_active: true,
  created_at: new Date().toISOString(),
};

const currentYear = new Date().getFullYear();

export const INITIAL_YEARS: FinancialYear[] = [
  {
    id: 1,
    year: currentYear,
    date_from: `${currentYear}-01-01`,
    date_to: `${currentYear}-12-31`,
    status: "open",
    notes: "السنة المالية الحالية",
  },
];

export const INITIAL_CUSTOMERS: Customer[] = [];

export const INITIAL_EMPLOYEES: Employee[] = [];

export const INITIAL_VEHICLES: Vehicle[] = [];

export const INITIAL_CASHBOXES: Cashbox[] = [
  {
    id: 1,
    code: "CASH-01",
    name: "الخزينة الرئيسية",
    created_date: new Date().toISOString().slice(0, 10),
    opening_balance: 0,
    notes: "",
  },
];

export const INITIAL_BANKS: Bank[] = [];

export const INITIAL_SUPPLIERS: Supplier[] = [];

export const INITIAL_INVOICES: Invoice[] = [];

export const INITIAL_RECEIPTS: ReceiptVoucher[] = [];

export const INITIAL_PAYMENTS: PaymentVoucher[] = [];

export const INITIAL_DEDUCTIONS: EmployeeDeduction[] = [];

export const INITIAL_PURCHASES: PurchaseInvoice[] = [];

export const INITIAL_CREDIT_DEBIT_NOTES: CreditDebitNote[] = [];

export const INITIAL_PAYROLLS: Payroll[] = [];

export const INITIAL_APP_SETTINGS: AppSettings = {
  app_name: "نظام المحاسبة وإدارة النقليات واللوجستيات",
  app_version: "2.5.0 Desktop Pro",
  developer_name: "",
  developer_title: "",
  developer_country: "",
  phone: "",
  whatsapp: "",
  telegram: "",
  email: "",
  support_hours: "",
  about_text: "برنامج سطح مكتب متكامل لإدارة شركات النقل البري واللوجستيات، يعمل أوفلاين بالكامل ومتوافق مع ويندوز 7 وما بعده.",
  payment_note: "",
  copyright: "",
  monthly_price: 0,
  yearly_price: 0,
  pricing_discount_note: "",
  visibility: {
    developer_country: true,
    support_hours: true,
    pricing: true,
  },
  custom_fields: [],
  cloudflare_worker_url: "",
};
