import React, { useState, useEffect } from "react";
import {
  Sun,
  Moon,
  Key,
  ShieldCheck,
  Clock,
  Download,
  Upload,
  RefreshCw,
  Wifi,
  WifiOff,
  Bell,
  HardDrive,
} from "lucide-react";
import type { Company, LicenseInfo, ThemeMode } from "@/types";
import { exportFullDatabaseBackup, importFullDatabaseBackup } from "@/lib/storage";

interface Props {
  company: Company;
  license: LicenseInfo;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onOpenLicenseModal: () => void;
  onRefreshData: () => void;
}

export const Header: React.FC<Props> = ({
  company,
  license,
  theme,
  onToggleTheme,
  onOpenLicenseModal,
  onRefreshData,
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleBackupExport = () => {
    const backupJson = exportFullDatabaseBackup();
    const blob = new Blob([backupJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `نسخة_احتياطية_${company.name.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBackupImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          const res = importFullDatabaseBackup(content);
          alert(res.message);
          if (res.success) {
            onRefreshData();
          }
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <header className="bg-white dark:bg-[#101a2c] border-b border-slate-200 dark:border-slate-800/80 px-4 py-2.5 flex items-center justify-between gap-3 sticky top-0 z-30 shadow-sm transition-colors">
      {/* Left side: Company & Status */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black text-lg shadow-md shadow-blue-500/20">
          🚛
        </div>
        <div>
          <h1 className="font-bold text-sm md:text-base text-slate-800 dark:text-slate-100 leading-tight">
            {company.name}
          </h1>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span>كود العميل: <b dir="ltr" className="font-mono text-blue-600 dark:text-blue-400">{company.client_code}</b></span>
            <span>•</span>
            <span className="flex items-center gap-1">
              {isOnline ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  متصل سحابياً
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  وضع أوفلاين (محلي)
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Right side: License badge & Actions */}
      <div className="flex items-center gap-2">
        {/* Subscription / Trial Status Badge */}
        <button
          onClick={onOpenLicenseModal}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition ${
            license.isTrial
              ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-100"
              : license.isExpired
              ? "bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-100"
              : "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100"
          }`}
          title="عرض تفاصيل الترخيص والاشتراك"
        >
          {license.isTrial ? (
            <>
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>تجربة مجانية: متبقي {license.trialDaysLeft} أيام</span>
            </>
          ) : license.isExpired ? (
            <>
              <Key className="w-3.5 h-3.5 text-red-500" />
              <span>الاشتراك منتهي — تفعيل</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>
                {license.planType === "open"
                  ? "اشتراك مفتوح دائم"
                  : `اشتراك مفعّل: متبقي ${license.daysLeft} يوماً`}
              </span>
            </>
          )}
        </button>

        {/* Database Backup Export & Import */}
        <button
          onClick={handleBackupExport}
          className="p-1.5 md:px-2.5 md:py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium flex items-center gap-1"
          title="تصدير نسخة احتياطية كاملة (JSON)"
        >
          <Download className="w-4 h-4 text-blue-500" />
          <span className="hidden md:inline">نسخ احتياطي</span>
        </button>

        <button
          onClick={handleBackupImport}
          className="p-1.5 md:px-2.5 md:py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium flex items-center gap-1"
          title="استيراد نسخة احتياطية (JSON)"
        >
          <Upload className="w-4 h-4 text-indigo-500" />
          <span className="hidden md:inline">استعادة</span>
        </button>

        {/* Dark/Light Mode Switcher */}
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          title={theme === "dark" ? "التبديل إلى الوضع الفاتح" : "التبديل إلى الوضع الداكن"}
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
        </button>
      </div>
    </header>
  );
};
