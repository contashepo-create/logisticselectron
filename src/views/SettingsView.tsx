import React, { useState } from "react";
import {
  Settings,
  Building,
  Save,
  Download,
  Upload,
  RotateCcw,
  Calendar,
  Percent,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import type { Company } from "@/types";
import {
  getCompany,
  saveCompany,
  exportFullDatabaseBackup,
  importFullDatabaseBackup,
  resetAllDataToDemo,
} from "@/lib/storage";

interface Props {
  company: Company;
  onRefreshData: () => void;
}

export const SettingsView: React.FC<Props> = ({ company: initialCompany, onRefreshData }) => {
  const [company, setCompanyState] = useState<Company>(initialCompany);
  const [successMsg, setSuccessMsg] = useState("");
  const [activeTab, setActiveTab] = useState<"company" | "fiscal" | "vat" | "backup">("company");

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    saveCompany(company);
    setSuccessMsg("تم حفظ بيانات المنشأة والإعدادات بنجاح.");
    onRefreshData();
    setTimeout(() => setSuccessMsg(""), 3000);
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
        "تحذير: هل أنت متأكد من رغبتك في إعادة تعيين كافة البيانات إلى البيانات النموذجية الأصلية؟ ستفقد أي سجلات مدخلة حديثاً."
      )
    ) {
      resetAllDataToDemo();
      onRefreshData();
      alert("تمت استعادة البيانات الافتراضية بنجاح.");
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <span>إعدادات المنشأة والنظام والسنوات المالية</span>
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
          onClick={() => setActiveTab("fiscal")}
          className={`pb-2.5 flex items-center gap-1.5 transition ${
            activeTab === "fiscal"
              ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>السنوات المالية والإقفال</span>
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

      {/* Tab: Fiscal Years */}
      {activeTab === "fiscal" && (
        <div className="app-card p-6 space-y-4">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
            السنوات المالية وفترات المحاسبة
          </h3>
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-800 dark:text-slate-100">السنة المالية النشطة:</div>
                <div className="text-blue-600 font-bold font-mono">2026 M / 1447 H</div>
              </div>
              <span className="badge badge-green">مفتوحة للعمليات</span>
            </div>
            <p className="text-slate-500 text-[11px]">
              يتم ترحيل أرصدة العملاء والموردين والخزائن وحسابات الأرباح المحتجزة تلقائياً في نهاية كل سنة مالية.
            </p>
          </div>
        </div>
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
              <span>إعادة ضبط البيانات الأصلية (Seed Reset)</span>
            </div>
            <p className="text-xs text-slate-500">
              حذف كافة العمليات المدخلة واستعادة البيانات التجريبية الافتراضية للنظام.
            </p>
            <button
              onClick={handleResetData}
              className="btn bg-rose-600 hover:bg-rose-700 text-white py-2 px-4 text-xs font-bold flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>إعادة تعيين البيانات للوضع الافتراضي</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
