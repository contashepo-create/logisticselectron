// مستودع البيانات الدائم مع دعم Node.js (للاختبارات) والمتصفح و Electron
// تخزين محلي يعمل 100% بدون إنترنت مع دعم النسخ الاحتياطي والاستيراد والتصدير

import type {
  AppSettings,
  Bank,
  Cashbox,
  Company,
  CreditDebitNote,
  Customer,
  Employee,
  EmployeeDeduction,
  FinancialYear,
  Invoice,
  InvoiceTrip,
  LicenseInfo,
  PaymentVoucher,
  Payroll,
  PurchaseInvoice,
  ReceiptVoucher,
  Supplier,
  SupportMessage,
  Vehicle,
} from "@/types";
import {
  INITIAL_APP_SETTINGS,
  INITIAL_BANKS,
  INITIAL_CASHBOXES,
  INITIAL_COMPANY,
  INITIAL_CUSTOMERS,
  INITIAL_DEDUCTIONS,
  INITIAL_EMPLOYEES,
  INITIAL_INVOICES,
  INITIAL_PAYMENTS,
  INITIAL_PURCHASES,
  INITIAL_RECEIPTS,
  INITIAL_SUPPLIERS,
  INITIAL_VEHICLES,
  INITIAL_YEARS,
} from "./demo-data";
import { RuleError, roundMoney, txt } from "./rules";

const STORAGE_KEY_PREFIX = "logistics_desktop_db_v2_";
const inMemoryStore = new Map<string, string>();

function isLocalStorageAvailable(): boolean {
  try {
    return typeof window !== "undefined" && typeof localStorage !== "undefined";
  } catch {
    return false;
  }
}

function getItem<T>(key: string, defaultValue: T): T {
  try {
    const fullKey = STORAGE_KEY_PREFIX + key;
    if (isLocalStorageAvailable()) {
      const raw = localStorage.getItem(fullKey);
      if (raw) return JSON.parse(raw) as T;
    } else if (inMemoryStore.has(fullKey)) {
      return JSON.parse(inMemoryStore.get(fullKey)!) as T;
    }
    return defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    const fullKey = STORAGE_KEY_PREFIX + key;
    const json = JSON.stringify(value);
    if (isLocalStorageAvailable()) {
      localStorage.setItem(fullKey, json);
    }
    inMemoryStore.set(fullKey, json);
  } catch (e) {
    console.error(`Error writing key ${key} to storage:`, e);
  }
}

// ---------------------------------------------------------------------------
// الشركة ومعلومات النظام
// ---------------------------------------------------------------------------

export function getCompany(): Company {
  return getItem<Company>("company", INITIAL_COMPANY);
}

export function saveCompany(company: Partial<Company>): Company {
  const current = getCompany();
  const updated: Company = {
    ...current,
    ...company,
  };
  setItem("company", updated);
  return updated;
}

// ---------------------------------------------------------------------------
// إعدادات التطبيق وبيانات المطور (صفحة حول التطبيق)
// ---------------------------------------------------------------------------

export function getAppSettings(): AppSettings {
  return getItem<AppSettings>("app_settings", INITIAL_APP_SETTINGS);
}

export function saveAppSettings(patch: Partial<AppSettings>): AppSettings {
  const current = getAppSettings();
  const updated: AppSettings = {
    ...current,
    ...patch,
  };
  setItem("app_settings", updated);
  return updated;
}

// ---------------------------------------------------------------------------
// نظام التراخيص والتجربة المجانية 7 أيام + الاشتراك الأوفلاين
// ---------------------------------------------------------------------------

export function getLicenseInfo(): LicenseInfo {
  const company = getCompany();
  const now = new Date();

  let deviceId = getItem<string>("device_id", "");
  if (!deviceId) {
    deviceId = "DEV-" + Math.random().toString(36).substring(2, 9).toUpperCase() + "-" + Date.now().toString(36).toUpperCase();
    setItem("device_id", deviceId);
  }

  const trialStart = new Date(company.trial_start || now.toISOString());
  const trialEnd = new Date(company.trial_end || new Date(trialStart.getTime() + 7 * 86400000).toISOString());
  const trialDaysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / 86400000));

  let daysLeft = 0;
  let isExpired = false;
  let warningNotice = false;
  const isTrial = company.plan_type === "trial";
  let expiryDate = company.subscription_end;

  if (company.plan_type === "open") {
    daysLeft = 9999;
    isExpired = false;
  } else if (company.subscription_end) {
    const subEnd = new Date(company.subscription_end);
    daysLeft = Math.max(0, Math.ceil((subEnd.getTime() - now.getTime()) / 86400000));
    isExpired = daysLeft === 0;
    expiryDate = company.subscription_end;
    if (daysLeft <= 5 && daysLeft > 0) {
      warningNotice = true;
    }
  } else {
    daysLeft = trialDaysLeft;
    isExpired = trialDaysLeft === 0;
    expiryDate = company.trial_end;
    if (trialDaysLeft <= 5 && trialDaysLeft > 0) {
      warningNotice = true;
    }
  }

  const isLicensed = !isExpired && company.is_active;

  return {
    isLicensed,
    planType: company.plan_type,
    licenseKey: getItem<string>("license_key", ""),
    daysLeft,
    isTrial,
    isExpired,
    trialDaysLeft,
    expiryDate,
    warningNotice,
    deviceId,
    clientCode: company.client_code || "CL-DEFAULT",
  };
}

