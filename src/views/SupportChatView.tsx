import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Send,
  Headphones,
  CheckCheck,
  Bot,
  User,
  Clock,
  Sparkles,
} from "lucide-react";
import type { Company, SupportMessage } from "@/types";
import { getSupportMessages, sendSupportMessage } from "@/lib/storage";

interface Props {
  company: Company;
  onRefreshData: () => void;
}

export const SupportChatView: React.FC<Props> = ({ company, onRefreshData }) => {
  const [messages, setMessages] = useState<SupportMessage[]>(() => getSupportMessages());
  const [inputBody, setInputBody] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputBody.trim()) return;

    try {
      const msg = sendSupportMessage(inputBody.trim(), "client");
      setMessages(getSupportMessages());
      setInputBody("");
      onRefreshData();

      // Simulate automatic bot acknowledgment if offline
      setTimeout(() => {
        setMessages(getSupportMessages());
      }, 500);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <span>قناة التواصل المباشر مع المطور والدعم الفني</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            تصل رسائلك مباشرة لبوت تليجرام المطور وتستقبل الردود فوراً داخل التطبيق
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>خدمة العملاء متصلة ومستعدة للمساعدة</span>
        </div>
      </div>

      {/* Main Chat Window */}
      <div className="app-card h-[600px] flex flex-col overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
        {/* Chat Titlebar */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm">فريق الدعم الفني والمطور (محمد عبده)</div>
              <div className="text-[11px] text-slate-400">مربوط ببوت تليجرام للإشعار الفوري</div>
            </div>
          </div>
          <div className="text-xs text-slate-400">
            كود العميل: <b dir="ltr" className="text-blue-400 font-mono">{company.client_code}</b>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-slate-950/50 text-xs">
          {messages.map((m) => {
            const isClient = m.sender === "client";
            return (
              <div
                key={m.id}
                className={`flex ${isClient ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl p-3.5 shadow-sm space-y-1 ${
                    isClient
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700/80 rounded-bl-none"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 text-[11px] opacity-75 mb-1 font-semibold">
                    <span>{m.sender_name}</span>
                    <span dir="ltr">
                      {new Date(m.created_at).toLocaleTimeString("ar-SA", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <p className="leading-relaxed whitespace-pre-wrap">{m.body}</p>

                  <div className="flex justify-end pt-1">
                    <CheckCheck className={`w-3.5 h-3.5 ${isClient ? "text-blue-200" : "text-emerald-500"}`} />
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex gap-2">
          <input
            type="text"
            value={inputBody}
            onChange={(e) => setInputBody(e.target.value)}
            placeholder="اكتب استفسارك، رسالتك، أو طلب تفعيل الاشتراك هنا..."
            className="form-input text-xs py-2.5"
            required
          />
          <button
            type="submit"
            className="btn btn-primary py-2.5 px-5 font-bold flex items-center gap-1.5 shrink-0 shadow-md"
          >
            <Send className="w-4 h-4" />
            <span>إرسال</span>
          </button>
        </form>
      </div>
    </div>
  );
};
