import React, { useState } from "react";
import { Calendar, Plus, Edit2, Trash2, X, Lock, Unlock } from "lucide-react";
import type { FinancialYear } from "@/types";
import {
  deleteFinancialYear,
  getFinancialYears,
  saveFinancialYear,
} from "@/lib/storage";

export const FinancialYearsView: React.FC = () => {
  const [years, setYears] = useState<FinancialYear[]>(() => getFinancialYears());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [dateFrom, setDateFrom] = useState(`${new Date().getFullYear()}-01-01`);
  const [dateTo, setDateTo] = useState(`${new Date().getFullYear()}-12-31`);
  const [status, setStatus] = useState<"open" | "closed">("open");
  const [notes, setNotes] = useState("");

  const reload = () => setYears(getFinancialYears());

  const handleOpenCreate = () => {
    setEditingId(null);
    const y = new Date().getFullYear();
    setYear(y);
    setDateFrom(`${y}-01-01`);
    setDateTo(`${y}-12-31`);
    setStatus("open");
    setNotes("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (fy: FinancialYear) => {
    setEditingId(fy.id);
    setYear(fy.year);
    setDateFrom(fy.date_from);
    setDateTo(fy.date_to);
    setStatus(fy.status);
    setNotes(fy.notes || "");
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      saveFinancialYear(
        { year, date_from: dateFrom, date_to: dateTo, status, notes },
        editingId
      );
      setIsModalOpen(false);
      reload();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذه السنة المالية؟")) {
      try {
        deleteFinancialYear(id);
        reload();
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const handleToggleStatus = (fy: FinancialYear) => {
    saveFinancialYear({ status: fy.status === "open" ? "closed" : "open" }, fy.id);
    reload();
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <span>السنوات المالية</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            إدارة السنوات المالية وفتحها وإقفالها، وترحيل الأرصدة بين الفترات المحاسبية
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="btn btn-primary text-xs md:text-sm font-bold flex items-center gap-1.5 shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة سنة مالية</span>
        </button>
      </div>

      <div className="app-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3">السنة</th>
                <th className="p-3">من تاريخ</th>
                <th className="p-3">إلى تاريخ</th>
                <th className="p-3">الحالة</th>
                <th className="p-3">ملاحظات</th>
                <th className="p-3 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {years.map((fy) => (
                <tr key={fy.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-3 font-black text-slate-900 dark:text-slate-100">{fy.year}</td>
                  <td className="p-3 text-slate-600 dark:text-slate-300 font-mono">{fy.date_from}</td>
                  <td className="p-3 text-slate-600 dark:text-slate-300 font-mono">{fy.date_to}</td>
                  <td className="p-3">
                    <span className={`badge ${fy.status === "open" ? "badge-green" : "badge-red"}`}>
                      {fy.status === "open" ? "مفتوحة للعمليات" : "مقفلة"}
                    </span>
                  </td>
                  <td className="p-3 text-slate-500 dark:text-slate-400">{fy.notes || "—"}</td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => handleToggleStatus(fy)}
                        className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50"
                        title={fy.status === "open" ? "إقفال السنة" : "إعادة فتح السنة"}
                      >
                        {fy.status === "open" ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleOpenEdit(fy)}
                        className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="تعديل"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(fy.id)}
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

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative">
            <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-base">
                {editingId ? "تعديل السنة المالية" : "إضافة سنة مالية جديدة"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-white/80 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">السنة:</label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="form-input text-xs font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">من تاريخ:</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="form-input text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">إلى تاريخ:</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="form-input text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">الحالة:</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="form-select text-xs"
                >
                  <option value="open">مفتوحة للعمليات</option>
                  <option value="closed">مقفلة</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">ملاحظات:</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="form-textarea text-xs h-16"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn py-2 px-4">
                  إلغاء
                </button>
                <button type="submit" className="btn btn-primary py-2 px-6 font-bold">
                  حفظ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
