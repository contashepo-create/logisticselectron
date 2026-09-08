// Types for Logistics & Accounting Desktop Application

export type ThemeMode = "light" | "dark" | "system";

export type ViewType =
  | "dashboard"
  | "invoices"
  | "receipts"
  | "payments"
  | "customers"
  | "suppliers"
  | "vehicles"
  | "employees"
  | "advances"
  | "deductions"
  | "payroll"
  | "treasury"
  | "reports"
  | "financial-years"
  | "about"
  | "settings";

export type AccountKind = "cashbox" | "bank";

export interface Company {
  id: string;
  name: string;
  name_en?: string;
  phone: string;
  email: string;
  address: string;
  currency: string;
  vat_rate: number;
  vat_note: string;
  commercial_reg?: string;
  cr_number?: string;
  tax_number?: string;
  vat_number?: string;
  bank_name?: string;
  iban?: string;
  logo_url?: string;
  plan_type: "trial" | "monthly" | "yearly" | "open";
  client_code: string;
  trial_start: string;
  trial_end: string;
  subscription_start: string | null;
  subscription_end: string | null; // null = open / lifetime
  is_active: boolean;
  created_at?: string;
}

export interface LicenseInfo {
  isLicensed: boolean;
  planType: "trial" | "monthly" | "yearly" | "open";
  licenseKey?: string;
  daysLeft: number;
  isTrial: boolean;
  isExpired: boolean;
  trialDaysLeft: number;
  expiryDate: string | null;
  warningNotice: boolean; // True when <= 5 days left to prompt internet renewal politely
  deviceId: string;
  clientCode: string;
}

export interface FinancialYear {
  id: number;
  year: number;
  date_from: string;
  date_to: string;
  status: "open" | "closed";
  notes: string;
}

export interface Customer {
  id: number;
  code: string;
  name: string;
  address: string;
  phone: string;
  tax_number?: string;
  commercial_reg?: string;
  country?: string;
  city?: string;
  opening_balance: number;
  notes: string;
  created_at?: string;
}

export interface Employee {
  id: number;
  code: string;
  name: string;
  nationality: string;
  phone: string;
  emp_type: "driver" | "admin";
  base_salary: number;
  notes: string;
  created_at?: string;
}

export interface Vehicle {
  id: number;
  code: string;
  plate_number: string;
  vehicle_type: string;
  default_driver_id: number | null;
  notes: string;
  driver_name?: string;
  created_at?: string;
}

export interface Cashbox {
  id: number;
  code: string;
  name: string;
  created_date: string;
  opening_balance: number;
  notes: string;
  created_at?: string;
}

export interface Bank {
  id: number;
  code: string;
  name: string;
  created_date: string;
  account_number: string;
  iban: string;
  opening_balance: number;
  notes: string;
  created_at?: string;
}

export interface TreasuryAccount {
  id: number;
  name: string;
  kind: AccountKind;
  balance: number;
}

export type ExpenseSource = "cash" | "driver" | "supplier" | "customer";

export interface TripExpense {
  id: number;
  trip_id: number;
  expense_type: "trip" | "fuel" | "card" | "other";
  qty: number;
  unit_amount: number;
  amount: number;
  source: ExpenseSource;
  account_kind?: "cashbox" | "bank" | null;
  account_id?: number | null;
  supplier_name?: string;
  notes: string;
}

export interface InvoiceTrip {
  id: number;
  invoice_id: number;
  vehicle_id: number | null;
  driver_id: number | null;
  from_loc: string;
  to_loc: string;
  qty: number;
  unit_price: number;
  price: number;
  container_numbers: string[];
  notes: string;
  expenses: TripExpense[];
  vehicle_name?: string | null;
  driver_name?: string | null;
}

export interface Invoice {
  id: number;
  number: number;
  date: string;
  customer_id: number;
  vat_rate: number;
  notes: string;
  attachments: string[];
  container_number?: string;
  created_at?: string;
  trips?: InvoiceTrip[];
  customer_name?: string;
  subtotal?: number;
  vat_amount?: number;
  total?: number;
}

export type CreditDebitNoteType = "credit" | "debit";

export interface CreditDebitNote {
  id: number;
  number: number;
  note_type: CreditDebitNoteType;
  invoice_id: number;
  customer_id: number;
  date: string;
  amount: number;
  vat_rate: number;
  reason: string;
  trip_ids?: number[];
  created_at?: string;
  customer_name?: string;
  invoice_number?: number;
}