export function activateLicenseKey(key: string): {
  success: boolean;
  message: string;
  planType: "monthly" | "yearly" | "open";
  days: number;
} {
  const cleanKey = key.trim().toUpperCase();
  if (!cleanKey) {
    return { success: false, message: "يرجى إدخال رمز الترخيص.", planType: "monthly", days: 0 };
  }

  const now = new Date();
  let planType: "monthly" | "yearly" | "open" = "monthly";
  let daysToAdd = 30;

  if (cleanKey.includes("YEAR") || cleanKey.startsWith("YEAR-")) {
    planType = "yearly";
    daysToAdd = 365;
  } else if (cleanKey.includes("OPEN") || cleanKey.startsWith("OPEN-") || cleanKey.includes("LIFETIME")) {
    planType = "open";
    daysToAdd = 9999;
  } else if (cleanKey.includes("MONTH") || cleanKey.startsWith("LOGIST-") || cleanKey.length >= 12) {
    planType = "monthly";
    daysToAdd = 30;
  } else {
    return {
      success: false,
      message: "رمز الترخيص غير صالح. يرجى مراجعة المطور للحصول على رمز تفعيل صحيح.",
      planType: "monthly",
      days: 0,
    };
  }

  const company = getCompany();
  const currentEnd = company.subscription_end ? new Date(company.subscription_end) : now;
  const baseDate = currentEnd > now ? currentEnd : now;
  const newEnd = planType === "open" ? null : new Date(baseDate.getTime() + daysToAdd * 86400000).toISOString();

  saveCompany({
    plan_type: planType,
    subscription_start: now.toISOString(),
    subscription_end: newEnd,
    is_active: true,
  });

  setItem("license_key", cleanKey);
  return {
    success: true,
    message: `تم تفعيل الاشتراك بنجاح (${planType === "yearly" ? "سنوي - 365 يوماً" : planType === "open" ? "اشتراك مفتوح دائم" : "شهري - 30 يوماً"})! يعمل النظام بكامل مميزاته.`,
    planType,
    days: daysToAdd,
  };
}

// ---------------------------------------------------------------------------
// السنوات المالية
// ---------------------------------------------------------------------------

export function getFinancialYears(): FinancialYear[] {
  return getItem<FinancialYear[]>("financial_years", INITIAL_YEARS);
}

export function saveFinancialYear(data: Partial<FinancialYear>, id?: number | null): FinancialYear {
  const years = getFinancialYears();
  if (id) {
    const idx = years.findIndex((y) => y.id === id);
    if (idx === -1) throw new RuleError("السنة المالية غير موجودة.");
    years[idx] = { ...years[idx], ...data } as FinancialYear;
    setItem("financial_years", years);
    return years[idx];
  }

  const newId = years.length ? Math.max(...years.map((y) => y.id)) + 1 : 1;
  const newYear: FinancialYear = {
    id: newId,
    year: data.year ?? new Date().getFullYear(),
    date_from: data.date_from ?? `${data.year}-01-01`,
    date_to: data.date_to ?? `${data.year}-12-31`,
    status: data.status ?? "open",
    notes: data.notes ?? "",
  };
  years.push(newYear);
  setItem("financial_years", years);
  return newYear;
}

export function deleteFinancialYear(id: number): void {
  let years = getFinancialYears();
  if (years.length <= 1) throw new RuleError("لا يمكن حذف السنة المالية الوحيدة في النظام.");
  years = years.filter((y) => y.id !== id);
  setItem("financial_years", years);
}

// ---------------------------------------------------------------------------
// العملاء
// ---------------------------------------------------------------------------

export function getCustomers(): Customer[] {
  return getItem<Customer[]>("customers", INITIAL_CUSTOMERS);
}

export function getCustomer(id: number): Customer | null {
  return getCustomers().find((c) => c.id === id) ?? null;
}

export function saveCustomer(data: Partial<Customer>, id?: number | null): Customer {
  const list = getCustomers();
  const name = txt(data.name, "اسم العميل", 150, true);
  const opening_balance = roundMoney(data.opening_balance ?? 0);

  if (id) {
    const idx = list.findIndex((c) => c.id === id);
    if (idx === -1) throw new RuleError("العميل غير موجود.");
    list[idx] = {
      ...list[idx],
      ...data,
      name,
      opening_balance,
    } as Customer;
    setItem("customers", list);
    return list[idx];
  }

  const newId = list.length ? Math.max(...list.map((c) => c.id)) + 1 : 1;
  const newCustomer: Customer = {
    id: newId,
    code: data.code || `CUST-${String(newId).padStart(4, "0")}`,
    name,
    address: txt(data.address ?? "", "العنوان", 255),
    phone: txt(data.phone ?? "", "الهاتف", 50),
    tax_number: txt(data.tax_number ?? "", "الرقم الضريبي", 50),
    commercial_reg: txt(data.commercial_reg ?? "", "السجل التجاري", 50),
    city: txt(data.city ?? "", "المدينة", 100),
    opening_balance,
    notes: txt(data.notes ?? "", "الملاحظات", 1000),
    created_at: new Date().toISOString(),
  };
  list.push(newCustomer);
  setItem("customers", list);
  return newCustomer;
}

export function deleteCustomer(id: number): void {
  const invoices = getInvoices();
  const hasInvoices = invoices.some((i) => i.customer_id === id);
  if (hasInvoices) {
    throw new RuleError("لا يمكن حذف هذا العميل لوجود فواتير مسجلة باسمه. يمكنك تعديل بياناته بدلاً من ذلك.");
  }
  let list = getCustomers();
  list = list.filter((c) => c.id !== id);
  setItem("customers", list);
}

// ---------------------------------------------------------------------------
// الموظفون والسائقون
// ---------------------------------------------------------------------------

export function getEmployees(): Employee[] {
  return getItem<Employee[]>("employees", INITIAL_EMPLOYEES);
}

export function getEmployee(id: number): Employee | null {
  return getEmployees().find((e) => e.id === id) ?? null;
}

export function saveEmployee(data: Partial<Employee>, id?: number | null): Employee {
  const list = getEmployees();
  const name = txt(data.name, "اسم الموظف", 150, true);
  const base_salary = roundMoney(data.base_salary ?? 0);

  if (id) {
    const idx = list.findIndex((e) => e.id === id);
    if (idx === -1) throw new RuleError("الموظف غير موجود.");
    list[idx] = {
      ...list[idx],
      ...data,
      name,
      base_salary,
    } as Employee;
    setItem("employees", list);
    return list[idx];
  }

  const newId = list.length ? Math.max(...list.map((e) => e.id)) + 1 : 1;
  const newEmp: Employee = {
    id: newId,
    code: data.code || `EMP-${String(newId).padStart(3, "0")}`,
    name,
    nationality: txt(data.nationality ?? "", "الجنسية", 60),
    phone: txt(data.phone ?? "", "الهاتف", 50),
    emp_type: data.emp_type === "admin" ? "admin" : "driver",
    base_salary,
    notes: txt(data.notes ?? "", "ملاحظات", 1000),
    created_at: new Date().toISOString(),
  };
  list.push(newEmp);
  setItem("employees", list);
  return newEmp;
}

