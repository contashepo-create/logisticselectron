// محرك قوالب الطباعة الفائقة (6 قوالب فواتير + قالب التقارير الموحد + قوالب السندات والرواتب)

import type {
  Bank,
  Cashbox,
  Company,
  CreditDebitNote,
  Customer,
  Employee,
  EmployeeDeduction,
  Invoice,
  InvoicePrintTemplate,
  InvoiceTrip,
  PaymentVoucher,
  Payroll,
  PrintSettings,
  PurchaseInvoice,
  ReceiptVoucher,
  Supplier,
} from "@/types";
import { formatMoney } from "./format";
import { numberToArabicWords } from "./words";
import { buildZatcaQr, generateQrDataUrl } from "./zatca";

function esc(str: unknown): string {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export const DEFAULT_PRINT_SETTINGS: PrintSettings = {
  template: "modern",
  accent_color: "#2563eb",
  show_logo: true,
  logo_url: "",
  show_qr: true,
  label_language: "both",
  header_title: "فاتورة ضريبية",
  footer_text: "شكراً لتعاملكم معنا — نسعد بخدمتكم دائماً",
  show_terms: true,
  terms_text: "تعتبر هذه الفاتورة مستحقة السداد وفقاً للشروط المتفق عليها. البضاعة المنقولة تخضع لشروط وثيقة النقل المعتمدة.",
};

// ---------------------------------------------------------------------------
// 1. توليد HTML لفاتورة النقل بالقوالب الستة
// ---------------------------------------------------------------------------

export async function renderInvoiceHtml(
  invoice: Invoice,
  company: Company,
  customer: Customer | null,
  settings: PrintSettings = DEFAULT_PRINT_SETTINGS
): Promise<string> {
  const accent = settings.accent_color || "#2563eb";
  const vatRate = Number(invoice.vat_rate ?? company.vat_rate ?? 15);
  const trips = invoice.trips || [];

  let subtotal = 0;
  let totalReimbursedExpenses = 0;
  for (const t of trips) {
    subtotal += Number(t.price) || 0;
    for (const exp of t.expenses || []) {
      if (exp.source === "customer") {
        totalReimbursedExpenses += Number(exp.amount) || 0;
      }
    }
  }
  const taxableAmount = subtotal + totalReimbursedExpenses;
  const vatAmount = (taxableAmount * vatRate) / 100;
  const grandTotal = taxableAmount + vatAmount;

  // Generate ZATCA QR
  const qrString = buildZatcaQr({
    sellerName: company.name,
    vatNumber: company.tax_number || "300000000000003",
    timestamp: invoice.date + "T12:00:00Z",
    totalWithVat: grandTotal,
    vatAmount: vatAmount,
  });

  const qrDataUrl = await generateQrDataUrl(qrString);
  const amountWords = numberToArabicWords(grandTotal, company.currency || "ريال سعودي");

  const template = settings.template || "modern";

  switch (template) {
    case "classic":
      return renderClassicInvoice(invoice, company, customer, settings, {
        subtotal,
        totalReimbursedExpenses,
        taxableAmount,
        vatAmount,
        grandTotal,
        amountWords,
        qrDataUrl,
        accent,
      });

    case "zatca":
      return renderZatcaInvoice(invoice, company, customer, settings, {
        subtotal,
        totalReimbursedExpenses,
        taxableAmount,
        vatAmount,
        grandTotal,
        amountWords,
        qrDataUrl,
        accent,
      });

    case "thermal":
      return renderThermalInvoice(invoice, company, customer, settings, {
        subtotal,
        totalReimbursedExpenses,
        taxableAmount,
        vatAmount,
        grandTotal,
        amountWords,
        qrDataUrl,
      });

    case "logistics":
      return renderLogisticsInvoice(invoice, company, customer, settings, {
        subtotal,
        totalReimbursedExpenses,
        taxableAmount,
        vatAmount,
        grandTotal,
        amountWords,
        qrDataUrl,
        accent,
      });

    case "royal":
      return renderRoyalInvoice(invoice, company, customer, settings, {
        subtotal,
        totalReimbursedExpenses,
        taxableAmount,
        vatAmount,
        grandTotal,
        amountWords,
        qrDataUrl,
        accent,
      });

    case "modern":
    default:
      return renderModernInvoice(invoice, company, customer, settings, {
        subtotal,
        totalReimbursedExpenses,
        taxableAmount,
        vatAmount,
        grandTotal,
        amountWords,
        qrDataUrl,
        accent,
      });
  }
}

// -------------------- Template 1: Classic Official --------------------
function renderClassicInvoice(
  invoice: Invoice,
  company: Company,
  customer: Customer | null,
  settings: PrintSettings,
  calc: any
): string {
  return `
  <div style="font-family:'IBM Plex Sans Arabic', Tahoma, sans-serif; direction:rtl; color:#1e293b; padding:24px; background:#fff; line-height:1.6;">
    <div style="border:2px solid ${calc.accent}; padding:18px; border-radius:8px;">
      <!-- Header -->
      <table style="width:100%; border-bottom:2px solid ${calc.accent}; padding-bottom:12px; margin-bottom:16px;">
        <tr>
          <td style="width:60%; vertical-align:top;">
            <div style="font-size:22px; font-weight:800; color:${calc.accent};">${esc(company.name)}</div>
            <div style="font-size:12px; color:#64748b; margin-top:3px;">خدمات النقل البري واللوجستيات والشحن العام</div>
            <div style="font-size:12px; margin-top:4px;"><b>الرقم الضريبي:</b> <span dir="ltr">${esc(company.tax_number || "—")}</span> | <b>السجل التجاري:</b> <span dir="ltr">${esc(company.commercial_reg || "—")}</span></div>
            <div style="font-size:12px;"><b>العنوان:</b> ${esc(company.address || "—")} | <b>الهاتف:</b> <span dir="ltr">${esc(company.phone || "—")}</span></div>
          </td>
          <td style="width:40%; text-align:left; vertical-align:top;">
            <div style="font-size:20px; font-weight:700; color:#0f172a;">فاتورة ضريبية رسمية</div>
            <div style="font-size:12px; color:#64748b;" dir="ltr">TAX INVOICE</div>
            <div style="margin-top:6px; font-size:13px;"><b>رقم الفاتورة:</b> <span style="font-size:16px; font-weight:700; color:${calc.accent};">#${invoice.number}</span></div>
            <div style="font-size:13px;"><b>تاريخ الإصدار:</b> ${esc(invoice.date)}</div>
          </td>
        </tr>
      </table>

      <!-- Customer Info Box -->
      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:12px; margin-bottom:16px;">
        <table style="width:100%; font-size:13px;">
          <tr>
            <td style="width:50%;"><b>بيانات العميل (المشتري):</b> ${esc(customer?.name || "عميل عام")}</td>
            <td style="width:50%;"><b>الرقم الضريبي للعميل:</b> <span dir="ltr">${esc(customer?.tax_number || "غير مسجل")}</span></td>
          </tr>
          <tr>
            <td><b>العنوان:</b> ${esc(customer?.address || customer?.city || "—")}</td>
            <td><b>الهاتف:</b> <span dir="ltr">${esc(customer?.phone || "—")}</span></td>
          </tr>
        </table>
      </div>

      <!-- Trips Table -->
      <table style="width:100%; border-collapse:collapse; font-size:12.5px; margin-bottom:16px;">
        <thead>
          <tr style="background:${calc.accent}; color:#fff;">
            <th style="padding:8px; border:1px solid ${calc.accent}; width:35px;">#</th>
            <th style="padding:8px; border:1px solid ${calc.accent}; text-align:right;">خط السير / النقلة</th>
            <th style="padding:8px; border:1px solid ${calc.accent}; text-align:center;">الشاحنة والسائق</th>
            <th style="padding:8px; border:1px solid ${calc.accent}; text-align:center; width:60px;">العدد</th>
            <th style="padding:8px; border:1px solid ${calc.accent}; text-align:left; width:90px;">سعر النقلة</th>
            <th style="padding:8px; border:1px solid ${calc.accent}; text-align:left; width:100px;">الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          ${(invoice.trips || []).map((t, idx) => `
            <tr style="background:${idx % 2 === 0 ? "#ffffff" : "#f8fafc"};">
              <td style="padding:8px; border:1px solid #e2e8f0; text-align:center;">${idx + 1}</td>
              <td style="padding:8px; border:1px solid #e2e8f0;">
                <b>من:</b> ${esc(t.from_loc)} <b>إلى:</b> ${esc(t.to_loc)}
                ${t.container_numbers?.length ? `<div style="font-size:11px; color:#64748b;">حاويات: ${t.container_numbers.join(", ")}</div>` : ""}
              </td>
              <td style="padding:8px; border:1px solid #e2e8f0; text-align:center;">
                ${esc(t.vehicle_name || "—")}<br><span style="font-size:11px; color:#64748b;">${esc(t.driver_name || "")}</span>
              </td>
              <td style="padding:8px; border:1px solid #e2e8f0; text-align:center;">${t.qty}</td>
              <td style="padding:8px; border:1px solid #e2e8f0; text-align:left;">${formatMoney(t.unit_price, "")}</td>
              <td style="padding:8px; border:1px solid #e2e8f0; text-align:left; font-weight:600;">${formatMoney(t.price, "")}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>

      <!-- Totals & QR Grid -->
      <table style="width:100%; border-top:1px solid #e2e8f0; padding-top:10px;">
        <tr>
          <td style="width:130px; text-align:center; vertical-align:top;">
            <img src="${calc.qrDataUrl}" style="width:115px; height:115px; border:1px solid #cbd5e1; padding:3px; border-radius:6px;" alt="ZATCA QR" />
            <div style="font-size:10px; color:#64748b; margin-top:2px;">رمز الفاتورة الضريبية</div>
          </td>
          <td style="vertical-align:top; padding:0 16px;">
            <div style="font-size:12.5px; background:#f1f5f9; padding:8px; border-radius:6px; margin-bottom:6px;">
              <b>المبلغ كتابة:</b> ${esc(calc.amountWords)}
            </div>
            ${invoice.notes ? `<div style="font-size:12px; color:#475569;"><b>ملاحظات:</b> ${esc(invoice.notes)}</div>` : ""}
          </td>
          <td style="width:260px; vertical-align:top;">
            <table style="width:100%; font-size:13px; border-collapse:collapse;">
              <tr>
                <td style="padding:4px 0;">المجموع قبل الضريبة:</td>
                <td style="text-align:left; font-weight:600;">${formatMoney(calc.taxableAmount, company.currency)}</td>
              </tr>
              <tr>
                <td style="padding:4px 0;">ضريبة القيمة المضافة (${invoice.vat_rate}%):</td>
                <td style="text-align:left; font-weight:600; color:${calc.accent};">${formatMoney(calc.vatAmount, company.currency)}</td>
              </tr>
              <tr style="border-top:2px solid #0f172a; font-size:15px; font-weight:800;">
                <td style="padding:8px 0;">الإجمالي النهائي المستحق:</td>
                <td style="text-align:left; color:${calc.accent};">${formatMoney(calc.grandTotal, company.currency)}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Signatures Footer -->
      <div style="margin-top:24px; padding-top:12px; border-top:1px dashed #cbd5e1; display:flex; justify-content:space-between; text-align:center; font-size:12px; color:#64748b;">
        <div style="width:200px;">
          <div>المستلم / العميل</div>
          <div style="margin-top:28px; border-bottom:1px solid #94a3b8;"></div>
        </div>
        <div style="width:200px;">
          <div>المحاسب المسؤول</div>
          <div style="margin-top:28px; border-bottom:1px solid #94a3b8;"></div>
        </div>
        <div style="width:200px;">
          <div>ختم الشركة والاعتماد</div>
          <div style="margin-top:28px; border-bottom:1px solid #94a3b8;"></div>
        </div>
      </div>
    </div>
  </div>`;
}

// -------------------- Template 2: Modern Clean --------------------
function renderModernInvoice(
  invoice: Invoice,
  company: Company,
  customer: Customer | null,
  settings: PrintSettings,
  calc: any
): string {
  return `
  <div style="font-family:'IBM Plex Sans Arabic', Tahoma, sans-serif; direction:rtl; color:#0f172a; padding:24px; background:#fff; line-height:1.6;">
    <!-- Top Header Banner -->
    <div style="background:linear-gradient(135deg, ${calc.accent} 0%, #1e1b4b 100%); color:#fff; border-radius:12px; padding:20px; margin-bottom:20px;">
      <table style="width:100%;">
        <tr>
          <td style="vertical-align:middle;">
            <div style="font-size:24px; font-weight:800; letter-spacing:-0.5px;">${esc(company.name)}</div>
            <div style="font-size:12.5px; opacity:0.9; margin-top:4px;">حلول النقل الذكي والشحن اللوجستي المتكامل</div>
            <div style="font-size:12px; opacity:0.85; margin-top:4px;">
              الرقم الضريبي: <span dir="ltr">${esc(company.tax_number || "—")}</span> | السجل التجاري: <span dir="ltr">${esc(company.commercial_reg || "—")}</span>
            </div>
          </td>
          <td style="text-align:left; vertical-align:middle;">
            <div style="background:rgba(255,255,255,0.15); border:1px solid rgba(255,255,255,0.25); border-radius:8px; padding:10px 16px; display:inline-block; text-align:center;">
              <div style="font-size:11px; text-transform:uppercase; opacity:0.9;">فاتورة نقل إلكترونية</div>
              <div style="font-size:20px; font-weight:800; margin:2px 0;">#${invoice.number}</div>
              <div style="font-size:12px; opacity:0.9;">${esc(invoice.date)}</div>
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Client & Info Cards -->
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:20px;">
      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:14px;">
        <div style="font-size:11px; font-weight:700; color:${calc.accent}; text-transform:uppercase; margin-bottom:6px;">العميل المستفيد</div>
        <div style="font-size:15px; font-weight:700;">${esc(customer?.name || "عميل نقدي")}</div>
        <div style="font-size:12.5px; color:#64748b; margin-top:4px;">الرقم الضريبي: <span dir="ltr">${esc(customer?.tax_number || "—")}</span></div>
        <div style="font-size:12.5px; color:#64748b;">العنوان: ${esc(customer?.address || customer?.city || "المملكة العربية السعودية")}</div>
        <div style="font-size:12.5px; color:#64748b;">الهاتف: <span dir="ltr">${esc(customer?.phone || "—")}</span></div>
      </div>
      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:14px;">
        <div style="font-size:11px; font-weight:700; color:${calc.accent}; text-transform:uppercase; margin-bottom:6px;">تفاصيل السداد والخدمة</div>
        <div style="font-size:12.5px; margin-top:2px;"><b>حالة الفاتورة:</b> <span style="background:#dcfce7; color:#15803d; font-weight:700; padding:2px 8px; border-radius:12px; font-size:11px;">معتمدة</span></div>
        <div style="font-size:12.5px; margin-top:4px;"><b>العملة:</b> ${esc(company.currency || "ريال سعودي")}</div>
        <div style="font-size:12.5px; margin-top:4px;"><b>هاتف الشركة:</b> <span dir="ltr">${esc(company.phone || "—")}</span></div>
        <div style="font-size:12.5px; margin-top:4px;"><b>البريد:</b> <span dir="ltr">${esc(company.email || "—")}</span></div>
      </div>
    </div>

    <!-- Modern Items Table -->
    <table style="width:100%; border-collapse:separate; border-spacing:0; margin-bottom:20px; border-radius:10px; overflow:hidden; border:1px solid #e2e8f0;">
      <thead>
        <tr style="background:#f1f5f9; color:#334155; font-size:12.5px;">
          <th style="padding:10px 14px; text-align:right;">بيان الرحلة وخط السير</th>
          <th style="padding:10px 14px; text-align:center;">بيانات الشاحنة</th>
          <th style="padding:10px 14px; text-align:center;">الكمية</th>
          <th style="padding:10px 14px; text-align:left;">سعر الوحدة</th>
          <th style="padding:10px 14px; text-align:left;">المجموع الصافي</th>
        </tr>
      </thead>
      <tbody>
        ${(invoice.trips || []).map((t, idx) => `
          <tr style="border-top:1px solid #e2e8f0; font-size:13px; background:${idx % 2 === 0 ? "#fff" : "#fafafa"};">
            <td style="padding:12px 14px; border-top:1px solid #e2e8f0;">
              <div style="font-weight:700; color:#1e293b;">من ${esc(t.from_loc)} إلى ${esc(t.to_loc)}</div>
              ${t.container_numbers?.length ? `<div style="font-size:11.5px; color:#64748b; margin-top:2px;">أرقام الحاويات: <b>${t.container_numbers.join("، ")}</b></div>` : ""}
              ${t.notes ? `<div style="font-size:11.5px; color:#94a3b8;">${esc(t.notes)}</div>` : ""}
            </td>
            <td style="padding:12px 14px; border-top:1px solid #e2e8f0; text-align:center;">
              <div><b>${esc(t.vehicle_name || "—")}</b></div>
              <div style="font-size:11.5px; color:#64748b;">${esc(t.driver_name || "")}</div>
            </td>
            <td style="padding:12px 14px; border-top:1px solid #e2e8f0; text-align:center; font-weight:700;">${t.qty}</td>
            <td style="padding:12px 14px; border-top:1px solid #e2e8f0; text-align:left;">${formatMoney(t.unit_price, "")}</td>
            <td style="padding:12px 14px; border-top:1px solid #e2e8f0; text-align:left; font-weight:700; color:${calc.accent};">${formatMoney(t.price, "")}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>

    <!-- Totals and QR Summary -->
    <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:18px; display:flex; justify-content:space-between; align-items:center;">
      <div style="display:flex; align-items:center; gap:16px;">
        <img src="${calc.qrDataUrl}" style="width:110px; height:110px; border-radius:8px; border:1px solid #cbd5e1; background:#fff; padding:4px;" alt="QR" />
        <div>
          <div style="font-size:13px; font-weight:700; color:#0f172a;">المبلغ المستحق بالكلمات:</div>
          <div style="font-size:12.5px; color:${calc.accent}; font-weight:600; margin-top:3px;">${esc(calc.amountWords)}</div>
          <div style="font-size:11.5px; color:#64748b; margin-top:6px;">نظام الفاتورة الضريبية وفق اشتراطات هيئة الزكاة والضريبة والجمارك</div>
        </div>
      </div>
      <div style="width:260px;">
        <div style="display:flex; justify-content:space-between; font-size:13px; padding:4px 0; color:#64748b;">
          <span>المجموع الصافي:</span>
          <span style="font-weight:600; color:#0f172a;">${formatMoney(calc.taxableAmount, company.currency)}</span>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:13px; padding:4px 0; color:#64748b;">
          <span>ضريبة القيمة المضافة (${invoice.vat_rate}%):</span>
          <span style="font-weight:600; color:${calc.accent};">${formatMoney(calc.vatAmount, company.currency)}</span>
        </div>
        <div style="border-top:2px solid ${calc.accent}; margin-top:8px; padding-top:8px; display:flex; justify-content:space-between; font-size:16px; font-weight:800; color:#0f172a;">
          <span>الإجمالي شامل الضريبة:</span>
          <span style="color:${calc.accent};">${formatMoney(calc.grandTotal, company.currency)}</span>
        </div>
      </div>
    </div>
  </div>`;
}

// -------------------- Template 3: ZATCA Standard --------------------
function renderZatcaInvoice(
  invoice: Invoice,
  company: Company,
  customer: Customer | null,
  settings: PrintSettings,
  calc: any
): string {
  return `
  <div style="font-family:'IBM Plex Sans Arabic', Tahoma, sans-serif; direction:rtl; color:#1e293b; padding:20px; background:#fff; font-size:12px; line-height:1.5;">
    <div style="text-align:center; border-bottom:2px solid #000; padding-bottom:8px; margin-bottom:12px;">
      <div style="font-size:20px; font-weight:900;">فاتورة ضريبية / TAX INVOICE</div>
      <div style="font-size:14px; font-weight:700; color:#475569;">${esc(company.name)}</div>
    </div>

    <!-- Bilingual Info Grid -->
    <table style="width:100%; border:1px solid #000; border-collapse:collapse; margin-bottom:12px; font-size:11.5px;">
      <tr>
        <td style="width:50%; padding:6px; border:1px solid #000; vertical-align:top;">
          <b>بيانات المورد (البائع) / Seller:</b><br>
          الاسم: ${esc(company.name)}<br>
          الرقم الضريبي (VAT No): <b dir="ltr">${esc(company.tax_number || "—")}</b><br>
          السجل التجاري (CR): <b dir="ltr">${esc(company.commercial_reg || "—")}</b><br>
          العنوان: ${esc(company.address || "المملكة العربية السعودية")}
        </td>
        <td style="width:50%; padding:6px; border:1px solid #000; vertical-align:top;">
          <b>بيانات العميل (المشتري) / Buyer:</b><br>
          الاسم: ${esc(customer?.name || "عميل نقدي")}<br>
          الرقم الضريبي (VAT No): <b dir="ltr">${esc(customer?.tax_number || "—")}</b><br>
          السجل التجاري (CR): <b dir="ltr">${esc(customer?.commercial_reg || "—")}</b><br>
          العنوان: ${esc(customer?.address || customer?.city || "—")}
        </td>
      </tr>
      <tr style="background:#f1f5f9;">
        <td style="padding:6px; border:1px solid #000;"><b>رقم الفاتورة / Invoice No:</b> <b style="font-size:13px;">#${invoice.number}</b></td>
        <td style="padding:6px; border:1px solid #000;"><b>تاريخ الفاتورة / Issue Date:</b> ${esc(invoice.date)}</td>
      </tr>
    </table>

    <!-- ZATCA Line Items Table -->
    <table style="width:100%; border-collapse:collapse; border:1px solid #000; margin-bottom:12px; font-size:11px;">
      <thead>
        <tr style="background:#e2e8f0; text-align:center;">
          <th style="border:1px solid #000; padding:6px;">#</th>
          <th style="border:1px solid #000; padding:6px;">طبيعة السلع أو الخدمات<br><span style="font-size:9px;">Nature of Goods/Services</span></th>
          <th style="border:1px solid #000; padding:6px;">الكمية<br><span style="font-size:9px;">Qty</span></th>
          <th style="border:1px solid #000; padding:6px;">سعر الوحدة<br><span style="font-size:9px;">Unit Price</span></th>
          <th style="border:1px solid #000; padding:6px;">المبلغ الخاضع للضريبة<br><span style="font-size:9px;">Taxable Amount</span></th>
          <th style="border:1px solid #000; padding:6px;">نسبة الضريبة<br><span style="font-size:9px;">VAT Rate</span></th>
          <th style="border:1px solid #000; padding:6px;">مبلغ الضريبة<br><span style="font-size:9px;">VAT Amount</span></th>
          <th style="border:1px solid #000; padding:6px;">الإجمالي شامل الضريبة<br><span style="font-size:9px;">Total with VAT</span></th>
        </tr>
      </thead>
      <tbody>
        ${(invoice.trips || []).map((t, idx) => {
          const tripSub = Number(t.price) || 0;
          const tripVat = (tripSub * invoice.vat_rate) / 100;
          const tripTotal = tripSub + tripVat;
          return `
          <tr style="text-align:center;">
            <td style="border:1px solid #000; padding:5px;">${idx + 1}</td>
            <td style="border:1px solid #000; padding:5px; text-align:right;">
              نقل بضائع من ${esc(t.from_loc)} إلى ${esc(t.to_loc)}
              ${t.container_numbers?.length ? `<br><span style="font-size:9.5px; color:#475569;">حاويات: ${t.container_numbers.join(", ")}</span>` : ""}
            </td>
            <td style="border:1px solid #000; padding:5px;">${t.qty}</td>
            <td style="border:1px solid #000; padding:5px;">${formatMoney(t.unit_price, "")}</td>
            <td style="border:1px solid #000; padding:5px;">${formatMoney(tripSub, "")}</td>
            <td style="border:1px solid #000; padding:5px;">${invoice.vat_rate}%</td>
            <td style="border:1px solid #000; padding:5px;">${formatMoney(tripVat, "")}</td>
            <td style="border:1px solid #000; padding:5px; font-weight:700;">${formatMoney(tripTotal, "")}</td>
          </tr>
        `;
        }).join("")}
      </tbody>
    </table>

    <!-- Totals Table with QR -->
    <table style="width:100%; border:1px solid #000; border-collapse:collapse;">
      <tr>
        <td style="width:130px; text-align:center; padding:8px; border-left:1px solid #000;">
          <img src="${calc.qrDataUrl}" style="width:110px; height:110px;" alt="ZATCA QR" />
        </td>
        <td style="padding:8px; vertical-align:top; font-size:11.5px;">
          <div><b>المبلغ الإجمالي كتابة:</b> ${esc(calc.amountWords)}</div>
          <div style="margin-top:6px; font-size:10.5px; color:#475569;">
            تم إصدار هذه الفاتورة الإلكترونية وفقاً لمتطلبات الفوترة الإلكترونية بالمملكة العربية السعودية (هيئة الزكاة والضريبة والجمارك).
          </div>
        </td>
        <td style="width:260px; padding:6px; vertical-align:top;">
          <table style="width:100%; font-size:12px; border-collapse:collapse;">
            <tr>
              <td>إجمالي المبلغ الخاضع للضريبة:</td>
              <td style="text-align:left; font-weight:700;">${formatMoney(calc.taxableAmount, company.currency)}</td>
            </tr>
            <tr>
              <td>إجمالي ضريبة القيمة المضافة:</td>
              <td style="text-align:left; font-weight:700;">${formatMoney(calc.vatAmount, company.currency)}</td>
            </tr>
            <tr style="border-top:1px solid #000; font-size:14px; font-weight:900;">
              <td>الإجمالي المستحق (شامل الضريبة):</td>
              <td style="text-align:left;">${formatMoney(calc.grandTotal, company.currency)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>`;
}

// -------------------- Template 4: Thermal Receipt 80mm --------------------
function renderThermalInvoice(
  invoice: Invoice,
  company: Company,
  customer: Customer | null,
  settings: PrintSettings,
  calc: any
): string {
  return `
  <div style="font-family:monospace, 'Courier New', Tahoma; direction:rtl; width:72mm; margin:0 auto; padding:8px; color:#000; background:#fff; font-size:11px; line-height:1.4;">
    <div style="text-align:center; border-bottom:1px dashed #000; padding-bottom:6px; margin-bottom:6px;">
      <div style="font-size:14px; font-weight:900;">${esc(company.name)}</div>
      <div style="font-size:10px;">نقل بري وشحن سريع</div>
      <div style="font-size:10px;">الرقم الضريبي: <span dir="ltr">${esc(company.tax_number || "—")}</span></div>
      <div style="font-size:10px;">الهاتف: <span dir="ltr">${esc(company.phone || "—")}</span></div>
    </div>

    <div style="font-size:10.5px; margin-bottom:6px; border-bottom:1px dashed #000; padding-bottom:4px;">
      <div><b>فاتورة رقم:</b> #${invoice.number}</div>
      <div><b>التاريخ:</b> ${esc(invoice.date)}</div>
      <div><b>العميل:</b> ${esc(customer?.name || "عميل نقدي")}</div>
      ${customer?.tax_number ? `<div><b>ضريبة العميل:</b> <span dir="ltr">${customer.tax_number}</span></div>` : ""}
    </div>

    <!-- Items List -->
    <div style="border-bottom:1px dashed #000; padding-bottom:6px; margin-bottom:6px;">
      ${(invoice.trips || []).map((t, idx) => `
        <div style="margin-bottom:4px;">
          <div style="font-weight:700;">${idx + 1}. ${esc(t.from_loc)} ⬅ ${esc(t.to_loc)}</div>
          <div style="display:flex; justify-content:space-between; font-size:10px;">
            <span>${t.qty} × ${formatMoney(t.unit_price, "")}</span>
            <b>${formatMoney(t.price, "")}</b>
          </div>
          ${t.container_numbers?.length ? `<div style="font-size:9px; color:#333;">حاوية: ${t.container_numbers.join(", ")}</div>` : ""}
        </div>
      `).join("")}
    </div>

    <!-- Totals -->
    <div style="font-size:11px; border-bottom:1px dashed #000; padding-bottom:6px; margin-bottom:8px;">
      <div style="display:flex; justify-content:space-between;">
        <span>المجموع:</span>
        <span>${formatMoney(calc.taxableAmount, company.currency)}</span>
      </div>
      <div style="display:flex; justify-content:space-between;">
        <span>الضريبة (${invoice.vat_rate}%):</span>
        <span>${formatMoney(calc.vatAmount, company.currency)}</span>
      </div>
      <div style="display:flex; justify-content:space-between; font-size:13px; font-weight:900; margin-top:3px;">
        <span>الإجمالي:</span>
        <span>${formatMoney(calc.grandTotal, company.currency)}</span>
      </div>
    </div>

    <!-- QR Code Center -->
    <div style="text-align:center;">
      <img src="${calc.qrDataUrl}" style="width:90px; height:90px;" alt="QR" />
      <div style="font-size:9px; margin-top:2px;">شكراً لتعاملكم معنا</div>
    </div>
  </div>`;
}

// -------------------- Template 5: Logistics Fleet & Cargo --------------------
function renderLogisticsInvoice(
  invoice: Invoice,
  company: Company,
  customer: Customer | null,
  settings: PrintSettings,
  calc: any
): string {
  return `
  <div style="font-family:'IBM Plex Sans Arabic', Tahoma, sans-serif; direction:rtl; color:#0f172a; padding:22px; background:#fff; line-height:1.6;">
    <div style="border-top:6px solid ${calc.accent}; border-bottom:1px solid #cbd5e1; padding-bottom:12px; margin-bottom:16px;">
      <table style="width:100%;">
        <tr>
          <td>
            <div style="font-size:22px; font-weight:800; color:${calc.accent};">${esc(company.name)}</div>
            <div style="font-size:13px; font-weight:600; color:#475569;">بيان نقل وحمولة حاويات وفاتورة نولون</div>
            <div style="font-size:12px; color:#64748b;">الرقم الضريبي: ${esc(company.tax_number || "—")} | س.ت: ${esc(company.commercial_reg || "—")}</div>
          </td>
          <td style="text-align:left; vertical-align:top;">
            <div style="font-size:18px; font-weight:800; color:${calc.accent};">فاتورة نولون #${invoice.number}</div>
            <div style="font-size:12px;"><b>تاريخ الرحلة:</b> ${esc(invoice.date)}</div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Logistics Details Bar -->
    <div style="background:#0f172a; color:#fff; border-radius:8px; padding:10px 16px; margin-bottom:16px; display:flex; justify-content:space-between; font-size:12.5px;">
      <div><b>العميل / الشاحن:</b> ${esc(customer?.name || "عميل عام")}</div>
      <div><b>عدد النقلات:</b> ${invoice.trips?.length || 1}</div>
      <div><b>الضريبة:</b> ${invoice.vat_rate}%</div>
    </div>

    <!-- Detailed Trips Table -->
    <table style="width:100%; border-collapse:collapse; font-size:12px; margin-bottom:16px; border:1px solid #cbd5e1;">
      <thead>
        <tr style="background:#f1f5f9; color:#1e293b;">
          <th style="padding:8px; border:1px solid #cbd5e1;">#</th>
          <th style="padding:8px; border:1px solid #cbd5e1; text-align:right;">خط السير والموانئ</th>
          <th style="padding:8px; border:1px solid #cbd5e1; text-align:center;">رقم الحاوية / البوليصة</th>
          <th style="padding:8px; border:1px solid #cbd5e1; text-align:center;">الشاحنة والسائق</th>
          <th style="padding:8px; border:1px solid #cbd5e1; text-align:center;">العدد</th>
          <th style="padding:8px; border:1px solid #cbd5e1; text-align:left;">النولون</th>
          <th style="padding:8px; border:1px solid #cbd5e1; text-align:left;">الإجمالي</th>
        </tr>
      </thead>
      <tbody>
        ${(invoice.trips || []).map((t, idx) => `
          <tr>
            <td style="padding:8px; border:1px solid #cbd5e1; text-align:center;">${idx + 1}</td>
            <td style="padding:8px; border:1px solid #cbd5e1;">
              <b>من:</b> ${esc(t.from_loc)}<br>
              <b>إلى:</b> ${esc(t.to_loc)}
            </td>
            <td style="padding:8px; border:1px solid #cbd5e1; text-align:center; font-family:monospace; font-weight:700;">
              ${t.container_numbers?.length ? t.container_numbers.join("<br>") : (invoice.container_number || "—")}
            </td>
            <td style="padding:8px; border:1px solid #cbd5e1; text-align:center;">
              <b>${esc(t.vehicle_name || "—")}</b><br>
              <span style="font-size:11px; color:#64748b;">${esc(t.driver_name || "")}</span>
            </td>
            <td style="padding:8px; border:1px solid #cbd5e1; text-align:center; font-weight:700;">${t.qty}</td>
            <td style="padding:8px; border:1px solid #cbd5e1; text-align:left;">${formatMoney(t.unit_price, "")}</td>
            <td style="padding:8px; border:1px solid #cbd5e1; text-align:left; font-weight:700;">${formatMoney(t.price, "")}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>

    <!-- Bottom summary -->
    <div style="display:flex; justify-content:space-between; align-items:start; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:14px;">
      <div style="display:flex; gap:14px; align-items:center;">
        <img src="${calc.qrDataUrl}" style="width:100px; height:100px; border:1px solid #cbd5e1; border-radius:6px;" alt="QR" />
        <div style="font-size:12px;">
          <div><b>تفقيط المبلغ:</b> ${esc(calc.amountWords)}</div>
          <div style="margin-top:4px; color:#64748b;">تفريغ واستلام وفق الشروط القياسية لخدمات النقل البري</div>
        </div>
      </div>
      <div style="width:240px; font-size:13px;">
        <div style="display:flex; justify-content:space-between; padding:3px 0;">
          <span>صافي النولون:</span>
          <b>${formatMoney(calc.taxableAmount, company.currency)}</b>
        </div>
        <div style="display:flex; justify-content:space-between; padding:3px 0;">
          <span>الضريبة (${invoice.vat_rate}%):</span>
          <b style="color:${calc.accent};">${formatMoney(calc.vatAmount, company.currency)}</b>
        </div>
        <div style="border-top:2px solid #0f172a; margin-top:6px; padding-top:6px; display:flex; justify-content:space-between; font-size:15px; font-weight:800;">
          <span>الإجمالي النهائي:</span>
          <span style="color:${calc.accent};">${formatMoney(calc.grandTotal, company.currency)}</span>
        </div>
      </div>
    </div>
  </div>`;
}

// -------------------- Template 6: Elegant Royal --------------------
function renderRoyalInvoice(
  invoice: Invoice,
  company: Company,
  customer: Customer | null,
  settings: PrintSettings,
  calc: any
): string {
  return `
  <div style="font-family:'IBM Plex Sans Arabic', Tahoma, sans-serif; direction:rtl; color:#1e1b4b; padding:26px; background:#fff; line-height:1.6;">
    <div style="border:1px solid rgba(37,99,235,0.2); border-radius:16px; padding:20px; box-shadow:0 4px 20px rgba(0,0,0,0.04);">
      <!-- Header -->
      <table style="width:100%; border-bottom:1px solid #e2e8f0; padding-bottom:16px; margin-bottom:18px;">
        <tr>
          <td>
            <div style="font-size:24px; font-weight:900; color:#1e1b4b;">${esc(company.name)}</div>
            <div style="font-size:12px; color:#64748b; margin-top:2px;">ROYAL TRANSPORT & LOGISTICS SERVICES</div>
            <div style="font-size:12px; margin-top:6px;">الرقم الضريبي: <b dir="ltr">${esc(company.tax_number || "—")}</b> | السجل التجاري: <b dir="ltr">${esc(company.commercial_reg || "—")}</b></div>
          </td>
          <td style="text-align:left; vertical-align:top;">
            <div style="display:inline-block; border-radius:12px; background:#1e1b4b; color:#fff; padding:10px 18px; text-align:center;">
              <div style="font-size:11px; opacity:0.8;">فاتورة رسمية فاخرة</div>
              <div style="font-size:18px; font-weight:800;">#${invoice.number}</div>
              <div style="font-size:11px; opacity:0.8;">${esc(invoice.date)}</div>
            </div>
          </td>
        </tr>
      </table>

      <!-- Client Details in Royal Box -->
      <div style="background:linear-gradient(to left, #f8fafc, #f1f5f9); border-radius:10px; padding:14px; margin-bottom:18px; border-right:4px solid ${calc.accent};">
        <table style="width:100%; font-size:12.5px;">
          <tr>
            <td style="width:50%;"><b>المكرم السادة /</b> <span style="font-size:14px; font-weight:700;">${esc(customer?.name || "عميل نقدي")}</span></td>
            <td style="width:50%;"><b>الرقم الضريبي:</b> <span dir="ltr">${esc(customer?.tax_number || "—")}</span></td>
          </tr>
          <tr>
            <td><b>العنوان:</b> ${esc(customer?.address || customer?.city || "المملكة العربية السعودية")}</td>
            <td><b>الهاتف:</b> <span dir="ltr">${esc(customer?.phone || "—")}</span></td>
          </tr>
        </table>
      </div>

      <!-- Trips Table -->
      <table style="width:100%; border-collapse:collapse; font-size:12.5px; margin-bottom:20px;">
        <thead>
          <tr style="background:#1e1b4b; color:#fff;">
            <th style="padding:10px; text-align:right; border-radius:0 8px 8px 0;">الرحلة / خط النقل</th>
            <th style="padding:10px; text-align:center;">الشاحنة والسائق</th>
            <th style="padding:10px; text-align:center;">الكمية</th>
            <th style="padding:10px; text-align:left;">السعر</th>
            <th style="padding:10px; text-align:left; border-radius:8px 0 0 8px;">الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          ${(invoice.trips || []).map((t, idx) => `
            <tr style="border-bottom:1px solid #e2e8f0; background:${idx % 2 === 0 ? "#fff" : "#faf5ff"};">
              <td style="padding:12px 10px;">
                <div style="font-weight:700;">من ${esc(t.from_loc)} إلى ${esc(t.to_loc)}</div>
                ${t.container_numbers?.length ? `<div style="font-size:11px; color:#64748b;">حاويات: ${t.container_numbers.join(", ")}</div>` : ""}
              </td>
              <td style="padding:12px 10px; text-align:center;">${esc(t.vehicle_name || "—")}<br><span style="font-size:11px; color:#64748b;">${esc(t.driver_name || "")}</span></td>
              <td style="padding:12px 10px; text-align:center; font-weight:700;">${t.qty}</td>
              <td style="padding:12px 10px; text-align:left;">${formatMoney(t.unit_price, "")}</td>
              <td style="padding:12px 10px; text-align:left; font-weight:800; color:#1e1b4b;">${formatMoney(t.price, "")}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>

      <!-- Royal Totals Banner -->
      <div style="background:#1e1b4b; color:#fff; border-radius:12px; padding:16px; display:flex; justify-content:space-between; align-items:center;">
        <div style="display:flex; align-items:center; gap:16px;">
          <img src="${calc.qrDataUrl}" style="width:95px; height:95px; border-radius:6px; background:#fff; padding:3px;" alt="QR" />
          <div>
            <div style="font-size:11px; opacity:0.8;">المبلغ المعتمد بالكلمات:</div>
            <div style="font-size:13px; font-weight:700; margin-top:2px;">${esc(calc.amountWords)}</div>
          </div>
        </div>
        <div style="width:240px; font-size:13px;">
          <div style="display:flex; justify-content:space-between; padding:2px 0; opacity:0.9;">
            <span>المجموع:</span>
            <span>${formatMoney(calc.taxableAmount, company.currency)}</span>
          </div>
          <div style="display:flex; justify-content:space-between; padding:2px 0; opacity:0.9;">
            <span>الضريبة (${invoice.vat_rate}%):</span>
            <span>${formatMoney(calc.vatAmount, company.currency)}</span>
          </div>
          <div style="border-top:1px solid rgba(255,255,255,0.3); margin-top:6px; padding-top:6px; display:flex; justify-content:space-between; font-size:16px; font-weight:900;">
            <span>الإجمالي:</span>
            <span style="color:#fde047;">${formatMoney(calc.grandTotal, company.currency)}</span>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

// ---------------------------------------------------------------------------
// 2. قالب التقارير الاحترافي الموحد (Master Universal Report Template)
// ---------------------------------------------------------------------------

export interface ReportColumn {
  header: string;
  key: string;
  align?: "right" | "center" | "left";
  format?: (val: any, row: any) => string;
}

export interface UniversalReportModel {
  title: string;
  subtitle?: string;
  period?: { from?: string | null; to?: string | null };
  filterLabel?: string;
  kpis?: { label: string; value: string; color?: string }[];
  columns: ReportColumn[];
  rows: any[];
  summaryRow?: Record<string, string>;
  notes?: string;
}

export function renderMasterReportHtml(
  report: UniversalReportModel,
  company: Company
): string {
  const printedDate = new Date().toLocaleString("ar-SA");

  return `
  <div style="font-family:'IBM Plex Sans Arabic', Tahoma, sans-serif; direction:rtl; color:#0f172a; padding:24px; background:#fff; line-height:1.6;">
    <!-- Report Top Header -->
    <table style="width:100%; border-bottom:2px solid #0f172a; padding-bottom:12px; margin-bottom:16px;">
      <tr>
        <td style="width:65%;">
          <div style="font-size:22px; font-weight:800; color:#0f172a;">${esc(company.name)}</div>
          <div style="font-size:16px; font-weight:700; color:#2563eb; margin-top:2px;">${esc(report.title)}</div>
          ${report.subtitle ? `<div style="font-size:12.5px; color:#64748b;">${esc(report.subtitle)}</div>` : ""}
          ${report.filterLabel ? `<div style="font-size:12px; color:#475569; margin-top:2px;"><b>معايير التقرير:</b> ${esc(report.filterLabel)}</div>` : ""}
        </td>
        <td style="width:35%; text-align:left; vertical-align:top; font-size:12px; color:#64748b;">
          <div><b>تاريخ الطباعة:</b> ${esc(printedDate)}</div>
          ${report.period?.from || report.period?.to ? `<div><b>الفترة:</b> من ${report.period.from || "البداية"} إلى ${report.period.to || "اليوم"}</div>` : ""}
          <div><b>العملة:</b> ${esc(company.currency || "ر.س")}</div>
        </td>
      </tr>
    </table>

    <!-- KPI Metric Cards (if any) -->
    ${report.kpis?.length ? `
      <div style="display:grid; grid-template-columns:repeat(${Math.min(report.kpis.length, 4)}, 1fr); gap:12px; margin-bottom:18px;">
        ${report.kpis.map((k) => `
          <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:10px 14px; text-align:center;">
            <div style="font-size:11.5px; color:#64748b; font-weight:600;">${esc(k.label)}</div>
            <div style="font-size:18px; font-weight:800; color:${k.color || "#0f172a"}; margin-top:3px;">${esc(k.value)}</div>
          </div>
        `).join("")}
      </div>
    ` : ""}

    <!-- Data Table -->
    <table style="width:100%; border-collapse:collapse; font-size:12.5px; margin-bottom:18px;">
      <thead>
        <tr style="background:#0f172a; color:#fff;">
          ${report.columns.map((c) => `
            <th style="padding:9px 12px; border:1px solid #0f172a; text-align:${c.align || "right"}; font-weight:700;">${esc(c.header)}</th>
          `).join("")}
        </tr>
      </thead>
      <tbody>
        ${report.rows.map((row, idx) => `
          <tr style="background:${idx % 2 === 0 ? "#ffffff" : "#f8fafc"}; border-bottom:1px solid #e2e8f0;">
            ${report.columns.map((c) => {
              const val = c.format ? c.format(row[c.key], row) : (row[c.key] ?? "—");
              return `<td style="padding:8px 12px; border:1px solid #e2e8f0; text-align:${c.align || "right"};">${esc(val)}</td>`;
            }).join("")}
          </tr>
        `).join("")}

        <!-- Summary / Total Row -->
        ${report.summaryRow ? `
          <tr style="background:#e2e8f0; font-weight:800; border-top:2px solid #0f172a;">
            ${report.columns.map((c) => {
              const val = report.summaryRow![c.key] ?? "";
              return `<td style="padding:9px 12px; border:1px solid #cbd5e1; text-align:${c.align || "right"};">${esc(val)}</td>`;
            }).join("")}
          </tr>
        ` : ""}
      </tbody>
    </table>

    <!-- Footer Notes and Signatures -->
    ${report.notes ? `<div style="font-size:12px; color:#64748b; margin-bottom:20px;"><b>ملاحظات التقرير:</b> ${esc(report.notes)}</div>` : ""}

    <div style="display:flex; justify-content:space-between; margin-top:28px; padding-top:12px; border-top:1px dashed #cbd5e1; text-align:center; font-size:12px; color:#64748b;">
      <div style="width:200px;">
        <div>إعداد المحاسب</div>
        <div style="margin-top:30px; border-bottom:1px solid #94a3b8;"></div>
      </div>
      <div style="width:200px;">
        <div>مراجعة التدقيق المالي</div>
        <div style="margin-top:30px; border-bottom:1px solid #94a3b8;"></div>
      </div>
      <div style="width:200px;">
        <div>اعتماد الإدارة العامة</div>
        <div style="margin-top:30px; border-bottom:1px solid #94a3b8;"></div>
      </div>
    </div>
  </div>`;
}

// ---------------------------------------------------------------------------
// 3. قوالب السندات والعمليات المحاسبية الأخرى (قبض / صرف / سلفة / رواتب)
// ---------------------------------------------------------------------------

export function renderReceiptVoucherHtml(voucher: ReceiptVoucher, company: Company): string {
  const amountWords = numberToArabicWords(voucher.amount, company.currency || "ريال سعودي");
  return `
  <div style="font-family:'IBM Plex Sans Arabic', Tahoma, sans-serif; direction:rtl; color:#0f172a; padding:24px; background:#fff; line-height:1.7;">
    <div style="border:2px solid #059669; border-radius:12px; padding:20px;">
      <table style="width:100%; border-bottom:2px solid #059669; padding-bottom:12px; margin-bottom:16px;">
        <tr>
          <td>
            <div style="font-size:22px; font-weight:800; color:#059669;">${esc(company.name)}</div>
            <div style="font-size:12px; color:#64748b;">سند قبض نقدية وشيكات رسمي / RECEIPT VOUCHER</div>
          </td>
          <td style="text-align:left; vertical-align:top;">
            <div style="font-size:18px; font-weight:800; color:#059669;">سند قبض #${voucher.number}</div>
            <div style="font-size:12px;"><b>التاريخ:</b> ${esc(voucher.date)}</div>
          </td>
        </tr>
      </table>

      <div style="background:#ecfdf5; border:1px solid #a7f3d0; border-radius:8px; padding:14px; margin-bottom:18px; display:flex; justify-content:space-between; align-items:center;">
        <div style="font-size:14px;">المبلغ المستلم: <b style="font-size:20px; color:#059669;">${formatMoney(voucher.amount, company.currency)}</b></div>
        <div style="font-size:12.5px; color:#065f46;"><b>الحساب المستلم:</b> ${esc(voucher.account_name || "الخزينة")}</div>
      </div>

      <table style="width:100%; font-size:13.5px; border-collapse:collapse; margin-bottom:20px;">
        <tr>
          <td style="padding:8px 0; width:140px; color:#64748b;">استلمنا من المكرم /</td>
          <td style="padding:8px 0; font-weight:700; border-bottom:1px dotted #94a3b8;">${esc(voucher.customer_name || "إيراد عام")}</td>
        </tr>
        <tr>
          <td style="padding:8px 0; color:#64748b;">مبلغ وقدره /</td>
          <td style="padding:8px 0; font-weight:700; border-bottom:1px dotted #94a3b8; color:#059669;">${esc(amountWords)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0; color:#64748b;">وذلك عن /</td>
          <td style="padding:8px 0; font-weight:600; border-bottom:1px dotted #94a3b8;">${esc(voucher.description)}</td>
        </tr>
      </table>

      <div style="display:flex; justify-content:space-between; margin-top:36px; padding-top:12px; text-align:center; font-size:12px; color:#64748b;">
        <div style="width:200px;">
          <div>توقيع المُسلّم</div>
          <div style="margin-top:30px; border-bottom:1px solid #94a3b8;"></div>
        </div>
        <div style="width:200px;">
          <div>أمين الصندوق / المحاسب</div>
          <div style="margin-top:30px; border-bottom:1px solid #94a3b8;"></div>
        </div>
        <div style="width:200px;">
          <div>الختم المالي</div>
          <div style="margin-top:30px; border-bottom:1px solid #94a3b8;"></div>
        </div>
      </div>
    </div>
  </div>`;
}

export function renderPaymentVoucherHtml(voucher: PaymentVoucher, company: Company): string {
  const amountWords = numberToArabicWords(voucher.amount, company.currency || "ريال سعودي");
  return `
  <div style="font-family:'IBM Plex Sans Arabic', Tahoma, sans-serif; direction:rtl; color:#0f172a; padding:24px; background:#fff; line-height:1.7;">
    <div style="border:2px solid #dc2626; border-radius:12px; padding:20px;">
      <table style="width:100%; border-bottom:2px solid #dc2626; padding-bottom:12px; margin-bottom:16px;">
        <tr>
          <td>
            <div style="font-size:22px; font-weight:800; color:#dc2626;">${esc(company.name)}</div>
            <div style="font-size:12px; color:#64748b;">سند صرف مالي رسمي / PAYMENT VOUCHER</div>
          </td>
          <td style="text-align:left; vertical-align:top;">
            <div style="font-size:18px; font-weight:800; color:#dc2626;">سند صرف #${voucher.number}</div>
            <div style="font-size:12px;"><b>التاريخ:</b> ${esc(voucher.date)}</div>
          </td>
        </tr>
      </table>

      <div style="background:#fef2f2; border:1px solid #fecaca; border-radius:8px; padding:14px; margin-bottom:18px; display:flex; justify-content:space-between; align-items:center;">
        <div style="font-size:14px;">المبلغ المصروف: <b style="font-size:20px; color:#dc2626;">${formatMoney(voucher.amount, company.currency)}</b></div>
        <div style="font-size:12.5px; color:#991b1b;"><b>الجهة / البنك:</b> ${esc(voucher.account_name || "الخزينة")}</div>
      </div>

      <table style="width:100%; font-size:13.5px; border-collapse:collapse; margin-bottom:20px;">
        <tr>
          <td style="padding:8px 0; width:140px; color:#64748b;">اصرفوا للمكرم /</td>
          <td style="padding:8px 0; font-weight:700; border-bottom:1px dotted #94a3b8;">${esc(voucher.employee_name || voucher.supplier_name || "مصروف عام")}</td>
        </tr>
        <tr>
          <td style="padding:8px 0; color:#64748b;">مبلغ وقدره /</td>
          <td style="padding:8px 0; font-weight:700; border-bottom:1px dotted #94a3b8; color:#dc2626;">${esc(amountWords)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0; color:#64748b;">وذلك عن /</td>
          <td style="padding:8px 0; font-weight:600; border-bottom:1px dotted #94a3b8;">${esc(voucher.description)}</td>
        </tr>
      </table>

      <div style="display:flex; justify-content:space-between; margin-top:36px; padding-top:12px; text-align:center; font-size:12px; color:#64748b;">
        <div style="width:200px;">
          <div>توقيع المستلم</div>
          <div style="margin-top:30px; border-bottom:1px solid #94a3b8;"></div>
        </div>
        <div style="width:200px;">
          <div>أمين الصندوق</div>
          <div style="margin-top:30px; border-bottom:1px solid #94a3b8;"></div>
        </div>
        <div style="width:200px;">
          <div>اعتماد الإدارة المالية</div>
          <div style="margin-top:30px; border-bottom:1px solid #94a3b8;"></div>
        </div>
      </div>
    </div>
  </div>`;
}

export function renderPayrollSlipHtml(payroll: Payroll, company: Company): string {
  const netWords = numberToArabicWords(payroll.net_salary, company.currency || "ريال سعودي");
  return `
  <div style="font-family:'IBM Plex Sans Arabic', Tahoma, sans-serif; direction:rtl; color:#0f172a; padding:24px; background:#fff; line-height:1.6;">
    <div style="border:2px solid #2563eb; border-radius:12px; padding:20px;">
      <table style="width:100%; border-bottom:2px solid #2563eb; padding-bottom:12px; margin-bottom:16px;">
        <tr>
          <td>
            <div style="font-size:22px; font-weight:800; color:#2563eb;">${esc(company.name)}</div>
            <div style="font-size:14px; font-weight:700; color:#475569;">قسيمة راتب شهرية / PAYSLIP — ${payroll.period_month} / ${payroll.period_year}</div>
          </td>
          <td style="text-align:left; vertical-align:top;">
            <div style="font-size:16px; font-weight:800;">مسير #${payroll.number}</div>
            <div style="font-size:12px;"><b>تاريخ الصرف:</b> ${esc(payroll.date)}</div>
          </td>
        </tr>
      </table>

      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:12px; margin-bottom:16px; display:flex; justify-content:space-between;">
        <div><b>اسم الموظف / السائق:</b> <span style="font-size:15px; font-weight:700; color:#2563eb;">${esc(payroll.employee_name)}</span></div>
        <div><b>طريقة الصرف:</b> ${esc(payroll.account_name || "الخزينة")}</div>
      </div>

      <!-- Breakdown Table -->
      <table style="width:100%; border-collapse:collapse; font-size:13px; margin-bottom:18px; border:1px solid #e2e8f0;">
        <tr style="background:#f1f5f9; font-weight:700;">
          <th style="padding:8px; border:1px solid #e2e8f0; text-align:right; width:50%;">الاستحقاقات (الإضافات)</th>
          <th style="padding:8px; border:1px solid #e2e8f0; text-align:right; width:50%;">الاستقطاعات (الخصومات)</th>
        </tr>
        <tr>
          <td style="padding:8px; border:1px solid #e2e8f0; vertical-align:top;">
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
              <span>الراتب الأساسي:</span>
              <b>${formatMoney(payroll.base_salary, company.currency)}</b>
            </div>
            ${payroll.additions > 0 ? `
              <div style="display:flex; justify-content:space-between; color:#15803d;">
                <span>بدلات ومكافآت (${esc(payroll.additions_note || "إضافي")}):</span>
                <b>+${formatMoney(payroll.additions, company.currency)}</b>
              </div>
            ` : ""}
          </td>
          <td style="padding:8px; border:1px solid #e2e8f0; vertical-align:top;">
            ${payroll.advance_deduction > 0 ? `
              <div style="display:flex; justify-content:space-between; color:#dc2626; margin-bottom:4px;">
                <span>خصم سلف مستردة:</span>
                <b>-${formatMoney(payroll.advance_deduction, company.currency)}</b>
              </div>
            ` : ""}
            ${(payroll.deduction_deduction || 0) > 0 ? `
              <div style="display:flex; justify-content:space-between; color:#dc2626; margin-bottom:4px;">
                <span>خصومات ومخالفات مسجلة:</span>
                <b>-${formatMoney(payroll.deduction_deduction, company.currency)}</b>
              </div>
            ` : ""}
            ${payroll.other_deductions > 0 ? `
              <div style="display:flex; justify-content:space-between; color:#dc2626;">
                <span>خصومات أخرى وتأمينات:</span>
                <b>-${formatMoney(payroll.other_deductions, company.currency)}</b>
              </div>
            ` : ""}
          </td>
        </tr>
      </table>

      <!-- Net Salary Box -->
      <div style="background:#1e1b4b; color:#fff; border-radius:10px; padding:14px; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-size:12px; opacity:0.85;">صافي الراتب المستحق للصرف:</div>
          <div style="font-size:13px; font-weight:700; margin-top:2px; color:#fde047;">${esc(netWords)}</div>
        </div>
        <div style="font-size:22px; font-weight:900; color:#fff;">${formatMoney(payroll.net_salary, company.currency)}</div>
      </div>

      <div style="display:flex; justify-content:space-between; margin-top:30px; text-align:center; font-size:12px; color:#64748b;">
        <div style="width:200px;">
          <div>توقيع الموظف بالاستلام</div>
          <div style="margin-top:26px; border-bottom:1px solid #94a3b8;"></div>
        </div>
        <div style="width:200px;">
          <div>المحاسب المسؤول</div>
          <div style="margin-top:26px; border-bottom:1px solid #94a3b8;"></div>
        </div>
      </div>
    </div>
  </div>`;
}
