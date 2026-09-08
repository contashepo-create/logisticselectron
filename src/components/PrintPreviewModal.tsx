import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Printer,
  Download,
  Palette,
  LayoutTemplate,
  Check,
  Eye,
} from "lucide-react";
import type { InvoicePrintTemplate } from "@/types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  htmlContent: string;
  template?: InvoicePrintTemplate;
  onChangeTemplate?: (tpl: InvoicePrintTemplate) => void;
  accentColor?: string;
  onChangeAccentColor?: (color: string) => void;
  showTemplatePicker?: boolean;
}

export const PrintPreviewModal: React.FC<Props> = ({
  isOpen,
  onClose,
  title,
  htmlContent,
  template = "modern",
  onChangeTemplate,
  accentColor = "#2563eb",
  onChangeAccentColor,
  showTemplatePicker = true,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current && htmlContent) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(`
          <!DOCTYPE html>
          <html lang="ar" dir="rtl">
            <head>
              <meta charset="UTF-8">
              <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700;800&display=swap" rel="stylesheet">
              <style>
                * { box-sizing: border-box; }
                body { margin: 0; padding: 0; font-family: 'IBM Plex Sans Arabic', sans-serif; }
                @media print {
                  body { margin: 0; padding: 0; }
                  @page { margin: 10mm; }
                }
              </style>
            </head>
            <body>
              ${htmlContent}
            </body>
          </html>
        `);
        doc.close();
      }
    }
  }, [htmlContent, isOpen]);

  if (!isOpen) return null;

  const handlePrint = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.focus();
      iframeRef.current.contentWindow.print();
    }
  };

  const templates: { id: InvoicePrintTemplate; name: string; tag: string }[] = [
    { id: "modern", name: "عصري حديث (Modern Clean)", tag: "افتراضي" },
    { id: "classic", name: "كلاسيكي رسمي (Classic Official)", tag: "معتمد" },
    { id: "zatca", name: "ضريبي معتمد (ZATCA Standard)", tag: "فوترة زاتكا" },
    { id: "logistics", name: "شحن ونقل لوجستي (Logistics Cargo)", tag: "تفصيلي" },
    { id: "thermal", name: "إيصال كاشير حراري (Thermal 80mm)", tag: "طابعات حرارية" },
    { id: "royal", name: "ملكي أنيق (Royal Elegant)", tag: "فاخر" },
  ];

  const colors = ["#2563eb", "#059669", "#7c3aed", "#d97706", "#dc2626", "#0f172a"];

  return (
    <div className="modal-overlay">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden shadow-2xl relative">
        {/* Header Toolbar */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between gap-4 shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Eye className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm md:text-base">{title}</h3>
              <p className="text-xs text-slate-400">معاينة المستند والطباعة والتصدير</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Direct Print Button */}
            <button
              onClick={handlePrint}
              className="btn btn-primary text-xs py-2 px-4 flex items-center gap-1.5 shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة المستند</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Secondary Options Bar (Templates & Theme Colors) */}
        {showTemplatePicker && onChangeTemplate && (
          <div className="bg-slate-100 dark:bg-slate-800/80 px-5 py-2.5 border-b border-slate-200 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs">
            {/* Templates Selector */}
            <div className="flex items-center gap-2 overflow-x-auto py-1">
              <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <LayoutTemplate className="w-3.5 h-3.5" />
                القالب:
              </span>
              {templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onChangeTemplate(t.id)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 shrink-0 ${
                    template === t.id
                      ? "bg-blue-600 text-white font-bold shadow-sm"
                      : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span>{t.name.split(" ")[0]}</span>
                  <span className="text-[10px] opacity-75">({t.tag})</span>
                </button>
              ))}
            </div>

            {/* Colors */}
            {onChangeAccentColor && (
              <div className="flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-slate-500" />
                <span className="font-medium text-slate-600 dark:text-slate-400">اللون:</span>
                <div className="flex gap-1.5">
                  {colors.map((c) => (
                    <button
                      key={c}
                      onClick={() => onChangeAccentColor(c)}
                      style={{ backgroundColor: c }}
                      className={`w-5 h-5 rounded-full border-2 transition ${
                        accentColor === c ? "border-white ring-2 ring-blue-500 scale-110" : "border-transparent"
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Document Preview Frame */}
        <div className="flex-1 bg-slate-200 dark:bg-slate-950/60 p-4 overflow-auto flex justify-center">
          <div
            className={`bg-white rounded-lg shadow-xl overflow-hidden border border-slate-300 ${
              template === "thermal" ? "w-[360px]" : "w-full max-w-[840px]"
            } h-fit min-h-full`}
          >
            <iframe
              ref={iframeRef}
              title="Document Print Preview"
              className="w-full min-h-[900px] border-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
