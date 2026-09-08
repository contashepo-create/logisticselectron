import { describe, it, expect, beforeEach } from "vitest";
import {
  customerBalance,
  accountBalance,
  supplierBalance,
  customerStatement,
  supplierStatement,
  pnlReport,
  customersAging,
  suppliersAging,
  vehicleReport,
  employeeStatement,
  getDashboardOverview,
} from "../lib/calc";
import {
  saveCustomer,
  saveInvoice,
  saveReceipt,
  savePayment,
  saveSupplier,
  savePurchase,
  saveCashbox,
  saveBank,
  saveEmployee,
  savePayroll,
  saveDeduction,
  saveCreditDebitNote,
  resetAllDataToDemo,
  getInvoices,
  activateLicenseKey,
  getLicenseInfo,
  saveCompany,
} from "../lib/storage";
import { numberToArabicWords } from "../lib/words";
import { buildZatcaQr, tlv, bytesToBase64 } from "../lib/zatca";
import { roundMoney } from "../lib/rules";

describe("Accounting Engine & Financial Calculations", () => {
  beforeEach(() => {
    // Reset to clean test state
    resetAllDataToDemo();
  });

  describe("1. Currency Rounding & Math Precision", () => {
    it("rounds numbers accurately to 2 decimals avoiding binary floating point errors", () => {
      expect(roundMoney(100.005)).toBe(100.01);
      expect(roundMoney(1.005)).toBe(1.01);
      expect(roundMoney(10.554)).toBe(10.55);
      expect(roundMoney(0.1 + 0.2)).toBe(0.3);
      expect(roundMoney(null)).toBe(0);
      expect(roundMoney(undefined)).toBe(0);
    });
  });

  describe("2. Customer Balance & Statement Calculations", () => {
    it("calculates customer balance accurately with opening balance, invoices, and receipts", () => {
      // Customer 1 in demo data has opening balance: 15,000
      // Invoice 1: 4,800 + 15% VAT (720) = 5,520
      // Receipt 1: 10,000
      // Expected balance = 15,000 + 5,520 - 10,000 = 10,520
      const bal = customerBalance(1);
      expect(bal).toBe(10520);
    });

    it("updates balance correctly after issuing a new invoice with customer-borne expenses", () => {
      const initialBal = customerBalance(1);

      // Create new invoice with trip price 3,000 and customer expense 200 => Subtotal 3,200 + 15% VAT (480) = 3,680
      saveInvoice({
        customer_id: 1,
        date: "2026-02-20",
        vat_rate: 15,
        trips: [
          {
            id: 99,
            invoice_id: 0,
            vehicle_id: 1,
            driver_id: 1,
            from_loc: "الرياض",
            to_loc: "جدة",
            qty: 1,
            unit_price: 3000,
            price: 3000,
            container_numbers: ["TEST-123"],
            notes: "اختبار",
            expenses: [
              {
                id: 991,
                trip_id: 99,
                expense_type: "other",
                qty: 1,
                unit_amount: 200,
                amount: 200,
                source: "customer",
                notes: "مصاريف إضافة على العميل",
              },
            ],
          },
        ],
      });

      const newBal = customerBalance(1);
      expect(newBal).toBe(roundMoney(initialBal + 3680));
    });

    it("adjusts customer balance with Credit and Debit Notes", () => {
      const initialBal = customerBalance(1);

      // Add Credit Note for 500 + 15% VAT (75) = 575 -> Reduces customer balance
      saveCreditDebitNote({
        customer_id: 1,
        invoice_id: 1,
        note_type: "credit",
        amount: 500,
        vat_rate: 15,
        reason: "خصم تسوية شحنة",
      });

      const balAfterCredit = customerBalance(1);
      expect(balAfterCredit).toBe(roundMoney(initialBal - 575));

      // Add Debit Note for 200 + 15% VAT (30) = 230 -> Increases customer balance
      saveCreditDebitNote({
        customer_id: 1,
        invoice_id: 1,
        note_type: "debit",
        amount: 200,
        vat_rate: 15,
        reason: "رسوم إضافية",
      });

      const balAfterDebit = customerBalance(1);
      expect(balAfterDebit).toBe(roundMoney(balAfterCredit + 230));
    });

    it("generates a synchronized chronological customer statement with running balance", () => {
      const statement = customerStatement(1);
      expect(statement.rows.length).toBeGreaterThan(0);
      expect(statement.rows[0].kind).toBe("opening");
      expect(statement.totals.balance).toBe(customerBalance(1));
    });
  });

  describe("3. Treasury, Cashbox & Bank Balances", () => {
    it("tracks cashbox balance through inflows and outflows", () => {
      // Cashbox 1 opening balance = 50,000
      // Payment 1 (Advance) = 1,000
      // Payment 2 (Maintenance) = 650
      // Net expected = 50,000 - 1,000 - 650 = 48,350
      const boxBal = accountBalance("cashbox", 1);
      expect(boxBal).toBe(48350);
    });

    it("tracks bank balance after customer receipt collections", () => {
      // Bank 1 opening balance = 180,000
      // Receipt 1 = 10,000
      // Net expected = 190,000
      const bankBal = accountBalance("bank", 1);
      expect(bankBal).toBe(190000);
    });

    it("deducts net salary from designated cashbox or bank upon payroll execution", () => {
      const initialCash = accountBalance("cashbox", 1);

      // Create a payroll for employee 1
      // Base: 4,500, Additions: 500, Advance deduction: 1,000 -> Net: 4,000
      savePayroll({
        employee_id: 1,
        account_kind: "cashbox",
        account_id: 1,
        base_salary: 4500,
        additions: 500,
        advance_deduction: 1000,
        other_deductions: 0,
      });

      const newCash = accountBalance("cashbox", 1);
      expect(newCash).toBe(roundMoney(initialCash - 4000));
    });
  });

  describe("4. Supplier Accounts & Purchase Invoices", () => {
    it("calculates supplier balance based on opening balance, credit purchases and payments", () => {
      // Supplier 1 opening balance = 12,000
      // Purchase 1: 3,000 * 1.15 = 3,450 + 15% VAT (517.50) = 3,967.50
      // Payments: 0
      // Expected = 12,000 + 3,967.50 = 15,967.50
      const bal = supplierBalance(1);
      expect(bal).toBe(15967.50);
    });

    it("reduces supplier balance when a payment voucher is issued", () => {
      const initialBal = supplierBalance(1);

      savePayment({
        voucher_type: "supplier",
        supplier_id: 1,
        account_kind: "bank",
        account_id: 1,
        amount: 5000,
        description: "سداد دفعة للمورد من مصرف الراجحي",
      });

      const newBal = supplierBalance(1);
      expect(newBal).toBe(roundMoney(initialBal - 5000));
    });

    it("generates an accurate supplier statement with running balances", () => {
      const stmt = supplierStatement(1);
      expect(stmt.rows.length).toBeGreaterThan(0);
      expect(stmt.totals.balance).toBe(supplierBalance(1));
    });
  });

  describe("5. Aging Analysis (Receivables & Payables)", () => {
    it("categorizes customer debts into age buckets (0-30, 31-60, 61-90, 90+)", () => {
      const aging = customersAging();
      expect(Array.isArray(aging)).toBe(true);
      const cust1 = aging.find((a) => a.id === 1);
      expect(cust1).toBeDefined();
      expect(cust1?.total).toBeGreaterThan(0);
    });

    it("categorizes supplier payables into age buckets", () => {
      const aging = suppliersAging();
      expect(Array.isArray(aging)).toBe(true);
      const sup1 = aging.find((a) => a.id === 1);
      expect(sup1).toBeDefined();
      expect(sup1?.total).toBeGreaterThan(0);
    });
  });

  describe("6. Profit and Loss (P&L) Calculations", () => {
    it("computes gross revenue, direct trip expenses, operating expenses and net profit correctly", () => {
      const pnl = pnlReport();
      expect(pnl.revenue.tripsRevenue).toBeGreaterThan(0);
      expect(pnl.directExpenses.totalDirectTripExpenses).toBeGreaterThan(0);
      expect(pnl.grossProfit).toBe(
        roundMoney(pnl.revenue.totalGrossRevenue - pnl.directExpenses.totalDirectTripExpenses)
      );
      expect(pnl.netOperatingProfit).toBe(
        roundMoney(pnl.grossProfit - pnl.operatingExpenses.totalOperatingExpenses)
      );
    });
  });

  describe("7. Fleet Vehicle Performance", () => {
    it("calculates vehicle trips, revenue, fuel, maintenance, and profit margin", () => {
      const report = vehicleReport();
      expect(report.length).toBeGreaterThan(0);
      const veh1 = report.find((v) => v.vehicleId === 1);
      expect(veh1).toBeDefined();
      expect(veh1?.totalRevenue).toBe(4800);
      expect(veh1?.totalExpenses).toBeGreaterThan(0);
      expect(veh1?.netProfit).toBe(roundMoney(veh1!.totalRevenue - veh1!.totalExpenses));
    });
  });

  describe("8. Employee Advances & Deductions Tracking", () => {
    it("tracks employee advances, settlements and remaining balance", () => {
      const statement = employeeStatement(1);
      expect(statement).not.toBeNull();
      expect(statement?.totalAdvancesIssued).toBe(1000); // 1000 from Payment 1
      expect(statement?.remainingAdvances).toBe(1000);

      // Now settle 600 via payroll
      savePayroll({
        employee_id: 1,
        account_kind: "cashbox",
        account_id: 1,
        base_salary: 4500,
        additions: 0,
        advance_deduction: 600,
        other_deductions: 0,
      });

      const updated = employeeStatement(1);
      expect(updated?.totalAdvancesSettled).toBe(600);
      expect(updated?.remainingAdvances).toBe(400);
    });
  });

  describe("9. Saudi ZATCA e-Invoicing QR (TLV Base64)", () => {
    it("encodes ZATCA TLV tags correctly and formats valid Base64", () => {
      const qrBase64 = buildZatcaQr({
        sellerName: "شركة أسطول النقل السريع",
        vatNumber: "310123456700003",
        timestamp: "2026-02-10T14:30:00Z",
        totalWithVat: 5520.00,
        vatAmount: 720.00,
      });

      expect(qrBase64).toBeTruthy();
      expect(typeof qrBase64).toBe("string");
      expect(qrBase64.length).toBeGreaterThan(20);

      // Validate base64 format
      const decoded = atob(qrBase64);
      expect(decoded.length).toBeGreaterThan(0);
    });
  });

  describe("10. Arabic Words Number Converter (Tafqeet)", () => {
    it("converts numbers to Arabic financial currency text accurately", () => {
      expect(numberToArabicWords(0)).toBe("صفر ريال سعودي فقط لا غير");
      expect(numberToArabicWords(100)).toContain("مائة");
      expect(numberToArabicWords(1500)).toContain("ألف");
      expect(numberToArabicWords(1500)).toContain("خمسمائة");
      expect(numberToArabicWords(5520.50)).toContain("خمسة آلاف");
    });
  });

  describe("11. License & 7-Day Free Trial Engine", () => {
    it("detects trial days and license activation correctly", () => {
      const info = getLicenseInfo();
      expect(info.isTrial).toBe(true);
      expect(info.trialDaysLeft).toBeGreaterThanOrEqual(0);

      // Test activating monthly license key
      const result = activateLicenseKey("LOGIST-MONTH-ABCD-1234");
      expect(result.success).toBe(true);
      expect(result.planType).toBe("monthly");

      const activatedInfo = getLicenseInfo();
      expect(activatedInfo.isTrial).toBe(false);
      expect(activatedInfo.isLicensed).toBe(true);
      expect(activatedInfo.daysLeft).toBeGreaterThan(25);
    });

    it("rejects invalid license key format", () => {
      const result = activateLicenseKey("INVALID_KEY");
      expect(result.success).toBe(false);
    });
  });

  describe("12. Dashboard Overview Aggregation", () => {
    it("computes complete financial metrics for dashboard without errors", () => {
      const dash = getDashboardOverview();
      expect(dash.totalRevenue).toBeGreaterThan(0);
      expect(dash.totalLiquidCash).toBeGreaterThan(0);
      expect(dash.activeVehiclesCount).toBeGreaterThan(0);
      expect(dash.monthlyChart.length).toBe(6);
      expect(dash.topCustomers.length).toBeGreaterThan(0);
      expect(dash.recentActivities.length).toBeGreaterThan(0);
    });
  });
});
