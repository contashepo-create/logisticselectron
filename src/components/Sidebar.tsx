import React from "react";
import {
  LayoutDashboard,
  FileText,
  ArrowDownLeft,
  ArrowUpRight,
  Users,
  Building2,
  Truck,
  UserCheck,
  Wallet,
  PieChart,
  Bot,
  MessageSquare,
  Info,
  Settings,
  Calendar,
} from "lucide-react";

export type ActiveTab =
  | "dashboard"
  | "invoices"
  | "receipts"
  | "payments"
  | "customers"
  | "suppliers"
  | "vehicles"
  | "employees"
  | "treasury"
  | "reports"
  | "telegram"
  | "support"
  | "about"
  | "settings";

interface Props {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  supportUnreadCount?: number;
}

export const Sidebar: React.FC<Props> = ({
  activeTab,
  onSelectTab,
  supportUnreadCount = 0,
}) => {
  const menuItems: { id: ActiveTab; label: string; icon: React.FC<{ className?: string }>; badge?: number }[] = [
    { id: "dashboard", label: "لوحة التحكم الرئيسية", icon: LayoutDashboard },
    { id: "invoices", label: "فواتير النقل والرحلات", icon: FileText },
    { id: "receipts", label: "سندات القبض (تحصيل)", icon: ArrowDownLeft },
    { id: "payments", label: "سندات الصرف (مصروفات)", icon: ArrowUpRight },
    { id: "customers", label: "العملاء وكشوف الحساب", icon: Users },
    { id: "suppliers", label: "الموردون وفواتير الشراء", icon: Building2 },
    { id: "vehicles", label: "الشاحنات وأداء الأسطول", icon: Truck },
    { id: "employees", label: "الموظفون والرواتب والسلف", icon: UserCheck },
    { id: "treasury", label: "الخزائن والحسابات البنكية", icon: Wallet },
    { id: "reports", label: "التقارير المالية والأرباح", icon: PieChart },
  ];

  const secondaryItems: { id: ActiveTab; label: string; icon: React.FC<{ className?: string }>; badge?: number }[] = [
    { id: "telegram", label: "بوت تليجرام والمشتركين", icon: Bot },
    { id: "support", label: "الدعم الفني والمراسلة", icon: MessageSquare, badge: supportUnreadCount },
    { id: "about", label: "حول التطبيق والمطور", icon: Info },
    { id: "settings", label: "الإعدادات والسنوات المالية", icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-screen border-l border-slate-800 select-none">
      {/* App Branding Brand Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
          🚚
        </div>
        <div>
          <div className="font-bold text-sm text-white leading-snug">نظام النقل المحاسبي</div>
          <div className="text-[11px] text-blue-400 font-medium">Desktop Pro v2.4 (Win 7+)</div>
        </div>
      </div>

      {/* Main Navigation Links */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 pt-2 pb-1">
          العمليات والمحاسبة
        </div>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs md:text-sm font-medium transition-all ${
                isActive
                  ? "bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/30"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && item.badge > 0 ? (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}

        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 pt-4 pb-1">
          الخدمات السحابية والإدارة
        </div>

        {secondaryItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs md:text-sm font-medium transition-all ${
                isActive
                  ? "bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && item.badge > 0 ? (
                <span className="bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Footer Info Box */}
      <div className="p-3 border-t border-slate-800/80 text-[11px] text-slate-400 bg-slate-950/40">
        <div className="flex justify-between items-center text-slate-400">
          <span>المطور: محمد عبده</span>
          <span className="text-emerald-400 font-semibold">أوفلاين 100%</span>
        </div>
      </div>
    </aside>
  );
};
