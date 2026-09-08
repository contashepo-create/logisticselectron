import React, { useMemo, useState } from "react";
import { DollarSign } from "lucide-react";
import type { ActiveTab } from "@/components/Sidebar";
import type { Company } from "@/types";
import { getEmployees, getPayments, getPayrolls } from "@/lib/storage";
import { employeeStatement } from "@/lib/calc";
import { formatMoney } from "@/lib/format";

interface Props {
  company: Company;
  onNavigate?: (tab: ActiveTab) => void;
}

export const AdvancesView: React.FC<Props> = ({ company, onNavigate }) => {
  const [employees] = useState(() => getEmployees());
  const [payments] = useState(() => getPayments());
  const [payrolls] = useState(() => getPayrolls());

  const advancesList = useMemo(() => {
    return employees.map((emp) => {
      const stmt = employeeStatement(emp.id);
      return {
        employee: emp,
        totalIssued: stmt?.totalAdvancesIssued || 0,
        totalSettled: stmt?.totalAdvancesSettled || 0,
        remaining: stmt?.remainingAdvances || 0,
      };
    });
  }, [employees, payments, payrolls]);

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-blue-600" />
          <span>سلف الموظفين والسائقين</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          متابعة أرصدة سلف العهد الممنوحة للموظفين والسائقين والمبالغ المستردة عبر مسيرات الرواتب
        </p>
      </div>

      <div className="app-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3">الموظف / السائق</th>
                <th className="p-3">الوظيفة</th>
                <th className="p-3">إجمالي السلف المنصرفة</th>
                <th className="p-3">المسترد عبر الرواتب</th>
                <th className="p-3">المتبقي المطلوب استرداده</th>
                <th className="p-3 text-center">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {advancesList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    لا يوجد موظفون مسجلون بعد
                  </td>
                </tr>
              ) : (
                advancesList.map((row) => (
                  <tr
                    key={row.employee.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="p-3 font-bold text-slate-800 dark:text-slate-100">
                      {row.employee.name}
                    </td>
                    <td className="p-3 text-slate-600">
                      {row.employee.emp_type === "driver" ? "سائق" : "إداري"}
                    </td>
                    <td className="p-3 text-rose-600 font-bold">{formatMoney(row.totalIssued, company.currency)}</td>
                    <td className="p-3 text-emerald-600 font-bold">{formatMoney(row.totalSettled, company.currency)}</td>
                    <td className="p-3">
                      <span
                        className={`font-black text-xs md:text-sm ${
                          row.remaining > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-400"
                        }`}
                      >
                        {formatMoney(row.remaining, company.currency)}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => onNavigate && onNavigate("payroll")}
                        className="btn py-1 px-2.5 text-[11px] font-bold text-blue-600 hover:bg-blue-50"
                      >
                        خصم من المسير
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
