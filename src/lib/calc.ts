// المحرك المحاسبي الشامل لعمليات النقل واللوجستيات
// حساب الأرصدة اللحظية، كشوف الحسابات، الأرباح والخسائر، أعمار الديون، أداء الأسطول

import type {
  AccountKind,
  AdvanceSettlementRow,
  Bank,
  Cashbox,
  Customer,
  DeductionSettlementRow,
  Employee,
  EmployeeDeduction,
  Invoice,
  InvoiceTrip,
  PaymentVoucher,
  Payroll,
  PurchaseInvoice,
  ReceiptVoucher,
  Supplier,
  Vehicle,
} from "@/types";
import { roundMoney } from "./rules";
import {
  getBanks,
  getCashboxes,
  getCreditDebitNotes,
  getCustomers,
  getDeductions,
  getEmployees,
  getInvoices,
  getPayments,
  getPayrolls,
  getPurchases,
  getReceipts,
  getSuppliers,
  getVehicles,
} from "./storage";

export function num(x: unknown): number {
  const v = Number(x ?? 0);
  return Number.isFinite(v) ? v : 0;
}

// ---------------------------------------------------------------------------
// رصيد العميل وكشف حسابه
// ---------------------------------------------------------------------------

/**
 * رصيد العميل:
 * موجب = مطلوب منه (مدين لنا)
 * سالب = له رصيد دائن
 * المعادلة: الرصيد الافتتاحي + إجمالي الفواتير (نقلات + مصروفات على العميل + الضريبة) - سندات القبض + إشعارات المدين - إشعارات الدائن
 */
export function customerBalance(customerId: number, beforeDate?: string | null): number {
  const customers = getCustomers();
  const c = customers.find((x) => x.id === customerId);
  const opening = c ? num(c.opening_balance) : 0;

  const invoices = getInvoices().filter((inv) => {
    if (inv.customer_id !== customerId) return false;
    if (beforeDate && inv.date >= beforeDate) return false;
    return true;
  });

  let invTotal = 0;
  for (const inv of invoices) {
    invTotal += num(inv.total);
  }

  const receipts = getReceipts().filter((rec) => {
    if (rec.voucher_type !== "customer" || rec.customer_id !== customerId) return false;
    if (beforeDate && rec.date >= beforeDate) return false;
    return true;
  });

  let recTotal = 0;
  for (const r of receipts) {
    recTotal += num(r.amount);
  }

  const notes = getCreditDebitNotes().filter((n) => {
    if (n.customer_id !== customerId) return false;
    if (beforeDate && n.date >= beforeDate) return false;
    return true;
  });

  let noteEffect = 0;
  for (const n of notes) {
    const total = num(n.amount) + roundMoney((num(n.amount) * num(n.vat_rate)) / 100);
    noteEffect += n.note_type === "debit" ? total : -total;
  }

  return roundMoney(opening + invTotal - recTotal + noteEffect);
}

export function customersWithBalance(): (Customer & { balance: number })[] {
  const list = getCustomers();
  return list.map((c) => ({
    ...c,
    balance: customerBalance(c.id),
  }));
}

export interface StatementRow {
  date: string;
  doc: string;
  desc: string;
  debit: number; // مدين (عليه)
  credit: number; // دائن (له)
  balance: number;
  kind: "opening" | "invoice" | "receipt" | "credit_note" | "debit_note" | "payment" | "purchase";
}

