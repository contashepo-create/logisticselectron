import React, { useState, useEffect, useRef } from "react";
import {
  Bot,
  Send,
  Terminal,
  Key,
  Users,
  Shield,
  Cloud,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  Zap,
} from "lucide-react";
import type { Company, LicenseInfo } from "@/types";
import { executeTelegramBotCommand } from "@/lib/telegram-bot";
import { getAppSettings, getCompany, getLicenseInfo, saveAppSettings } from "@/lib/storage";

interface Props {
  company: Company;
  license: LicenseInfo;
  onRefreshData: () => void;
}

interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  time: string;
}

export const TelegramBotView: React.FC<Props> = ({ company, license, onRefreshData }) => {
  const [activeTab, setActiveTab] = useState<"terminal" | "generator" | "subscribers" | "worker">("terminal");

  const [inputCommand, setInputCommand] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      sender: "bot",
      text: `🤖 <b>مرحباً بك في محاكي بوت تليجرام وكلاود فلير!</b>\n\nهذه الواجهة مربوطة بمحرك النظام السحابي، ويمكنك إدخال أي أمر لتحكم في النظام فوراً.\n\nجرّب كتابة <code>/start</code> أو <code>/about</code> أو <code>/keygen</code>.`,
      time: new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  // Key Generator State
  const [genTargetClient, setGenTargetClient] = useState(company.client_code);
  const [genPlanType, setGenPlanType] = useState<"monthly" | "yearly" | "open">("monthly");
  const [generatedKey, setGeneratedKey] = useState("");
  const [copiedKey, setCopiedKey] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = inputCommand.trim();
    if (!cmd) return;

    const userMsg: ChatMessage = {
      id: "user_" + Date.now(),
      sender: "user",
      text: cmd,
      time: new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputCommand("");

    // Execute bot logic
    const res = await executeTelegramBotCommand(cmd);

    const botMsg: ChatMessage = {
      id: "bot_" + Date.now(),
      sender: "bot",
      text: res.replyText,
      time: new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, botMsg]);
    onRefreshData();
  };

  const handleQuickCommand = (cmd: string) => {
    setInputCommand(cmd);
  };

  const handleGenerateKey = async () => {
    const res = await executeTelegramBotCommand(`/keygen ${genTargetClient} ${genPlanType}`);
    // Extract key from response
    const match = res.replyText.match(/<code>(LOGIST-[^<]+)<\/code>/);
    if (match && match[1]) {
      setGeneratedKey(match[1]);
    }
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(generatedKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Bot className="w-5 h-5 text-blue-500" />
            <span>بوت تليجرام والتحكم السحابي (Cloudflare + Telegram)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            إدارة المشتركين، إصدار أكواد التفعيل، وتعديل محتويات صفحة «حول التطبيق» والأسعار مباشرة عبر البوت
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4 text-xs font-bold">
        <button
          onClick={() => setActiveTab("terminal")}
          className={`pb-2.5 flex items-center gap-1.5 transition ${
            activeTab === "terminal"
              ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>محاكي أوامر البوت التفاعلي</span>
        </button>

        <button
          onClick={() => setActiveTab("generator")}
          className={`pb-2.5 flex items-center gap-1.5 transition ${
            activeTab === "generator"
              ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Key className="w-4 h-4" />
          <span>أداة توليد أكواد التفعيل (KeyGen)</span>
        </button>

        <button
          onClick={() => setActiveTab("subscribers")}
          className={`pb-2.5 flex items-center gap-1.5 transition ${
            activeTab === "subscribers"
              ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>إدارة المشتركين والأجهزة</span>
        </button>

        <button
          onClick={() => setActiveTab("worker")}
          className={`pb-2.5 flex items-center gap-1.5 transition ${
            activeTab === "worker"
              ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Cloud className="w-4 h-4" />
          <span>كود وربط Cloudflare Worker</span>
        </button>
      </div>

      {/* Tab 1: Terminal Simulator */}
      {activeTab === "terminal" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Main Chat Terminal (3 cols) */}
          <div className="lg:col-span-3 app-card flex flex-col h-[600px] overflow-hidden bg-slate-900 border-slate-800">
            {/* Terminal Header */}
            <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-500"></span>
                  <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                  <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                </div>
                <span className="font-mono font-bold">@LogisticsAccountingBot — Telegram Gateway</span>
              </div>
              <span className="text-[11px] text-emerald-400 font-mono">🟢 متصل ومستعد للأوامر</span>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl p-3 shadow-md ${
                      m.sender === "user"
                        ? "bg-blue-600 text-white rounded-br-none"
                        : "bg-slate-800 text-slate-100 border border-slate-700/80 rounded-bl-none"
                    }`}
                  >
                    <div
                      className="whitespace-pre-wrap leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: m.text }}
                    />
                    <div className="text-[10px] opacity-60 text-left mt-1" dir="ltr">
                      {m.time}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendCommand} className="p-3 bg-slate-950 border-t border-slate-800 flex gap-2">
              <input
                type="text"
                value={inputCommand}
                onChange={(e) => setInputCommand(e.target.value)}
                placeholder="اكتب أمراً مثل: /start أو /about أو /keygen أو /set_name..."
                className="form-input text-xs font-mono bg-slate-900 text-white border-slate-700 placeholder:text-slate-500"
              />
              <button
                type="submit"
                className="btn btn-primary bg-blue-600 hover:bg-blue-700 py-2 px-4 shrink-0 font-bold"
              >
                <Send className="w-4 h-4" />
                <span>إرسال للأمر</span>
              </button>
            </form>
          </div>

          {/* Quick Command Shortcuts (1 col) */}
          <div className="app-card p-4 space-y-3">
            <h4 className="font-bold text-xs text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>أوامر سريعة بنقرة واحدة:</span>
            </h4>

            <div className="space-y-1.5 text-xs">
              <button
                onClick={() => handleQuickCommand("/start")}
                className="w-full text-right p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 font-mono text-[11px] text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700"
              >
                /start (قائمة الأوامر)
              </button>

              <button
                onClick={() => handleQuickCommand("/about")}
                className="w-full text-right p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 font-mono text-[11px] text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700"
              >
                /about (عرض بيانات التطبيق)
              </button>

              <button
                onClick={() => handleQuickCommand(`/keygen ${company.client_code} monthly`)}
                className="w-full text-right p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 font-mono text-[11px] text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-700"
              >
                /keygen (توليد كود شهري)
              </button>

              <button
                onClick={() => handleQuickCommand(`/keygen ${company.client_code} yearly`)}
                className="w-full text-right p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 font-mono text-[11px] text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-700"
              >
                /keygen (توليد كود سنوي)
              </button>

              <button
                onClick={() => handleQuickCommand("/subscribers")}
                className="w-full text-right p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 font-mono text-[11px] text-purple-600 dark:text-purple-400 border border-slate-200 dark:border-slate-700"
              >
                /subscribers (قائمة المشتركين)
              </button>

              <button
                onClick={() => handleQuickCommand(`/activate ${company.client_code} 30`)}
                className="w-full text-right p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 font-mono text-[11px] text-amber-600 dark:text-amber-400 border border-slate-200 dark:border-slate-700"
              >
                /activate (تمديد 30 يوم)
              </button>

              <button
                onClick={() => handleQuickCommand(`/reply ${company.client_code} أهلاً بك، تم استلام استفسارك وسيتم التواصل معك.`)}
                className="w-full text-right p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 font-mono text-[11px] text-rose-600 dark:text-rose-400 border border-slate-200 dark:border-slate-700"
              >
                /reply (رد فوري للعميل)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Key Generator */}
      {activeTab === "generator" && (
        <div className="app-card p-6 max-w-2xl mx-auto space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-xl">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
                أداة توليد وتصدير أكواد التفعيل الفورية
              </h3>
              <p className="text-xs text-slate-400">إصدار تراخيص أوفلاين مدعومة بخوارزمية تحقق مشفرة</p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                كود العميل المستهدف:
              </label>
              <input
                type="text"
                value={genTargetClient}
                onChange={(e) => setGenTargetClient(e.target.value)}
                placeholder="مثال: CL-892147"
                className="form-input text-xs font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                نوع باقة الاشتراك:
              </label>
              <select
                value={genPlanType}
                onChange={(e) => setGenPlanType(e.target.value as any)}
                className="form-select text-xs font-bold"
              >
                <option value="monthly">باقة شهرية — 30 يوماً (100 ر.س)</option>
                <option value="yearly">باقة سنوية — 365 يوماً (1000 ر.س مع خصم)</option>
                <option value="open">ترخيص مفتوح مدى الحياة (حصري للمطور)</option>
              </select>
            </div>

            <button
              onClick={handleGenerateKey}
              className="btn btn-primary w-full py-2.5 text-sm font-bold flex items-center justify-center gap-2 shadow-md"
            >
              <Sparkles className="w-4 h-4" />
              <span>توليد كود التفعيل الآن</span>
            </button>

            {generatedKey && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl space-y-2 animate-in fade-in">
                <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  كود التفعيل الصادر بنجاح:
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="font-mono text-base font-extrabold text-slate-900 dark:text-white bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 flex-1 text-center select-all">
                    {generatedKey}
                  </div>
                  <button
                    onClick={handleCopyKey}
                    className="btn btn-primary bg-emerald-600 hover:bg-emerald-700 py-2.5 px-4 font-bold flex items-center gap-1.5 shrink-0"
                  >
                    {copiedKey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedKey ? "تم النسخ" : "نسخ الكود"}</span>
                  </button>
                </div>
                <div className="text-[11px] text-slate-500">
                  قم بإرسال هذا الكود إلى العميل ليقوم بإدخاله في نافذة تفعيل الاشتراك.
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Subscribers Manager */}
      {activeTab === "subscribers" && (
        <div className="app-card overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
              قائمة المشتركين في النظام
            </h3>
            <span className="text-xs text-slate-400">تحديث فوري للحالة والتراخيص</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead className="bg-slate-100 dark:bg-slate-800/80 font-bold">
                <tr>
                  <th className="p-3">اسم المنشأة / الشركة</th>
                  <th className="p-3">كود العميل</th>
                  <th className="p-3">معرف الجهاز (Device ID)</th>
                  <th className="p-3">الباقة</th>
                  <th className="p-3">الحالة</th>
                  <th className="p-3">تاريخ الانتهاء</th>
                  <th className="p-3 text-center">التحكم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                <tr>
                  <td className="p-3 font-bold">{company.name}</td>
                  <td className="p-3 font-mono text-blue-600 font-bold">{company.client_code}</td>
                  <td className="p-3 font-mono text-slate-400">{license.deviceId}</td>
                  <td className="p-3 font-semibold">
                    {license.isTrial
                      ? "تجريبية (7 أيام)"
                      : license.planType === "open"
                      ? "مفتوح دائم"
                      : license.planType === "yearly"
                      ? "سنوي"
                      : "شهري"}
                  </td>
                  <td className="p-3">
                    <span
                      className={`badge ${
                        license.isTrial
                          ? "badge-amber"
                          : license.isExpired
                          ? "badge-red"
                          : "badge-green"
                      }`}
                    >
                      {license.isTrial ? "تجريبي" : license.isExpired ? "منتهي" : "نشط ومفعّل"}
                    </span>
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-300">
                    {license.expiryDate ? license.expiryDate.slice(0, 10) : "—"}
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => {
                        executeTelegramBotCommand(`/activate ${company.client_code} 30`);
                        onRefreshData();
                      }}
                      className="btn py-1 px-2.5 text-[11px] font-bold text-emerald-600 hover:bg-emerald-50"
                    >
                      تمديد 30 يوم
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Cloudflare Worker Code & Deployment */}
      {activeTab === "worker" && (
        <div className="app-card p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Cloud className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="font-bold text-base">تعليمات نشر Cloudflare Worker وبوت تليجرام</h3>
              <p className="text-xs text-slate-400">ملف الباك إند موجود داخل المسار <code>cloudflare-worker/worker.js</code></p>
            </div>
          </div>

          <div className="space-y-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            <p>
              1. قم بإنشاء بوت جديد من <b>@BotFather</b> في تليجرام واحصل على <b>TELEGRAM_BOT_TOKEN</b>.
            </p>
            <p>
              2. احصل على <b>TELEGRAM_ADMIN_CHAT_ID</b> (معرف الدردشة الخاص بك).
            </p>
            <p>
              3. انشر الوركر إلى Cloudflare بواسطة الأمر:
            </p>
            <pre className="bg-slate-900 text-emerald-400 p-3 rounded-lg font-mono text-xs overflow-x-auto" dir="ltr">
              npx wrangler deploy
            </pre>
            <p>
              4. عيّن الويب هوك لتليجرام:
            </p>
            <pre className="bg-slate-900 text-blue-400 p-3 rounded-lg font-mono text-xs overflow-x-auto" dir="ltr">
              https://api.telegram.org/bot&lt;TOKEN&gt;/setWebhook?url=https://your-worker.workers.dev/telegram-webhook
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
