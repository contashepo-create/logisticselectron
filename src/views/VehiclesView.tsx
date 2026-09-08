import React, { useState, useMemo } from "react";
import {
  Plus,
  Search,
  Printer,
  Edit2,
  Trash2,
  Truck,
  DollarSign,
  TrendingUp,
  X,
  FileText,
  User,
} from "lucide-react";
import type { Company, Employee, Vehicle } from "@/types";
import {
  deleteVehicle,
  getEmployees,
  getVehicles,
  saveVehicle,
} from "@/lib/storage";
import { vehicleReport } from "@/lib/calc";
import { formatMoney } from "@/lib/format";
import { renderMasterReportHtml } from "@/lib/print-templates";
import { PrintPreviewModal } from "@/components/PrintPreviewModal";

interface Props {
  company: Company;
  onRefreshData: () => void;
}

export const VehiclesView: React.FC<Props> = ({ company, onRefreshData }) => {
  const [vehicles, setVehicles] = useState(() => getVehicles());
  const [employees, setEmployees] = useState(() => getEmployees());
  const [searchTerm, setSearchTerm] = useState("");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formPlate, setFormPlate] = useState("");
  const [formType, setFormType] = useState("");
  const [formDriverId, setFormDriverId] = useState<number | null>(null);
  const [formNotes, setFormNotes] = useState("");

  // Print Preview
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printHtml, setPrintHtml] = useState("");

  const reloadData = () => {
    setVehicles(getVehicles());
    setEmployees(getEmployees());
    onRefreshData();
  };

  const performanceList = useMemo(() => {
    return vehicleReport();
  }, [vehicles]);

  const filteredVehicles = useMemo(() => {
    return vehicles.filter(
      (v) =>
        v.plate_number.includes(searchTerm) ||
        v.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.vehicle_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (v.driver_name || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [vehicles, searchTerm]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormPlate("");
    setFormType("شاحنة مرسيدس أكتروس 2022");
    setFormDriverId(employees[0]?.id || null);
    setFormNotes("");
    setIsFormOpen(true);
  };

  const handleOpenEdit = (v: Vehicle) => {
    setEditingId(v.id);
    setFormPlate(v.plate_number);
    setFormType(v.vehicle_type);
    setFormDriverId(v.default_driver_id || null);
    setFormNotes(v.notes || "");
    setIsFormOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذه الشاحنة من الأسطول؟")) {
      deleteVehicle(id);
      reloadData();
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      saveVehicle(
        {
          plate_number: formPlate,
          vehicle_type: formType,
          default_driver_id: formDriverId,
          notes: formNotes,
        },
        editingId
      );
      setIsFormOpen(false);
      reloadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handlePrintPerformance = () => {
    const totalRev = performanceList.reduce((acc, v) => acc + v.totalRevenue, 0);
    const totalExp = performanceList.reduce((acc, v) => acc + v.totalExpenses, 0);
    const totalProfit = performanceList.reduce((acc, v) => acc + v.netProfit, 0);

    const html = renderMasterReportHtml(
      {
        title: "تقرير أداء وربحية أسطول الشاحنات والمركبات",
        subtitle: `إجمالي عدد الشاحنات: ${vehicles.length} شاحنة عاملة`,
        kpis: [
          { label: "إجمالي إيراد النقلات", value: formatMoney(totalRev, company.currency), color: "#2563eb" },
          { label: "إجمالي تكاليف التشغيل والصيانة", value: formatMoney(totalExp, company.currency), color: "#dc2626" },
          { label: "صافي أرباح الأسطول", value: formatMoney(totalProfit, company.currency), color: "#059669" },
        ],
        columns: [
          { header: "كود", key: "code", align: "center" },
          { header: "رقم اللوحة والنوع", key: "plateNumber" },
          { header: "السائق الافتراضي", key: "driverName" },
          { header: "عدد النقلات", key: "tripsCount", align: "center" },
          { header: "إجمالي الإيراد", key: "totalRevenue", align: "left", format: (v) => formatMoney(v, "") },
          { header: "الوقود والصيانة", key: "totalExpenses", align: "left", format: (v) => formatMoney(v, "") },
          { header: "صافي الربح", key: "netProfit", align: "left", format: (v) => formatMoney(v, "") },
          { header: "هامش الربح", key: "profitMargin", align: "center", format: (v) => `${v}%` },
        ],
        rows: performanceList,
        summaryRow: {
          code: "الإجمالي",
          plateNumber: "",
          driverName: "",
          tripsCount: String(performanceList.reduce((a, b) => a + b.tripsCount, 0)),
          totalRevenue: formatMoney(totalRev, ""),
          totalExpenses: formatMoney(totalExp, ""),
          netProfit: formatMoney(totalProfit, company.currency),
          profitMargin: totalRev > 0 ? `${((totalProfit / totalRev) * 100).toFixed(1)}%` : "0%",
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
            <Truck className="w-5 h-5 text-indigo-600" />
            <span>أسطول الشاحنات والمركبات والربحية</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            إدارة المركبات، ربط السائقين، متابعة مصروفات الديزل والصيانة، وقياس ربحية كل شاحنة
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrintPerformance}
            className="btn py-2 px-3 text-xs font-semibold flex items-center gap-1.5"
            title="طباعة تقرير أداء الأسطول"
          >
            <Printer className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            <span>طباعة تقرير الأداء</span>
          </button>
          <button
            onClick={handleOpenCreate}
            className="btn btn-primary bg-indigo-600 hover:bg-indigo-700 text-xs md:text-sm font-bold flex items-center gap-1.5 shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة شاحنة جديدة</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="app-card p-3.5 text-xs">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="البحث برقم اللوحة، نوع المركبة، السائق..."
            className="form-input pr-9 text-xs"
          />
        </div>
      </div>

      {/* Grid of Vehicle Cards / Performance Table */}
      <div className="app-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3">الكود</th>
                <th className="p-3">رقم اللوحة</th>
                <th className="p-3">نوع الشاحنة / الطراز</th>
                <th className="p-3">السائق المخصص</th>
                <th className="p-3 text-center">النقلات المنفذة</th>
                <th className="p-3">إجمالي الإيرادات</th>
                <th className="p-3">المصروفات (ديزل + صيانة)</th>
                <th className="p-3">صافي الربح المحقق</th>
                <th className="p-3 text-center">خيارات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    لا توجد شاحنات مسجلة
                  </td>
                </tr>
              ) : (
                filteredVehicles.map((v) => {
                  const perf = performanceList.find((p) => p.vehicleId === v.id);
                  const revenue = perf?.totalRevenue || 0;
                  const expenses = perf?.totalExpenses || 0;
                  const net = perf?.netProfit || 0;
                  const margin = perf?.profitMargin || 0;

                  return (
                    <tr
                      key={v.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="p-3 font-mono font-bold text-slate-500">{v.code}</td>
                      <td className="p-3 font-bold text-slate-900 dark:text-slate-100">
                        {v.plate_number}
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-300">{v.vehicle_type}</td>
                      <td className="p-3 text-slate-700 dark:text-slate-300">
                        {v.driver_name || "—"}
                      </td>
                      <td className="p-3 text-center">
                        <span className="badge badge-blue">
                          {perf?.tripsCount || 0} نقلة
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-blue-600 dark:text-blue-400">
                        {formatMoney(revenue, "")}
                      </td>
                      <td className="p-3 text-rose-600 dark:text-rose-400">
                        {formatMoney(expenses, "")}
                      </td>
                      <td className="p-3 font-extrabold text-emerald-600 dark:text-emerald-400">
                        {formatMoney(net, company.currency)}
                        <span className="block text-[10px] text-slate-400 font-normal">
                          هامش: {margin}%
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(v)}
                            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="تعديل الشاحنة"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(v.id)}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Form Modal */}
      {isFormOpen && (
        <div className="modal-overlay">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative">
            <div className="bg-indigo-700 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-base">
                {editingId ? "تعديل بيانات المركبة" : "إضافة شاحنة جديدة إلى الأسطول"}
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
                  رقم اللوحة:
                </label>
                <input
                  type="text"
                  value={formPlate}
                  onChange={(e) => setFormPlate(e.target.value)}
                  placeholder="مثال: أ ب ج 1234"
                  className="form-input text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  نوع وطراز المركبة:
                </label>
                <input
                  type="text"
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  placeholder="مثال: شاحنة مرسيدس أكتروس 2022 / تريلا سطحة"
                  className="form-input text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  السائق المخصص افتراضياً:
                </label>
                <select
                  value={formDriverId || ""}
                  onChange={(e) => setFormDriverId(Number(e.target.value) || null)}
                  className="form-select text-xs"
                >
                  <option value="">بدون سائق افتراضي</option>
                  {employees
                    .filter((e) => e.emp_type === "driver")
                    .map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.phone || emp.code})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ملاحظات الفحص والاستمارة والتأمين:
                </label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="رقم الشاسيه، تاريخ انتهاء الاستمارة..."
                  className="form-textarea text-xs h-20"
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
                  className="btn btn-primary bg-indigo-600 hover:bg-indigo-700 py-2 px-6 font-bold"
                >
                  حفظ المركبة
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
        title="معاينة وطباعة تقرير أداء وربحية الأسطول"
        htmlContent={printHtml}
        showTemplatePicker={false}
      />
    </div>
  );
};