export function customerStatement(
  customerId: number,
  fromDate?: string | null,
  toDate?: string | null
): { rows: StatementRow[]; totals: { debit: number; credit: number; balance: number } } {
  const customer = getCustomers().find((c) => c.id === customerId);
  if (!customer) return { rows: [], totals: { debit: 0, credit: 0, balance: 0 } };

  const opening = fromDate ? customerBalance(customerId, fromDate) : num(customer.opening_balance);

  const events: StatementRow[] = [];

  // Invoices
  const invoices = getInvoices().filter((inv) => {
    if (inv.customer_id !== customerId) return false;
    if (fromDate && inv.date < fromDate) return false;
    if (toDate && inv.date > toDate) return false;
    return true;
  });

  for (const inv of invoices) {
    events.push({
      date: inv.date,
      doc: `فاتورة #${inv.number}`,
      desc: inv.notes || `فاتورة خدمات نقل بري (${inv.trips?.length || 1} نقلات)`,
      debit: num(inv.total),
      credit: 0,
      balance: 0,
      kind: "invoice",
    });
  }

  // Receipts
  const receipts = getReceipts().filter((rec) => {
    if (rec.voucher_type !== "customer" || rec.customer_id !== customerId) return false;
    if (fromDate && rec.date < fromDate) return false;
    if (toDate && rec.date > toDate) return false;
    return true;
  });

  for (const r of receipts) {
    events.push({
      date: r.date,
      doc: `سند قبض #${r.number}`,
      desc: r.description || "سداد نقدي / تحويل بنكي من العميل",
      debit: 0,
      credit: num(r.amount),
      balance: 0,
      kind: "receipt",
    });
  }

  // Credit / Debit notes
  const notes = getCreditDebitNotes().filter((n) => {
    if (n.customer_id !== customerId) return false;
    if (fromDate && n.date < fromDate) return false;
    if (toDate && n.date > toDate) return false;
    return true;
  });

  for (const n of notes) {
    const total = num(n.amount) + roundMoney((num(n.amount) * num(n.vat_rate)) / 100);
    if (n.note_type === "debit") {
      events.push({
        date: n.date,
        doc: `إشعار مدين #${n.number}`,
        desc: n.reason || "إشعار مدين إضافي",
        debit: total,
        credit: 0,
        balance: 0,
        kind: "debit_note",
      });
    } else {
      events.push({
        date: n.date,
        doc: `إشعار دائن #${n.number}`,
        desc: n.reason || "خصم / مرتجع نقلة",
        debit: 0,
        credit: total,
        balance: 0,
        kind: "credit_note",
      });
    }
  }

  events.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  let running = roundMoney(opening);
  const rows: StatementRow[] = [
    {
      date: fromDate ?? "",
      doc: "رصيد افتتاحي",
      desc: fromDate ? "الرصيد المرحل حتى بداية الفترة" : "الرصيد الافتتاحي للعميل",
      debit: 0,
      credit: 0,
      balance: running,
      kind: "opening",
    },
  ];

  let totalDebit = 0;
  let totalCredit = 0;

  for (const e of events) {
    running = roundMoney(running + e.debit - e.credit);
    totalDebit += e.debit;
    totalCredit += e.credit;
    rows.push({
      ...e,
      balance: running,
    });
  }

  return {
    rows,
    totals: {
      debit: roundMoney(totalDebit),
      credit: roundMoney(totalCredit),
      balance: running,
    },
  };
}

// ---------------------------------------------------------------------------
// رصيد الخزينة والبنك
// ---------------------------------------------------------------------------

export function accountBalance(
  kind: "cashbox" | "bank",
  accountId: number,
  beforeDate?: string | null
): number {
  let opening = 0;
  if (kind === "cashbox") {
    const box = getCashboxes().find((c) => c.id === accountId);
    opening = box ? num(box.opening_balance) : 0;
  } else {
    const bank = getBanks().find((b) => b.id === accountId);
    opening = bank ? num(bank.opening_balance) : 0;
  }

  // 1. Receipts (Inflow)
  const receipts = getReceipts().filter((r) => {
    if (r.account_kind !== kind || r.account_id !== accountId) return false;
    if (beforeDate && r.date >= beforeDate) return false;
    return true;
  });
  const totalIn = receipts.reduce((acc, r) => acc + num(r.amount), 0);

  // 2. Payments (Outflow)
  const payments = getPayments().filter((p) => {
    if (p.account_kind !== kind || p.account_id !== accountId) return false;
    if (beforeDate && p.date >= beforeDate) return false;
    return true;
  });
  const totalOutPayments = payments.reduce((acc, p) => acc + num(p.amount), 0);

  // 3. Payrolls paid from this account (Outflow)
  const payrolls = getPayrolls().filter((p) => {
    if (p.account_kind !== kind || p.account_id !== accountId) return false;
    if (beforeDate && p.date >= beforeDate) return false;
    return true;
  });
  const totalOutPayroll = payrolls.reduce((acc, p) => acc + num(p.net_salary), 0);

  // 4. Trip cash expenses paid directly from this cashbox/bank
  const invoices = getInvoices();
  let totalOutTripExp = 0;
  for (const inv of invoices) {
    if (beforeDate && inv.date >= beforeDate) continue;
    for (const trip of inv.trips || []) {
      for (const exp of trip.expenses || []) {
        if (exp.source === "cash" && exp.account_kind === kind && exp.account_id === accountId) {
          totalOutTripExp += num(exp.amount);
        }
      }
    }
  }

  // 5. Cash Purchases directly paid from this account
  const purchases = getPurchases().filter((p) => {
    if (p.purchase_type !== "cash" || p.account_kind !== kind || p.account_id !== accountId) return false;
    if (beforeDate && p.date >= beforeDate) return false;
    return true;
  });
  const totalOutPurchases = purchases.reduce((acc, p) => acc + num(p.total), 0);

  return roundMoney(
    opening + totalIn - (totalOutPayments + totalOutPayroll + totalOutTripExp + totalOutPurchases)
  );
}

