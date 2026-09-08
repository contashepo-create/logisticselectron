import React, { useState, useMemo } from "react";
import {
  Plus,
  Search,
  Printer,
  Edit2,
  Trash2,
  Wallet,
  Building,
  ArrowRightLeft,
  DollarSign,
  FileText,
  X,
} from "lucide-react";
import type { Bank, Cashbox, Company } from "@/types";
import {
  deleteBank,
  deleteCashbox,
  getBanks,
  getCashboxes,
  saveBank,
  saveCashbox,
  savePayment,
  saveReceipt,
} from "@/lib/storage";
import { accountBalance, accountsWithBalance } from "@/lib/calc";
import { formatMoney } from "@/lib/format";
import { renderMasterReportHtml } from "@/lib/print-templates";
import { PrintPreviewModal } from "@/components/PrintPreviewModal";

interface Props {
  company: Company;
  onRefreshData: () => void;
}

export const TreasuryView: React.FC<Props> = ({ company, onRefreshData }) => {
  const [data, setData] = useState(() => accountsWithBalance());

  // Cashbox Form
  const [isCashboxModalOpen, setIsCashboxModalOpen] = useState(false);
  const [cashboxName, setCashboxName] = useState("");
  const [cashboxOpenBal, setCashboxOpenBal] = useState(0);

  // Bank Form
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [bankName, setBankName] = useState("");
  const [bankAccNo, setBankAccNo] = useState("");
  const [bankIban, setBankIban] = useState("");
  const [bankOpenBal, setBankOpenBal] = useState(0);

  // Transfer Modal
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferFromKind, setTransferFromKind] = useState<"cashbox" | "bank">("cashbox");
  const [transferFromId, setTransferFromId] = useState<number>(1);
  const [transferToKind, setTransferToKind] = useState<"cashbox" | "bank">("bank");
  const [transferToId, setTransferToId] = useState<number>(1);
  const [transferAmount, setTransferAmount] = useState(0);
  const [transferDesc, setTransferDesc] = useState("تحويل نقدية بين الحسابات");

  // Print Preview
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printHtml, setPrintHtml] = useState("");

  const reloadData = () => {
    setData(accountsWithBalance());
    onRefreshData();
  };

  const handleSaveCashbox = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      saveCashbox({ name: cashboxName, opening_balance: Number(cashboxOpenBal) });
      setIsCashboxModalOpen(false);
      setCashboxName("");
      reloadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSaveBank = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      saveBank({
        name: bankName,
        account_number: bankAccNo,
        iban: bankIban,
        opening_balance: Number(bankOpenBal),
      });
      setIsBankModalOpen(false);
      setBankName("");
      reloadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (transferAmount <= 0) return alert("المبلغ غير صالح");
    try {
      const now = new Date().toISOString().slice(0, 10);
      // 1. Payment from source
      savePayment({
        date: now,
        voucher_type: "general",
        account_kind: transferFromKind,
        account_id: transferFromId,
        amount: Number(transferAmount),
        description: `تحويل صادر: ${transferDesc}`,
      });

      // 2. Receipt to target
      saveReceipt({
        date: now,
        voucher_type: "other",
        account_kind: transferToKind,
        account_id: transferToId,
        amount: Number(transferAmount),
        description: `تحويل وارد: ${transferDesc}`,
      });

      setIsTransferModalOpen(false);
      setTransferAmount(0);
      alert("تم التحويل البنكي/النقدي بنجاح!");
      reloadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handlePrintTreasurySummary = () => {
    const rows = [
      ...data.cashboxes.map((c) => ({
        type: "خزينة نقدية",
        code: c.code,
        name: c.name,
        details: "نقدية في الصندوق",
        balance: c.balance,
      })),
      ...data.banks.map((b) => ({
        type: "حساب بنكي",
        code: b.code,
        name: b.name,
        details: `آيبان: ${b.iban || b.account_number || "—"}`,
        balance: b.balance,
      })),
    ];

    const html = renderMasterReportHtml(
      {
        title: "تقرير أرصدة الخزائن والحسابات البنكية والسيولة النقدية",
        kpis: [
          { label: "إجمالي أرصدة الخزائن (كاش)", value: formatMoney(data.totalCash, company.currency), color: "#059669" },
          { label: "إجمالي الأرصدة البنكية", value: formatMoney(data.totalBank, company.currency), color: "#2563eb" },
          { label: "إجمالي السيولة النقدية المتاحة", value: formatMoney(data.totalLiquid, company.currency), color: "#7c3aed" },
        ],
        columns: [
          { header: "النوع", key: "type" },
          { header: "الكود", key: "code", align: "center" },
          { header: "اسم الخزينة / البنك", key: "name" },
          { header: "تفاصيل الحساب", key: "details" },
          { header: "الرصيد اللحظي الحالي", key: "balance", align: "left", format: (v) => formatMoney(v, company.currency) },
        ],
        rows,
        summaryRow: {
          type: "الإجمالي الكلي",
          code: "",
          name: "",
          details: "",
          balance: formatMoney(data.totalLiquid, company.currency),
        },
      },
      company
    );

    setPrintHtml(html);
    setPrintModalOpen(true);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-600" />
            <span>الخزائن، البنوك، وإدارة السيولة النقدية</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            متابعة الصناديق النقدية، الحسابات المصرفية، إجراء التحويلات المالية، وتدقيق حركة النقدية
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrintTreasurySummary}
            className="btn py-2 px-3 text-xs font-semibold flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>طباعة تقرير السيولة</span>
          </button>
          <button
            onClick={() => setIsTransferModalOpen(true)}
            className="btn py-2 px-3 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white border-none flex items-center gap-1.5 shadow-sm"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>تحويل بين الحسابات</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="app-card p-4 bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20">
          <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400">نقدية الخزائن (كاش)</div>
          <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-2">
            {formatMoney(data.totalCash, company.currency)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">{data.cashboxes.length} صناديق نقدية نشطة</div>
        </div>

        <div className="app-card p-4 bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
          <div className="text-xs font-bold text-blue-700 dark:text-blue-400">الأرصدة البنكية</div>
          <div className="text-2xl font-black text-blue-700 dark:text-blue-300 mt-2">
            {formatMoney(data.totalBank, company.currency)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">{data.banks.length} حسابات بنكية نشطة</div>
        </div>

        <div className="app-card p-4 bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20">
          <div className="text-xs font-bold text-purple-700 dark:text-purple-400">إجمالي السيولة المتاحة</div>
          <div className="text-2xl font-black text-purple-700 dark:text-purple-300 mt-2">
            {formatMoney(data.totalLiquid, company.currency)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">تحديث لحظي مع كل حركة</div>
        </div>
      </div>

      {/* Cashboxes & Banks Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cashboxes Box */}
        <div className="app-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-sm md:text-base text-slate-800 dark:text-slate-100">
                الخزائن النقدية
              </h3>
            </div>
            <button
              onClick={() => setIsCashboxModalOpen(true)}
              className="btn py-1 px-2.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold"
            >
              + إضافة خزينة
            </button>
          </div>

          <div className="space-y-3">
            {data.cashboxes.map((box) => (
              <div
                key={box.id}
                className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-xs md:text-sm text-slate-800 dark:text-slate-100">
                    {box.name}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    الكود: {box.code} | رصيد افتتاحي: {formatMoney(box.opening_balance, "")}
                  </div>
                </div>

                <div className="text-left font-black text-sm md:text-base text-emerald-600 dark:text-emerald-400">
                  {formatMoney(box.balance, company.currency)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Banks Box */}
        <div className="app-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-sm md:text-base text-slate-800 dark:text-slate-100">
                الحسابات البنكية والمصارف
              </h3>
            </div>
            <button
              onClick={() => setIsBankModalOpen(true)}
              className="btn py-1 px-2.5 text-xs text-blue-600 dark:text-blue-400 font-bold"
            >
              + إضافة حساب بنكي
            </button>
          </div>

          <div className="space-y-3">
            {data.banks.map((bank) => (
              <div
                key={bank.id}
                className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-xs md:text-sm text-slate-800 dark:text-slate-100">
                    {bank.name}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5" dir="ltr">
                    IBAN: {bank.iban || bank.account_number || "—"}
                  </div>
                </div>

                <div className="text-left font-black text-sm md:text-base text-blue-600 dark:text-blue-400">
                  {formatMoney(bank.balance, company.currency)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Cashbox Modal */}
      {isCashboxModalOpen && (
        <div className="modal-overlay">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold">إضافة خزينة نقدية جديدة</h3>
              <button onClick={() => setIsCashboxModalOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveCashbox} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">اسم الخزينة:</label>
                <input
                  type="text"
                  value={cashboxName}
                  onChange={(e) => setCashboxName(e.target.value)}
                  placeholder="مثال: خزينة الصيانة والتشغيل"
                  className="form-input text-xs"
                  required
                />
              </div>
              <div>
                <label className="block font-bold mb-1">الرصيد الافتتاحي:</label>
                <input
                  type="number"
                  value={cashboxOpenBal}
                  onChange={(e) => setCashboxOpenBal(Number(e.target.value))}
                  className="form-input text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCashboxModalOpen(false)}
                  className="btn"
                >
                  إلغاء
                </button>
                <button type="submit" className="btn btn-primary">
                  حفظ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Bank Modal */}
      {isBankModalOpen && (
        <div className="modal-overlay">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold">إضافة حساب بنكي جديد</h3>
              <button onClick={() => setIsBankModalOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveBank} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">اسم البنك / الحساب:</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="مثال: بنك الرياض — الحساب التجاري"
                  className="form-input text-xs"
                  required
                />
              </div>
              <div>
                <label className="block font-bold mb-1">رقم الآيبان (IBAN):</label>
                <input
                  type="text"
                  value={bankIban}
                  onChange={(e) => setBankIban(e.target.value)}
                  placeholder="SAXXXXXXXXXXXXXXXXXXXXXXXX"
                  className="form-input text-xs font-mono"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">الرصيد الافتتاحي:</label>
                <input
                  type="number"
                  value={bankOpenBal}
                  onChange={(e) => setBankOpenBal(Number(e.target.value))}
                  className="form-input text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBankModalOpen(false)}
                  className="btn"
                >
                  إلغاء
                </button>
                <button type="submit" className="btn btn-primary">
                  حفظ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Between Accounts Modal */}
      {isTransferModalOpen && (
        <div className="modal-overlay">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold">تحويل مالي بين الخزائن والحسابات</h3>
              <button onClick={() => setIsTransferModalOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleTransfer} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">تحويل من (الجهة المحولة):</label>
                  <select
                    value={transferFromKind}
                    onChange={(e) => setTransferFromKind(e.target.value as any)}
                    className="form-select text-xs mb-1.5"
                  >
                    <option value="cashbox">خزينة نقدية</option>
                    <option value="bank">حساب بنكي</option>
                  </select>
                  <select
                    value={transferFromId}
                    onChange={(e) => setTransferFromId(Number(e.target.value))}
                    className="form-select text-xs"
                  >
                    {transferFromKind === "cashbox"
                      ? data.cashboxes.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} (رصيد: {formatMoney(c.balance, "")})
                          </option>
                        ))
                      : data.banks.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name} (رصيد: {formatMoney(b.balance, "")})
                          </option>
                        ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">إلى (الجهة المستلمة):</label>
                  <select
                    value={transferToKind}
                    onChange={(e) => setTransferToKind(e.target.value as any)}
                    className="form-select text-xs mb-1.5"
                  >
                    <option value="bank">حساب بنكي</option>
                    <option value="cashbox">خزينة نقدية</option>
                  </select>
                  <select
                    value={transferToId}
                    onChange={(e) => setTransferToId(Number(e.target.value))}
                    className="form-select text-xs"
                  >
                    {transferToKind === "cashbox"
                      ? data.cashboxes.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))
                      : data.banks.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">المبلغ المراد تحويله ({company.currency}):</label>
                <input
                  type="number"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(Number(e.target.value))}
                  className="form-input text-sm font-bold text-purple-600"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block font-bold mb-1">البيان / مرجع التحويل:</label>
                <input
                  type="text"
                  value={transferDesc}
                  onChange={(e) => setTransferDesc(e.target.value)}
                  className="form-input text-xs"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="btn"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="btn btn-primary bg-purple-600 hover:bg-purple-700"
                >
                  تنفيذ التحويل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print Preview Modal */}
      <PrintPreviewModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        title="معاينة وطباعة تقرير السيولة والخزائن"
        htmlContent={printHtml}
        showTemplatePicker={false}
      />
    </div>
  );
};
