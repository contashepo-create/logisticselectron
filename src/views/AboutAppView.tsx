import React, { useState } from "react";
import {
  Info,
  Phone,
  MessageCircle,
  Send,
  Mail,
  Clock,
  Globe,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Laptop,
  Check,
} from "lucide-react";
import type { AppSettings, Company } from "@/types";
import { getAppSettings } from "@/lib/storage";

interface Props {
  company: Company;
}

export const AboutAppView: React.FC<Props> = ({ company }) => {
  const [settings] = useState<AppSettings>(() => getAppSettings());

  const modules = [
    "إدارة فواتير النقل والبوالص وحمولات الحاويات",
    "سندات القبض المالي وسندات الصرف والمصروفات",
    "دليل العملاء، المديونيات، وكشوف الحسابات اللحظية",
    "دليل الموردين، فواتير المشتريات، وأعمار الديون",
    "إدارة أسطول الشاحنات وربحية كل مركبة واستهلاك الوقود",
    "الموظفون والسائقون، مسيرات الرواتب الشهرية، والسلف",
    "الخزائن النقدية، الحسابات المصرفية، والتحويلات الداخلية",
    "قوائم الأرباح والخسائر التشغيلية والدخل (P&L)",
    "قوالب طباعة احترافية (6 قوالب فواتير + قالب التقارير الموحد)",
    "التوافق التام مع الفوترة الإلكترونية السعودية (ZATCA Phase 1 & 2)",
    "العمل أوفلاين 100% بدون اشتراط اتصال إنترنت دائم",
    "الربط السحابي مع كلاود فلير وبوت تليجرام للإشعارات والتراخيص",
  ];

  const whatsappUrl = `https://wa.me/${settings.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
    `السلام عليكم ورحمة الله وبركاته، أتواصل معك بخصوص ${settings.app_name}`
  )}`;

  const telegramUrl = settings.telegram.startsWith("http")
    ? settings.telegram
    : `https://t.me/${settings.telegram.replace("@", "")}`;

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 rounded-3xl p-8 text-white shadow-xl text-center relative overflow-hidden">
        <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-3xl mx-auto shadow-inner mb-4">
          🚛
        </div>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight">{settings.app_name}</h1>
        <p className="text-xs md:text-sm text-blue-200 mt-2 max-w-xl mx-auto leading-relaxed">
          الإصدار: <span dir="ltr" className="font-mono font-bold text-white">{settings.app_version}</span> | متوافق مع نظام تشغيل Windows 7 وما بعده (32/64 بت)
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="btn bg-emerald-600 hover:bg-emerald-700 text-white border-none text-xs font-bold py-2.5 px-4 flex items-center gap-2 shadow-lg"
          >
            <MessageCircle className="w-4 h-4" />
            <span>تواصل عبر واتساب</span>
          </a>
          <a
            href={telegramUrl}
            target="_blank"
            rel="noreferrer"
            className="btn bg-blue-600 hover:bg-blue-700 text-white border-none text-xs font-bold py-2.5 px-4 flex items-center gap-2 shadow-lg"
          >
            <Send className="w-4 h-4" />
            <span>بوت / قناة تليجرام</span>
          </a>
          <a
            href={`tel:${settings.phone}`}
            className="btn bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-bold py-2.5 px-4 flex items-center gap-2"
          >
            <Phone className="w-4 h-4" />
            <span>اتصال مباشر</span>
          </a>
        </div>
      </div>

      {/* Developer Profile Card */}
      <div className="app-card p-6 space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
            بطاقة بيانات المطور والدعم الفني
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-slate-500 block mb-1">اسم المطور:</span>
            <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
              {settings.developer_name}
            </span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-slate-500 block mb-1">المسمى والصفة المهنية:</span>
            <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
              {settings.developer_title}
            </span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-slate-500 block mb-1">الهاتف والواتساب المعتمد:</span>
            <span className="font-bold text-blue-600 dark:text-blue-400 text-sm" dir="ltr">
              {settings.phone}
            </span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-slate-500 block mb-1">البريد الإلكتروني:</span>
            <span className="font-bold text-blue-600 dark:text-blue-400 text-sm" dir="ltr">
              {settings.email}
            </span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-slate-500 block mb-1">مواعيد الدعم الفني:</span>
            <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
              {settings.support_hours}
            </span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-slate-500 block mb-1">الدولة والنطاق:</span>
            <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
              {settings.developer_country}
            </span>
          </div>
        </div>
      </div>

      {/* About Description */}
      <div className="app-card p-6 space-y-3">
        <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-600" />
          <span>نبذة تعريفية عن البرنامج</span>
        </h3>
        <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-loose">
          {settings.about_text}
        </p>
      </div>

      {/* Pricing Packages Box */}
      <div className="app-card p-6 space-y-4">
        <div className="text-center max-w-md mx-auto">
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">
            باقات الاشتراك والترخيص
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            يحصل كل مشترك على تجربة مجانية كاملة لمدة 7 أيام عند بدء التثبيت
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Monthly */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-center space-y-3">
            <div className="font-bold text-sm text-slate-700 dark:text-slate-200">الاشتراك الشهري</div>
            <div className="text-3xl font-black text-slate-900 dark:text-white">
              {settings.monthly_price} <span className="text-sm font-normal text-slate-500">ر.س / شهر</span>
            </div>
            <p className="text-xs text-slate-500">
              تفعيل شهري كامل مع دعم فني مستمر وتحديثات النظام.
            </p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="btn w-full py-2 text-xs font-bold"
            >
              طلب تفعيل شهري
            </a>
          </div>

          {/* Yearly */}
          <div className="p-5 rounded-2xl border-2 border-blue-600 bg-blue-50/40 dark:bg-blue-950/20 text-center space-y-3 relative shadow-md">
            <span className="bg-blue-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full absolute -top-2.5 right-1/2 translate-x-1/2 shadow">
              {settings.pricing_discount_note || "الأكثر توفيراً"}
            </span>
            <div className="font-bold text-sm text-blue-700 dark:text-blue-300">الاشتراك السنوي</div>
            <div className="text-3xl font-black text-blue-700 dark:text-blue-400">
              {settings.yearly_price} <span className="text-sm font-normal text-slate-500">ر.س / سنة</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              خصم خاص وتوفير سنوي + أولوية الدعم الفني ونسخ احتياطي سحابي.
            </p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary w-full py-2 text-xs font-bold"
            >
              طلب تفعيل سنوي
            </a>
          </div>
        </div>
      </div>

      {/* System Features Grid */}
      <div className="app-card p-6 space-y-4">
        <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>الوحدات والمميزات المضمنة في النظام</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-700 dark:text-slate-300">
          {modules.map((m, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>{m}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Copyright */}
      <div className="text-center text-xs text-slate-500 py-4">
        {settings.copyright} — إصدار سطح المكتب المعتمد
      </div>
    </div>
  );
};