export function accountsWithBalance(): {
  cashboxes: (Cashbox & { balance: number })[];
  banks: (Bank & { balance: number })[];
  totalCash: number;
  totalBank: number;
  totalLiquid: number;
} {
  const cashboxes = getCashboxes().map((c) => ({
    ...c,
    balance: accountBalance("cashbox", c.id),
  }));

  const banks = getBanks().map((b) => ({
    ...b,
    balance: accountBalance("bank", b.id),
  }));

  const totalCash = roundMoney(cashboxes.reduce((acc, c) => acc + c.balance, 0));
  const totalBank = roundMoney(banks.reduce((acc, b) => acc + b.balance, 0));
  const totalLiquid = roundMoney(totalCash + totalBank);

  return { cashboxes, banks, totalCash, totalBank, totalLiquid };
}

// ---------------------------------------------------------------------------
// رصيد المورد وكشف حسابه
// ---------------------------------------------------------------------------

export function supplierBalance(supplierId: number, beforeDate?: string | null): number {
  const suppliers = getSuppliers();
  const s = suppliers.find((x) => x.id === supplierId);
  const opening = s ? num(s.opening_balance) : 0;

  // Credit Purchases
  const purchases = getPurchases().filter((p) => {
    if (p.supplier_id !== supplierId) return false;
    if (beforeDate && p.date >= beforeDate) return false;
    return true;
  });

  const purchaseTotal = purchases.reduce((acc, p) => acc + num(p.total), 0);

  // Payments to supplier
  const payments = getPayments().filter((p) => {
    if (p.supplier_id !== supplierId && p.voucher_type !== "supplier") return false;
    if (p.supplier_id !== supplierId) return false;
    if (beforeDate && p.date >= beforeDate) return false;
    return true;
  });

  const paidTotal = payments.reduce((acc, p) => acc + num(p.amount), 0);

  return roundMoney(opening + purchaseTotal - paidTotal);
}

export function suppliersWithBalance(): (Supplier & { balance: number })[] {
  const list = getSuppliers();
  return list.map((s) => ({
    ...s,
    balance: supplierBalance(s.id),
  }));
}

