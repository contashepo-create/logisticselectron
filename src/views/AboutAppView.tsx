import React, { useEffect, useRef, useState } from "react";
import {
  Info,
  Phone,
  MessageCircle,
  Send,
  Mail,
  CheckCircle2,
  Sparkles,
  Check,
  MessageSquare,
  Headphones,
  CheckCheck,
  RefreshCw,
  CloudOff,
  Cloud,
} from "lucide-react";
import type { AppSettings, Company, SupportMessage } from "@/types";
import { getAppSettings, getSupportMessages, sendSupportMessage } from "@/lib/storage";
import {
  fetchSupportMessagesFromCloud,
  isCloudConfigured,
  sendSupportMessageToCloud,
} from "@/lib/cloud-sync";

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
    "قوالب طباعة احترافية متعددة للفواتير والتقارير والسندات",
    "التوافق التام مع الفوترة الإلكترونية السعودية (ZATCA Phase 1 & 2)",
    "العمل أوفلاين 100% بدون اشتراط اتصال إنترنت دائم",
    "السنوات المالية المستقلة وإمكانية الإقفال والترحيل",
  ];

  const supportPhone = (settings.phone || "").trim();
  const supportWhatsapp = (settings.whatsapp || "").replace(/\D/g, "");
  const whatsappUrl = supportWhatsapp
    ? `https://wa.me/${supportWhatsapp}?text=${encodeURIComponent(
        `السلام عليكم ورحمة الله وبركاته، أتواصل معك بخصوص ${settings.app_name}`
      )}`
    : "";

  const telegramUrl = (settings.telegram || "").trim()
    ? settings.telegram.startsWith("http")
      ? settings.telegram
      : `https://t.me/${settings.telegram.replace("@", "")}`
    : "";

  const hasDeveloperInfo =
    settings.developer_name || settings.developer_title || supportPhone || settings.email || settings.support_hours;

  const showPricing =
    settings.visibility?.pricing !== false && (settings.monthly_price > 0 || settings.yearly_price > 0);

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

        {(whatsappUrl || telegramUrl || supportPhone) && (
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="btn bg-emerald-600 hover:bg-emerald-700 text-white border-none text-xs font-bold py-2.5 px-4 flex items-center gap-2 shadow-lg"
              >
                <MessageCircle className="w-4 h-4" />
                <span>تواصل عبر واتساب</span>
              </a>
            )}
            {telegramUrl && (
              <a
                href={telegramUrl}
                target="_blank"
                rel="noreferrer"
                className="btn bg-blue-600 hover:bg-blue-700 text-white border-none text-xs font-bold py-2.5 px-4 flex items-center gap-2 shadow-lg"
              >
                <Send className="w-4 h-4" />
                <span>بوت / قناة تليجرام</span>
              </a>
            )}
            {supportPhone && (
              <a
                href={`tel:${supportPhone}`}
                className="btn bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-bold py-2.5 px-4 flex items-center gap-2"
              >
                <Phone className="w-4 h-4" />
                <span>اتصال مباشر</span>
              </a>
            )}
          </div>
        )}
      </div>

      {/* Developer / Support Profile Card */}
      {hasDeveloperInfo && (
        <div className="app-card p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
              بيانات المطور والدعم الفني
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {settings.developer_name && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 block mb-1">اسم المطور:</span>
                <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                  {settings.developer_name}
                </span>
              </div>
            )}

            {settings.developer_title && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 block mb-1">المسمى والصفة المهنية:</span>
                <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                  {settings.developer_title}
                </span>
              </div>
            )}

            {supportPhone && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 block mb-1">الهاتف / الواتساب:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400 text-sm" dir="ltr">
                  {supportPhone}
                </span>
              </div>
            )}

            {settings.email && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 block mb-1">البريد الإلكتروني:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400 text-sm" dir="ltr">
                  {settings.email}
                </span>
              </div>
            )}

            {settings.support_hours && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 block mb-1">مواعيد الدعم الفني:</span>
                <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                  {settings.support_hours}
                </span>
              </div>
            )}

            {settings.developer_country && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 block mb-1">الدولة والنطاق:</span>
                <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                  {settings.developer_country}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* About Description */}
      {settings.about_text && (
        <div className="app-card p-6 space-y-3">
          <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-600" />
            <span>نبذة تعريفية عن البرنامج</span>
          </h3>
          <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-loose">
            {settings.about_text}
          </p>
        </div>
      )}

      {/* Pricing Packages Box (only shown if configured) */}
      {showPricing && (
        <div className="app-card p-6 space-y-4">
          <div className="text-center max-w-md mx-auto">
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">
              باقات الاشتراك والترخيص
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {settings.monthly_price > 0 && (
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-center space-y-3">
                <div className="font-bold text-sm text-slate-700 dark:text-slate-200">الاشتراك الشهري</div>
                <div className="text-3xl font-black text-slate-900 dark:text-white">
                  {settings.monthly_price} <span className="text-sm font-normal text-slate-500">{company.currency} / شهر</span>
                </div>
                {whatsappUrl && (
                  <a href={whatsappUrl} target="_blank" rel="noreferrer" className="btn w-full py-2 text-xs font-bold">
                    طلب تفعيل شهري
                  </a>
                )}
              </div>
            )}

            {settings.yearly_price > 0 && (
              <div className="p-5 rounded-2xl border-2 border-blue-600 bg-blue-50/40 dark:bg-blue-950/20 text-center space-y-3 relative shadow-md">
                {settings.pricing_discount_note && (
                  <span className="bg-blue-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full absolute -top-2.5 right-1/2 translate-x-1/2 shadow">
                    {settings.pricing_discount_note}
                  </span>
                )}
                <div className="font-bold text-sm text-blue-700 dark:text-blue-300">الاشتراك السنوي</div>
                <div className="text-3xl font-black text-blue-700 dark:text-blue-400">
                  {settings.yearly_price} <span className="text-sm font-normal text-slate-500">{company.currency} / سنة</span>
                </div>
                {whatsappUrl && (
                  <a href={whatsappUrl} target="_blank" rel="noreferrer" className="btn btn-primary w-full py-2 text-xs font-bold">
                    طلب تفعيل سنوي
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}

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

      {/* Internal Support Section */}
      <SupportSection company={company} />

      {/* Footer Copyright */}
      {settings.copyright && (
        <div className="text-center text-xs text-slate-500 py-4">
          {settings.copyright}
        </div>
      )}
    </div>
  );
};

const SupportSection: React.FC<{ company: Company }> = ({ company }) => {
  const [messages, setMessages] = useState<SupportMessage[]>(() => getSupportMessages());
  const [inputBody, setInputBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [cloudConnected] = useState(() => isCloudConfigured());
  const [statusMsg, setStatusMsg] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!cloudConnected) return;
    handleSyncFromCloud();
    const interval = setInterval(handleSyncFromCloud, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cloudConnected]);

  const handleSyncFromCloud = async () => {
    if (!cloudConnected) return;
    setIsSyncing(true);
    const res = await fetchSupportMessagesFromCloud();
    setIsSyncing(false);
    if (res.success) setMessages(getSupportMessages());
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputBody.trim()) return;

    try {
      sendSupportMessage(inputBody.trim(), "client");
      setMessages(getSupportMessages());

      if (cloudConnected) {
        setIsSending(true);
        const res = await sendSupportMessageToCloud(inputBody.trim());
        setIsSending(false);
        setStatusMsg(res.success ? "" : res.message);
      }

      setInputBody("");
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="app-card overflow-hidden">
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
        <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          <span>الدعم الفني</span>
        </h3>
        <div
          className={`flex items-center gap-2 text-[11px] px-2.5 py-1 rounded-lg border font-semibold ${
            cloudConnected
              ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800"
              : "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800"
          }`}
        >
          {cloudConnected ? <Cloud className="w-3.5 h-3.5" /> : <CloudOff className="w-3.5 h-3.5" />}
          <span>{cloudConnected ? "متصل بالخادم السحابي" : "غير متصل بعد"}</span>
        </div>
      </div>

      <div className="h-[420px] flex flex-col overflow-hidden bg-white dark:bg-slate-900">
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold">
              <Headphones className="w-4 h-4" />
            </div>
            <div className="text-[11px] text-slate-400">
              {cloudConnected ? "مربوط ببوت تليجرام عبر كلاود فلير" : "بانتظار ربط الخدمة السحابية من الإعدادات"}
            </div>
          </div>
          {cloudConnected && (
            <button
              onClick={handleSyncFromCloud}
              disabled={isSyncing}
              className="text-slate-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10"
              title="تحديث الرسائل"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-slate-950/50 text-xs">
          {messages.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              لا توجد رسائل بعد. اكتب رسالتك أدناه لبدء محادثة مع الدعم الفني.
            </div>
          ) : (
            messages.map((m) => {
              const isClient = m.sender === "client";
              return (
                <div key={m.id} className={`flex ${isClient ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl p-3 shadow-sm space-y-1 ${
                      isClient
                        ? "bg-blue-600 text-white rounded-br-none"
                        : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700/80 rounded-bl-none"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 text-[10px] opacity-75 mb-1 font-semibold">
                      <span>{m.sender_name}</span>
                      <span dir="ltr">
                        {new Date(m.created_at).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="leading-relaxed whitespace-pre-wrap">{m.body}</p>
                    <div className="flex justify-end pt-1">
                      <CheckCheck className={`w-3.5 h-3.5 ${isClient ? "text-blue-200" : "text-emerald-500"}`} />
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {statusMsg && (
          <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-[11px] border-t border-amber-200 dark:border-amber-800">
            {statusMsg}
          </div>
        )}

        <form onSubmit={handleSend} className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex gap-2">
          <input
            type="text"
            value={inputBody}
            onChange={(e) => setInputBody(e.target.value)}
            placeholder="اكتب استفسارك أو رسالتك هنا..."
            className="form-input text-xs py-2.5"
            required
          />
          <button
            type="submit"
            disabled={isSending}
            className="btn btn-primary py-2.5 px-5 font-bold flex items-center gap-1.5 shrink-0 shadow-md disabled:opacity-60"
          >
            <Send className="w-4 h-4" />
            <span>إرسال</span>
          </button>
        </form>
      </div>
    </div>
  );
};
