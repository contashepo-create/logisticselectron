import React, { useState } from "react";
import {
  Settings,
  Building,
  Save,
  Download,
  Upload,
  RotateCcw,
  Percent,
  CheckCircle2,
  AlertTriangle,
  Cloud,
  Copy,
  Check,
} from "lucide-react";
import type { AppSettings, Company } from "@/types";
import {
  getAppSettings,
  getCompany,
  saveAppSettings,
  saveCompany,
  exportFullDatabaseBackup,
  importFullDatabaseBackup,
  resetAllDataToBlank,
} from "@/lib/storage";

interface Props {
  company: Company;
  onRefreshData: () => void;
}

export const SettingsView: React.FC<Props> = ({ company: initialCompany, onRefreshData }) => {
  const [company, setCompanyState] = useState<Company>(initialCompany);
  const [appSettings, setAppSettings] = useState<AppSettings>(() => getAppSettings());
  const [successMsg, setSuccessMsg] = useState("");
  const [cloudSuccessMsg, setCloudSuccessMsg] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeTab, setActiveTab] = useState<"company" | "vat" | "cloud" | "backup">("company");

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    saveCompany(company);
    setSuccessMsg("تم حفظ بيانات المنشأة والإعدادات بنجاح.");
    onRefreshData();
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handleSaveCloudSettings = (e: React.FormEvent) => {
    e.preventDefault();
    saveAppSettings(appSettings);
    setCloudSuccessMsg("تم حفظ إعدادات الربط السحابي وبيانات الدعم الفني بنجاح.");
    onRefreshData();
    setTimeout(() => setCloudSuccessMsg(""), 3000);
  };

  const handleCopyClientCode = () => {
    navigator.clipboard.writeText(company.client_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleExportBackup = () => {
    const jsonStr = exportFullDatabaseBackup();
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Logistics_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importFullDatabaseBackup(content);
      if (res.success) {
        alert("تم استيراد النسخة الاحتياطية بنجاح!");
        onRefreshData();
      } else {
        alert(res.message);
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    if (
      confirm(
        "تحذير: سيتم حذف جميع البيانات المدخلة نهائياً (العملاء، الفواتير، الموظفين، السندات...) وإعادة النظام إلى حالته الفارغة الأصلية. هل أنت متأكد من المتابعة؟"
      )
    ) {
      resetAllDataToBlank();
      onRefreshData();
      alert("تمت إعادة ضبط النظام بنجاح. جميع البيانات الآن فارغة وجاهزة لإدخال بياناتك الحقيقية.");
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <span>الإعدادات</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            تخصيص البيانات الرسمية، إعدادات الضريبة، والنسخ الاحتياطي لقاعدة البيانات
          </p>
        </div>

        {successMsg && (
          <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-3 py-1.5 rounded-xl border border-emerald-300 text-xs font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4 text-xs font-bold">
        <button
          onClick={() => setActiveTab("company")}
          className={`pb-2.5 flex items-center gap-1.5 transition ${
            activeTab === "company"
              ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Building className="w-4 h-4" />
          <span>بيانات المنشأة والترخيص</span>
        </button>

        <button
          onClick={() => setActiveTab("vat")}
          className={`pb-2.5 flex items-center gap-1.5 transition ${
            activeTab === "vat"
              ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Percent className="w-4 h-4" />
          <span>إعدادات ضريبة القيمة المضافة وZATCA</span>
        </button>

        <button
          onClick={() => setActiveTab("cloud")}
          className={`pb-2.5 flex items-center gap-1.5 transition ${
            activeTab === "cloud"
              ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Cloud className="w-4 h-4" />
          <span>الربط السحابي (Cloudflare وتليجرام)</span>
        </button>

        <button
          onClick={() => setActiveTab("backup")}
          className={`pb-2.5 flex items-center gap-1.5 transition ${
            activeTab === "backup"
              ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Download className="w-4 h-4" />
          <span>النسخ الاحتياطي والصيانة</span>
        </button>
      </div>

      {/* Tab: Company Info */}
      {activeTab === "company" && (
        <form onSubmit={handleSaveCompany} className="app-card p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                اسم الشركة / المؤسسة (بالعربية):
              </label>
              <input
                type="text"
                value={company.name}
                onChange={(e) => setCompanyState({ ...company, name: e.target.value })}
                className="form-input text-xs"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                اسم المنشأة بالإنجليزية:
              </label>
              <input
                type="text"
                value={company.name_en || ""}
                onChange={(e) => setCompanyState({ ...company, name_en: e.target.value })}
                className="form-input text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                الرقم الضريبي (VAT Number):
              </label>
              <input
                type="text"
                value={company.tax_number || ""}
                onChange={(e) =>
                  setCompanyState({
                    ...company,
                    tax_number: e.target.value,
                    vat_number: e.target.value,
                  })
                }
                className="form-input text-xs font-mono"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                رقم السجل التجاري (CR):
              </label>
              <input
                type="text"
                value={company.commercial_reg || ""}
                onChange={(e) =>
                  setCompanyState({
                    ...company,
                    commercial_reg: e.target.value,
                    cr_number: e.target.value,
                  })
                }
                className="form-input text-xs font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                رقم الهاتف / الجوال:
              </label>
              <input
                type="text"
                value={company.phone}
                onChange={(e) => setCompanyState({ ...company, phone: e.target.value })}
                className="form-input text-xs font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                البريد الإلكتروني:
              </label>
              <input
                type="email"
                value={company.email}
                onChange={(e) => setCompanyState({ ...company, email: e.target.value })}
                className="form-input text-xs font-mono"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                العنوان الوطني / المقر الرئيسي:
              </label>
              <input
                type="text"
                value={company.address}
                onChange={(e) => setCompanyState({ ...company, address: e.target.value })}
                className="form-input text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                اسم البنك والفرع:
              </label>
              <input
                type="text"
                value={company.bank_name || ""}
                onChange={(e) => setCompanyState({ ...company, bank_name: e.target.value })}
                className="form-input text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                رقم الآيبان البنكي (IBAN):
              </label>
              <input
                type="text"
                value={company.iban || ""}
                onChange={(e) => setCompanyState({ ...company, iban: e.target.value })}
                className="form-input text-xs font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="submit"
              className="btn btn-primary py-2.5 px-6 font-bold flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>حفظ التعديلات</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab: VAT Settings */}
      {activeTab === "vat" && (
        <div className="app-card p-6 space-y-4">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
            ضريبة القيمة المضافة والفوترة الإلكترونية (هيئة الزكاة والضريبة والجمارك ZATCA)
          </h3>
          <div className="space-y-3 text-xs">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-2">
              <div className="font-bold">نسبة الضريبة القياسية الحالية:</div>
              <div className="text-xl font-black text-blue-600 font-mono">15.00 %</div>
              <p className="text-slate-500 text-[11px]">
                تطبق هذه النسبة على خدمات النقل البري والشحن اللوجستي وفق اللائحة التنفيذية.
              </p>
            </div>

            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl space-y-2 border border-emerald-200 dark:border-emerald-800">
              <div className="font-bold text-emerald-800 dark:text-emerald-300">
                رمز الاستجابة السريع (QR Code) المتوافق مع ZATCA المرحلة الأولى والثانية:
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                يتم توليد رمز الـ QR تلقائياً باستخدام تشفير Base64 TLV المعتمد (اسم المورد، الرقم الضريبي، الطابع الزمني، إجمالي الفاتورة، ومبلغ الضريبة) ويطبع في كافة نماذج الفواتير.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Cloud Integration (Cloudflare + Telegram) */}
      {activeTab === "cloud" && (
        <form onSubmit={handleSaveCloudSettings} className="space-y-5">
          {cloudSuccessMsg && (
            <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-3 py-1.5 rounded-xl border border-emerald-300 text-xs font-bold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" />
              <span>{cloudSuccessMsg}</span>
            </div>
          )}

          <div className="app-card p-6 space-y-4">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Cloud className="w-4 h-4 text-blue-600" />
              <span>ربط التطبيق بخادم Cloudflare Worker وبوت تليجرام</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              هذا التطبيق لا يحتوي على أي محاكاة داخلية لبوت تليجرام. للتحكم الفعلي بالتطبيق عن بعد (تفعيل
              التراخيص، استقبال رسائل الدعم الفني، متابعة المشتركين)، يجب نشر ملف{" "}
              <code className="font-mono text-blue-600">cloudflare-worker/worker.js</code> على Cloudflare Workers،
              ثم ضبط رابط الـ Worker هنا. بعد النشر يتحكم بوت تليجرام في التطبيق مباشرة عبر Webhook حقيقي على
              Cloudflare — وليس عبر أي واجهة داخل هذا التطبيق.
            </p>

            <div className="grid grid-cols-1 gap-4 text-xs pt-2">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  رابط Cloudflare Worker (Base URL):
                </label>
                <input
                  type="text"
                  value={appSettings.cloudflare_worker_url || ""}
                  onChange={(e) => setAppSettings({ ...appSettings, cloudflare_worker_url: e.target.value })}
                  placeholder="https://your-worker.workers.dev"
                  dir="ltr"
                  className="form-input text-xs font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  اتركه فارغاً لإبقاء التطبيق يعمل أوفلاين بالكامل بدون أي ربط سحابي.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">كود العميل الفريد (لاستخدامه في أوامر البوت):</div>
                  <div className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400 mt-0.5" dir="ltr">
                    {company.client_code}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyClientCode}
                  className="btn text-xs py-1.5 px-3 flex items-center gap-1.5"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? "تم النسخ" : "نسخ الكود"}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="app-card p-6 space-y-3">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">بيانات الدعم الفني الظاهرة للعميل</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              هذه البيانات تظهر في صفحة «حول التطبيق والدعم الفني» — اتركها فارغة لإخفاء أي قسم منها.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-2">
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">اسم جهة الدعم الفني:</label>
                <input
                  type="text"
                  value={appSettings.developer_name}
                  onChange={(e) => setAppSettings({ ...appSettings, developer_name: e.target.value })}
                  className="form-input text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">هاتف / واتساب الدعم:</label>
                <input
                  type="text"
                  value={appSettings.whatsapp}
                  onChange={(e) =>
                    setAppSettings({ ...appSettings, whatsapp: e.target.value, phone: e.target.value })
                  }
                  className="form-input text-xs font-mono"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">معرف تليجرام (بدون @):</label>
                <input
                  type="text"
                  value={appSettings.telegram}
                  onChange={(e) => setAppSettings({ ...appSettings, telegram: e.target.value })}
                  className="form-input text-xs font-mono"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">البريد الإلكتروني:</label>
                <input
                  type="email"
                  value={appSettings.email}
                  onChange={(e) => setAppSettings({ ...appSettings, email: e.target.value })}
                  className="form-input text-xs font-mono"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">مواعيد الدعم الفني:</label>
                <input
                  type="text"
                  value={appSettings.support_hours}
                  onChange={(e) => setAppSettings({ ...appSettings, support_hours: e.target.value })}
                  className="form-input text-xs"
                />
              </div>
            </div>
          </div>

          <div className="app-card p-6 space-y-3">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">خطوات نشر البوت وربطه بالتطبيق</h3>
            <div className="space-y-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              <p>1. أنشئ بوت جديد من <b>@BotFather</b> في تليجرام واحصل على رمز التوكن.</p>
              <p>2. انشر ملف <code className="font-mono text-blue-600">cloudflare-worker/worker.js</code> على Cloudflare Workers وحدد أسرار البيئة (Bot Token، Chat ID، KV Namespace).</p>
              <p>3. اربط الويب هوك من تليجرام مباشرة برابط الـ Worker:</p>
              <pre className="bg-slate-900 text-blue-400 p-3 rounded-lg font-mono text-xs overflow-x-auto" dir="ltr">
                https://api.telegram.org/bot&lt;TOKEN&gt;/setWebhook?url=https://your-worker.workers.dev/telegram-webhook
              </pre>
              <p>4. ضع رابط الـ Worker أعلاه في هذا التطبيق ليتم تفعيل مراسلات الدعم الفني ومزامنتها تلقائياً.</p>
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" className="btn btn-primary py-2.5 px-6 font-bold flex items-center gap-2">
              <Save className="w-4 h-4" />
              <span>حفظ إعدادات الربط السحابي</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab: Backup and Maintenance */}
      {activeTab === "backup" && (
        <div className="app-card p-6 space-y-6">
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
              تصدير واستيراد النسخ الاحتياطية (Offline JSON Backup)
            </h3>
            <p className="text-xs text-slate-500">
              يمكنك تصدير قاعدة بيانات النظام بالكامل والاحتفاظ بها على قرص فلاش أو سحابة واستعادتها في أي وقت.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={handleExportBackup}
                className="btn btn-primary py-2.5 px-4 text-xs font-bold flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>تصدير نسخة احتياطية (.JSON)</span>
              </button>

              <label className="btn btn-secondary py-2.5 px-4 text-xs font-bold flex items-center gap-2 cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>استيراد نسخة احتياطية</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="pt-6 border-t border-rose-100 dark:border-rose-950/50 space-y-3">
            <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
              <AlertTriangle className="w-5 h-5" />
              <span>إعادة ضبط المصنع (حذف جميع البيانات)</span>
            </div>
            <p className="text-xs text-slate-500">
              حذف كافة العمليات والبيانات المدخلة نهائياً وإعادة النظام إلى حالته الفارغة الأولى.
            </p>
            <button
              onClick={handleResetData}
              className="btn bg-rose-600 hover:bg-rose-700 text-white py-2 px-4 text-xs font-bold flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>إعادة ضبط المصنع الآن</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