export function deleteEmployee(id: number): void {
  let list = getEmployees();
  list = list.filter((e) => e.id !== id);
  setItem("employees", list);
}

// ---------------------------------------------------------------------------
// الشاحنات والسيارات
// ---------------------------------------------------------------------------

export function getVehicles(): Vehicle[] {
  const list = getItem<Vehicle[]>("vehicles", INITIAL_VEHICLES);
  const emps = getEmployees();
  return list.map((v) => {
    const driver = emps.find((e) => e.id === v.default_driver_id);
    return {
      ...v,
      driver_name: driver ? driver.name : v.driver_name || "",
    };
  });
}

export function saveVehicle(data: Partial<Vehicle>, id?: number | null): Vehicle {
  const list = getVehicles();
  const plate_number = txt(data.plate_number, "رقم اللوحة", 50, true);

  if (id) {
    const idx = list.findIndex((v) => v.id === id);
    if (idx === -1) throw new RuleError("الشاحنة غير موجودة.");
    list[idx] = {
      ...list[idx],
      ...data,
      plate_number,
    } as Vehicle;
    setItem("vehicles", list);
    return list[idx];
  }

  const newId = list.length ? Math.max(...list.map((v) => v.id)) + 1 : 1;
  const newV: Vehicle = {
    id: newId,
    code: data.code || `VEH-${String(newId).padStart(2, "0")}`,
    plate_number,
    vehicle_type: txt(data.vehicle_type ?? "", "نوع المركبة", 100),
    default_driver_id: data.default_driver_id ?? null,
    notes: txt(data.notes ?? "", "الملاحظات", 1000),
    created_at: new Date().toISOString(),
  };
  list.push(newV);
  setItem("vehicles", list);
  return newV;
}

export function deleteVehicle(id: number): void {
  let list = getVehicles();
  list = list.filter((v) => v.id !== id);
  setItem("vehicles", list);
}

// ---------------------------------------------------------------------------
// الخزائن والبنوك
// ---------------------------------------------------------------------------

export function getCashboxes(): Cashbox[] {
  return getItem<Cashbox[]>("cashboxes", INITIAL_CASHBOXES);
}

export function saveCashbox(data: Partial<Cashbox>, id?: number | null): Cashbox {
  const list = getCashboxes();
  const name = txt(data.name, "اسم الخزينة", 120, true);
  const opening_balance = roundMoney(data.opening_balance ?? 0);

  if (id) {
    const idx = list.findIndex((c) => c.id === id);
    if (idx === -1) throw new RuleError("الخزينة غير موجودة.");
    list[idx] = { ...list[idx], ...data, name, opening_balance } as Cashbox;
    setItem("cashboxes", list);
    return list[idx];
  }

  const newId = list.length ? Math.max(...list.map((c) => c.id)) + 1 : 1;
  const item: Cashbox = {
    id: newId,
    code: data.code || `CASH-${String(newId).padStart(2, "0")}`,
    name,
    created_date: data.created_date || new Date().toISOString().slice(0, 10),
    opening_balance,
    notes: txt(data.notes ?? "", "ملاحظات", 500),
    created_at: new Date().toISOString(),
  };
  list.push(item);
  setItem("cashboxes", list);
  return item;
}

export function deleteCashbox(id: number): void {
  let list = getCashboxes();
  if (list.length <= 1) throw new RuleError("يجب الإبقاء على خزينة واحدة على الأقل.");
  list = list.filter((c) => c.id !== id);
  setItem("cashboxes", list);
}

export function getBanks(): Bank[] {
  return getItem<Bank[]>("banks", INITIAL_BANKS);
}

export function saveBank(data: Partial<Bank>, id?: number | null): Bank {
  const list = getBanks();
  const name = txt(data.name, "اسم البنك", 120, true);
  const opening_balance = roundMoney(data.opening_balance ?? 0);

  if (id) {
    const idx = list.findIndex((b) => b.id === id);
    if (idx === -1) throw new RuleError("البنك غير موجود.");
    list[idx] = { ...list[idx], ...data, name, opening_balance } as Bank;
    setItem("banks", list);
    return list[idx];
  }

  const newId = list.length ? Math.max(...list.map((b) => b.id)) + 1 : 1;
  const item: Bank = {
    id: newId,
    code: data.code || `BNK-${String(newId).padStart(2, "0")}`,
    name,
    created_date: data.created_date || new Date().toISOString().slice(0, 10),
    account_number: txt(data.account_number ?? "", "رقم الحساب", 50),
    iban: txt(data.iban ?? "", "رقم الآيبان", 50),
    opening_balance,
    notes: txt(data.notes ?? "", "ملاحظات", 500),
    created_at: new Date().toISOString(),
  };
  list.push(item);
  setItem("banks", list);
  return item;
}

export function deleteBank(id: number): void {
  let list = getBanks();
  list = list.filter((b) => b.id !== id);
  setItem("banks", list);
}

// ---------------------------------------------------------------------------
// الموردون
// ---------------------------------------------------------------------------

export function getSuppliers(): Supplier[] {
  return getItem<Supplier[]>("suppliers", INITIAL_SUPPLIERS);
}

export function getSupplier(id: number): Supplier | null {
  return getSuppliers().find((s) => s.id === id) ?? null;
}

