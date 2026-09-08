import React, { useState } from "react";
import {
  X,
  Key,
  ShieldCheck,
  Clock,
  MessageCircle,
  Send,
  Phone,
  Copy,
  Check,
  Sparkles,
} from "lucide-react";
import type { Company, LicenseInfo } from "@/types";
import { activateLicenseKey, getAppSettings } from "@/lib/storage";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  company: Company;
  license: LicenseInfo;
  onActivated: () => void;
}

export const LicenseModal: React.FC<Props> = ({
  isOpen,
  onClose,
  company,
  license,
  onActivated,
}) => {
  const [licenseKeyInput, setLicenseKeyInput] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  if (!isOpen) return null;

  const handleActivate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const res = activateLicenseKey(licenseKeyInput);
    if (res.success) {
      setSuccessMessage(res.message);
      onActivated();
      setTimeout(() => {
        onClose();
      }, 2000);
    } else {
      setErrorMessage(res.message);
    }
  };

  const handleCopyClientCode = () => {
    navigator.clipboard.writeText(company.client_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const settings = getAppSettings();
  const supportWhatsapp = (settings.whatsapp || "").replace(/\D/g, "");
  const whatsappUrl = supportWhatsapp
    ? `https://wa.me/${supportWhatsapp}?text=${encodeURIComponent(
        `السلام عليكم، أود تفعيل اشتراك النظام المحاسبي لخدمات النقل.\nكود العميل: ${company.client_code}\nاسم الشركة: ${company.name}`
      )}`
    : "";

  const telegramUrl = settings.telegram
    ? settings.telegram.startsWith("http")
      ? settings.telegram
      : `https://t.me/${settings.telegram.replace("@", "")}`
    : "";

  return (
    <div className="modal-overlay">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <Key className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base">إدارة ترخيص واشتراك النظام</h3>
              <p className="text-xs text-blue-100">يعمل أوفلاين دون الحاجة لاتصال إنترنت دائم</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Status Box */}
          <div
            className={`p-4 rounded-xl border ${
              license.isTrial
                ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800"
                : license.isExpired
                ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"
                : "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {license.isTrial ? (
                  <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                ) : license.isExpired ? (
                  <Clock className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
                ) : (
                  <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                )}
                <div>
                  <div className="font-bold text-sm text-slate-800 dark:text-slate-100">
                    {license.isTrial
                      ? `باقة التجربة المجانية (7 أيام)`
                      : license.planType === "open"
                      ? "اشتراك مفتوح مدى الحياة"
                      : license.planType === "yearly"
                      ? "اشتراك سنوي معتمد"
                      : "اشتراك شهري معتمد"}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    {license.isTrial
                      ? `متبقي من فترتك التجريبية: ${license.trialDaysLeft} أيام`
                      : license.isExpired
                      ? "انتهت فترة الاشتراك — يرجى إدخال رمز ترخيص جديد"
                      : `متبقي على نهاية الاشتراك: ${license.daysLeft} يوماً (تاريخ الانتهاء: ${license.expiryDate?.slice(0, 10)})`}
                  </div>
                </div>
              </div>

              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  license.isTrial
                    ? "bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200"
                    : license.isExpired
                    ? "bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-200"
                    : "bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200"
                }`}
              >
                {license.isTrial ? "تجريبي" : license.isExpired ? "منتهي" : "نشط ومفعّل"}
              </span>
            </div>
          </div>

          {/* Client Identity & Code */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">رقم العميل الفريد للترخيص:</div>
              <div className="font-mono font-bold text-base text-blue-600 dark:text-blue-400 mt-0.5" dir="ltr">
                {company.client_code}
              </div>
            </div>
            <button
              onClick={handleCopyClientCode}
              className="btn text-xs py-1.5 px-3 flex items-center gap-1.5"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? "تم النسخ" : "نسخ الكود"}</span>
            </button>
          </div>

          {/* Key Activation Form */}
          <form onSubmit={handleActivate} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                أدخل رمز التفعيل أو الترخيص المالي (Activation Code):
              </label>
              <input
                type="text"
                value={licenseKeyInput}
                onChange={(e) => setLicenseKeyInput(e.target.value)}
                placeholder="مثال: LOGIST-MONTH-XXXX-YYYY أو LOGIST-YEAR-XXXX-YYYY"
                dir="ltr"
                className="form-input font-mono text-center uppercase tracking-wider text-sm py-2.5 font-bold"
              />
            </div>

            {errorMessage && (
              <div className="p-2.5 bg-red-500/15 border border-red-500/30 text-red-600 dark:text-red-400 rounded-lg text-xs font-medium">
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="p-2.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-medium">
                {successMessage}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary w-full py-2.5 text-sm font-bold shadow-md flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              تفعيل الترخيص والاشتراك الآن
            </button>
          </form>

          {/* Contact Developer Quick Action */}
          {(whatsappUrl || telegramUrl) && (
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-2.5 text-center">
                للحصول على رمز تفعيل أو تجديد الاشتراك، تواصل مع الدعم الفني:
              </div>
              <div className="grid grid-cols-2 gap-2">
                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white border-none py-2 flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <MessageCircle className="w-4 h-4" />
                    واتساب الدعم الفني
                  </a>
                )}
                {telegramUrl && (
                  <a
                    href={telegramUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white border-none py-2 flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Send className="w-4 h-4" />
                    تليجرام
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
