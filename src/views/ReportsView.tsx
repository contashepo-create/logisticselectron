import React, { useState, useMemo } from "react";
import {
  PieChart,
  Calendar,
  Printer,
  Download,
  Filter,
  TrendingUp,
  Clock,
  Truck,
  Users,
  Building2,
  FileText,
  DollarSign,
} from "lucide-react";
import type { Company } from "@/types";
import {
  customersAging,
  pnlReport,
  suppliersAging,
  vehicleReport,
} from "@/lib/calc";
import { getInvoices } from "@/lib/storage";
import { formatMoney } from "@/lib/format";
import { renderMasterReportHtml } from "@/lib/print-templates";
import { PrintPreviewModal } from "@/components/PrintPreviewModal";

interface Props {
  company: Company;
}

type ReportType = "pnl" | "customers_aging" | "suppliers_aging" | "vehicles" | "trips";

export const ReportsView: React.FC<Props> = ({ company }) => {
  const [selectedReport, setSelectedReport] = useState<ReportType>("pnl");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Print Modal
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printHtml, setPrintHtml] = useState("");

  const pnl = useMemo(() => pnlReport(fromDate, toDate), [fromDate, toDate]);
  const custAging = useMemo(() => customersAging(), []);
  const suppAging = useMemo(() => suppliersAging(), []);
  const vehicles = useMemo(() => vehicleReport(null, fromDate, toDate), [fromDate, toDate]);
  const invoices = useMemo(() => getInvoices(), []);

  // Trips Log
  const tripsLog = useMemo(() => {
    const list: any[] = [];
    for (const inv of invoices) {
      if (fromDate && inv.date < fromDate) continue;
      if (toDate && inv.date > toDate) continue;
      for (const t of inv.trips || []) {
        list.push({
          date: inv.date,
          invNumber: inv.number,
          customerName: inv.customer_name,
          route: `من ${t.from_loc} إلى ${t.to_loc}`,
          vehicle: t.vehicle_name || "—",
          driver: t.driver_name || "—",
          qty: t.qty,
          price: t.price,
          containers: t.container_numbers?.join(", ") || "—",
        });
      }
    }
    return list;
  }, [invoices, fromDate, toDate]);

  const handlePrintCurrentReport = () => {
    let reportModel: any = null;

    if (selectedReport === "pnl") {
      const rows = [
        { section: "الإيرادات", item: "إيرادات النقلات والنولون", amount: pnl.revenue.tripsRevenue },
        { section: "الإيرادات", item: "مصروفات مستردة من العملاء", amount: pnl.revenue.customerExpensesReimbursed },
        { section: "الإيرادات", item: "إيرادات أخرى", amount: pnl.revenue.otherRevenues },
        { section: "التكاليف المباشرة", item: "وقود وديزل الرحلات", amount: -pnl.directExpenses.tripFuel },
        { section: "التكاليف المباشرة", item: "كارتات وموازين وموانئ", amount: -pnl.directExpenses.tripTolls },
        { section: "التكاليف المباشرة", item: "مصروفات نقل مباشرة أخرى", amount: -pnl.directExpenses.tripOther },
        { section: "المصروفات التشغيلية", item: "الرواتب والأجور الشهرية", amount: -pnl.operatingExpenses.payrollGross },
        { section: "المصروفات التشغيلية", item: "صيانة وقطع غيار الشاحنات", amount: -pnl.operatingExpenses.vehicleMaintenance },
        { section: "المصروفات التشغيلية", item: "مشتريات ومصروفات عامة", amount: -pnl.operatingExpenses.purchasesExpenses },
        { section: "المصروفات التشغيلية", item: "مصروفات إدارية وعمومية", amount: -pnl.operatingExpenses.generalAdminExpenses },
      ];

      reportModel = {
        title: "قائمة الأرباح والخسائر والدخل التشغيلي (P&L)",
        subtitle: `الفترة: ${fromDate || "بداية العام"} إلى ${toDate || "اليوم"} | عدد النقلات: ${pnl.tripsCount} نقلة`,
        kpis: [
          { label: "إجمالي الإيرادات", value: formatMoney(pnl.revenue.totalGrossRevenue, company.currency), color: "#2563eb" },
          { label: "مجمل الربح", value: formatMoney(pnl.grossProfit, company.currency), color: "#059669" },
          { label: "صافي الربح التشغيلي", value: formatMoney(pnl.netOperatingProfit, company.currency), color: "#7c3aed" },
        ],
        columns: [
          { header: "التصنيف الرئيسي", key: "section" },
          { header: "البند المالي", key: "item" },
          { header: "القيمة المالية", key: "amount", align: "left", format: (v: any) => formatMoney(v, company.currency) },
        ],
        rows,
        summaryRow: {
          section: "الصافي النهائي",
          item: "صافي الأرباح التشغيلية",
          amount: formatMoney(pnl.netOperatingProfit, company.currency),
        },
      };
    } else if (selectedReport === "customers_aging") {
      const totalAging = custAging.reduce((a, b) => a + b.total, 0);
      reportModel = {
        title: "تقرير أعمار ديون العملاء والمستحقات (Receivables Aging)",
        subtitle: `تاريخ التقييم: ${new Date().toISOString().slice(0, 10)}`,
        kpis: [
          { label: "إجمالي مديونيات العملاء", value: formatMoney(totalAging, company.currency), color: "#2563eb" },
          { label: "ديون حديثة (0-30 يوم)", value: formatMoney(custAging.reduce((a, b) => a + b.current, 0), company.currency) },
          { label: "متعثرة (+90 يوم)", value: formatMoney(custAging.reduce((a, b) => a + b.over90, 0), company.currency), color: "#dc2626" },
        ],
        columns: [
          { header: "اسم العميل", key: "name" },
          { header: "حالي (0-30 يوم)", key: "current", align: "left", format: (v: any) => formatMoney(v, "") },
          { header: "31-60 يوم", key: "d31_60", align: "left", format: (v: any) => formatMoney(v, "") },
          { header: "61-90 يوم", key: "d61_90", align: "left", format: (v: any) => formatMoney(v, "") },
          { header: "أكثر من 90 يوم", key: "over90", align: "left", format: (v: any) => formatMoney(v, "") },
          { header: "الإجمالي المستحق", key: "total", align: "left", format: (v: any) => formatMoney(v, company.currency) },
        ],
        rows: custAging,
        summaryRow: {
          name: "الإجمالي العام",
          current: formatMoney(custAging.reduce((a, b) => a + b.current, 0), ""),
          d31_60: formatMoney(custAging.reduce((a, b) => a + b.d31_60, 0), ""),
          d61_90: formatMoney(custAging.reduce((a, b) => a + b.d61_90, 0), ""),
          over90: formatMoney(custAging.reduce((a, b) => a + b.over90, 0), ""),
          total: formatMoney(totalAging, company.currency),
        },
      };
    } else if (selectedReport === "suppliers_aging") {
      const totalSupp = suppAging.reduce((a, b) => a + b.total, 0);
      reportModel = {
        title: "تقرير أعمار ديون الموردين والمستحقات (Payables Aging)",
        subtitle: `تاريخ التقييم: ${new Date().toISOString().slice(0, 10)}`,
        kpis: [
          { label: "إجمالي مستحقات الموردين", value: formatMoney(totalSupp, company.currency), color: "#d97706" },
        ],
        columns: [
          { header: "اسم المورد", key: "name" },
          { header: "0-30 يوم", key: "current", align: "left", format: (v: any) => formatMoney(v, "") },
          { header: "31-60 يوم", key: "d31_60", align: "left", format: (v: any) => formatMoney(v, "") },
          { header: "61-90 يوم", key: "d61_90", align: "left", format: (v: any) => formatMoney(v, "") },
          { header: "+90 يوم", key: "over90", align: "left", format: (v: any) => formatMoney(v, "") },
          { header: "الإجمالي", key: "total", align: "left", format: (v: any) => formatMoney(v, company.currency) },
        ],
        rows: suppAging,
        summaryRow: {
          name: "الإجمالي الكلي",
          current: formatMoney(suppAging.reduce((a, b) => a + b.current, 0), ""),
          d31_60: formatMoney(suppAging.reduce((a, b) => a + b.d31_60, 0), ""),
          d61_90: formatMoney(suppAging.reduce((a, b) => a + b.d61_90, 0), ""),
          over90: formatMoney(suppAging.reduce((a, b) => a + b.over90, 0), ""),
          total: formatMoney(totalSupp, company.currency),
        },
      };
    } else if (selectedReport === "vehicles") {
      const totalRev = vehicles.reduce((a, b) => a + b.totalRevenue, 0);
      const totalProfit = vehicles.reduce((a, b) => a + b.netProfit, 0);
      reportModel = {
        title: "تقرير كفاءة وربحية أسطول الشاحنات والمركبات",
        columns: [
          { header: "الكود واللوحة", key: "plateNumber" },
          { header: "نوع المركبة", key: "vehicleType" },
          { header: "السائق", key: "driverName" },
          { header: "عدد الرحلات", key: "tripsCount", align: "center" },
          { header: "الإيراد", key: "totalRevenue", align: "left", format: (v: any) => formatMoney(v, "") },
          { header: "التكاليف", key: "totalExpenses", align: "left", format: (v: any) => formatMoney(v, "") },
          { header: "صافي الربح", key: "netProfit", align: "left", format: (v: any) => formatMoney(v, company.currency) },
          { header: "هامش الربح", key: "profitMargin", align: "center", format: (v: any) => `${v}%` },
        ],
        rows: vehicles,
        summaryRow: {
          plateNumber: "الإجمالي",
          vehicleType: "",
          driverName: "",
          tripsCount: String(vehicles.reduce((a, b) => a + b.tripsCount, 0)),
          totalRevenue: formatMoney(totalRev, ""),
          totalExpenses: formatMoney(vehicles.reduce((a, b) => a + b.totalExpenses, 0), ""),
          netProfit: formatMoney(totalProfit, company.currency),
          profitMargin: totalRev > 0 ? `${((totalProfit / totalRev) * 100).toFixed(1)}%` : "0%",
        },
      };
    } else if (selectedReport === "trips") {
      const totalTripsPrice = tripsLog.reduce((a, b) => a + b.price, 0);
      reportModel = {
        title: "سجل حركة النقلات والرحلات المنفذة",
        subtitle: `إجمالي الرحلات: ${tripsLog.length} نقلة`,
        columns: [
          { header: "التاريخ", key: "date", align: "center" },
          { header: "الفاتورة", key: "invNumber", align: "center", format: (v: any) => `#${v}` },
          { header: "العميل", key: "customerName" },
          { header: "خط السير", key: "route" },
          { header: "الشاحنة والسائق", key: "vehicle", format: (v: any, r: any) => `${v} (${r.driver})` },
          { header: "الحاويات", key: "containers" },
          { header: "المبلغ", key: "price", align: "left", format: (v: any) => formatMoney(v, company.currency) },
        ],
        rows: tripsLog,
        summaryRow: {
          date: "الإجمالي",
          invNumber: "",
          customerName: "",
          route: "",
          vehicle: "",
          containers: `${tripsLog.length} نقلة`,
          price: formatMoney(totalTripsPrice, company.currency),
        },
      };
    }

    if (reportModel) {
      const html = renderMasterReportHtml(reportModel, company);
      setPrintHtml(html);
      setPrintModalOpen(true);
    }
  };

  const reportsList: { id: ReportType; label: string; icon: any; desc: string }[] = [
    { id: "pnl", label: "الأرباح والخسائر (P&L)", icon: TrendingUp, desc: "بيان الدخل والإيرادات والتكاليف المباشرة والتشغيلية" },
    { id: "customers_aging", label: "أعمار ديون العملاء", icon: Users, desc: "تحليل المستحقات والديون على شرائح عمرية (0-30، 60، 90+)" },
    { id: "suppliers_aging", label: "أعمار ديون الموردين", icon: Building2, desc: "تحليل التزامات الموردين ومواعيد السداد" },
    { id: "vehicles", label: "ربحية أسطول الشاحنات", icon: Truck, desc: "معدلات أداء كل شاحنة، استهلاك الوقود، والصيانة" },
    { id: "trips", label: "سجل حركة النقلات", icon: FileText, desc: "سجل مفصل بكل النقلات والحاويات المنقولة" },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-purple-600" />
            <span>التقارير المحاسبية والقوائم المالية</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            استخراج القوائم المالية، أعمار الديون، أداء الأسطول، وتحليل الإيرادات والمصروفات
          </p>
        </div>

        <button
          onClick={handlePrintCurrentReport}
          className="btn btn-primary bg-purple-600 hover:bg-purple-700 text-xs md:text-sm font-bold flex items-center gap-1.5 shadow-md"
        >
          <Printer className="w-4 h-4" />
          <span>طباعة وتصدير التقرير الحالي</span>
        </button>
      </div>

      {/* Reports Selection Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {reportsList.map((rep) => {
          const Icon = rep.icon;
          const isSelected = selectedReport === rep.id;
          return (
            <button
              key={rep.id}
              onClick={() => setSelectedReport(rep.id)}
              className={`p-3.5 rounded-xl border text-right transition flex flex-col justify-between gap-2 ${
                isSelected
                  ? "bg-purple-50 dark:bg-purple-950/40 border-purple-500 ring-2 ring-purple-500/20 text-purple-700 dark:text-purple-300 shadow-sm"
                  : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs">{rep.label}</span>
                <Icon className="w-4 h-4 text-purple-500" />
              </div>
              <p className="text-[10px] text-slate-400 line-clamp-2 leading-tight">
                {rep.desc}
              </p>
            </button>
          );
        })}
      </div>

      {/* Filters Bar */}
      <div className="app-card p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            فترة التقرير:
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">من:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="form-input text-xs py-1"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">إلى:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="form-input text-xs py-1"
            />
          </div>
        </div>

        {(fromDate || toDate) && (
          <button
            onClick={() => {
              setFromDate("");
              setToDate("");
            }}
            className="text-xs text-blue-600 hover:underline"
          >
            إعادة تعيين الفترة
          </button>
        )}
      </div>

      {/* Dynamic Report View Panel */}
      <div className="app-card p-5">
        {/* P&L View */}
        {selectedReport === "pnl" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
                <div className="text-xs text-blue-700 dark:text-blue-300 font-bold">إجمالي الإيرادات</div>
                <div className="text-xl font-black text-blue-700 dark:text-blue-300 mt-1">
                  {formatMoney(pnl.revenue.totalGrossRevenue, company.currency)}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                <div className="text-xs text-emerald-700 dark:text-emerald-300 font-bold">مجمل الربح (بعد مصروفات الرحلات)</div>
                <div className="text-xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
                  {formatMoney(pnl.grossProfit, company.currency)}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800">
                <div className="text-xs text-purple-700 dark:text-purple-300 font-bold">صافي الربح التشغيلي النهائي</div>
                <div className="text-xl font-black text-purple-700 dark:text-purple-300 mt-1">
                  {formatMoney(pnl.netOperatingProfit, company.currency)}
                </div>
              </div>
            </div>

            {/* Income Statement Table */}
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                تفاصيل بنود قائمة الدخل
              </h4>

              <table className="w-full text-xs text-right border-collapse">
                <tbody>
                  <tr className="bg-slate-100 dark:bg-slate-800 font-bold">
                    <td colSpan={2} className="p-2.5 text-blue-600">1. الإيرادات التشغيلية</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 pr-6">إيرادات النقلات وعمليات الشحن</td>
                    <td className="p-2.5 font-bold text-left">{formatMoney(pnl.revenue.tripsRevenue, company.currency)}</td>
                  </tr>
                  {pnl.revenue.customerExpensesReimbursed > 0 && (
                    <tr>
                      <td className="p-2.5 pr-6">مصروفات مستردة ومفوترة على العملاء</td>
                      <td className="p-2.5 font-bold text-left">{formatMoney(pnl.revenue.customerExpensesReimbursed, company.currency)}</td>
                    </tr>
                  )}
                  {pnl.revenue.otherRevenues > 0 && (
                    <tr>
                      <td className="p-2.5 pr-6">إيرادات ومقبوضات أخرى</td>
                      <td className="p-2.5 font-bold text-left">{formatMoney(pnl.revenue.otherRevenues, company.currency)}</td>
                    </tr>
                  )}

                  <tr className="bg-slate-100 dark:bg-slate-800 font-bold">
                    <td colSpan={2} className="p-2.5 text-rose-600">2. التكاليف المباشرة للرحلات</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 pr-6">ديزل ووقود الشاحنات للرحلات</td>
                    <td className="p-2.5 font-bold text-left text-rose-600">-{formatMoney(pnl.directExpenses.tripFuel, company.currency)}</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 pr-6">كارتات ورسوم موازين وموانئ</td>
                    <td className="p-2.5 font-bold text-left text-rose-600">-{formatMoney(pnl.directExpenses.tripTolls, company.currency)}</td>
                  </tr>

                  <tr className="bg-slate-100 dark:bg-slate-800 font-bold">
                    <td colSpan={2} className="p-2.5 text-amber-600">3. المصروفات التشغيلية والإدارية</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 pr-6">الرواتب والأجور وبدلات السائقين</td>
                    <td className="p-2.5 font-bold text-left text-rose-600">-{formatMoney(pnl.operatingExpenses.payrollGross, company.currency)}</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 pr-6">صيانة وقطع غيار وإطارات الأسطول</td>
                    <td className="p-2.5 font-bold text-left text-rose-600">-{formatMoney(pnl.operatingExpenses.vehicleMaintenance, company.currency)}</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 pr-6">فواتير مشتريات ومصروفات عامة</td>
                    <td className="p-2.5 font-bold text-left text-rose-600">-{formatMoney(pnl.operatingExpenses.purchasesExpenses, company.currency)}</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 pr-6">مصروفات عمومية وإدارية</td>
                    <td className="p-2.5 font-bold text-left text-rose-600">-{formatMoney(pnl.operatingExpenses.generalAdminExpenses, company.currency)}</td>
                  </tr>

                  <tr className="bg-slate-900 text-white font-extrabold text-sm">
                    <td className="p-3">صافي الربح التشغيلي (Net Operating Income)</td>
                    <td className="p-3 text-left text-emerald-400 font-black">
                      {formatMoney(pnl.netOperatingProfit, company.currency)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Customer Aging View */}
        {selectedReport === "customers_aging" && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead className="bg-slate-100 dark:bg-slate-800 font-bold">
                <tr>
                  <th className="p-3">اسم العميل</th>
                  <th className="p-3">0-30 يوم</th>
                  <th className="p-3">31-60 يوم</th>
                  <th className="p-3">61-90 يوم</th>
                  <th className="p-3">أكثر من 90 يوم</th>
                  <th className="p-3">إجمالي المديونية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {custAging.map((c) => (
                  <tr key={c.id}>
                    <td className="p-3 font-bold">{c.name}</td>
                    <td className="p-3">{formatMoney(c.current, "")}</td>
                    <td className="p-3">{formatMoney(c.d31_60, "")}</td>
                    <td className="p-3">{formatMoney(c.d61_90, "")}</td>
                    <td className="p-3 text-rose-600 font-bold">{formatMoney(c.over90, "")}</td>
                    <td className="p-3 font-black text-blue-600">{formatMoney(c.total, company.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Supplier Aging View */}
        {selectedReport === "suppliers_aging" && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead className="bg-slate-100 dark:bg-slate-800 font-bold">
                <tr>
                  <th className="p-3">اسم المورد</th>
                  <th className="p-3">0-30 يوم</th>
                  <th className="p-3">31-60 يوم</th>
                  <th className="p-3">61-90 يوم</th>
                  <th className="p-3">+90 يوم</th>
                  <th className="p-3">إجمالي المستحق له</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {suppAging.map((s) => (
                  <tr key={s.id}>
                    <td className="p-3 font-bold">{s.name}</td>
                    <td className="p-3">{formatMoney(s.current, "")}</td>
                    <td className="p-3">{formatMoney(s.d31_60, "")}</td>
                    <td className="p-3">{formatMoney(s.d61_90, "")}</td>
                    <td className="p-3">{formatMoney(s.over90, "")}</td>
                    <td className="p-3 font-black text-amber-600">{formatMoney(s.total, company.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Vehicles View */}
        {selectedReport === "vehicles" && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead className="bg-slate-100 dark:bg-slate-800 font-bold">
                <tr>
                  <th className="p-3">رقم اللوحة</th>
                  <th className="p-3">النوع</th>
                  <th className="p-3">السائق</th>
                  <th className="p-3 text-center">النقلات</th>
                  <th className="p-3">الإيرادات</th>
                  <th className="p-3">التكاليف</th>
                  <th className="p-3">صافي الربح</th>
                  <th className="p-3 text-center">هامش الربح</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {vehicles.map((v) => (
                  <tr key={v.vehicleId}>
                    <td className="p-3 font-bold">{v.plateNumber}</td>
                    <td className="p-3 text-slate-500">{v.vehicleType}</td>
                    <td className="p-3">{v.driverName}</td>
                    <td className="p-3 text-center">{v.tripsCount}</td>
                    <td className="p-3 font-bold text-blue-600">{formatMoney(v.totalRevenue, "")}</td>
                    <td className="p-3 text-rose-600">{formatMoney(v.totalExpenses, "")}</td>
                    <td className="p-3 font-black text-emerald-600">{formatMoney(v.netProfit, company.currency)}</td>
                    <td className="p-3 text-center">{v.profitMargin}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Trips View */}
        {selectedReport === "trips" && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead className="bg-slate-100 dark:bg-slate-800 font-bold">
                <tr>
                  <th className="p-3">التاريخ</th>
                  <th className="p-3">الفاتورة</th>
                  <th className="p-3">العميل</th>
                  <th className="p-3">خط السير</th>
                  <th className="p-3">الشاحنة والسائق</th>
                  <th className="p-3">الحاويات</th>
                  <th className="p-3">سعر النقلة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {tripsLog.map((t, idx) => (
                  <tr key={idx}>
                    <td className="p-3">{t.date}</td>
                    <td className="p-3 font-bold text-blue-600">#{t.invNumber}</td>
                    <td className="p-3 font-semibold">{t.customerName}</td>
                    <td className="p-3">{t.route}</td>
                    <td className="p-3">{t.vehicle} ({t.driver})</td>
                    <td className="p-3 font-mono">{t.containers}</td>
                    <td className="p-3 font-bold text-emerald-600">{formatMoney(t.price, company.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Print Preview Modal */}
      <PrintPreviewModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        title="معاينة وطباعة التقرير المالي"
        htmlContent={printHtml}
        showTemplatePicker={false}
      />
    </div>
  );
};
