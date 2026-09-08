import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  Search,
  PanelRightClose,
  PanelRightOpen,
  X,
  Sparkles,
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

/** لوحة ألوان لكل عنصر — تُستخدم لتلوين الأيقونة والتوهج عند التفعيل */
type Accent =
  | "blue"
  | "indigo"
  | "emerald"
  | "amber"
  | "rose"
  | "violet"
  | "cyan"
  | "teal"
  | "slate";

interface LeafItem {
  id: ActiveTab;
  label: string;
  icon: React.FC<{ className?: string }>;
  accent: Accent;
  badge?: number;
  keywords?: string;
}

interface GroupItem {
  groupId: string;
  label: string;
  icon: React.FC<{ className?: string }>;
  accent: Accent;
  children: LeafItem[];
}

type NavEntry = LeafItem | GroupItem;

interface NavSection {
  id: string;
  title: string;
  entries: NavEntry[];
}

function isGroup(entry: NavEntry): entry is GroupItem {
  return (entry as GroupItem).children !== undefined;
}

/* ------------------------------------------------------------------ */
/*  خرائط الألوان (مكتوبة كاملة حتى لا يحذفها Tailwind أثناء البناء)   */
/* ------------------------------------------------------------------ */

const ACCENT_ICON: Record<Accent, string> = {
  blue: "text-blue-600 dark:text-blue-400",
  indigo: "text-indigo-600 dark:text-indigo-400",
  emerald: "text-emerald-600 dark:text-emerald-400",
  amber: "text-amber-600 dark:text-amber-400",
  rose: "text-rose-600 dark:text-rose-400",
  violet: "text-violet-600 dark:text-violet-400",
  cyan: "text-cyan-600 dark:text-cyan-400",
  teal: "text-teal-600 dark:text-teal-400",
  slate: "text-slate-500 dark:text-slate-400",
};

const ACCENT_SOFT_BG: Record<Accent, string> = {
  blue: "bg-blue-500/10 dark:bg-blue-400/10",
  indigo: "bg-indigo-500/10 dark:bg-indigo-400/10",
  emerald: "bg-emerald-500/10 dark:bg-emerald-400/10",
  amber: "bg-amber-500/10 dark:bg-amber-400/10",
  rose: "bg-rose-500/10 dark:bg-rose-400/10",
  violet: "bg-violet-500/10 dark:bg-violet-400/10",
  cyan: "bg-cyan-500/10 dark:bg-cyan-400/10",
  teal: "bg-teal-500/10 dark:bg-teal-400/10",
  slate: "bg-slate-500/10 dark:bg-slate-400/10",
};

const ACCENT_GRADIENT: Record<Accent, string> = {
  blue: "from-blue-600 to-blue-500 dark:from-blue-600 dark:to-blue-500",
  indigo: "from-indigo-600 to-indigo-500 dark:from-indigo-600 dark:to-indigo-500",
  emerald: "from-emerald-600 to-emerald-500 dark:from-emerald-600 dark:to-emerald-500",
  amber: "from-amber-500 to-amber-400 dark:from-amber-600 dark:to-amber-500",
  rose: "from-rose-600 to-rose-500 dark:from-rose-600 dark:to-rose-500",
  violet: "from-violet-600 to-violet-500 dark:from-violet-600 dark:to-violet-500",
  cyan: "from-cyan-600 to-cyan-500 dark:from-cyan-600 dark:to-cyan-500",
  teal: "from-teal-600 to-teal-500 dark:from-teal-600 dark:to-teal-500",
  slate: "from-slate-600 to-slate-500 dark:from-slate-600 dark:to-slate-500",
};

const ACCENT_GLOW: Record<Accent, string> = {
  blue: "shadow-blue-500/35 dark:shadow-blue-500/25",
  indigo: "shadow-indigo-500/35 dark:shadow-indigo-500/25",
  emerald: "shadow-emerald-500/35 dark:shadow-emerald-500/25",
  amber: "shadow-amber-500/35 dark:shadow-amber-500/25",
  rose: "shadow-rose-500/35 dark:shadow-rose-500/25",
  violet: "shadow-violet-500/35 dark:shadow-violet-500/25",
  cyan: "shadow-cyan-500/35 dark:shadow-cyan-500/25",
  teal: "shadow-teal-500/35 dark:shadow-teal-500/25",
  slate: "shadow-slate-500/35 dark:shadow-slate-500/25",
};