export interface ReceiptVoucher {
  id: number;
  number: number;
  date: string;
  account_kind: "cashbox" | "bank";
  account_id: number;
  voucher_type: "customer" | "other";
  customer_id: number | null;
  amount: number;
  description: string;
  created_at?: string;
  customer_name?: string;
  account_name?: string;
}

export interface PaymentVoucher {
  id: number;
  number: number;
  date: string;
  account_kind: "cashbox" | "bank";
  account_id: number;
  voucher_type: "trip" | "advance" | "vehicle" | "general" | "supplier" | "purchase" | "owner";
  supplier_id?: number | null;
  supplier_name?: string | null;
  purchase_invoice_id?: number | null;
  trip_id: number | null;
  employee_id: number | null;
  vehicle_id: number | null;
  vehicle_expense: string;
  quantity: number;
  unit_amount: number;
  amount: number;
  description: string;
  created_at?: string;
  employee_name?: string;
  plate_number?: string;
  account_name?: string;
}

export interface AdvanceSettlementRow {
  id: number;
  payment_voucher_id: number;
  payroll_id: number;
  amount: number;
  voucher_number: number;
  voucher_date: string;
}

export interface EmployeeDeduction {
  id: number;
  number: number;
  date: string;
  employee_id: number;
  amount: number;
  reason: string;
  notes: string;
  created_at?: string;
  employee_name?: string;
  settled?: number;
  remaining?: number;
  status?: "open" | "partial" | "closed";
}

export interface DeductionSettlementRow {
  id: number;
  employee_deduction_id: number;
  payroll_id: number;
  amount: number;
  deduction_number: number;
  deduction_date: string;
  deduction_reason?: string;
}

export interface Payroll {
  id: number;
  number: number;
  date: string;
  employee_id: number;
  period_year: number;
  period_month: number;
  account_kind: "cashbox" | "bank";
  account_id: number;
  base_salary: number;
  additions: number;
  additions_note: string;
  advance_deduction: number;
  other_deductions: number;
  deduction_deduction?: number;
  net_salary: number;
  notes: string;
  created_at?: string;
  employee_name?: string;
  emp_type?: string;
  account_name?: string;
  settlements?: AdvanceSettlementRow[];
  deduction_settlements?: DeductionSettlementRow[];
}

export interface Supplier {
  id: number;
  code: string;
  name: string;
  name_en: string;
  phone: string;
  email: string;
  contact_person: string;
  address: string;
  opening_balance: number;
  notes: string;
  tax_number: string;
  commercial_reg: string;
  created_at?: string;
}

export interface PurchaseItem {
  id: number;
  purchase_invoice_id: number;
  item_name: string;
  unit: string;
  qty: number;
  unit_price: number;
  vat_rate: number;
  notes?: string;
}

export interface PurchaseInvoice {
  id: number;
  number: number;
  date: string;
  purchase_type: "credit" | "cash";
  supplier_id: number | null;
  supplier_ref: string;
  expense_category: string;
  vehicle_id: number | null;
  account_kind: "cashbox" | "bank" | null;
  account_id: number | null;
  vat_rate: number;
  vat_included: boolean;
  notes: string;
  items: PurchaseItem[];
  supplier_name?: string;
  vehicle_plate?: string;
  account_name?: string;
  subtotal?: number;
  vat_amount?: number;
  total?: number;
}

export interface CustomField {
  id: string;
  label: string;
  value: string;
  type: "text" | "phone" | "whatsapp" | "telegram" | "email" | "link";
  enabled: boolean;
}

export interface AppSettings {
  app_name: string;
  app_version: string;
  developer_name: string;
  developer_title: string;
  developer_country: string;
  phone: string;
  whatsapp: string;
  telegram: string;
  email: string;
  support_hours: string;
  about_text: string;
  payment_note: string;
  copyright: string;
  monthly_price: number;
  yearly_price: number;
  pricing_discount_note: string;
  visibility: Record<string, boolean>;
  custom_fields: CustomField[];
  cloudflare_worker_url?: string;
  last_synced_at?: string;
}

export interface SupportMessage {
  id: string;
  company_id: string;
  sender: "client" | "admin";
  sender_name: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

export type InvoicePrintTemplate =
  | "classic"
  | "modern"
  | "zatca"
  | "thermal"
  | "logistics"
  | "royal";

export type PrintTemplateType =
  | InvoicePrintTemplate
  | "receipt-voucher"
  | "payment-voucher"
  | "report";

export interface PrintSettings {
  template: InvoicePrintTemplate;
  accent_color: string;
  show_logo: boolean;
  logo_url: string;
  show_qr: boolean;
  label_language: "ar" | "en" | "both";
  header_title: string;
  footer_text: string;
  show_terms: boolean;
  terms_text: string;
}