export function saveSupplier(data: Partial<Supplier>, id?: number | null): Supplier {
  const list = getSuppliers();
  const name = txt(data.name, "اسم المورد", 150, true);
  const opening_balance = roundMoney(data.opening_balance ?? 0);

  if (id) {
    const idx = list.findIndex((s) => s.id === id);
    if (idx === -1) throw new RuleError("المورد غير موجود.");
    list[idx] = { ...list[idx], ...data, name, opening_balance } as Supplier;
    setItem("suppliers", list);
    return list[idx];
  }

  const newId = list.length ? Math.max(...list.map((s) => s.id)) + 1 : 1;
  const item: Supplier = {
    id: newId,
    code: data.code || `SUPP-${String(newId).padStart(3, "0")}`,
    name,
    name_en: txt(data.name_en ?? "", "اسم المورد بالإنجليزية", 150),
    phone: txt(data.phone ?? "", "الهاتف", 50),
    email: txt(data.email ?? "", "البريد الإلكتروني", 80),
    contact_person: txt(data.contact_person ?? "", "مسؤول الاتصال", 100),
    address: txt(data.address ?? "", "العنوان", 255),
    opening_balance,
    tax_number: txt(data.tax_number ?? "", "الرقم الضريبي", 50),
    commercial_reg: txt(data.commercial_reg ?? "", "السجل التجاري", 50),
    notes: txt(data.notes ?? "", "الملاحظات", 1000),
    created_at: new Date().toISOString(),
  };
  list.push(item);
  setItem("suppliers", list);
  return item;
}

export function deleteSupplier(id: number): void {
  let list = getSuppliers();
  list = list.filter((s) => s.id !== id);
  setItem("suppliers", list);
}

// ---------------------------------------------------------------------------
// فواتير النقل والرحلات والمصروفات
// ---------------------------------------------------------------------------

export function getInvoices(): Invoice[] {
  const invs = getItem<Invoice[]>("invoices", INITIAL_INVOICES);
  const customers = getCustomers();

  return invs.map((inv) => {
    const cust = customers.find((c) => c.id === inv.customer_id);
    const trips = (inv.trips || []).map((t) => ({
      ...t,
      price: roundMoney((Number(t.qty) || 1) * (Number(t.unit_price) || 0)),
      expenses: (t.expenses || []).map((e) => ({
        ...e,
        amount: roundMoney((Number(e.qty) || 1) * (Number(e.unit_amount) || 0)),
      })),
    }));

    let subtotal = 0;
    for (const trip of trips) {
      subtotal += trip.price;
      for (const exp of trip.expenses) {
        if (exp.source === "customer") {
          subtotal += exp.amount;
        }
      }
    }
    subtotal = roundMoney(subtotal);
    const vat_rate = Number(inv.vat_rate ?? 15);
    const vat_amount = roundMoney((subtotal * vat_rate) / 100);
    const total = roundMoney(subtotal + vat_amount);

    return {
      ...inv,
      customer_name: cust ? cust.name : "عميل غير معروف",
      trips,
      subtotal,
      vat_amount,
      total,
    };
  });
}

export function getInvoice(id: number): Invoice | null {
  return getInvoices().find((i) => i.id === id) ?? null;
}

export function saveInvoice(data: Partial<Invoice>, id?: number | null): Invoice {
  const list = getItem<Invoice[]>("invoices", INITIAL_INVOICES);
  const customer_id = Number(data.customer_id);
  if (!customer_id) throw new RuleError("يجب اختيار العميل للفاتورة.");

  const date = data.date || new Date().toISOString().slice(0, 10);
  const vat_rate = Number(data.vat_rate ?? 15);
  const trips = (data.trips || []).map((t, idx) => ({
    id: t.id || idx + 1,
    invoice_id: id || 0,
    vehicle_id: t.vehicle_id ? Number(t.vehicle_id) : null,
    driver_id: t.driver_id ? Number(t.driver_id) : null,
    from_loc: txt(t.from_loc, "مكان التحميل", 150, true),
    to_loc: txt(t.to_loc, "مكان التعتيق / التسليم", 150, true),
    qty: Number(t.qty) || 1,
    unit_price: roundMoney(t.unit_price ?? 0),
    price: roundMoney((Number(t.qty) || 1) * (Number(t.unit_price) || 0)),
    container_numbers: Array.isArray(t.container_numbers) ? t.container_numbers : [],
    notes: txt(t.notes ?? "", "ملاحظات النقلة", 500),
    vehicle_name: t.vehicle_name || "",
    driver_name: t.driver_name || "",
    expenses: (t.expenses || []).map((e, eIdx) => ({
      id: e.id || eIdx + 1,
      trip_id: t.id || idx + 1,
      expense_type: e.expense_type || "trip",
      qty: Number(e.qty) || 1,
      unit_amount: roundMoney(e.unit_amount ?? 0),
      amount: roundMoney((Number(e.qty) || 1) * (Number(e.unit_amount) || 0)),
      source: e.source || "cash",
      account_kind: e.account_kind || null,
      account_id: e.account_id ? Number(e.account_id) : null,
      supplier_name: e.supplier_name || "",
      notes: txt(e.notes ?? "", "ملاحظات المصروف", 255),
    })),
  }));

  if (trips.length === 0) {
    throw new RuleError("يجب إضافة نقلة / رحلة واحدة على الأقل داخل الفاتورة.");
  }

  if (id) {
    const idx = list.findIndex((i) => i.id === id);
    if (idx === -1) throw new RuleError("الفاتورة غير موجودة.");
    list[idx] = {
      ...list[idx],
      ...data,
      customer_id,
      date,
      vat_rate,
      trips,
    } as Invoice;
    setItem("invoices", list);
    return getInvoice(id)!;
  }

  const newId = list.length ? Math.max(...list.map((i) => i.id)) + 1 : 1;
  const newNumber = list.length ? Math.max(...list.map((i) => i.number)) + 1 : 1001;

  const newInvoice: Invoice = {
    id: newId,
    number: data.number ? Number(data.number) : newNumber,
    date,
    customer_id,
    vat_rate,
    notes: txt(data.notes ?? "", "ملاحظات الفاتورة", 1000),
    attachments: data.attachments || [],
    container_number: data.container_number || "",
    created_at: new Date().toISOString(),
    trips: trips.map((t) => ({ ...t, invoice_id: newId })),
  };

  list.push(newInvoice);
  setItem("invoices", list);
  return getInvoice(newId)!;
}

export function deleteInvoice(id: number): void {
  let list = getItem<Invoice[]>("invoices", INITIAL_INVOICES);
  list = list.filter((i) => i.id !== id);
  setItem("invoices", list);
}

// ---------------------------------------------------------------------------
// سندات القبض (Receipts)
// ---------------------------------------------------------------------------