const ACCENT_BAR: Record<Accent, string> = {
  blue: "bg-blue-500",
  indigo: "bg-indigo-500",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  violet: "bg-violet-500",
  cyan: "bg-cyan-500",
  teal: "bg-teal-500",
  slate: "bg-slate-500",
};

/* ------------------------------------------------------------------ */

interface Props {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  supportUnreadCount?: number;
}

const COLLAPSE_KEY = "logistics_sidebar_collapsed";

export const Sidebar: React.FC<Props> = ({
  activeTab,
  onSelectTab,
  supportUnreadCount = 0,
}) => {
  /* ----------------------------- بنية القائمة ----------------------------- */
  const sections: NavSection[] = useMemo(
    () => [
      {
        id: "overview",
        title: "نظرة عامة",
        entries: [
          {
            id: "dashboard",
            label: "لوحة التحكم",
            icon: LayoutDashboard,
            accent: "blue",
            keywords: "الرئيسية الرئيسيه المؤشرات",
          },
        ],
      },
      {
        id: "finance",
        title: "العمليات المالية",
        entries: [
          {
            groupId: "accounting",
            label: "الحسابات",
            icon: BookOpenCheck,
            accent: "indigo",
            children: [
              { id: "invoices", label: "الفواتير", icon: FileText, accent: "indigo" },
              { id: "receipts", label: "سندات القبض", icon: ArrowDownLeft, accent: "emerald" },
              { id: "payments", label: "سندات الصرف", icon: ArrowUpRight, accent: "rose" },
            ],
          },
          {
            id: "treasury",
            label: "الخزينة والبنوك",
            icon: Wallet,
            accent: "emerald",
            keywords: "النقدية الصندوق",
          },
        ],
      },
      {
        id: "records",
        title: "السجلات والملفات",
        entries: [
          {
            groupId: "parties",
            label: "العملاء والموردون",
            icon: Users,
            accent: "cyan",
            children: [
              { id: "customers", label: "العملاء", icon: Users, accent: "cyan" },
              { id: "suppliers", label: "الموردون", icon: Building2, accent: "teal" },
            ],
          },
          {
            groupId: "fleet",
            label: "الأسطول",
            icon: Truck,
            accent: "amber",
            children: [
              { id: "vehicles", label: "الشاحنات", icon: Truck, accent: "amber" },
            ],
          },
          {
            groupId: "hr",
            label: "الموارد البشرية",
            icon: UserCheck,
            accent: "violet",
            children: [
              { id: "employees", label: "الموظفون والسائقون", icon: UserCheck, accent: "violet" },
              { id: "advances", label: "السلف", icon: DollarSign, accent: "amber" },
              { id: "deductions", label: "الخصومات والمخالفات", icon: AlertCircle, accent: "rose" },
              { id: "payroll", label: "الرواتب", icon: CreditCard, accent: "emerald" },
            ],
          },
        ],
      },
      {
        id: "system",
        title: "التقارير والنظام",
        entries: [
          { id: "reports", label: "التقارير", icon: PieChart, accent: "violet" },
          { id: "financial-years", label: "السنوات المالية", icon: Calendar, accent: "teal" },
          { id: "settings", label: "الإعدادات", icon: Settings, accent: "slate" },
          {
            id: "about",
            label: "حول التطبيق والدعم",
            icon: Info,
            accent: "blue",
            badge: supportUnreadCount,
          },
        ],
      },
    ],
    [supportUnreadCount],
  );

  /* ------------------------------- الحالة ------------------------------- */
  const findGroupOf = useCallback(
    (tab: ActiveTab): string | null => {
      for (const section of sections) {
        for (const entry of section.entries) {
          if (isGroup(entry) && entry.children.some((c) => c.id === tab)) {
            return entry.groupId;
          }
        }
      }
      return null;
    },
    [sections],
  );

  const [openGroups, setOpenGroups] = useState<string[]>(() => {
    const g = findGroupOf(activeTab);
    return g ? [g] : [];
  });
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [query, setQuery] = useState("");
  const [tooltip, setTooltip] = useState<{ text: string; top: number } | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  /* فتح المجموعة تلقائياً عند تغيير القسم النشط من خارج الشريط */
  useEffect(() => {
    const g = findGroupOf(activeTab);
    if (g) setOpenGroups((prev) => (prev.includes(g) ? prev : [...prev, g]));
  }, [activeTab, findGroupOf]);

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");
    } catch {
      /* تجاهل */
    }
    if (collapsed) setQuery("");
  }, [collapsed]);

  /* اختصارات لوحة المفاتيح: Ctrl+B للطي، Ctrl+K للبحث */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setCollapsed((c) => !c);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCollapsed(false);
        setTimeout(() => searchRef.current?.focus(), 60);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* ------------------------------ البحث ------------------------------ */
  const normalize = (s: string) =>
    s
      .replace(/[أإآ]/g, "ا")
      .replace(/ى/g, "ي")
      .replace(/ة/g, "ه")
      .replace(/[ًٌٍَُِّْ]/g, "")
      .trim()
      .toLowerCase();

  const q = normalize(query);

  const filteredSections: NavSection[] = useMemo(() => {
    if (!q) return sections;
    const match = (item: LeafItem) =>
      normalize(item.label).includes(q) || normalize(item.keywords || "").includes(q);

    return sections
      .map((section) => {
        const entries: NavEntry[] = [];
        for (const entry of section.entries) {
          if (isGroup(entry)) {
            const kids = entry.children.filter(match);
            if (normalize(entry.label).includes(q)) {
              entries.push(entry);
            } else if (kids.length) {
              entries.push({ ...entry, children: kids });
            }
          } else if (match(entry)) {
            entries.push(entry);
          }
        }
        return { ...section, entries };
      })
      .filter((s) => s.entries.length > 0);
  }, [q, sections]);

  const isSearching = q.length > 0;

  /* ----------------------------- المعالجات ----------------------------- */
  const toggleGroup = (groupId: string) => {
    if (collapsed) {
      setCollapsed(false);
      setOpenGroups((prev) => (prev.includes(groupId) ? prev : [...prev, groupId]));
      return;
    }
    setOpenGroups((prev) =>
      prev.includes(groupId) ? prev.filter((g) => g !== groupId) : [...prev, groupId],
    );
  };

  const selectLeaf = (id: ActiveTab) => {
    onSelectTab(id);
    setQuery("");
    setTooltip(null);
  };

  const showTip = (e: React.MouseEvent<HTMLElement>, text: string) => {
    if (!collapsed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({ text, top: rect.top + rect.height / 2 });
  };
  const hideTip = () => setTooltip(null);

  /* --------------------------- عناصر الواجهة --------------------------- */

  const renderLeaf = (item: LeafItem, opts: { child?: boolean; index?: number } = {}) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;
    const { child = false, index = 0 } = opts;

    return (
      <li
        key={item.id}
        className={`${child ? "sb-branch-row relative " : ""}${
          isSearching || child ? "sb-enter" : ""
        }`}
        style={isSearching || child ? { animationDelay: `${index * 35}ms` } : undefined}
      >
        <button
          type="button"
          onClick={() => selectLeaf(item.id)}
          onMouseEnter={(e) => showTip(e, item.label)}
          onMouseLeave={hideTip}
          aria-current={isActive ? "page" : undefined}
          className={`sb-item group relative w-full flex items-center rounded-xl outline-none
            focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:ring-offset-1
            focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900
            ${collapsed ? "justify-center px-0 py-2.5" : "gap-3 ps-3 pe-2.5 py-2"}
            ${
              isActive
                ? `bg-gradient-to-l ${ACCENT_GRADIENT[item.accent]} text-white shadow-lg ${ACCENT_GLOW[item.accent]}`
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-900/[0.045] dark:hover:bg-white/[0.06]"
            }`}
        >
          {/* لمعة تمر فوق العنصر عند تفعيله (مقصوصة داخل غلاف مستقل) */}
          {isActive && <span key={item.id} className="sb-sheen" />}

          {/* شريط التفعيل الجانبي (للعناصر الرئيسية فقط — الفرعية لها خط الربط) */}
          {!child && (
            <span
              className={`absolute -right-[9px] top-1/2 -translate-y-1/2 w-[3px] rounded-full transition-all duration-300
                ${ACCENT_BAR[item.accent]}
                ${isActive ? "h-5 opacity-100" : "h-0 opacity-0 group-hover:h-3.5 group-hover:opacity-60"}`}
            />
          )}

          {/* الأيقونة */}
          <span
            className={`relative shrink-0 grid place-items-center rounded-lg transition-all duration-300
              ${collapsed ? "w-9 h-9" : child ? "w-7 h-7" : "w-8 h-8"}
              ${
                isActive
                  ? "bg-white/20 text-white"
                  : `${ACCENT_SOFT_BG[item.accent]} ${ACCENT_ICON[item.accent]} group-hover:scale-[1.08]`
              }`}
          >
            <Icon className={child && !collapsed ? "w-[15px] h-[15px]" : "w-[17px] h-[17px]"} />
          </span>

          {/* النص */}
          {!collapsed && (
            <span
              className={`relative flex-1 text-right truncate transition-transform duration-300 group-hover:-translate-x-0.5
                ${child ? "text-[12.5px]" : "text-[13.5px]"}
                ${isActive ? "font-semibold" : "font-medium"}`}
            >
              {item.label}
            </span>
          )}

          {/* الشارة */}
          {item.badge && item.badge > 0 ? (
            collapsed ? (
              <span className="absolute top-1 left-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900 sb-pulse" />
            ) : (
              <span
                className={`shrink-0 min-w-[20px] h-5 px-1.5 grid place-items-center rounded-full text-[10px] font-bold tabular-nums
                  ${isActive ? "bg-white/25 text-white" : "bg-rose-500 text-white shadow-sm shadow-rose-500/40"}`}
              >
                {item.badge > 99 ? "99+" : item.badge}
              </span>
            )
          ) : null}
        </button>
      </li>
    );
  };

  const renderGroup = (entry: GroupItem) => {
    const GroupIcon = entry.icon;
    const isOpen = isSearching || openGroups.includes(entry.groupId);
    const activeChild = entry.children.find((c) => c.id === activeTab);
    const hasActiveChild = Boolean(activeChild);

    return (
      <li key={entry.groupId}>
        <button
          type="button"
          onClick={() => toggleGroup(entry.groupId)}
          onMouseEnter={(e) => showTip(e, entry.label)}
          onMouseLeave={hideTip}
          aria-expanded={isOpen}
          className={`sb-item group relative w-full flex items-center rounded-xl outline-none
            focus-visible:ring-2 focus-visible:ring-blue-500/60
            ${collapsed ? "justify-center px-0 py-2.5" : "gap-3 ps-3 pe-2.5 py-2"}
            ${
              hasActiveChild && !isOpen
                ? "bg-slate-900/[0.05] dark:bg-white/[0.07] text-slate-900 dark:text-white"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-900/[0.045] dark:hover:bg-white/[0.06] hover:text-slate-900 dark:hover:text-white"
            }`}
        >
          <span
            className={`absolute -right-[9px] top-1/2 -translate-y-1/2 w-[3px] rounded-full transition-all duration-300
              ${ACCENT_BAR[entry.accent]}
              ${hasActiveChild ? "h-5 opacity-100" : "h-0 opacity-0 group-hover:h-3.5 group-hover:opacity-60"}`}
          />

          <span
            className={`relative shrink-0 grid place-items-center rounded-lg transition-all duration-300
              ${collapsed ? "w-9 h-9" : "w-8 h-8"}
              ${ACCENT_SOFT_BG[entry.accent]} ${ACCENT_ICON[entry.accent]} group-hover:scale-[1.08]`}
          >
            <GroupIcon className="w-[17px] h-[17px]" />
            {collapsed && hasActiveChild && (
              <span
                className={`absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${ACCENT_BAR[entry.accent]}`}
              />
            )}
          </span>

          {!collapsed && (
            <>
              <span className="flex-1 text-right truncate text-[13.5px] font-semibold">
                {entry.label}
              </span>

              {/* عدد العناصر / مؤشر القسم النشط */}
              {!isOpen && hasActiveChild ? (
                <span
                  className={`shrink-0 text-[10.5px] font-semibold px-1.5 py-0.5 rounded-md truncate max-w-[86px]
                    ${ACCENT_SOFT_BG[entry.accent]} ${ACCENT_ICON[entry.accent]}`}
                >
                  {activeChild!.label}
                </span>
              ) : (
                <span className="shrink-0 text-[10.5px] font-semibold text-slate-400 dark:text-slate-500 tabular-nums">
                  {entry.children.length}
                </span>
              )}

              <ChevronDown
                className={`shrink-0 w-3.5 h-3.5 text-slate-400 dark:text-slate-500 transition-transform duration-300 ease-out
                  ${isOpen ? "rotate-180" : ""}`}
              />
            </>
          )}
        </button>

        {/* الأبناء — حركة انزلاق ناعمة */}
        {!collapsed && (
          <div className={`sb-collapsible ${isOpen ? "is-open" : ""}`}>
            <div className="overflow-hidden">
              <ul className="sb-branch relative mt-1 space-y-0.5 pe-1">
                {entry.children.map((child, i) =>
                  renderLeaf(child, { child: true, index: i }),
                )}
              </ul>
            </div>
          </div>
        )}
      </li>
    );
  };

  /* ------------------------------- العرض ------------------------------- */
  return (
    <>
      <aside
        dir="rtl"
        className={`sb-root relative z-20 shrink-0 h-full flex flex-col select-none
          border-l border-slate-200/90 dark:border-white/[0.06]
          bg-white dark:bg-[#0c1424]
          transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          ${collapsed ? "w-[76px]" : "w-[268px]"}`}
      >
        {/* توهجات خلفية زخرفية */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="sb-orb absolute -top-16 -right-10 w-44 h-44 rounded-full bg-blue-500/10 dark:bg-blue-500/20 blur-3xl" />
          <div className="sb-orb sb-orb-2 absolute top-1/3 -left-16 w-48 h-48 rounded-full bg-indigo-500/[0.07] dark:bg-indigo-500/[0.14] blur-3xl" />
          <div className="sb-orb sb-orb-3 absolute -bottom-20 -right-12 w-52 h-52 rounded-full bg-emerald-500/[0.06] dark:bg-emerald-500/[0.12] blur-3xl" />
        </div>
        {/* حد متدرج مضيء على الحافة */}
        <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-blue-500/30 to-transparent dark:via-blue-400/30" />

        {/* ============================ الهوية ============================ */}
        <div className={`relative shrink-0 ${collapsed ? "px-3 pt-4 pb-3" : "px-4 pt-4 pb-3"}`}>
          <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
            <button
              type="button"
              onClick={() => selectLeaf("dashboard")}
              onMouseEnter={(e) => showTip(e, "نظام النقل المحاسبي")}
              onMouseLeave={hideTip}
              className="sb-logo group relative shrink-0 w-10 h-10 rounded-2xl grid place-items-center
                bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600
                text-white text-lg shadow-lg shadow-blue-600/30 dark:shadow-blue-600/25
                transition-transform duration-300 hover:scale-105 active:scale-95"
            >
              <span className="drop-shadow-sm">🚚</span>
              <span className="sb-logo-ring absolute inset-0 rounded-2xl ring-2 ring-blue-500/40 dark:ring-blue-400/40" />
            </button>

            {!collapsed && (
              <div className="flex-1 min-w-0 sb-fade">
                <div className="font-bold text-[13.5px] leading-tight text-slate-900 dark:text-white truncate">
                  نظام النقل المحاسبي
                </div>
                <div className="flex items-center gap-1 text-[10.5px] font-semibold text-blue-600 dark:text-blue-400">
                  <Sparkles className="w-3 h-3" />
                  <span>Desktop Pro · v2.0</span>
                </div>
              </div>
            )}

            {!collapsed && (
              <button
                type="button"
                onClick={() => setCollapsed(true)}
                title="طي الشريط الجانبي (Ctrl+B)"
                className="shrink-0 w-8 h-8 grid place-items-center rounded-lg text-slate-400 dark:text-slate-500
                  hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-900/[0.06] dark:hover:bg-white/[0.08]
                  transition-colors"
              >
                <PanelRightClose className="w-[17px] h-[17px]" />
              </button>
            )}
          </div>

          {collapsed && (
            <button
              type="button"
              onClick={() => setCollapsed(false)}
              onMouseEnter={(e) => showTip(e, "توسيع الشريط (Ctrl+B)")}
              onMouseLeave={hideTip}
              className="mt-3 w-full h-8 grid place-items-center rounded-lg text-slate-400 dark:text-slate-500
                hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-900/[0.06] dark:hover:bg-white/[0.08]
                transition-colors"
            >
              <PanelRightOpen className="w-[17px] h-[17px]" />
            </button>
          )}
        </div>

        {/* ============================ البحث ============================ */}
        {!collapsed && (
          <div className="relative shrink-0 px-4 pb-3 sb-fade">
            <div
              className="group relative flex items-center gap-2 h-9 px-2.5 rounded-xl
                bg-slate-900/[0.045] dark:bg-white/[0.05]
                border border-transparent focus-within:border-blue-500/60 dark:focus-within:border-blue-400/50
                focus-within:bg-white dark:focus-within:bg-white/[0.07]
                focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]
                transition-all duration-200"
            >
              <Search className="w-4 h-4 shrink-0 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500" />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Escape" && setQuery("")}
                placeholder="بحث في الأقسام…"
                className="flex-1 min-w-0 bg-transparent outline-none text-[12.5px] text-slate-700 dark:text-slate-200
                  placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="shrink-0 w-5 h-5 grid place-items-center rounded-md text-slate-400
                    hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-900/10 dark:hover:bg-white/10"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <kbd
                  className="shrink-0 hidden md:block text-[9.5px] font-sans font-semibold px-1.5 py-0.5 rounded
                    text-slate-400 dark:text-slate-500 bg-slate-900/[0.06] dark:bg-white/[0.07]"
                  dir="ltr"
                >
                  Ctrl K
                </kbd>
              )}
            </div>
          </div>
        )}

        {/* ============================ القائمة ============================ */}
        <nav
          onScroll={tooltip ? hideTip : undefined}
          className={`sb-scroll relative flex-1 overflow-y-auto overflow-x-hidden pb-3
            ${collapsed ? "px-3 space-y-2" : "px-4 space-y-4"}`}
        >
          {filteredSections.map((section) => (
            <div key={section.id}>
              {!collapsed ? (
                <div className="flex items-center gap-2 px-1 mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500 whitespace-nowrap">
                    {section.title}
                  </span>
                  <span className="flex-1 h-px bg-gradient-to-l from-transparent via-slate-200 to-transparent dark:via-white/[0.08]" />
                </div>
              ) : (
                <div className="mx-auto w-6 h-px my-2 bg-slate-200 dark:bg-white/[0.08]" />
              )}

              <ul className="space-y-1">
                {section.entries.map((entry, i) =>
                  isGroup(entry) ? renderGroup(entry) : renderLeaf(entry, { index: i }),
                )}
              </ul>
            </div>
          ))}

          {filteredSections.length === 0 && (
            <div className="sb-fade flex flex-col items-center justify-center gap-2 py-10 text-center">
              <div className="w-11 h-11 rounded-2xl grid place-items-center bg-slate-900/[0.05] dark:bg-white/[0.06]">
                <Search className="w-5 h-5 text-slate-400 dark:text-slate-500" />
              </div>
              <p className="text-[12px] text-slate-500 dark:text-slate-400">
                لا توجد نتائج لِـ «{query}»
              </p>
              <button
                type="button"
                onClick={() => setQuery("")}
                className="text-[11.5px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                مسح البحث
              </button>
            </div>
          )}
        </nav>

        {/* ============================ التذييل ============================ */}
        <div className={`relative shrink-0 ${collapsed ? "px-3 pb-3 pt-2" : "px-4 pb-4 pt-2"}`}>
          {collapsed ? (
            <div
              className="mx-auto w-9 h-9 grid place-items-center rounded-xl bg-emerald-500/10 dark:bg-emerald-400/10"
              onMouseEnter={(e) => showTip(e, "يعمل أوفلاين بالكامل · 100%")}
              onMouseLeave={hideTip}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 sb-pulse" />
            </div>
          ) : (
            <div
              className="sb-fade relative overflow-hidden rounded-xl p-3
                bg-gradient-to-br from-emerald-500/[0.09] to-transparent dark:from-emerald-400/[0.12]
                border border-emerald-500/20 dark:border-emerald-400/15"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="relative shrink-0 flex w-2 h-2">
                    <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-500 opacity-70 sb-ping" />
                    <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-500" />
                  </span>
                  <span className="text-[11.5px] font-semibold text-slate-700 dark:text-slate-200 truncate">
                    يعمل أوفلاين بالكامل
                  </span>
                </div>
                <span className="shrink-0 text-[11.5px] font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  100%
                </span>
              </div>
              <div className="mt-2 h-1 rounded-full bg-emerald-500/15 overflow-hidden">
                <div className="sb-bar h-full w-full rounded-full bg-gradient-to-l from-emerald-500 to-teal-400" />
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* تلميح عائم في وضع الطي */}
      {collapsed && tooltip && (
        <div
          className="sb-tooltip fixed z-50 pointer-events-none"
          style={{ top: tooltip.top, right: 84 }}
        >
          <div
            className="-translate-y-1/2 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[12px] font-semibold
              bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900
              shadow-xl shadow-slate-900/20 dark:shadow-black/40"
          >
            {tooltip.text}
          </div>
        </div>
      )}
    </>
  );
};
