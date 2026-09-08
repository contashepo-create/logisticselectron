import React, { useState } from "react";
import { Plus, AlertCircle, X } from "lucide-react";
import type { Company } from "@/types";
import { getDeductions, getEmployees, saveDeduction } from "@/lib/storage";
import { formatMoney } from "@/lib/format";

interface Props {
  company: Company;
  onRefreshData: () => void;
}

export const DeductionsView: React.FC<Props> = ({ company, onRefreshData }) => {
  const [deductions, setDeductions] = useState(() => getDeductions());
  const [employees] = useState(() => getEmployees());

  const [isDeductModalOpen, setIsDeductModalOpen] = useState(false);
  const [deductEmpId, setDeductEmpId] = useState<number>(employees[0]?.id || 0);
  const [deductAmount, setDeductAmount] = useState(0);
  const [deductReason, setDeductReason] = useState("");
  const [deductDate, setDeductDate] = useState(new Date().toISOString().slice(0, 10));

  const reloadData = () => {
    setDeductions(getDeductions());
    onRefreshData();
  };

  const handleSaveDeduction = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      saveDeduction({
        employee_id: deductEmpId,
        date: deductDate,
        amount: Number(deductAmount),
        reason: deductReason,
      });
      setIsDeductModalOpen(false);
      setDeductAmount(0);
      setDeductReason("");
      reloadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600" />
            <span>الخصومات والمخالفات</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            تسجيل الخصومات والمخالفات المرورية على الموظفين والسائقين ومتابعة اقتطاعها من الرواتب
          </p>
        </div>

        <button
          onClick={() => setIsDeductModalOpen(true)}
          disabled={employees.length === 0}
          className="btn btn-primary bg-rose-600 hover:bg-rose-700 text-xs md:text-sm font-bold flex items-center gap-1.5 shadow-md disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          <span>تسجيل خصم / مخالفة</span>
        </button>
      </div>

      <div className="app-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3">رقم القيد</th>
                <th className="p-3">التاريخ</th>
                <th className="p-3">الموظف / السائق</th>
                <th className="p-3">سبب الخصم / المخالفة</th>
                <th className="p-3">قيمة الخصم</th>
                <th className="p-3">المقتطع</th>
                <th className="p-3">المتبقي</th>
                <th className="p-3 text-center">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {deductions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    لا توجد خصومات مسجلة
                  </td>
                </tr>
              ) : (
                deductions.map((d) => (
                  <tr
                    key={d.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="p-3 font-mono font-bold text-slate-500">#{d.number}</td>
                    <td className="p-3 text-slate-600">{d.date}</td>
                    <td className="p-3 font-bold text-slate-800 dark:text-slate-100">{d.employee_name}</td>
                    <td className="p-3 text-slate-700 dark:text-slate-300">{d.reason}</td>
                    <td className="p-3 font-bold text-rose-600">{formatMoney(d.amount, company.currency)}</td>
                    <td className="p-3 text-emerald-600">{formatMoney(d.settled || 0, "")}</td>
                    <td className="p-3 font-bold">{formatMoney(d.remaining || 0, company.currency)}</td>
                    <td className="p-3 text-center">
                      <span
                        className={`badge ${
                          d.status === "closed"
                            ? "badge-green"
                            : d.status === "partial"
                            ? "badge-amber"
                            : "badge-red"
                        }`}
                      >
                        {d.status === "closed" ? "مقتطع كلياً" : d.status === "partial" ? "مقتطع جزئياً" : "غير مقتطع"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deduction Modal */}
      {isDeductModalOpen && (
        <div className="modal-overlay">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative">
            <div className="bg-rose-700 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-base">تسجيل خصم أو مخالفة على سائق/موظف</h3>
              <button
                onClick={() => setIsDeductModalOpen(false)}
                className="text-white/80 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDeduction} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  الموظف / السائق:
                </label>
                <select
                  value={deductEmpId}
                  onChange={(e) => setDeductEmpId(Number(e.target.value))}
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    تاريخ الخصم:
                  </label>
                  <input
                    type="date"
                    value={deductDate}
                    onChange={(e) => setDeductDate(e.target.value)}
                    className="form-input text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    مبلغ الخصم ({company.currency}):
                  </label>
                  <input
                    type="number"
                    value={deductAmount}
                    onChange={(e) => setDeductAmount(Number(e.target.value))}
                    className="form-input text-xs font-bold text-rose-600"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  سبب الخصم / تفاصيل المخالفة المرورية:
                </label>
                <textarea
                  value={deductReason}
                  onChange={(e) => setDeductReason(e.target.value)}
                  placeholder="مثال: مخالفة سرعة رصد آلي على طريق الرياض..."
                  className="form-textarea text-xs h-20"
                  required
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsDeductModalOpen(false)}
                  className="btn py-2 px-4"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="btn btn-primary bg-rose-600 hover:bg-rose-700 py-2 px-6 font-bold"
                >
                  تسجيل الخصم
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
