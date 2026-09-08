import React, { useState } from "react";
import {
  LayoutDashboard,
  FileText,
  ArrowDownLeft,
  ArrowUpRight,
  Users,
  Building2,
  Truck,
  UserCheck,
  DollarSign,
  AlertCircle,
  CreditCard,
  Wallet,
  PieChart,
  Info,
  Settings,
  Calendar,
  ChevronDown,
  BookOpenCheck,
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
  | "advances"
  | "deductions"
  | "payroll"
  | "treasury"
  | "reports"
  | "financial-years"
  | "about"
  | "settings";

interface LeafItem {
  id: ActiveTab;
  label: string;
  icon: React.FC<{ className?: string }>;
  badge?: number;
}

interface GroupItem {
  groupId: string;
  label: string;
  icon: React.FC<{ className?: string }>;
  children: LeafItem[];
}

type NavEntry = LeafItem | GroupItem;

function isGroup(entry: NavEntry): entry is GroupItem {
  return (entry as GroupItem).children !== undefined;
}

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
  const navTree: NavEntry[] = [
    { id: "dashboard", label: "لوحة التحكم الرئيسية", icon: LayoutDashboard },
    {
      groupId: "accounting",
      label: "الحسابات",
      icon: BookOpenCheck,
      children: [
        { id: "invoices", label: "الفواتير", icon: FileText },
        { id: "receipts", label: "سندات القبض", icon: ArrowDownLeft },
        { id: "payments", label: "سندات الصرف", icon: ArrowUpRight },
      ],
    },
    {
      groupId: "parties",
      label: "العملاء والموردون",
      icon: Users,
      children: [
        { id: "customers", label: "العملاء", icon: Users },
        { id: "suppliers", label: "الموردون", icon: Building2 },
      ],
    },
    {
      groupId: "fleet",
      label: "الأسطول",
      icon: Truck,
      children: [{ id: "vehicles", label: "الشاحنات", icon: Truck }],
    },
    {
      groupId: "hr",
      label: "الموظفون والرواتب والسلف",
      icon: UserCheck,
      children: [
        { id: "employees", label: "دليل الموظفين والسائقين", icon: UserCheck },
        { id: "advances", label: "السلف", icon: DollarSign },
        { id: "deductions", label: "الخصومات والمخالفات", icon: AlertCircle },
        { id: "payroll", label: "الرواتب", icon: CreditCard },
      ],
    },
    { id: "treasury", label: "الخزينة والبنوك", icon: Wallet },
    { id: "reports", label: "التقارير", icon: PieChart },
    { id: "financial-years", label: "السنوات المالية", icon: Calendar },
    { id: "settings", label: "الإعدادات", icon: Settings },
    { id: "about", label: "حول التطبيق والدعم الفني", icon: Info },
  ];

  const findActiveGroup = (): string | null => {
    for (const entry of navTree) {
      if (isGroup(entry) && entry.children.some((c) => c.id === activeTab)) {
        return entry.groupId;
      }
    }
    return null;
  };

  const [openGroup, setOpenGroup] = useState<string | null>(findActiveGroup());

  const handleToggleGroup = (groupId: string) => {
    setOpenGroup((prev) => (prev === groupId ? null : groupId));
  };

  const handleSelectLeaf = (id: ActiveTab, parentGroupId?: string) => {
    onSelectTab(id);
    if (parentGroupId) setOpenGroup(parentGroupId);
  };

  const renderLeafButton = (item: LeafItem, indent: boolean, accentClass?: string) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;
    return (
      <button
        key={item.id}
        onClick={() => handleSelectLeaf(item.id)}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs md:text-sm font-medium transition-all ${
          indent ? "ps-8" : ""
        } ${
          isActive
            ? `${accentClass || "bg-blue-600"} text-white font-semibold shadow-md`
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
  };

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-screen border-l border-slate-800 select-none">
      {/* App Branding Brand Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
          🚚
        </div>
        <div>
          <div className="font-bold text-sm text-white leading-snug">نظام النقل المحاسبي</div>
          <div className="text-[11px] text-blue-400 font-medium">Desktop Pro (Win 7+)</div>
        </div>
      </div>

      {/* Main Navigation Tree */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1">
        {navTree.map((entry) => {
          if (!isGroup(entry)) {
            return renderLeafButton(entry, false);
          }

          const GroupIcon = entry.icon;
          const isGroupOpen = openGroup === entry.groupId;
          const isChildActive = entry.children.some((c) => c.id === activeTab);

          return (
            <div key={entry.groupId} className="space-y-1">
              <button
                onClick={() => handleToggleGroup(entry.groupId)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs md:text-sm font-bold transition-all ${
                  isChildActive && !isGroupOpen
                    ? "text-blue-400 bg-slate-800/40"
                    : "text-slate-300 hover:text-slate-100 hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <GroupIcon className="w-4 h-4" />
                  <span>{entry.label}</span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    isGroupOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isGroupOpen && (
                <div className="space-y-1 py-0.5 border-r-2 border-slate-800 mr-3.5 pr-1">
                  {entry.children.map((child) => renderLeafButton(child, true))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Info Box */}
      <div className="p-3 border-t border-slate-800/80 text-[11px] text-slate-400 bg-slate-950/40">
        <div className="flex justify-between items-center text-slate-400">
          <span>يعمل أوفلاين بالكامل</span>
          <span className="text-emerald-400 font-semibold">100%</span>
        </div>
      </div>
    </aside>
  );
};
