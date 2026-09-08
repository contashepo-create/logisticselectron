import React, { useState, useMemo } from "react";
import {
  Plus,
  Search,
  Printer,
  Edit2,
  Trash2,
  UserCheck,
  DollarSign,
  FileText,
  X,
  CreditCard,
  AlertCircle,
} from "lucide-react";
import type { Company, Employee, EmployeeDeduction, Payroll, PaymentVoucher } from "@/types";
import {
  deleteDeduction,
  deleteEmployee,
  deletePayroll,
  getDeductions,
  getEmployees,
  getPayments,
  getPayrolls,
  saveDeduction,
  saveEmployee,
  savePayroll,
} from "@/lib/storage";
import { employeeStatement } from "@/lib/calc";
import { formatMoney } from "@/lib/format";
import { renderPayrollSlipHtml, renderMasterReportHtml } from "@/lib/print-templates";
import { PrintPreviewModal } from "@/components/PrintPreviewModal";

interface Props {
  company: Company;
  onRefreshData: () => void;
}

export const EmployeesView: React.FC<Props> = ({ company, onRefreshData }) => {
  const [activeSubTab, setActiveSubTab] = useState<"employees" | "advances" | "deductions" | "payroll">("employees");

  const [employees, setEmployees] = useState(() => getEmployees());
  const [payrolls, setPayrolls] = useState(() => getPayrolls());
  const [deductions, setDeductions] = useState(() => getDeductions());
  const [payments, setPayments] = useState(() => getPayments());

  const [searchTerm, setSearchTerm] = useState("");

  // Employee Modal
  const [isEmpModalOpen, setIsEmpModalOpen] = useState(false);
  const [editingEmpId, setEditingEmpId] = useState<number | null>(null);
  const [empName, setEmpName] = useState("");
  const [empType, setEmpType] = useState<"driver" | "admin">("driver");
  const [empNat, setEmpNat] = useState("سعودي");
  const [empPhone, setEmpPhone] = useState("");
  const [empSalary, setEmpSalary] = useState(4000);
  const [empNotes, setEmpNotes] = useState("");

  // Deduction Modal
  const [isDeductModalOpen, setIsDeductModalOpen] = useState(false);
  const [deductEmpId, setDeductEmpId] = useState<number>(employees[0]?.id || 1);
  const [deductAmount, setDeductAmount] = useState(0);
  const [deductReason, setDeductReason] = useState("");
  const [deductDate, setDeductDate] = useState(new Date().toISOString().slice(0, 10));

  // Payroll Issue Modal
  const [isPayrollModalOpen, setIsPayrollModalOpen] = useState(false);
  const [payEmpId, setPayEmpId] = useState<number>(employees[0]?.id || 1);
  const [payYear, setPayYear] = useState(new Date().getFullYear());
  const [payMonth, setPayMonth] = useState(new Date().getMonth() + 1);
  const [payBase, setPayBase] = useState(4000);
  const [payAdditions, setPayAdditions] = useState(0);
  const [payAdditionsNote, setPayAdditionsNote] = useState("");
  const [payAdvanceDeduction, setPayAdvanceDeduction] = useState(0);
  const [payDeductionDeduction, setPayDeductionDeduction] = useState(0);
  const [payOtherDeductions, setPayOtherDeductions] = useState(0);
  const [payAccountKind, setPayAccountKind] = useState<"cashbox" | "bank">("cashbox");

  // Print Preview
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printHtml, setPrintHtml] = useState("");

  const reloadData = () => {
    setEmployees(getEmployees());
    setPayrolls(getPayrolls());
    setDeductions(getDeductions());
    setPayments(getPayments());
    onRefreshData();
  };

  // Advances data aggregation
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

  // Handle Employee Form
  const handleOpenCreateEmp = () => {
    setEditingEmpId(null);
    setEmpName("");
    setEmpType("driver");
    setEmpNat("سعودي");
    setEmpPhone("");
    setEmpSalary(4000);
    setEmpNotes("");
    setIsEmpModalOpen(true);
  };

  const handleOpenEditEmp = (e: Employee) => {
    setEditingEmpId(e.id);
    setEmpName(e.name);
    setEmpType(e.emp_type);
    setEmpNat(e.nationality);
    setEmpPhone(e.phone || "");
    setEmpSalary(e.base_salary);
    setEmpNotes(e.notes || "");
    setIsEmpModalOpen(true);
  };

  const handleDeleteEmp = (id: number) => {
    if (confirm("هل أنت متأكد من حذف الموظف؟")) {
      deleteEmployee(id);
      reloadData();
    }
  };

  const handleSaveEmp = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      saveEmployee(
        {
          name: empName,
          emp_type: empType,
          nationality: empNat,
          phone: empPhone,
          base_salary: Number(empSalary),
          notes: empNotes,
        },
        editingEmpId
      );
      setIsEmpModalOpen(false);
      reloadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Handle Deduction Form
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

  // Handle Payroll Processor Modal
  const handleOpenCreatePayroll = (empId?: number) => {
    const targetId = empId || employees[0]?.id || 1;
    const emp = employees.find((e) => e.id === targetId);
    const stmt = employeeStatement(targetId);

    setPayEmpId(targetId);
    setPayYear(new Date().getFullYear());
    setPayMonth(new Date().getMonth() + 1);
    setPayBase(emp ? emp.base_salary : 4000);
    setPayAdditions(0);
    setPayAdditionsNote("");
    setPayAdvanceDeduction(Math.min(stmt?.remainingAdvances || 0, (emp?.base_salary || 4000) / 2));
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
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-600" />
            <span>الموظفون، السائقون، ومسيرات الرواتب والسلف</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            إدارة بيانات الكادر والسائقين، متابعة سلف العهد والخصومات، وإصدار مسيرات الرواتب الشهرية وقسائم الصرف
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeSubTab === "employees" && (
            <button
              onClick={handleOpenCreateEmp}
              className="btn btn-primary text-xs md:text-sm font-bold flex items-center gap-1.5 shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة موظف / سائق</span>
            </button>
          )}

          {activeSubTab === "deductions" && (
            <button
              onClick={() => setIsDeductModalOpen(true)}
              className="btn btn-primary bg-rose-600 hover:bg-rose-700 text-xs md:text-sm font-bold flex items-center gap-1.5 shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>تسجيل خصم / مخالفة</span>
            </button>
          )}

          {activeSubTab === "payroll" && (
            <button
              onClick={() => handleOpenCreatePayroll()}
              className="btn btn-primary bg-emerald-600 hover:bg-emerald-700 text-xs md:text-sm font-bold flex items-center gap-1.5 shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>إصدار مسير راتب جديد</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4 text-xs font-bold">
        <button
          onClick={() => setActiveSubTab("employees")}
          className={`pb-2.5 flex items-center gap-1.5 transition ${
            activeSubTab === "employees"
              ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>دليل الموظفين والسائقين ({employees.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab("advances")}
          className={`pb-2.5 flex items-center gap-1.5 transition ${
            activeSubTab === "advances"
              ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>أرصدة وسلف السائقين</span>
        </button>

        <button
          onClick={() => setActiveSubTab("deductions")}
          className={`pb-2.5 flex items-center gap-1.5 transition ${
            activeSubTab === "deductions"
              ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          <span>الخصومات والمخالفات ({deductions.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab("payroll")}
          className={`pb-2.5 flex items-center gap-1.5 transition ${
            activeSubTab === "payroll"
              ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>مسيرات الرواتب الصادرة ({payrolls.length})</span>
        </button>
      </div>

      {/* Tab 1: Employees List */}
      {activeSubTab === "employees" && (
        <div className="app-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3">الكود</th>
                  <th className="p-3">الاسم الكامل</th>
                  <th className="p-3">الوظيفة / الصفة</th>
                  <th className="p-3">الجنسية</th>
                  <th className="p-3">الهاتف</th>
                  <th className="p-3">الراتب الأساسي</th>
                  <th className="p-3 text-center">مسير الراتب والخيارات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {employees.map((emp) => (
                  <tr
                    key={emp.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="p-3 font-mono font-bold text-slate-500">{emp.code}</td>
                    <td className="p-3 font-bold text-slate-800 dark:text-slate-100">{emp.name}</td>
                    <td className="p-3">
                      <span className={`badge ${emp.emp_type === "driver" ? "badge-blue" : "badge-green"}`}>
                        {emp.emp_type === "driver" ? "سائق شاحنة" : "إداري / محاسب"}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">{emp.nationality}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">{emp.phone || "—"}</td>
                    <td className="p-3 font-extrabold text-slate-900 dark:text-slate-100">
                      {formatMoney(emp.base_salary, company.currency)}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenCreatePayroll(emp.id)}
                          className="btn py-1 px-2 text-[11px] font-bold text-emerald-600 hover:bg-emerald-50"
                          title="إصدار راتب"
                        >
                          صرف راتب
                        </button>
                        <button
                          onClick={() => handleOpenEditEmp(emp)}
                          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="تعديل"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteEmp(emp.id)}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Advances Tracker */}
      {activeSubTab === "advances" && (
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
                {advancesList.map((row) => (
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
                        onClick={() => handleOpenCreatePayroll(row.employee.id)}
                        className="btn py-1 px-2.5 text-[11px] font-bold text-blue-600 hover:bg-blue-50"
                      >
                        خصم من المسير
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Deductions List */}
      {activeSubTab === "deductions" && (
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
      )}

      {/* Tab 4: Payrolls History */}
      {activeSubTab === "payroll" && (
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
      )}

      {/* Employee Modal */}
      {isEmpModalOpen && (
        <div className="modal-overlay">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative">
            <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-base">
                {editingEmpId ? "تعديل بيانات الموظف" : "إضافة موظف / سائق جديد"}
              </h3>
              <button
                onClick={() => setIsEmpModalOpen(false)}
                className="text-white/80 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEmp} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  الاسم الكامل:
                </label>
                <input
                  type="text"
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                  placeholder="مثال: أحمد منصور الحارثي"
                  className="form-input text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    الوظيفة / الدور:
                  </label>
                  <select
                    value={empType}
                    onChange={(e) => setEmpType(e.target.value as any)}
                    className="form-select text-xs"
                  >
                    <option value="driver">سائق شاحنة / تريلا</option>
                    <option value="admin">إداري / محاسب / تشغيل</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    الجنسية:
                  </label>
                  <input
                    type="text"
                    value={empNat}
                    onChange={(e) => setEmpNat(e.target.value)}
                    placeholder="سعودي، مصري، باكستاني..."
                    className="form-input text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    رقم الهاتف:
                  </label>
                  <input
                    type="text"
                    value={empPhone}
                    onChange={(e) => setEmpPhone(e.target.value)}
                    placeholder="05XXXXXXXX"
                    className="form-input text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    الراتب الأساسي الشهري:
                  </label>
                  <input
                    type="number"
                    value={empSalary}
                    onChange={(e) => setEmpSalary(Number(e.target.value))}
                    className="form-input text-xs font-bold"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ملاحظات ورقم الإقامة ورخصة القيادة:
                </label>
                <textarea
                  value={empNotes}
                  onChange={(e) => setEmpNotes(e.target.value)}
                  placeholder="رقم الإقامة، تاريخ انتهائها، فئة رخصة القيادة..."
                  className="form-textarea text-xs h-16"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEmpModalOpen(false)}
                  className="btn py-2 px-4"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="btn btn-primary py-2 px-6 font-bold"
                >
                  حفظ الموظف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
