import React, { useState, useMemo } from "react";
import {
  Plus,
  Search,
  Printer,
  Edit2,
  Trash2,
  ArrowUpRight,
  X,
  User,
  Truck,
  Building2,
} from "lucide-react";
import type { Bank, Cashbox, Company, Employee, PaymentVoucher, Supplier, Vehicle } from "@/types";
import {
  deletePayment,
  getBanks,
  getCashboxes,
  getEmployees,
  getPayments,
  getSuppliers,
  getVehicles,
  savePayment,
} from "@/lib/storage";
import { formatMoney, PAYMENT_TYPES } from "@/lib/format";
import { renderPaymentVoucherHtml } from "@/lib/print-templates";
import { PrintPreviewModal } from "@/components/PrintPreviewModal";

interface Props {
  company: Company;
  onRefreshData: () => void;
  initialNewModal?: boolean;
}

export const PaymentsView: React.FC<Props> = ({
  company,
  onRefreshData,
  initialNewModal = false,
}) => {
  const [payments, setPayments] = useState<PaymentVoucher[]>(() => getPayments());
  const [employees, setEmployees] = useState<Employee[]>(() => getEmployees());
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => getVehicles());
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => getSuppliers());
  const [cashboxes, setCashboxes] = useState<Cashbox[]>(() => getCashboxes());
  const [banks, setBanks] = useState<Bank[]>(() => getBanks());

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  const [isFormOpen, setIsFormOpen] = useState(initialNewModal);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formDate, setFormDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [formNumber, setFormNumber] = useState<string>("");
  const [formVoucherType, setFormVoucherType] = useState<any>("general");
  const [formEmployeeId, setFormEmployeeId] = useState<number | null>(employees[0]?.id || null);
  const [formVehicleId, setFormVehicleId] = useState<number | null>(vehicles[0]?.id || null);
  const [formSupplierId, setFormSupplierId] = useState<number | null>(suppliers[0]?.id || null);
  const [formAccountKind, setFormAccountKind] = useState<"cashbox" | "bank">("cashbox");
  const [formAccountId, setFormAccountId] = useState<number>(cashboxes[0]?.id || 1);
  const [formAmount, setFormAmount] = useState<number>(0);
  const [formDescription, setFormDescription] = useState<string>("");
  const [formVehicleExpense, setFormVehicleExpense] = useState<string>("");

  // Print Preview Modal State
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printHtml, setPrintHtml] = useState("");

  const reloadData = () => {
    setPayments(getPayments());
    setEmployees(getEmployees());
    setVehicles(getVehicles());
    setSuppliers(getSuppliers());
    setCashboxes(getCashboxes());
    setBanks(getBanks());
    onRefreshData();
  };

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const matchSearch =
        String(p.number).includes(searchTerm) ||
        (p.employee_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.supplier_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.description || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.account_name || "").toLowerCase().includes(searchTerm.toLowerCase());

      const matchType = filterType === "all" || p.voucher_type === filterType;

      return matchSearch && matchType;
    });
  }, [payments, searchTerm, filterType]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormNumber("");
    setFormVoucherType("general");
    setFormEmployeeId(employees[0]?.id || null);
    setFormVehicleId(vehicles[0]?.id || null);
    setFormSupplierId(suppliers[0]?.id || null);
    setFormAccountKind("cashbox");
    setFormAccountId(cashboxes[0]?.id || 1);
    setFormAmount(0);
    setFormDescription("");
    setFormVehicleExpense("");
    setIsFormOpen(true);
  };

  const handleOpenEdit = (p: PaymentVoucher) => {
    setEditingId(p.id);
    setFormDate(p.date);
    setFormNumber(String(p.number));
    setFormVoucherType(p.voucher_type);
    setFormEmployeeId(p.employee_id || null);
    setFormVehicleId(p.vehicle_id || null);
    setFormSupplierId(p.supplier_id || null);
    setFormAccountKind(p.account_kind);
    setFormAccountId(p.account_id);
    setFormAmount(p.amount);
    setFormDescription(p.description);
    setFormVehicleExpense(p.vehicle_expense || "");
    setIsFormOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("هل أنت متأكد من حذف سند الصرف؟")) {
      deletePayment(id);
      reloadData();
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      savePayment(
        {
          date: formDate,
          number: formNumber ? Number(formNumber) : undefined,
          voucher_type: formVoucherType,
          employee_id: formVoucherType === "advance" ? formEmployeeId : null,
          vehicle_id: formVoucherType === "vehicle" ? formVehicleId : null,
          vehicle_expense: formVoucherType === "vehicle" ? formVehicleExpense : "",
          supplier_id: formVoucherType === "supplier" ? formSupplierId : null,
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

  const handlePrint = (p: PaymentVoucher) => {
    const html = renderPaymentVoucherHtml(p, company);
    setPrintHtml(html);
    setPrintModalOpen(true);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5 text-rose-600" />
            <span>سندات الصرف والمصروفات</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            صرف السلف، مصروفات صيانة الشاحنات، المحروقات، سداد الموردين، والمصروفات الإدارية
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="btn btn-primary bg-rose-600 hover:bg-rose-700 text-xs md:text-sm font-bold flex items-center gap-1.5 shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>إصدار سند صرف جديد</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="app-card p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative w-full max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="البحث برقم السند، المستلم، البيان..."
            className="form-input pr-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500">نوع المصروف:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="form-select text-xs min-w-[160px]"
          >
            <option value="all">كل أنواع الصرف ({payments.length})</option>
            {Object.entries(PAYMENT_TYPES).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
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
                <th className="p-3">نوع المصروف</th>
                <th className="p-3">المستفيد / الجهة</th>
                <th className="p-3">الخزينة / البنك</th>
                <th className="p-3">البيان</th>
                <th className="p-3">المبلغ المصروف</th>
                <th className="p-3 text-center">خيارات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    لا توجد سندات صرف مطابقة
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="p-3 font-bold text-rose-600 dark:text-rose-400">
                      #{p.number}
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">{p.date}</td>
                    <td className="p-3">
                      <span className="badge badge-amber">
                        {PAYMENT_TYPES[p.voucher_type] || p.voucher_type}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                      {p.employee_name || p.supplier_name || p.plate_number || "مصروف عام"}
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">
                      {p.account_name}
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                      {p.description}
                    </td>
                    <td className="p-3 font-extrabold text-rose-600 dark:text-rose-400 text-sm">
                      {formatMoney(p.amount, company.currency)}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handlePrint(p)}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
                          title="طباعة سند الصرف"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title="تعديل السند"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
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
            <div className="bg-rose-700 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm md:text-base">
                {editingId ? "تعديل سند صرف" : "إصدار سند صرف جديد"}
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
                    نوع السند / المصروف:
                  </label>
                  <select
                    value={formVoucherType}
                    onChange={(e) => setFormVoucherType(e.target.value)}
                    className="form-select text-xs"
                  >
                    {Object.entries(PAYMENT_TYPES).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Conditional targets */}
              {formVoucherType === "advance" && (
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    الموظف / السائق المستلم للسلفة:
                  </label>
                  <select
                    value={formEmployeeId || ""}
                    onChange={(e) => setFormEmployeeId(Number(e.target.value))}
                    className="form-select text-xs"
                    required
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.emp_type === "driver" ? "سائق" : "إداري"})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {formVoucherType === "vehicle" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      الشاحنة / المركبة:
                    </label>
                    <select
                      value={formVehicleId || ""}
                      onChange={(e) => setFormVehicleId(Number(e.target.value))}
                      className="form-select text-xs"
                      required
                    >
                      {vehicles.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.plate_number} ({v.vehicle_type})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      بند الصيانة:
                    </label>
                    <input
                      type="text"
                      value={formVehicleExpense}
                      onChange={(e) => setFormVehicleExpense(e.target.value)}
                      placeholder="مثال: تغيير زيوت وفلاتر"
                      className="form-input text-xs"
                    />
                  </div>
                </div>
              )}

              {formVoucherType === "supplier" && (
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    المورد المستفيد:
                  </label>
                  <select
                    value={formSupplierId || ""}
                    onChange={(e) => setFormSupplierId(Number(e.target.value))}
                    className="form-select text-xs"
                    required
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Account Selection */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    جهة الصرف:
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
                    <option value="bank">حساب بنكي</option>
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
                  المبلغ المصروف ({company.currency}):
                </label>
                <input
                  type="number"
                  value={formAmount}
                  onChange={(e) => setFormAmount(Number(e.target.value))}
                  className="form-input text-sm font-bold text-rose-600 dark:text-rose-400 py-2"
                  min="0.01"
                  step="any"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  البيان والوصف التفصيلي:
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="اكتب سبب الصرف وملاحظات العملية..."
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
                  className="btn btn-primary bg-rose-600 hover:bg-rose-700 py-2 px-6 font-bold"
                >
                  حفظ سند الصرف
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
        title="معاينة وطباعة سند الصرف المالي"
        htmlContent={printHtml}
        showTemplatePicker={false}
      />
    </div>
  );
};
