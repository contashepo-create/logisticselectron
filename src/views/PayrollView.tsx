import React, { useState } from "react";
import { Plus, Printer, CreditCard, X } from "lucide-react";
import type { Company, Payroll } from "@/types";
import { getEmployees, getPayrolls, savePayroll } from "@/lib/storage";
import { employeeStatement } from "@/lib/calc";
import { formatMoney } from "@/lib/format";
import { renderPayrollSlipHtml } from "@/lib/print-templates";
import { PrintPreviewModal } from "@/components/PrintPreviewModal";

interface Props {
  company: Company;
  onRefreshData: () => void;
}

export const PayrollView: React.FC<Props> = ({ company, onRefreshData }) => {
  const [employees] = useState(() => getEmployees());
  const [payrolls, setPayrolls] = useState(() => getPayrolls());

  const [isPayrollModalOpen, setIsPayrollModalOpen] = useState(false);
  const [payEmpId, setPayEmpId] = useState<number>(employees[0]?.id || 0);
  const [payYear, setPayYear] = useState(new Date().getFullYear());
  const [payMonth, setPayMonth] = useState(new Date().getMonth() + 1);
  const [payBase, setPayBase] = useState(0);
  const [payAdditions, setPayAdditions] = useState(0);
  const [payAdditionsNote, setPayAdditionsNote] = useState("");
  const [payAdvanceDeduction, setPayAdvanceDeduction] = useState(0);
  const [payDeductionDeduction, setPayDeductionDeduction] = useState(0);
  const [payOtherDeductions, setPayOtherDeductions] = useState(0);
  const [payAccountKind, setPayAccountKind] = useState<"cashbox" | "bank">("cashbox");

  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printHtml, setPrintHtml] = useState("");

  const reloadData = () => {
    setPayrolls(getPayrolls());
    onRefreshData();
  };

  const handleOpenCreatePayroll = (empId?: number) => {
    const targetId = empId || employees[0]?.id || 0;
    const emp = employees.find((e) => e.id === targetId);
    const stmt = employeeStatement(targetId);

    setPayEmpId(targetId);
    setPayYear(new Date().getFullYear());
    setPayMonth(new Date().getMonth() + 1);
    setPayBase(emp ? emp.base_salary : 0);
    setPayAdditions(0);
    setPayAdditionsNote("");
    setPayAdvanceDeduction(Math.min(stmt?.remainingAdvances || 0, (emp?.base_salary || 0) / 2));
    setPayDeductionDeduction(stmt?.remainingDeductions || 0);
    setPayOtherDeductions(0);
    setPayAccountKind("cashbox");
    setIsPayrollModalOpen(true);
  };

  const handlePayrollEmployeeChange = (empId: number) => {
    setPayEmpId(empId);
    const emp = employees.find((e) => e.id === empId);
    const stmt = employeeStatement(empId);
    if (emp) {
      setPayBase(emp.base_salary);
      setPayAdvanceDeduction(Math.min(stmt?.remainingAdvances || 0, emp.base_salary / 2));
      setPayDeductionDeduction(stmt?.remainingDeductions || 0);
    }
  };

  const handleSavePayroll = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      savePayroll({
        employee_id: payEmpId,
        period_year: payYear,
        period_month: payMonth,
        date: new Date().toISOString().slice(0, 10),
        account_kind: payAccountKind,
        account_id: 1,
        base_salary: Number(payBase),
        additions: Number(payAdditions),
        additions_note: payAdditionsNote,
        advance_deduction: Number(payAdvanceDeduction),
        deduction_deduction: Number(payDeductionDeduction),
        other_deductions: Number(payOtherDeductions),
      });
      setIsPayrollModalOpen(false);
      reloadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handlePrintPayslip = (p: Payroll) => {
    const html = renderPayrollSlipHtml(p, company);
    setPrintHtml(html);
    setPrintModalOpen(true);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-600" />
            <span>مسيرات الرواتب الشهرية</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            إصدار مسيرات الرواتب الشهرية للموظفين والسائقين وطباعة قسائم الصرف
          </p>
        </div>

        <button
          onClick={() => handleOpenCreatePayroll()}
          disabled={employees.length === 0}
          className="btn btn-primary bg-emerald-600 hover:bg-emerald-700 text-xs md:text-sm font-bold flex items-center gap-1.5 shadow-md disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          <span>إصدار مسير راتب جديد</span>
        </button>
      </div>

      <div className="app-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3">رقم المسير</th>
                <th className="p-3">تاريخ الصرف</th>
                <th className="p-3">شهر / سنة</th>
                <th className="p-3">الموظف / السائق</th>
                <th className="p-3">الأساسي</th>
                <th className="p-3">الإضافي</th>
                <th className="p-3">خصم السلف والجزاءات</th>
                <th className="p-3">صافي الراتب المصروف</th>
                <th className="p-3 text-center">قسيمة الراتب</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {payrolls.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    لم يتم إصدار مسيرات رواتب بعد
                  </td>
                </tr>
              ) : (
                payrolls.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="p-3 font-mono font-bold text-blue-600">#{p.number}</td>
                    <td className="p-3 text-slate-600">{p.date}</td>
                    <td className="p-3 font-semibold text-slate-800 dark:text-slate-100">
                      {p.period_month} / {p.period_year}
                    </td>
                    <td className="p-3 font-bold text-slate-800 dark:text-slate-100">{p.employee_name}</td>
                    <td className="p-3 text-slate-600">{formatMoney(p.base_salary, "")}</td>
                    <td className="p-3 text-emerald-600">+{formatMoney(p.additions, "")}</td>
                    <td className="p-3 text-rose-600">
                      -{formatMoney(p.advance_deduction + (p.deduction_deduction || 0) + p.other_deductions, "")}
                    </td>
                    <td className="p-3 font-black text-emerald-600 dark:text-emerald-400 text-xs md:text-sm">
                      {formatMoney(p.net_salary, company.currency)}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handlePrintPayslip(p)}
                        className="btn py-1 px-2.5 text-[11px] font-bold text-blue-600 flex items-center gap-1 mx-auto"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>قسيمة الراتب</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payroll Processor Modal */}
      {isPayrollModalOpen && (
        <div className="modal-overlay">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl relative">
            <div className="bg-emerald-700 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-base">إصدار مسير راتب شهري وقسيمة صرف</h3>
              <button
                onClick={() => setIsPayrollModalOpen(false)}
                className="text-white/80 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePayroll} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    الشهر:
                  </label>
                  <input
                    type="number"
                    value={payMonth}
                    onChange={(e) => setPayMonth(Number(e.target.value))}
                    className="form-input text-xs font-bold"
                    min="1"
                    max="12"
                    required
                  />
                </div>
                <div className="col-span-1">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    السنة:
                  </label>
                  <input
                    type="number"
                    value={payYear}
                    onChange={(e) => setPayYear(Number(e.target.value))}
                    className="form-input text-xs font-bold"
                    required
                  />
                </div>
                <div className="col-span-1">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    طريقة الصرف:
                  </label>
                  <select
                    value={payAccountKind}
                    onChange={(e) => setPayAccountKind(e.target.value as any)}
                    className="form-select text-xs"
                  >
                    <option value="cashbox">خزينة نقدية</option>
                    <option value="bank">حساب بنكي</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  الموظف / السائق:
                </label>
                <select
                  value={payEmpId}
                  onChange={(e) => handlePayrollEmployeeChange(Number(e.target.value))}
                  className="form-select text-xs font-bold"
                  required
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} (أساسي: {formatMoney(emp.base_salary, "")})
                    </option>
                  ))}
                </select>
              </div>

              {/* Breakdown Grid */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    الراتب الأساسي:
                  </label>
                  <input
                    type="number"
                    value={payBase}
                    onChange={(e) => setPayBase(Number(e.target.value))}
                    className="form-input text-xs font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    بدلات ومكافآت إضافية (+):
                  </label>
                  <input
                    type="number"
                    value={payAdditions}
                    onChange={(e) => setPayAdditions(Number(e.target.value))}
                    className="form-input text-xs text-emerald-600 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    خصم سلف مستردة (-):
                  </label>
                  <input
                    type="number"
                    value={payAdvanceDeduction}
                    onChange={(e) => setPayAdvanceDeduction(Number(e.target.value))}
                    className="form-input text-xs text-rose-600 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    خصومات ومخالفات (-):
                  </label>
                  <input
                    type="number"
                    value={payDeductionDeduction}
                    onChange={(e) => setPayDeductionDeduction(Number(e.target.value))}
                    className="form-input text-xs text-rose-600 font-bold"
                  />
                </div>
              </div>

              {/* Net Output Box */}
              <div className="bg-slate-900 text-white p-3.5 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400">صافي الراتب المستحق للصرف:</div>
                  <div className="text-xl font-black text-emerald-400">
                    {formatMoney(
                      payBase + payAdditions - payAdvanceDeduction - payDeductionDeduction - payOtherDeductions,
                      company.currency
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPayrollModalOpen(false)}
                  className="btn py-2 px-4"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="btn btn-primary bg-emerald-600 hover:bg-emerald-700 py-2 px-6 font-bold"
                >
                  اعتماد وصرف المسير
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
        title="معاينة وطباعة قسيمة الراتب"
        htmlContent={printHtml}
        showTemplatePicker={false}
      />
    </div>
  );
};