export function getReceipts(): ReceiptVoucher[] {
  const list = getItem<ReceiptVoucher[]>("receipts", INITIAL_RECEIPTS);
  const customers = getCustomers();
  const cashboxes = getCashboxes();
  const banks = getBanks();

  return list.map((r) => {
    const cust = customers.find((c) => c.id === r.customer_id);
    let account_name = "";
    if (r.account_kind === "cashbox") {
      const box = cashboxes.find((c) => c.id === r.account_id);
      account_name = box ? box.name : "خزينة";
    } else {
      const bank = banks.find((b) => b.id === r.account_id);
      account_name = bank ? bank.name : "بنك";
    }

    return {
      ...r,
      customer_name: cust ? cust.name : r.voucher_type === "customer" ? "عميل" : "إيراد آخر",
      account_name,
    };
  });
}

export function saveReceipt(data: Partial<ReceiptVoucher>, id?: number | null): ReceiptVoucher {
  const list = getItem<ReceiptVoucher[]>("receipts", INITIAL_RECEIPTS);
  const amount = roundMoney(data.amount);
  if (amount <= 0) throw new RuleError("مبلغ سند القبض يجب أن يكون أكبر من صفر.");

  const account_id = Number(data.account_id);
  if (!account_id) throw new RuleError("يجب تحديد الخزينة أو الحساب البنكي المُستلم.");

  if (id) {
    const idx = list.findIndex((r) => r.id === id);
    if (idx === -1) throw new RuleError("سند القبض غير موجود.");
    list[idx] = { ...list[idx], ...data, amount, account_id } as ReceiptVoucher;
    setItem("receipts", list);
    return getReceipts().find((r) => r.id === id)!;
  }

  const newId = list.length ? Math.max(...list.map((r) => r.id)) + 1 : 1;
  const newNum = list.length ? Math.max(...list.map((r) => r.number)) + 1 : 501;

  const item: ReceiptVoucher = {
    id: newId,
    number: data.number ? Number(data.number) : newNum,
    date: data.date || new Date().toISOString().slice(0, 10),
    account_kind: data.account_kind || "cashbox",
    account_id,
    voucher_type: data.voucher_type || "customer",
    customer_id: data.customer_id ? Number(data.customer_id) : null,
    amount,
    description: txt(data.description ?? "", "البيان / الوصف", 500, true),
    created_at: new Date().toISOString(),
  };

  list.push(item);
  setItem("receipts", list);
  return getReceipts().find((r) => r.id === newId)!;
}

export function deleteReceipt(id: number): void {
  let list = getItem<ReceiptVoucher[]>("receipts", INITIAL_RECEIPTS);
  list = list.filter((r) => r.id !== id);
  setItem("receipts", list);
}

// ---------------------------------------------------------------------------
// سندات الصرف (Payments)
// ---------------------------------------------------------------------------

export function getPayments(): PaymentVoucher[] {
  const list = getItem<PaymentVoucher[]>("payments", INITIAL_PAYMENTS);
  const employees = getEmployees();
  const vehicles = getVehicles();
  const cashboxes = getCashboxes();
  const banks = getBanks();

  return list.map((p) => {
    const emp = employees.find((e) => e.id === p.employee_id);
    const veh = vehicles.find((v) => v.id === p.vehicle_id);
    let account_name = "";
    if (p.account_kind === "cashbox") {
      const box = cashboxes.find((c) => c.id === p.account_id);
      account_name = box ? box.name : "خزينة";
    } else {
      const bank = banks.find((b) => b.id === p.account_id);
      account_name = bank ? bank.name : "بنك";
    }

    return {
      ...p,
      employee_name: emp ? emp.name : "",
      plate_number: veh ? veh.plate_number : "",
      account_name,
    };
  });
}

export function savePayment(data: Partial<PaymentVoucher>, id?: number | null): PaymentVoucher {
  const list = getItem<PaymentVoucher[]>("payments", INITIAL_PAYMENTS);
  const amount = roundMoney(data.amount);
  if (amount <= 0) throw new RuleError("مبلغ سند الصرف يجب أن يكون أكبر من صفر.");

  const account_id = Number(data.account_id);
  if (!account_id) throw new RuleError("يجب تحديد الخزينة أو البنك المصروف منه.");

  if (id) {
    const idx = list.findIndex((p) => p.id === id);
    if (idx === -1) throw new RuleError("سند الصرف غير موجود.");
    list[idx] = { ...list[idx], ...data, amount, account_id } as PaymentVoucher;
    setItem("payments", list);
    return getPayments().find((p) => p.id === id)!;
  }

  const newId = list.length ? Math.max(...list.map((p) => p.id)) + 1 : 1;
  const newNum = list.length ? Math.max(...list.map((p) => p.number)) + 1 : 701;

  const item: PaymentVoucher = {
    id: newId,
    number: data.number ? Number(data.number) : newNum,
    date: data.date || new Date().toISOString().slice(0, 10),
    account_kind: data.account_kind || "cashbox",
    account_id,
    voucher_type: data.voucher_type || "general",
    supplier_id: data.supplier_id ? Number(data.supplier_id) : null,
    supplier_name: data.supplier_name || null,
    purchase_invoice_id: data.purchase_invoice_id ? Number(data.purchase_invoice_id) : null,
    trip_id: data.trip_id ? Number(data.trip_id) : null,
    employee_id: data.employee_id ? Number(data.employee_id) : null,
    vehicle_id: data.vehicle_id ? Number(data.vehicle_id) : null,
    vehicle_expense: data.vehicle_expense || "",
    quantity: Number(data.quantity) || 1,
    unit_amount: roundMoney(data.unit_amount || amount),
    amount,
    description: txt(data.description ?? "", "البيان / الوصف", 500, true),
    created_at: new Date().toISOString(),
  };

  list.push(item);
  setItem("payments", list);
  return getPayments().find((p) => p.id === newId)!;
}

export function deletePayment(id: number): void {
  let list = getItem<PaymentVoucher[]>("payments", INITIAL_PAYMENTS);
  list = list.filter((p) => p.id !== id);
  setItem("payments", list);
}

