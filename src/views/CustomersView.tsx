import React, { useState, useMemo } from "react";
import {
  Plus,
  Search,
  Printer,
  Edit2,
  Trash2,
  FileText,
  Users,
  Eye,
  X,
  Phone,
  MapPin,
  Building,
  DollarSign,
} from "lucide-react";
import type { Company, Customer } from "@/types";
import {
  deleteCustomer,
  getCustomers,
  saveCustomer,
} from "@/lib/storage";
import { customerBalance, customerStatement, customersWithBalance } from "@/lib/calc";
import { formatMoney } from "@/lib/format";
import { renderMasterReportHtml } from "@/lib/print-templates";
import { PrintPreviewModal } from "@/components/PrintPreviewModal";

interface Props {
  company: Company;
  onRefreshData: () => void;
}

export const CustomersView: React.FC<Props> = ({ company, onRefreshData }) => {
  const [customers, setCustomers] = useState(() => customersWithBalance());
  const [searchTerm, setSearchTerm] = useState("");

  // Customer Form Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formTaxNumber, setFormTaxNumber] = useState("");
  const [formCr, setFormCr] = useState("");
  const [formOpeningBalance, setFormOpeningBalance] = useState(0);
  const [formNotes, setFormNotes] = useState("");

  // Statement Modal State
  const [statementCustomer, setStatementCustomer] = useState<Customer | null>(null);
  const [statementFromDate, setStatementFromDate] = useState("");
  const [statementToDate, setStatementToDate] = useState("");

  // Print Preview
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printHtml, setPrintHtml] = useState("");

  const reloadData = () => {
    setCustomers(customersWithBalance());
    onRefreshData();
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      return (
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.phone || "").includes(searchTerm) ||
        (c.tax_number || "").includes(searchTerm)
      );
    });
  }, [customers, searchTerm]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormName("");
    setFormPhone("");
    setFormAddress("");
    setFormCity("");
    setFormTaxNumber("");
    setFormCr("");
    setFormOpeningBalance(0);
    setFormNotes("");
    setIsFormOpen(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingId(c.id);
    setFormName(c.name);
    setFormPhone(c.phone || "");
    setFormAddress(c.address || "");
    setFormCity(c.city || "");
    setFormTaxNumber(c.tax_number || "");
    setFormCr(c.commercial_reg || "");
    setFormOpeningBalance(c.opening_balance || 0);
    setFormNotes(c.notes || "");
    setIsFormOpen(true);
  };

  const handleDelete = (id: number) => {
    try {
      if (confirm("هل أنت متأكد من رغبتك في حذف هذا العميل؟")) {
        deleteCustomer(id);
        reloadData();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      saveCustomer(
        {
          name: formName,
          phone: formPhone,
          address: formAddress,
          city: formCity,
          tax_number: formTaxNumber,
          commercial_reg: formCr,
          opening_balance: Number(formOpeningBalance),
          notes: formNotes,
        },
        editingId
      );
      setIsFormOpen(false);
      reloadData();
    } catch (err: any) {
      alert("خطأ: " + err.message);
    }
  };

  // Open Statement
  const handleOpenStatement = (c: Customer) => {
    setStatementCustomer(c);
    setStatementFromDate("");
    setStatementToDate("");
  };

  const statementData = useMemo(() => {
    if (!statementCustomer) return null;
    return customerStatement(statementCustomer.id, statementFromDate, statementToDate);
  }, [statementCustomer, statementFromDate, statementToDate]);

  const handlePrintStatement = () => {
    if (!statementCustomer || !statementData) return;

    const html = renderMasterReportHtml(
      {
        title: `كشف حساب عميل — ${statementCustomer.name}`,
        subtitle: `كود العميل: ${statementCustomer.code} | الرقم الضريبي: ${statementCustomer.tax_number || "غير مسجل"}`,
        period: { from: statementFromDate, to: statementToDate },
        filterLabel: `هاتف: ${statementCustomer.phone || "—"} | العنوان: ${statementCustomer.address || "—"}`,
        kpis: [
          { label: "إجمالي الحركات المدينة (عليه)", value: formatMoney(statementData.totals.debit, company.currency) },
          { label: "إجمالي الحركات الدائنة (له)", value: formatMoney(statementData.totals.credit, company.currency) },
          { label: "الرصيد النهائي المستحق", value: formatMoney(statementData.totals.balance, company.currency), color: "#2563eb" },
        ],
        columns: [
          { header: "التاريخ", key: "date", align: "center" },
          { header: "نوع المستند", key: "doc" },
          { header: "البيان والتفاصيل", key: "desc" },
          { header: "مدين (عليه)", key: "debit", align: "left", format: (v) => (v ? formatMoney(v, "") : "—") },
          { header: "دائن (له)", key: "credit", align: "left", format: (v) => (v ? formatMoney(v, "") : "—") },
          { header: "الرصيد المرحّل", key: "balance", align: "left", format: (v) => formatMoney(v, "") },
        ],
        rows: statementData.rows,
        summaryRow: {
          date: "الإجمالي",
          doc: "",
          desc: "",
          debit: formatMoney(statementData.totals.debit, ""),
          credit: formatMoney(statementData.totals.credit, ""),
          balance: formatMoney(statementData.totals.balance, company.currency),
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
            <Users className="w-5 h-5 text-blue-600" />
            <span>دليل العملاء وكشوف الحساب</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            إدارة حسابات العملاء، البيانات الضريبية، الأرصدة اللحظية، وطباعة كشوف الحساب
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="btn btn-primary text-xs md:text-sm font-bold flex items-center gap-1.5 shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة عميل جديد</span>
        </button>
      </div>

      {/* Search */}
      <div className="app-card p-3.5 flex items-center justify-between gap-3 text-xs">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="البحث باسم العميل، الكود، الرقم الضريبي، الهاتف..."
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
                <th className="p-3">الكود</th>
                <th className="p-3">اسم العميل / الشركة</th>
                <th className="p-3">الرقم الضريبي</th>
                <th className="p-3">الهاتف والمدينة</th>
                <th className="p-3">الرصيد الافتتاحي</th>
                <th className="p-3">الرصيد الحالي المستحق</th>
                <th className="p-3 text-center">كشف الحساب والخيارات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    لا يوجد عملاء مطابقون
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="p-3 font-mono font-bold text-slate-500">{c.code}</td>
                    <td className="p-3 font-bold text-slate-800 dark:text-slate-100">
                      {c.name}
                    </td>
                    <td className="p-3 font-mono text-slate-600 dark:text-slate-400">
                      {c.tax_number || "—"}
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">
                      <div>{c.phone || "—"}</div>
                      <div className="text-[10px] text-slate-400">{c.city || c.address || ""}</div>
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">
                      {formatMoney(c.opening_balance, "")}
                    </td>
                    <td className="p-3">
                      <span
                        className={`font-black text-xs md:text-sm ${
                          c.balance > 0
                            ? "text-blue-600 dark:text-blue-400"
                            : c.balance < 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-slate-500"
                        }`}
                      >
                        {formatMoney(c.balance, company.currency)}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenStatement(c)}
                          className="btn py-1 px-2.5 text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1"
                          title="عرض وطباعة كشف الحساب"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>كشف الحساب</span>
                        </button>
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title="تعديل بيانات العميل"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 transition"
                          title="حذف العميل"
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

      {/* Add / Edit Customer Modal */}
      {isFormOpen && (
        <div className="modal-overlay">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative">
            <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm md:text-base">
                {editingId ? "تعديل بيانات العميل" : "إضافة عميل جديد"}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-white/80 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  اسم العميل أو المنشأة:
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="مثال: شركة المراعي المحدودة"
                  className="form-input text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    الرقم الضريبي (15 رقم):
                  </label>
                  <input
                    type="text"
                    value={formTaxNumber}
                    onChange={(e) => setFormTaxNumber(e.target.value)}
                    placeholder="3000XXXXXXXX003"
                    className="form-input text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    السجل التجاري:
                  </label>
                  <input
                    type="text"
                    value={formCr}
                    onChange={(e) => setFormCr(e.target.value)}
                    placeholder="1010XXXXXX"
                    className="form-input text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    رقم الهاتف / الجوال:
                  </label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="05XXXXXXXX"
                    className="form-input text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    المدينة:
                  </label>
                  <input
                    type="text"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    placeholder="الرياض، الدمام، جدة..."
                    className="form-input text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  العنوان التفصيلي:
                </label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="المنطقة الصناعية، الحي، الشارع..."
                  className="form-input text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  الرصيد الافتتاحي السابق ({company.currency}):
                </label>
                <input
                  type="number"
                  value={formOpeningBalance}
                  onChange={(e) => setFormOpeningBalance(Number(e.target.value))}
                  className="form-input text-xs font-bold"
                  step="any"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ملاحظات إضافية:
                </label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="شروط الدفع، فترات السماح..."
                  className="form-textarea text-xs h-16"
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
                  className="btn btn-primary py-2 px-6 font-bold"
                >
                  حفظ العميل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Statement Modal */}
      {statementCustomer && statementData && (
        <div className="modal-overlay">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl relative">
            {/* Statement Header */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="font-bold text-base">كشف حساب: {statementCustomer.name}</h3>
                  <p className="text-xs text-slate-400">
                    كود: {statementCustomer.code} | هاتف: {statementCustomer.phone || "—"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintStatement}
                  className="btn btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 shadow"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة الكشف</span>
                </button>
                <button
                  onClick={() => setStatementCustomer(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Date Filters Bar */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">من تاريخ:</span>
                  <input
                    type="date"
                    value={statementFromDate}
                    onChange={(e) => setStatementFromDate(e.target.value)}
                    className="form-input text-xs py-1"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">إلى تاريخ:</span>
                  <input
                    type="date"
                    value={statementToDate}
                    onChange={(e) => setStatementToDate(e.target.value)}
                    className="form-input text-xs py-1"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <div>
                  إجمالي المدين: <b className="text-blue-600">{formatMoney(statementData.totals.debit, company.currency)}</b>
                </div>
                <div>
                  إجمالي الدائن: <b className="text-emerald-600">{formatMoney(statementData.totals.credit, company.currency)}</b>
                </div>
                <div className="bg-blue-600 text-white font-bold px-2.5 py-1 rounded-lg">
                  الرصيد: {formatMoney(statementData.totals.balance, company.currency)}
                </div>
              </div>
            </div>

            {/* Statement Grid */}
            <div className="flex-1 overflow-y-auto p-4">
              <table className="w-full text-xs text-right border-collapse">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-300 dark:border-slate-700">
                  <tr>
                    <th className="p-2.5">التاريخ</th>
                    <th className="p-2.5">المستند</th>
                    <th className="p-2.5">البيان</th>
                    <th className="p-2.5">مدين (عليه)</th>
                    <th className="p-2.5">دائن (له)</th>
                    <th className="p-2.5">الرصيد المرحل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {statementData.rows.map((r, idx) => (
                    <tr
                      key={idx}
                      className={r.kind === "opening" ? "bg-slate-50 dark:bg-slate-800/40 font-bold" : ""}
                    >
                      <td className="p-2.5">{r.date || "—"}</td>
                      <td className="p-2.5 font-semibold text-blue-600 dark:text-blue-400">{r.doc}</td>
                      <td className="p-2.5 text-slate-600 dark:text-slate-300">{r.desc}</td>
                      <td className="p-2.5 text-blue-600 font-medium">
                        {r.debit ? formatMoney(r.debit, "") : "—"}
                      </td>
                      <td className="p-2.5 text-emerald-600 font-medium">
                        {r.credit ? formatMoney(r.credit, "") : "—"}
                      </td>
                      <td className="p-2.5 font-bold text-slate-900 dark:text-slate-100">
                        {formatMoney(r.balance, company.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Print Preview Modal */}
      <PrintPreviewModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        title="معاينة وطباعة كشف حساب العميل"
        htmlContent={printHtml}
        showTemplatePicker={false}
      />
    </div>
  );
};
