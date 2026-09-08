import React, { useState, useMemo } from "react";
import {
  Plus,
  Search,
  Printer,
  Edit2,
  Trash2,
  ArrowDownLeft,
  X,
  Wallet,
  Building,
} from "lucide-react";
import type { Bank, Cashbox, Company, Customer, ReceiptVoucher } from "@/types";
import {
  deleteReceipt,
  getBanks,
  getCashboxes,
  getCustomers,
  getReceipts,
  saveReceipt,
} from "@/lib/storage";
import { formatMoney } from "@/lib/format";
import { renderReceiptVoucherHtml } from "@/lib/print-templates";
import { PrintPreviewModal } from "@/components/PrintPreviewModal";

interface Props {
  company: Company;
  onRefreshData: () => void;
  initialNewModal?: boolean;
}

export const ReceiptsView: React.FC<Props> = ({
  company,
  onRefreshData,
  initialNewModal = false,
}) => {
  const [receipts, setReceipts] = useState<ReceiptVoucher[]>(() => getReceipts());
  const [customers, setCustomers] = useState<Customer[]>(() => getCustomers());
  const [cashboxes, setCashboxes] = useState<Cashbox[]>(() => getCashboxes());
  const [banks, setBanks] = useState<Bank[]>(() => getBanks());

  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(initialNewModal);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formDate, setFormDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [formNumber, setFormNumber] = useState<string>("");
  const [formType, setFormType] = useState<"customer" | "other">("customer");
  const [formCustomerId, setFormCustomerId] = useState<number>(customers[0]?.id || 1);
  const [formAccountKind, setFormAccountKind] = useState<"cashbox" | "bank">("cashbox");
  const [formAccountId, setFormAccountId] = useState<number>(cashboxes[0]?.id || 1);
  const [formAmount, setFormAmount] = useState<number>(0);
  const [formDescription, setFormDescription] = useState<string>("");

  // Print Preview Modal State
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printHtml, setPrintHtml] = useState("");

  const reloadData = () => {
    setReceipts(getReceipts());
    setCustomers(getCustomers());
    setCashboxes(getCashboxes());
    setBanks(getBanks());
    onRefreshData();
  };

  const filteredReceipts = useMemo(() => {
    return receipts.filter((r) => {
      return (
        String(r.number).includes(searchTerm) ||
        (r.customer_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.description || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.account_name || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [receipts, searchTerm]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormNumber("");
    setFormType("customer");
    setFormCustomerId(customers[0]?.id || 1);
    setFormAccountKind("cashbox");
    setFormAccountId(cashboxes[0]?.id || 1);
    setFormAmount(0);
    setFormDescription("");
    setIsFormOpen(true);
  };

  const handleOpenEdit = (r: ReceiptVoucher) => {
    setEditingId(r.id);
    setFormDate(r.date);
    setFormNumber(String(r.number));
    setFormType(r.voucher_type);
    setFormCustomerId(r.customer_id || customers[0]?.id || 1);
    setFormAccountKind(r.account_kind);
    setFormAccountId(r.account_id);
    setFormAmount(r.amount);
    setFormDescription(r.description);
    setIsFormOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذا السند؟")) {
      deleteReceipt(id);
      reloadData();
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      saveReceipt(
        {
          date: formDate,
          number: formNumber ? Number(formNumber) : undefined,
          voucher_type: formType,
          customer_id: formType === "customer" ? formCustomerId : null,
          account_kind: formAccountKind,
          account_id: formAccountId,
          amount: Number(formAmount),
          description: formDescription,
        },
        editingId
      );
      setIsFormOpen(false);
      reloadData();
    } catch (err: any) {
      alert("خطأ: " + err.message);
    }
  };

  const handlePrint = (r: ReceiptVoucher) => {
    const html = renderReceiptVoucherHtml(r, company);
    setPrintHtml(html);
    setPrintModalOpen(true);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
            <span>سندات القبض والتحصيلات</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            تسجيل المقبوضات النقدية، الحوالات البنكية، ودفعات حسابات العملاء
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="btn btn-primary bg-emerald-600 hover:bg-emerald-700 text-xs md:text-sm font-bold flex items-center gap-1.5 shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>إصدار سند قبض جديد</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="app-card p-3.5 flex items-center justify-between gap-3 text-xs">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="البحث برقم السند، العميل، البيان..."
            className="form-input pr-9 text-xs"
          />
        </div>
      </div>

      {/* Table */}
      <div className="app-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3">رقم السند</th>
                <th className="p-3">التاريخ</th>
                <th className="p-3">المستلم من (العميل)</th>
                <th className="p-3">الحساب المودع فيه</th>
                <th className="p-3">البيان / الوصف</th>
                <th className="p-3">المبلغ المستلم</th>
                <th className="p-3 text-center">خيارات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredReceipts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    لا توجد سندات قبض مسجلة
                  </td>
                </tr>
              ) : (
                filteredReceipts.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400">
                      #{r.number}
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">{r.date}</td>
                    <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                      {r.customer_name}
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">
                      <span className="badge badge-green">
                        {r.account_name}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                      {r.description}
                    </td>
                    <td className="p-3 font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                      {formatMoney(r.amount, company.currency)}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handlePrint(r)}
                          className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition"
                          title="طباعة سند القبض"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(r)}
                          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title="تعديل السند"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 transition"
                          title="حذف السند"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Form Modal */}
      {isFormOpen && (
        <div className="modal-overlay">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative">
            <div className="bg-emerald-700 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm md:text-base">
                {editingId ? "تعديل سند قبض" : "إصدار سند قبض جديد"}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-white/80 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    تاريخ السند:
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="form-input text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    نوع القبض:
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="form-select text-xs"
                  >
                    <option value="customer">تحصيل من حساب عميل</option>
                    <option value="other">إيرادات ومقبوضات أخرى</option>
                  </select>
                </div>
              </div>

              {formType === "customer" && (
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    العميل المُسدد:
                  </label>
                  <select
                    value={formCustomerId}
                    onChange={(e) => setFormCustomerId(Number(e.target.value))}
                    className="form-select text-xs"
                    required
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    جهة الإيداع:
                  </label>
                  <select
                    value={formAccountKind}
                    onChange={(e) => {
                      const kind = e.target.value as "cashbox" | "bank";
                      setFormAccountKind(kind);
                      setFormAccountId(kind === "cashbox" ? cashboxes[0]?.id || 1 : banks[0]?.id || 1);
                    }}
                    className="form-select text-xs"
                  >
                    <option value="cashbox">خزينة نقدية (كاش)</option>
                    <option value="bank">حساب بنكي (تحويل / شيك)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    اسم الخزينة / البنك:
                  </label>
                  <select
                    value={formAccountId}
                    onChange={(e) => setFormAccountId(Number(e.target.value))}
                    className="form-select text-xs"
                    required
                  >
                    {formAccountKind === "cashbox"
                      ? cashboxes.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))
                      : banks.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  المبلغ المستلم ({company.currency}):
                </label>
                <input
                  type="number"
                  value={formAmount}
                  onChange={(e) => setFormAmount(Number(e.target.value))}
                  className="form-input text-sm font-bold text-emerald-600 dark:text-emerald-400 py-2"
                  min="0.01"
                  step="any"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  البيان والوصف:
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="مثال: دفعة تحت حساب فواتير شهر فبراير..."
                  className="form-textarea text-xs h-20"
                  required
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="btn py-2 px-4"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="btn btn-primary bg-emerald-600 hover:bg-emerald-700 py-2 px-6 font-bold"
                >
                  حفظ السند
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
        title="معاينة وطباعة سند القبض المالي"
        htmlContent={printHtml}
        showTemplatePicker={false}
      />
    </div>
  );
};