// ---------------------------------------------------------------------------
// الخصومات على الموظفين (Deductions)
// ---------------------------------------------------------------------------

export function getDeductions(): EmployeeDeduction[] {
  const list = getItem<EmployeeDeduction[]>("deductions", INITIAL_DEDUCTIONS);
  const employees = getEmployees();
  const payrolls = getPayrolls();

  return list.map((d) => {
    const emp = employees.find((e) => e.id === d.employee_id);
    let settled = 0;
    for (const p of payrolls) {
      for (const s of p.deduction_settlements || []) {
        if (s.employee_deduction_id === d.id) {
          settled += Number(s.amount) || 0;
        }
      }
    }
    settled = roundMoney(settled);
    const remaining = roundMoney(Math.max(0, d.amount - settled));
    const status: "open" | "partial" | "closed" =
      remaining === 0 ? "closed" : settled > 0 ? "partial" : "open";

    return {
      ...d,
      employee_name: emp ? emp.name : "",
      settled,
      remaining,
      status,
    };
  });
}

export function saveDeduction(data: Partial<EmployeeDeduction>, id?: number | null): EmployeeDeduction {
  const list = getItem<EmployeeDeduction[]>("deductions", INITIAL_DEDUCTIONS);
  const amount = roundMoney(data.amount);
  if (amount <= 0) throw new RuleError("قيمة الخصم يجب أن تكون أكبر من صفر.");
  const employee_id = Number(data.employee_id);
  if (!employee_id) throw new RuleError("يجب اختيار الموظف أو السائق.");

  if (id) {
    const idx = list.findIndex((d) => d.id === id);
    if (idx === -1) throw new RuleError("سجل الخصم غير موجود.");
    list[idx] = { ...list[idx], ...data, amount, employee_id } as EmployeeDeduction;
    setItem("deductions", list);
    return getDeductions().find((d) => d.id === id)!;
  }

  const newId = list.length ? Math.max(...list.map((d) => d.id)) + 1 : 1;
  const newNum = list.length ? Math.max(...list.map((d) => d.number)) + 1 : 101;

  const item: EmployeeDeduction = {
    id: newId,
    number: data.number ? Number(data.number) : newNum,
    date: data.date || new Date().toISOString().slice(0, 10),
    employee_id,
    amount,
    reason: txt(data.reason, "سبب الخصم", 255, true),
    notes: txt(data.notes ?? "", "ملاحظات الخصم", 500),
    created_at: new Date().toISOString(),
  };

  list.push(item);
  setItem("deductions", list);
  return getDeductions().find((d) => d.id === newId)!;
}

export function deleteDeduction(id: number): void {
  let list = getItem<EmployeeDeduction[]>("deductions", INITIAL_DEDUCTIONS);
  list = list.filter((d) => d.id !== id);
  setItem("deductions", list);
}

// ---------------------------------------------------------------------------
// مسيرات الرواتب (Payrolls)
// ---------------------------------------------------------------------------

export function getPayrolls(): Payroll[] {
  const list = getItem<Payroll[]>("payrolls", []);
  const employees = getEmployees();
  const cashboxes = getCashboxes();
  const banks = getBanks();

  return list.map((p) => {
    const emp = employees.find((e) => e.id === p.employee_id);
    let account_name = "";
    if (p.account_kind === "cashbox") {
      const box = cashboxes.find((c) => c.id === p.account_id);
      account_name = box ? box.name : "خزينة";
    } else {
      const bank = banks.find((b) => b.id === p.account_id);
      account_name = bank ? bank.name : "بنك";
    }

    return {
      ...p,
      employee_name: emp ? emp.name : "",
      emp_type: emp ? emp.emp_type : "driver",
      account_name,
    };
  });
}

export function savePayroll(data: Partial<Payroll>, id?: number | null): Payroll {
  const list = getItem<Payroll[]>("payrolls", []);
  const employee_id = Number(data.employee_id);
  if (!employee_id) throw new RuleError("يجب اختيار الموظف لمسير الراتب.");

  const base_salary = roundMoney(data.base_salary);
  const additions = roundMoney(data.additions ?? 0);
  const advance_deduction = roundMoney(data.advance_deduction ?? 0);
  const deduction_deduction = roundMoney(data.deduction_deduction ?? 0);
  const other_deductions = roundMoney(data.other_deductions ?? 0);

  const net_salary = roundMoney(
    base_salary + additions - advance_deduction - deduction_deduction - other_deductions
  );

  if (id) {
    const idx = list.findIndex((p) => p.id === id);
    if (idx === -1) throw new RuleError("سجل المسير غير موجود.");
    list[idx] = {
      ...list[idx],
      ...data,
      employee_id,
      base_salary,
      additions,
      advance_deduction,
      deduction_deduction,
      other_deductions,
      net_salary,
    } as Payroll;
    setItem("payrolls", list);
    return getPayrolls().find((p) => p.id === id)!;
  }

  const newId = list.length ? Math.max(...list.map((p) => p.id)) + 1 : 1;
  const newNum = list.length ? Math.max(...list.map((p) => p.number)) + 1 : 301;

  const item: Payroll = {
    id: newId,
    number: data.number ? Number(data.number) : newNum,
    date: data.date || new Date().toISOString().slice(0, 10),
    employee_id,
    period_year: Number(data.period_year) || new Date().getFullYear(),
    period_month: Number(data.period_month) || new Date().getMonth() + 1,
    account_kind: data.account_kind || "cashbox",
    account_id: Number(data.account_id) || 1,
    base_salary,
    additions,
    additions_note: txt(data.additions_note ?? "", "بيان الإضافات", 255),
    advance_deduction,
    deduction_deduction,
    other_deductions,
    net_salary,
    notes: txt(data.notes ?? "", "ملاحظات الراتب", 500),
    settlements: data.settlements || [],
    deduction_settlements: data.deduction_settlements || [],
    created_at: new Date().toISOString(),
  };

  list.push(item);
  setItem("payrolls", list);
  return getPayrolls().find((p) => p.id === newId)!;
}

export function deletePayroll(id: number): void {
  let list = getItem<Payroll[]>("payrolls", []);
  list = list.filter((p) => p.id !== id);
  setItem("payrolls", list);
}