export function supplierStatement(
  supplierId: number,
  fromDate?: string | null,
  toDate?: string | null
): { rows: StatementRow[]; totals: { debit: number; credit: number; balance: number } } {
  const sup = getSuppliers().find((s) => s.id === supplierId);
  if (!sup) return { rows: [], totals: { debit: 0, credit: 0, balance: 0 } };

  const opening = fromDate ? supplierBalance(supplierId, fromDate) : num(sup.opening_balance);
  const events: StatementRow[] = [];

  // Purchases (Credit -> Increases what we owe)
  const purchases = getPurchases().filter((p) => {
    if (p.supplier_id !== supplierId) return false;
    if (fromDate && p.date < fromDate) return false;
    if (toDate && p.date > toDate) return false;
    return true;
  });

  for (const p of purchases) {
    events.push({
      date: p.date,
      doc: `فاتورة مشتريات #${p.number}`,
      desc: p.supplier_ref ? `مرجع: ${p.supplier_ref} — ${p.notes}` : p.notes || "مشتريات",
      debit: 0,
      credit: num(p.total),
      balance: 0,
      kind: "purchase",
    });
  }

  // Payments (Debit -> Decreases what we owe)
  const payments = getPayments().filter((p) => {
    if (p.supplier_id !== supplierId) return false;
    if (fromDate && p.date < fromDate) return false;
    if (toDate && p.date > toDate) return false;
    return true;
  });

  for (const p of payments) {
    events.push({
      date: p.date,
      doc: `سند صرف #${p.number}`,
      desc: p.description || "سداد للمورد",
      debit: num(p.amount),
      credit: 0,
      balance: 0,
      kind: "payment",
    });
  }

  events.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  let running = roundMoney(opening);
  const rows: StatementRow[] = [
    {
      date: fromDate ?? "",
      doc: "رصيد افتتاحي",
      desc: fromDate ? "الرصيد المرحل للمورد" : "الرصيد الافتتاحي للمورد",
      debit: 0,
      credit: 0,
      balance: running,
      kind: "opening",
    },
  ];

  let totalDebit = 0;
  let totalCredit = 0;

  for (const e of events) {
    running = roundMoney(running + e.credit - e.debit);
    totalDebit += e.debit;
    totalCredit += e.credit;
    rows.push({
      ...e,
      balance: running,
    });
  }

  return {
    rows,
    totals: {
      debit: roundMoney(totalDebit),
      credit: roundMoney(totalCredit),
      balance: running,
    },
  };
}

// ---------------------------------------------------------------------------
// أعمار الديون (Aging of Receivables and Payables)
// ---------------------------------------------------------------------------

export interface AgingBucketRow {
  id: number;
  name: string;
  current: number; // 0-30 days
  d31_60: number; // 31-60 days
  d61_90: number; // 61-90 days
  over90: number; // 90+ days
  total: number;
}

