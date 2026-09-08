import React, { useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  Users,
  Building2,
  Truck,
  FileText,
  ArrowDownLeft,
  ArrowUpRight,
  PlusCircle,
  Clock,
  ShieldCheck,
  ChevronLeft,
} from "lucide-react";
import type { Company, LicenseInfo } from "@/types";
import { getDashboardOverview } from "@/lib/calc";
import { formatMoney } from "@/lib/format";
import type { ActiveTab } from "@/components/Sidebar";

interface Props {
  company: Company;
  license: LicenseInfo;
  onNavigate: (tab: ActiveTab) => void;
  onNewInvoice: () => void;
  onNewReceipt: () => void;
  onNewPayment: () => void;
}

export const DashboardView: React.FC<Props> = ({
  company,
  license,
  onNavigate,
  onNewInvoice,
  onNewReceipt,
  onNewPayment,
}) => {
  const dash = useMemo(() => getDashboardOverview(), []);

  const maxChartValue = useMemo(() => {
    let max = 1000;
    for (const m of dash.monthlyChart) {
      if (m.revenue > max) max = m.revenue;
      if (m.expenses > max) max = m.expenses;
    }
    return max * 1.15;
  }, [dash.monthlyChart]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & Welcome */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-200">
              <span>لوحة التحكم والمؤشرات المالية</span>
              <span>•</span>
              <span>السنة المالية 2026</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold mt-1">
              مرحباً بك في {company.name}
            </h2>
            <p className="text-xs md:text-sm text-blue-100 mt-1 max-w-2xl leading-relaxed">
              متابعة دقيقة للأرباح التشغيلية، حركة النقل والرحلات، مستحقات العملاء، وأرصدة السيولة النقدية لحظة بلحظة.
            </p>
          </div>

          {/* Quick Actions in Header */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={onNewInvoice}
              className="bg-white text-blue-700 hover:bg-blue-50 font-bold px-3.5 py-2 rounded-xl text-xs md:text-sm flex items-center gap-1.5 shadow-md transition transform active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>فاتورة نقل جديدة</span>
            </button>
            <button
              onClick={onNewReceipt}
              className="bg-emerald-500 text-white hover:bg-emerald-600 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition"
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>سند قبض</span>
            </button>
            <button
              onClick={onNewPayment}
              className="bg-rose-500 text-white hover:bg-rose-600 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>سند صرف</span>
            </button>
          </div>
        </div>

        {/* Subtle background decoration */}
        <div className="absolute -left-10 -bottom-10 w-48 h-48 rounded-full bg-white/5 pointer-events-none blur-2xl"></div>
      </div>

      {/* Primary KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="app-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">إجمالي الإيرادات</span>
            <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-800 dark:text-slate-100">
              {formatMoney(dash.totalRevenue, company.currency)}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
              <span>من فواتير النقل وعمليات الشحن</span>
            </div>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="app-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">إجمالي المصروفات</span>
            <div className="p-2 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-800 dark:text-slate-100">
              {formatMoney(dash.totalExpenses, company.currency)}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              <span>وقود + صيانة + رواتب + إدارية</span>
            </div>
          </div>
        </div>

        {/* Net Profit */}
        <div className="app-card p-4 flex flex-col justify-between border-blue-500/30 dark:border-blue-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">صافي الأرباح التشغيلية</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div
              className={`text-2xl font-black ${
                dash.netProfit >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {formatMoney(dash.netProfit, company.currency)}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              <span>صافي العائد بعد خصم التكاليف</span>
            </div>
          </div>
        </div>

        {/* Cash & Bank Balances */}
        <div className="app-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">السيولة النقدية المتاحة</span>
            <div className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-800 dark:text-slate-100">
              {formatMoney(dash.totalLiquidCash, company.currency)}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex justify-between">
              <span>خزائن: {formatMoney(dash.totalCash, "")}</span>
              <span>بنوك: {formatMoney(dash.totalBank, "")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Receivables */}
        <div
          onClick={() => onNavigate("customers")}
          className="app-card p-3.5 hover:border-blue-400 cursor-pointer transition flex items-center gap-3"
        >
          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">مديونيات العملاء</div>
            <div className="text-sm md:text-base font-extrabold text-slate-800 dark:text-slate-100 mt-0.5">
              {formatMoney(dash.totalReceivables, company.currency)}
            </div>
          </div>
        </div>

        {/* Payables */}
        <div
          onClick={() => onNavigate("suppliers")}
          className="app-card p-3.5 hover:border-amber-400 cursor-pointer transition flex items-center gap-3"
        >
          <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">مستحقات الموردين</div>
            <div className="text-sm md:text-base font-extrabold text-slate-800 dark:text-slate-100 mt-0.5">
              {formatMoney(dash.totalPayables, company.currency)}
            </div>
          </div>
        </div>

        {/* Trips Count */}
        <div
          onClick={() => onNavigate("invoices")}
          className="app-card p-3.5 hover:border-indigo-400 cursor-pointer transition flex items-center gap-3"
        >
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">عدد النقلات المنفذة</div>
            <div className="text-sm md:text-base font-extrabold text-slate-800 dark:text-slate-100 mt-0.5">
              {dash.tripsCount} نقلة
            </div>
          </div>
        </div>

        {/* Active Fleet */}
        <div
          onClick={() => onNavigate("vehicles")}
          className="app-card p-3.5 hover:border-emerald-400 cursor-pointer transition flex items-center gap-3"
        >
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">أسطول الشاحنات</div>
            <div className="text-sm md:text-base font-extrabold text-slate-800 dark:text-slate-100 mt-0.5">
              {dash.activeVehiclesCount} مركبة
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive Visual Analytics & Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Financial Flow Bar Chart (2 columns) */}
        <div className="app-card p-5 lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
                مقارنة الإيرادات والمصروفات الشهرية
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                تحليل حركة التدفق النقدي للأشهر الستة الحالية
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-blue-600"></span>
                <span>الإيرادات</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-rose-500"></span>
                <span>المصروفات</span>
              </span>
            </div>
          </div>

          {/* SVG Bar Chart Visualization */}
          <div className="pt-6 pb-2">
            <div className="h-56 flex items-end justify-between gap-3 px-2">
              {dash.monthlyChart.map((m, idx) => {
                const revHeight = Math.max(8, (m.revenue / maxChartValue) * 100);
                const expHeight = Math.max(8, (m.expenses / maxChartValue) * 100);

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                    <div className="w-full flex items-end justify-center gap-1.5 h-44">
                      {/* Revenue Bar */}
                      <div
                        style={{ height: `${revHeight}%` }}
                        className="w-5 md:w-8 bg-gradient-to-t from-blue-700 to-blue-500 rounded-t-md transition-all duration-300 relative group cursor-pointer hover:opacity-90"
                      >
                        <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold py-1 px-1.5 rounded pointer-events-none whitespace-nowrap z-20 shadow">
                          إيراد: {formatMoney(m.revenue, "")}
                        </div>
                      </div>

                      {/* Expenses Bar */}
                      <div
                        style={{ height: `${expHeight}%` }}
                        className="w-5 md:w-8 bg-gradient-to-t from-rose-700 to-rose-500 rounded-t-md transition-all duration-300 relative group cursor-pointer hover:opacity-90"
                      >
                        <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold py-1 px-1.5 rounded pointer-events-none whitespace-nowrap z-20 shadow">
                          مصروف: {formatMoney(m.expenses, "")}
                        </div>
                      </div>
                    </div>

                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                      {m.month}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500">
            <span>معدل الربحية الشهري: <b>{dash.totalRevenue > 0 ? ((dash.netProfit / dash.totalRevenue) * 100).toFixed(1) : 0}%</b></span>
            <button
              onClick={() => onNavigate("reports")}
              className="text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1"
            >
              <span>عرض تقرير الأرباح والخسائر الكامل</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Top Customers Widget */}
        <div className="app-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm md:text-base text-slate-800 dark:text-slate-100">
                أعلى العملاء إيراداً
              </h3>
              <button
                onClick={() => onNavigate("customers")}
                className="text-xs text-blue-600 hover:underline"
              >
                الكل
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {dash.topCustomers.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">لا توجد بيانات فواتير بعد</div>
              ) : (
                dash.topCustomers.map((cust, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/60 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-800 dark:text-slate-200">
                          {cust.name}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          {cust.tripsCount} رحلات منفذة
                        </div>
                      </div>
                    </div>

                    <div className="font-black text-xs text-blue-600 dark:text-blue-400">
                      {formatMoney(cust.revenue, company.currency)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 text-center">
            تحديث فوري بناءً على الفواتير المعتمدة
          </div>
        </div>
      </div>

      {/* Recent Activities Stream */}
      <div className="app-card p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
              آخر العمليات والحركات المحاسبية
            </h3>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {dash.recentActivities.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400">لا توجد حركات مسجلة حتى الآن</div>
          ) : (
            dash.recentActivities.map((act) => (
              <div key={act.id} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      act.color === "blue"
                        ? "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
                        : act.color === "emerald"
                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
                        : "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400"
                    }`}
                  >
                    {act.type === "invoice" ? (
                      <FileText className="w-4 h-4" />
                    ) : act.type === "receipt" ? (
                      <ArrowDownLeft className="w-4 h-4" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-200">
                      {act.title}
                    </div>
                    <div className="text-[11px] text-slate-400">{act.date}</div>
                  </div>
                </div>

                <div
                  className={`font-bold text-xs md:text-sm ${
                    act.type === "receipt"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : act.type === "payment"
                      ? "text-rose-600 dark:text-rose-400"
                      : "text-blue-600 dark:text-blue-400"
                  }`}
                >
                  {act.type === "payment" ? "-" : "+"}
                  {formatMoney(act.amount, company.currency)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