// ---------------------------------------------------------------------------
// المشتريات وفواتير المصروفات
// ---------------------------------------------------------------------------

export function getPurchases(): PurchaseInvoice[] {
  const list = getItem<PurchaseInvoice[]>("purchases", INITIAL_PURCHASES);
  const suppliers = getSuppliers();
  const vehicles = getVehicles();
  const cashboxes = getCashboxes();
  const banks = getBanks();

  return list.map((p) => {
    const sup = suppliers.find((s) => s.id === p.supplier_id);
    const veh = vehicles.find((v) => v.id === p.vehicle_id);
    let account_name = "";
    if (p.account_kind === "cashbox") {
      const box = cashboxes.find((c) => c.id === p.account_id);
      account_name = box ? box.name : "خزينة";
    } else if (p.account_kind === "bank") {
      const bank = banks.find((b) => b.id === p.account_id);
      account_name = bank ? bank.name : "بنك";
    }

    const items = (p.items || []).map((it) => ({
      ...it,
      unit_price: roundMoney(it.unit_price),
      vat_rate: Number(it.vat_rate ?? 15),
    }));

    let subtotal = 0;
    let vat_amount = 0;
    for (const item of items) {
      const gross = item.qty * item.unit_price;
      const rate = item.vat_rate / 100;
      if (p.vat_included) {
        const base = gross / (1 + rate);
        subtotal += base;
        vat_amount += gross - base;
      } else {
        subtotal += gross;
        vat_amount += gross * rate;
      }
    }
    subtotal = roundMoney(subtotal);
    vat_amount = roundMoney(vat_amount);
    const total = roundMoney(subtotal + vat_amount);

    return {
      ...p,
      supplier_name: sup ? sup.name : p.purchase_type === "cash" ? "شراء نقدي مباشر" : "",
      vehicle_plate: veh ? veh.plate_number : "",
      account_name,
      items,
      subtotal,
      vat_amount,
      total,
    };
  });
}

export function savePurchase(data: Partial<PurchaseInvoice>, id?: number | null): PurchaseInvoice {
  const list = getItem<PurchaseInvoice[]>("purchases", INITIAL_PURCHASES);
  const items = (data.items || []).map((it, idx) => ({
    id: it.id || idx + 1,
    purchase_invoice_id: id || 0,
    item_name: txt(it.item_name, "اسم البند", 150, true),
    unit: txt(it.unit ?? "", "الوحدة", 30),
    qty: Number(it.qty) || 1,
    unit_price: roundMoney(it.unit_price),
    vat_rate: Number(it.vat_rate ?? 15),
    notes: txt(it.notes ?? "", "ملاحظات البند", 255),
  }));

  if (items.length === 0) {
    throw new RuleError("يجب إضافة بند واحد على الأقل في فاتورة المشتريات.");
  }

  if (id) {
    const idx = list.findIndex((p) => p.id === id);
    if (idx === -1) throw new RuleError("فاتورة المشتريات غير موجودة.");
    list[idx] = { ...list[idx], ...data, items } as PurchaseInvoice;
    setItem("purchases", list);
    return getPurchases().find((p) => p.id === id)!;
  }

  const newId = list.length ? Math.max(...list.map((p) => p.id)) + 1 : 1;
  const newNum = list.length ? Math.max(...list.map((p) => p.number)) + 1 : 201;

  const item: PurchaseInvoice = {
    id: newId,
    number: data.number ? Number(data.number) : newNum,
    date: data.date || new Date().toISOString().slice(0, 10),
    purchase_type: data.purchase_type || "credit",
    supplier_id: data.supplier_id ? Number(data.supplier_id) : null,
    supplier_ref: txt(data.supplier_ref ?? "", "مرجع المورد", 80),
    expense_category: data.expense_category || "fuel",
    vehicle_id: data.vehicle_id ? Number(data.vehicle_id) : null,
    account_kind: data.account_kind || null,
    account_id: data.account_id ? Number(data.account_id) : null,
    vat_rate: Number(data.vat_rate ?? 15),
    vat_included: Boolean(data.vat_included),
    notes: txt(data.notes ?? "", "ملاحظات الفاتورة", 500),
    items: items.map((it) => ({ ...it, purchase_invoice_id: newId })),
  };

  list.push(item);
  setItem("purchases", list);
  return getPurchases().find((p) => p.id === newId)!;
}

export function deletePurchase(id: number): void {
  let list = getItem<PurchaseInvoice[]>("purchases", INITIAL_PURCHASES);
  list = list.filter((p) => p.id !== id);
  setItem("purchases", list);
}

// ---------------------------------------------------------------------------
// إشعارات الدائن والمدين (Credit & Debit Notes)
// ---------------------------------------------------------------------------

export function getCreditDebitNotes(): CreditDebitNote[] {
  const list = getItem<CreditDebitNote[]>("credit_debit_notes", []);
  const customers = getCustomers();
  const invoices = getInvoices();

  return list.map((n) => {
    const cust = customers.find((c) => c.id === n.customer_id);
    const inv = invoices.find((i) => i.id === n.invoice_id);
    return {
      ...n,
      customer_name: cust ? cust.name : "",
      invoice_number: inv ? inv.number : 0,
    };
  });
}

export function saveCreditDebitNote(data: Partial<CreditDebitNote>, id?: number | null): CreditDebitNote {
  const list = getItem<CreditDebitNote[]>("credit_debit_notes", []);
  const amount = roundMoney(data.amount);
  if (amount <= 0) throw new RuleError("مبلغ الإشعار يجب أن يكون أكبر من صفر.");

  if (id) {
    const idx = list.findIndex((n) => n.id === id);
    if (idx === -1) throw new RuleError("الإشعار غير موجود.");
    list[idx] = { ...list[idx], ...data, amount } as CreditDebitNote;
    setItem("credit_debit_notes", list);
    return getCreditDebitNotes().find((n) => n.id === id)!;
  }

  const newId = list.length ? Math.max(...list.map((n) => n.id)) + 1 : 1;
  const newNum = list.length ? Math.max(...list.map((n) => n.number)) + 1 : 801;

  const item: CreditDebitNote = {
    id: newId,
    number: data.number ? Number(data.number) : newNum,
    note_type: data.note_type || "credit",
    invoice_id: Number(data.invoice_id) || 1,
    customer_id: Number(data.customer_id) || 1,
    date: data.date || new Date().toISOString().slice(0, 10),
    amount,
    vat_rate: Number(data.vat_rate ?? 15),
    reason: txt(data.reason, "سبب الإشعار", 255, true),
    trip_ids: data.trip_ids || [],
    created_at: new Date().toISOString(),
  };

  list.push(item);
  setItem("credit_debit_notes", list);
  return getCreditDebitNotes().find((n) => n.id === newId)!;
}