export function customersAging(asOf: Date = new Date()): AgingBucketRow[] {
  const customers = getCustomers();
  const invoices = getInvoices();
  const receipts = getReceipts();
  const out: AgingBucketRow[] = [];

  for (const c of customers) {
    const custInvoices = invoices
      .filter((i) => i.customer_id === c.id)
      .sort((a, b) => (a.date < b.date ? -1 : 1));

    const totalPaid = receipts
      .filter((r) => r.voucher_type === "customer" && r.customer_id === c.id)
      .reduce((acc, r) => acc + num(r.amount), 0);

    let remainingPaid = totalPaid;
    const buckets = { current: 0, d31_60: 0, d61_90: 0, over90: 0 };

    // Include opening balance
    if (c.opening_balance > 0) {
      const openDue = c.opening_balance;
      const used = Math.min(remainingPaid, openDue);
      remainingPaid -= used;
      const balanceOpen = openDue - used;
      if (balanceOpen > 0) {
        buckets.over90 += balanceOpen;
      }
    }

    for (const inv of custInvoices) {
      let due = num(inv.total);
      if (remainingPaid > 0) {
        const used = Math.min(remainingPaid, due);
        due -= used;
        remainingPaid -= used;
      }
      if (due <= 0) continue;

      const diffDays = Math.floor(
        (asOf.getTime() - new Date(inv.date).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays <= 30) buckets.current += due;
      else if (diffDays <= 60) buckets.d31_60 += due;
      else if (diffDays <= 90) buckets.d61_90 += due;
      else buckets.over90 += due;
    }

    const total = roundMoney(
      buckets.current + buckets.d31_60 + buckets.d61_90 + buckets.over90
    );

    if (total > 0 || c.opening_balance > 0) {
      out.push({
        id: c.id,
        name: c.name,
        current: roundMoney(buckets.current),
        d31_60: roundMoney(buckets.d31_60),
        d61_90: roundMoney(buckets.d61_90),
        over90: roundMoney(buckets.over90),
        total,
      });
    }
  }

  return out.sort((a, b) => b.total - a.total);
}

export function suppliersAging(asOf: Date = new Date()): AgingBucketRow[] {
  const suppliers = getSuppliers();
  const purchases = getPurchases();
  const payments = getPayments();
  const out: AgingBucketRow[] = [];

  for (const s of suppliers) {
    const supPurchases = purchases
      .filter((p) => p.supplier_id === s.id)
      .sort((a, b) => (a.date < b.date ? -1 : 1));

    const totalPaid = payments
      .filter((p) => p.supplier_id === s.id)
      .reduce((acc, p) => acc + num(p.amount), 0);

    let remainingPaid = totalPaid;
    const buckets = { current: 0, d31_60: 0, d61_90: 0, over90: 0 };

    if (s.opening_balance > 0) {
      const openDue = s.opening_balance;
      const used = Math.min(remainingPaid, openDue);
      remainingPaid -= used;
      const bal = openDue - used;
      if (bal > 0) buckets.over90 += bal;
    }

    for (const pur of supPurchases) {
      let due = num(pur.total);
      if (remainingPaid > 0) {
        const used = Math.min(remainingPaid, due);
        due -= used;
        remainingPaid -= used;
      }
      if (due <= 0) continue;

      const diffDays = Math.floor(
        (asOf.getTime() - new Date(pur.date).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays <= 30) buckets.current += due;
      else if (diffDays <= 60) buckets.d31_60 += due;
      else if (diffDays <= 90) buckets.d61_90 += due;
      else buckets.over90 += due;
    }

    const total = roundMoney(
      buckets.current + buckets.d31_60 + buckets.d61_90 + buckets.over90
    );

    if (total > 0 || s.opening_balance > 0) {
      out.push({
        id: s.id,
        name: s.name,
        current: roundMoney(buckets.current),
        d31_60: roundMoney(buckets.d31_60),
        d61_90: roundMoney(buckets.d61_90),
        over90: roundMoney(buckets.over90),
        total,
      });
    }
  }

  return out.sort((a, b) => b.total - a.total);
}

// ---------------------------------------------------------------------------
// تقرير الأرباح والخسائر (Profit & Loss / P&L)
// ---------------------------------------------------------------------------

export interface PnLReport {
  revenue: {
    tripsRevenue: number;
    customerExpensesReimbursed: number;
    otherRevenues: number;
    totalGrossRevenue: number;
  };
  directExpenses: {
    tripFuel: number;
    tripTolls: number;
    tripOther: number;
    totalDirectTripExpenses: number;
  };
  grossProfit: number;
  operatingExpenses: {
    payrollGross: number;
    vehicleMaintenance: number;
    purchasesExpenses: number;
    generalAdminExpenses: number;
    totalOperatingExpenses: number;
  };
  netOperatingProfit: number;
  tripsCount: number;
}

export function pnlReport(fromDate?: string | null, toDate?: string | null): PnLReport {
  const invoices = getInvoices().filter((inv) => {
    if (fromDate && inv.date < fromDate) return false;
    if (toDate && inv.date > toDate) return false;
    return true;
  });

  let tripsRevenue = 0;
  let customerExpensesReimbursed = 0;
  let tripFuel = 0;
  let tripTolls = 0;
  let tripOther = 0;
  let tripsCount = 0;

  for (const inv of invoices) {
    for (const trip of inv.trips || []) {
      tripsCount += Number(trip.qty) || 1;
      tripsRevenue += num(trip.price);

      for (const exp of trip.expenses || []) {
        if (exp.source === "customer") {
          customerExpensesReimbursed += num(exp.amount);
        }
        if (exp.expense_type === "fuel") tripFuel += num(exp.amount);
        else if (exp.expense_type === "card") tripTolls += num(exp.amount);
        else tripOther += num(exp.amount);
      }
    }
  }

  // Other receipts (other than customer debt collections)
  const otherReceipts = getReceipts().filter((r) => {
    if (r.voucher_type !== "other") return false;
    if (fromDate && r.date < fromDate) return false;
    if (toDate && r.date > toDate) return false;
    return true;
  });
  const otherRevenues = otherReceipts.reduce((acc, r) => acc + num(r.amount), 0);

  const totalGrossRevenue = roundMoney(
    tripsRevenue + customerExpensesReimbursed + otherRevenues
  );
  const totalDirectTripExpenses = roundMoney(tripFuel + tripTolls + tripOther);
  const grossProfit = roundMoney(totalGrossRevenue - totalDirectTripExpenses);

  // Operating Expenses
  const payrolls = getPayrolls().filter((p) => {
    if (fromDate && p.date < fromDate) return false;
    if (toDate && p.date > toDate) return false;
    return true;
  });
  // Payroll expense = Base + Additions
  const payrollGross = roundMoney(
    payrolls.reduce((acc, p) => acc + num(p.base_salary) + num(p.additions), 0)
  );

  const payments = getPayments().filter((p) => {
    if (fromDate && p.date < fromDate) return false;
    if (toDate && p.date > toDate) return false;
    return true;
  });

  let vehicleMaintenance = 0;
  let generalAdminExpenses = 0;

  for (const p of payments) {
    if (p.voucher_type === "vehicle") vehicleMaintenance += num(p.amount);
    if (p.voucher_type === "general") generalAdminExpenses += num(p.amount);
  }

  const purchases = getPurchases().filter((p) => {
    if (fromDate && p.date < fromDate) return false;
    if (toDate && p.date > toDate) return false;
    return true;
  });
  const purchasesExpenses = roundMoney(purchases.reduce((acc, p) => acc + num(p.subtotal), 0));

  const totalOperatingExpenses = roundMoney(
    payrollGross + vehicleMaintenance + generalAdminExpenses + purchasesExpenses
  );
  const netOperatingProfit = roundMoney(grossProfit - totalOperatingExpenses);

  return {
    revenue: {
      tripsRevenue: roundMoney(tripsRevenue),
      customerExpensesReimbursed: roundMoney(customerExpensesReimbursed),
      otherRevenues: roundMoney(otherRevenues),
      totalGrossRevenue,
    },
    directExpenses: {
      tripFuel: roundMoney(tripFuel),
      tripTolls: roundMoney(tripTolls),
      tripOther: roundMoney(tripOther),
      totalDirectTripExpenses,
    },
    grossProfit,
    operatingExpenses: {
      payrollGross,
      vehicleMaintenance: roundMoney(vehicleMaintenance),
      purchasesExpenses,
      generalAdminExpenses: roundMoney(generalAdminExpenses),
      totalOperatingExpenses,
    },
    netOperatingProfit,
    tripsCount,
  };
}

// ---------------------------------------------------------------------------
// تقرير أداء المركبات والشاحنات
// ---------------------------------------------------------------------------

export interface VehiclePerformance {
  vehicleId: number;
  code: string;
  plateNumber: string;
  vehicleType: string;
  driverName: string;
  tripsCount: number;
  totalRevenue: number;
  fuelExpenses: number;
  maintenanceExpenses: number;
  otherExpenses: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
}

export function vehicleReport(
  vehicleId?: number | null,
  fromDate?: string | null,
  toDate?: string | null
): VehiclePerformance[] {
  const vehicles = getVehicles();
  const targetVehicles = vehicleId ? vehicles.filter((v) => v.id === vehicleId) : vehicles;
  const invoices = getInvoices().filter((inv) => {
    if (fromDate && inv.date < fromDate) return false;
    if (toDate && inv.date > toDate) return false;
    return true;
  });
  const payments = getPayments().filter((p) => {
    if (fromDate && p.date < fromDate) return false;
    if (toDate && p.date > toDate) return false;
    return true;
  });

  const out: VehiclePerformance[] = [];

  for (const v of targetVehicles) {
    let tripsCount = 0;
    let totalRevenue = 0;
    let fuelExpenses = 0;
    let otherExpenses = 0;

    for (const inv of invoices) {
      for (const t of inv.trips || []) {
        if (t.vehicle_id === v.id) {
          tripsCount += Number(t.qty) || 1;
          totalRevenue += num(t.price);
          for (const exp of t.expenses || []) {
            if (exp.expense_type === "fuel") fuelExpenses += num(exp.amount);
            else otherExpenses += num(exp.amount);
          }
        }
      }
    }

    let maintenanceExpenses = 0;
    for (const p of payments) {
      if (p.voucher_type === "vehicle" && p.vehicle_id === v.id) {
        maintenanceExpenses += num(p.amount);
      }
    }

    const totalExpenses = roundMoney(fuelExpenses + maintenanceExpenses + otherExpenses);
    const netProfit = roundMoney(totalRevenue - totalExpenses);
    const profitMargin = totalRevenue > 0 ? roundMoney((netProfit / totalRevenue) * 100) : 0;

    out.push({
      vehicleId: v.id,
      code: v.code,
      plateNumber: v.plate_number,
      vehicleType: v.vehicle_type,
      driverName: v.driver_name || "—",
      tripsCount,
      totalRevenue: roundMoney(totalRevenue),
      fuelExpenses: roundMoney(fuelExpenses),
      maintenanceExpenses: roundMoney(maintenanceExpenses),
      otherExpenses: roundMoney(otherExpenses),
      totalExpenses,
      netProfit,
      profitMargin,
    });
  }

  return out.sort((a, b) => b.totalRevenue - a.totalRevenue);
}

// ---------------------------------------------------------------------------
// كشف حساب وسجل الموظف والسلف والخصومات
// ---------------------------------------------------------------------------

export interface EmployeeStatementData {
  employee: Employee;
  totalAdvancesIssued: number;
  totalAdvancesSettled: number;
  remainingAdvances: number;
  totalDeductionsIssued: number;
  totalDeductionsSettled: number;
  remainingDeductions: number;
  payrollsCount: number;
  totalNetSalariesPaid: number;
  recentAdvances: PaymentVoucher[];
  recentDeductions: EmployeeDeduction[];
}

export function employeeStatement(employeeId: number): EmployeeStatementData | null {
  const emp = getEmployees().find((e) => e.id === employeeId);
  if (!emp) return null;

  const payments = getPayments().filter(
    (p) => p.voucher_type === "advance" && p.employee_id === employeeId
  );
  const totalAdvancesIssued = roundMoney(
    payments.reduce((acc, p) => acc + num(p.amount), 0)
  );

  const deductions = getDeductions().filter((d) => d.employee_id === employeeId);
  const totalDeductionsIssued = roundMoney(
    deductions.reduce((acc, d) => acc + num(d.amount), 0)
  );
  const totalDeductionsSettled = roundMoney(
    deductions.reduce((acc, d) => acc + num(d.settled), 0)
  );
  const remainingDeductions = roundMoney(
    totalDeductionsIssued - totalDeductionsSettled
  );

  const payrolls = getPayrolls().filter((p) => p.employee_id === employeeId);
  const totalAdvancesSettled = roundMoney(
    payrolls.reduce((acc, p) => acc + num(p.advance_deduction), 0)
  );
  const remainingAdvances = roundMoney(
    Math.max(0, totalAdvancesIssued - totalAdvancesSettled)
  );
  const totalNetSalariesPaid = roundMoney(
    payrolls.reduce((acc, p) => acc + num(p.net_salary), 0)
  );

  return {
    employee: emp,
    totalAdvancesIssued,
    totalAdvancesSettled,
    remainingAdvances,
    totalDeductionsIssued,
    totalDeductionsSettled,
    remainingDeductions,
    payrollsCount: payrolls.length,
    totalNetSalariesPaid,
    recentAdvances: payments,
    recentDeductions: deductions,
  };
}

// ---------------------------------------------------------------------------
// لوحة التحكم الشاملة (Dashboard Overview)
// ---------------------------------------------------------------------------

export interface DashboardOverview {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  totalLiquidCash: number;
  totalCash: number;
  totalBank: number;
  totalReceivables: number;
  totalPayables: number;
  tripsCount: number;
  invoicesCount: number;
  activeVehiclesCount: number;
  activeDriversCount: number;
  monthlyChart: { month: string; revenue: number; expenses: number; profit: number }[];
  topCustomers: { name: string; revenue: number; tripsCount: number }[];
  recentActivities: { id: string; type: string; title: string; date: string; amount: number; color: string }[];
}

export function getDashboardOverview(): DashboardOverview {
  const pnl = pnlReport();
  const accounts = accountsWithBalance();
  const customers = customersWithBalance();
  const suppliers = suppliersWithBalance();
  const vehicles = getVehicles();
  const employees = getEmployees();
  const invoices = getInvoices();
  const receipts = getReceipts();
  const payments = getPayments();

  const totalReceivables = roundMoney(
    customers.reduce((acc, c) => acc + Math.max(0, c.balance), 0)
  );
  const totalPayables = roundMoney(
    suppliers.reduce((acc, s) => acc + Math.max(0, s.balance), 0)
  );

  // Build monthly breakdown for chart (e.g. 6 recent months)
  const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
  const currentYear = new Date().getFullYear();
  const monthlyChart: { month: string; revenue: number; expenses: number; profit: number }[] = [];

  for (let m = 0; m < 6; m++) {
    const monthNum = m + 1;
    const mStr = String(monthNum).padStart(2, "0");
    const from = `${currentYear}-${mStr}-01`;
    const to = `${currentYear}-${mStr}-31`;
    const mPnl = pnlReport(from, to);

    monthlyChart.push({
      month: monthNames[m],
      revenue: mPnl.revenue.totalGrossRevenue,
      expenses: mPnl.directExpenses.totalDirectTripExpenses + mPnl.operatingExpenses.totalOperatingExpenses,
      profit: mPnl.netOperatingProfit,
    });
  }

  // Top customers by revenue
  const customerRevenueMap = new Map<number, { name: string; revenue: number; count: number }>();
  for (const inv of invoices) {
    const c = customers.find((x) => x.id === inv.customer_id);
    const name = c ? c.name : "عميل";
    const cur = customerRevenueMap.get(inv.customer_id) || { name, revenue: 0, count: 0 };
    cur.revenue += num(inv.total);
    cur.count += inv.trips?.length || 1;
    customerRevenueMap.set(inv.customer_id, cur);
  }

  const topCustomers = [...customerRevenueMap.values()]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
    .map((c) => ({
      name: c.name,
      revenue: roundMoney(c.revenue),
      tripsCount: c.count,
    }));

  // Recent activities list
  const recentActivities: { id: string; type: string; title: string; date: string; amount: number; color: string }[] = [];

  for (const inv of invoices.slice(-4)) {
    recentActivities.push({
      id: "inv_" + inv.id,
      type: "invoice",
      title: `فاتورة نقل #${inv.number} — ${inv.customer_name}`,
      date: inv.date,
      amount: num(inv.total),
      color: "blue",
    });
  }

  for (const rec of receipts.slice(-3)) {
    recentActivities.push({
      id: "rec_" + rec.id,
      type: "receipt",
      title: `سند قبض #${rec.number} — ${rec.customer_name}`,
      date: rec.date,
      amount: num(rec.amount),
      color: "emerald",
    });
  }

  for (const pay of payments.slice(-3)) {
    recentActivities.push({
      id: "pay_" + pay.id,
      type: "payment",
      title: `سند صرف #${pay.number} — ${pay.description}`,
      date: pay.date,
      amount: num(pay.amount),
      color: "amber",
    });
  }

  recentActivities.sort((a, b) => (a.date < b.date ? 1 : -1));

  return {
    totalRevenue: pnl.revenue.totalGrossRevenue,
    totalExpenses: roundMoney(pnl.directExpenses.totalDirectTripExpenses + pnl.operatingExpenses.totalOperatingExpenses),
    netProfit: pnl.netOperatingProfit,
    totalLiquidCash: accounts.totalLiquid,
    totalCash: accounts.totalCash,
    totalBank: accounts.totalBank,
    totalReceivables,
    totalPayables,
    tripsCount: pnl.tripsCount,
    invoicesCount: invoices.length,
    activeVehiclesCount: vehicles.length,
    activeDriversCount: employees.filter((e) => e.emp_type === "driver").length,
    monthlyChart,
    topCustomers,
    recentActivities: recentActivities.slice(0, 8),
  };
}
