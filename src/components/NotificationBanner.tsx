import React from "react";
import { AlertTriangle, Clock, Key, ShieldCheck, Wifi } from "lucide-react";
import type { LicenseInfo } from "@/types";

interface Props {
  license: LicenseInfo;
  onOpenLicenseModal: () => void;
}

export const NotificationBanner: React.FC<Props> = ({ license, onOpenLicenseModal }) => {
  // If expired
  if (license.isExpired) {
    return (
      <div className="bg-red-500/15 border-b border-red-500/30 text-red-600 dark:text-red-400 px-4 py-2.5 text-xs md:text-sm font-medium flex items-center justify-between gap-3 shadow-inner">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
          <span>
            {license.isTrial
              ? "انتهت فترة التجربة المجانية (7 أيام). يرجى تفعيل اشتراكك للاستمرار في استخدام كافة العمليات المحاسبية."
              : "انتهت صلاحية اشتراكك الحالي. يرجى التجديد مع المطور."}
          </span>
        </div>
        <button
          onClick={onOpenLicenseModal}
          className="bg-red-600 text-white px-3 py-1 rounded-md text-xs font-semibold hover:bg-red-700 transition flex items-center gap-1 shrink-0"
        >
          <Key className="w-3.5 h-3.5" />
          تفعيل الآن
        </button>
      </div>
    );
  }

  // If 5 days or fewer remain (Gentle polite reminder as requested)
  if (license.warningNotice) {
    return (
      <div className="bg-amber-500/15 border-b border-amber-500/30 text-amber-800 dark:text-amber-300 px-4 py-2 text-xs md:text-sm font-medium flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 shrink-0 text-amber-500 animate-pulse" />
          <span>
            تنبيه لطيف: متبقي <b>{license.daysLeft} أيام</b> على انتهاء اشتراكك. يُرجى الاتصال بالإنترنت لتجديد الاشتراك بيسر وسهولة مع المطور.
          </span>
        </div>
        <button
          onClick={onOpenLicenseModal}
          className="bg-amber-600 text-white px-3 py-1 rounded-md text-xs font-semibold hover:bg-amber-700 transition flex items-center gap-1 shrink-0 shadow-sm"
        >
          <Wifi className="w-3.5 h-3.5" />
          تجديد الاشتراك
        </button>
      </div>
    );
  }

  return null;
};