export function deleteCreditDebitNote(id: number): void {
  let list = getItem<CreditDebitNote[]>("credit_debit_notes", []);
  list = list.filter((n) => n.id !== id);
  setItem("credit_debit_notes", list);
}

// ---------------------------------------------------------------------------
// قناة الدعم والمراسلة الفورية مع المطور
// ---------------------------------------------------------------------------

export function getSupportMessages(): SupportMessage[] {
  return getItem<SupportMessage[]>("support_messages", [
    {
      id: "msg_welcome_01",
      company_id: getCompany().id,
      sender: "admin",
      sender_name: "الدعم الفني والخدمات",
      body: "أهلاً بك في النظام المحاسبي لخدمات النقل واللوجستيات! يمكنك كتابة أي استفسار أو طلب مساعدة هنا وسيرد عليك المطور فوراً عبر البوت.",
      is_read: true,
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
  ]);
}

export function sendSupportMessage(body: string, sender: "client" | "admin" = "client"): SupportMessage {
  const list = getSupportMessages();
  const company = getCompany();
  const cleanBody = txt(body, "نص الرسالة", 2000, true);

  const newMsg: SupportMessage = {
    id: "msg_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    company_id: company.id,
    sender,
    sender_name: sender === "client" ? company.name : "المطور (تليجرام)",
    body: cleanBody,
    is_read: sender === "client",
    created_at: new Date().toISOString(),
  };

  list.push(newMsg);
  setItem("support_messages", list);
  return newMsg;
}

// ---------------------------------------------------------------------------
// النسخ الاحتياطي وتصدير / استيراد كامل قاعدة البيانات
// ---------------------------------------------------------------------------

export function exportFullDatabaseBackup(): string {
  const data = {
    version: "2.4.0",
    exportDate: new Date().toISOString(),
    company: getCompany(),
    app_settings: getAppSettings(),
    financial_years: getFinancialYears(),
    customers: getCustomers(),
    employees: getEmployees(),
    vehicles: getVehicles(),
    cashboxes: getCashboxes(),
    banks: getBanks(),
    suppliers: getSuppliers(),
    invoices: getItem<Invoice[]>("invoices", INITIAL_INVOICES),
    receipts: getItem<ReceiptVoucher[]>("receipts", INITIAL_RECEIPTS),
    payments: getItem<PaymentVoucher[]>("payments", INITIAL_PAYMENTS),
    deductions: getItem<EmployeeDeduction[]>("deductions", INITIAL_DEDUCTIONS),
    payrolls: getItem<Payroll[]>("payrolls", []),
    purchases: getItem<PurchaseInvoice[]>("purchases", INITIAL_PURCHASES),
    credit_debit_notes: getItem<CreditDebitNote[]>("credit_debit_notes", []),
    support_messages: getSupportMessages(),
    license_key: getItem<string>("license_key", ""),
  };
  return JSON.stringify(data, null, 2);
}

export function importFullDatabaseBackup(jsonString: string): { success: boolean; message: string } {
  try {
    const data = JSON.parse(jsonString);
    if (!data || typeof data !== "object") {
      return { success: false, message: "ملف النسخة الاحتياطية غير صالح." };
    }

    if (data.company) setItem("company", data.company);
    if (data.app_settings) setItem("app_settings", data.app_settings);
    if (data.financial_years) setItem("financial_years", data.financial_years);
    if (data.customers) setItem("customers", data.customers);
    if (data.employees) setItem("employees", data.employees);
    if (data.vehicles) setItem("vehicles", data.vehicles);
    if (data.cashboxes) setItem("cashboxes", data.cashboxes);
    if (data.banks) setItem("banks", data.banks);
    if (data.suppliers) setItem("suppliers", data.suppliers);
    if (data.invoices) setItem("invoices", data.invoices);
    if (data.receipts) setItem("receipts", data.receipts);
    if (data.payments) setItem("payments", data.payments);
    if (data.deductions) setItem("deductions", data.deductions);
    if (data.payrolls) setItem("payrolls", data.payrolls);
    if (data.purchases) setItem("purchases", data.purchases);
    if (data.credit_debit_notes) setItem("credit_debit_notes", data.credit_debit_notes);
    if (data.support_messages) setItem("support_messages", data.support_messages);
    if (data.license_key) setItem("license_key", data.license_key);

    return { success: true, message: "تم استعادة كافة بيانات النظام المحاسبي بنجاح!" };
  } catch (error) {
    return { success: false, message: "فشل استيراد النسخة الاحتياطية: " + String(error) };
  }
}

export function resetAllDataToDemo(): void {
  // Clear memory store
  inMemoryStore.clear();

  setItem("company", INITIAL_COMPANY);
  setItem("app_settings", INITIAL_APP_SETTINGS);
  setItem("financial_years", INITIAL_YEARS);
  setItem("customers", INITIAL_CUSTOMERS);
  setItem("employees", INITIAL_EMPLOYEES);
  setItem("vehicles", INITIAL_VEHICLES);
  setItem("cashboxes", INITIAL_CASHBOXES);
  setItem("banks", INITIAL_BANKS);
  setItem("suppliers", INITIAL_SUPPLIERS);
  setItem("invoices", INITIAL_INVOICES);
  setItem("receipts", INITIAL_RECEIPTS);
  setItem("payments", INITIAL_PAYMENTS);
  setItem("deductions", INITIAL_DEDUCTIONS);
  setItem("payrolls", []);
  setItem("purchases", INITIAL_PURCHASES);
  setItem("credit_debit_notes", []);
  setItem("license_key", "");
}
