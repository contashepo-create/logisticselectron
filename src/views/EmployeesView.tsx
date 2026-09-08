import React, { useState } from "react";
import { Plus, Edit2, Trash2, UserCheck } from "lucide-react";
import type { Company, Employee } from "@/types";
import {
  deleteEmployee,
  getEmployees,
  saveEmployee,
} from "@/lib/storage";
import { formatMoney } from "@/lib/format";

interface Props {
  company: Company;
  onRefreshData: () => void;
}

export const EmployeesView: React.FC<Props> = ({ company, onRefreshData }) => {
  const [employees, setEmployees] = useState(() => getEmployees());

  // Employee Modal
  const [isEmpModalOpen, setIsEmpModalOpen] = useState(false);
  const [editingEmpId, setEditingEmpId] = useState<number | null>(null);
  const [empName, setEmpName] = useState("");
  const [empType, setEmpType] = useState<"driver" | "admin">("driver");
  const [empNat, setEmpNat] = useState("");
  const [empPhone, setEmpPhone] = useState("");
  const [empSalary, setEmpSalary] = useState(0);
  const [empNotes, setEmpNotes] = useState("");

  const reloadData = () => {
    setEmployees(getEmployees());
    onRefreshData();
  };

  const handleOpenCreateEmp = () => {
    setEditingEmpId(null);
    setEmpName("");
    setEmpType("driver");
    setEmpNat("");
    setEmpPhone("");
    setEmpSalary(0);
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

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-600" />
            <span>دليل الموظفين والسائقين</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            إدارة بيانات الكادر والسائقين وبيانات الرواتب الأساسية
          </p>
        </div>

        <button
          onClick={handleOpenCreateEmp}
          className="btn btn-primary text-xs md:text-sm font-bold flex items-center gap-1.5 shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة موظف / سائق</span>
        </button>
      </div>

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
                <th className="p-3 text-center">الخيارات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    لا يوجد موظفون مسجلون بعد
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
                ✕
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
    </div>
  );
};
