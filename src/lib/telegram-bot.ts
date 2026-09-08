// جسر الربط والتفاعل مع كلاود فلير وبوت تليجرام + محاكي البوت الداخلي للتحكم الفوري

import type { AppSettings, Company, SupportMessage } from "@/types";
import {
  activateLicenseKey,
  getAppSettings,
  getCompany,
  getLicenseInfo,
  getSupportMessages,
  saveAppSettings,
  saveCompany,
  sendSupportMessage,
} from "./storage";

export interface BotCommandResponse {
  success: boolean;
  replyText: string;
  actionTaken?: string;
}

/**
 * تنفيذ أمر بوت تليجرام (سواء من المحاكي الداخلي أو عند استلام ويب هوك)
 */
export async function executeTelegramBotCommand(commandText: string): Promise<BotCommandResponse> {
  const text = commandText.trim();
  const settings = getAppSettings();
  const company = getCompany();

  // 1. /start or /help
  if (text === "/start" || text === "/help" || text === "start" || text === "help") {
    return {
      success: true,
      replyText: `🚛 <b>لوحة تحكم البوت — النظام المحاسبي لخدمات النقل</b>\n\n` +
        `مرحباً بك يا مطور! يمكنك إدارة التطبيق والمشتركين وصفحة «حول التطبيق» من خلال الأوامر التالية:\n\n` +
        `<b>⚙️ إدارة صفحة حول التطبيق:</b>\n` +
        `• <code>/about</code> - عرض كل البيانات الحالية في صفحة حول التطبيق\n` +
        `• <code>/set_name [الاسم]</code> - تغيير اسم التطبيق\n` +
        `• <code>/set_phone [الرقم]</code> - تغيير رقم الاتصال\n` +
        `• <code>/set_whatsapp [الرقم]</code> - تغيير رقم واتساب\n` +
        `• <code>/set_about [النص]</code> - تغيير نبذة حول التطبيق\n` +
        `• <code>/set_price [شهري] [سنوي]</code> - تحديث أسعار الباقات\n\n` +
        `<b>🔑 التراخيص والمشتركين:</b>\n` +
        `• <code>/keygen [كود_العميل] [monthly|yearly|open]</code> - إصدار كود تفعيل فوري\n` +
        `• <code>/subscribers</code> أو <code>/clients</code> - عرض قائمة المشتركين وحالتهم\n` +
        `• <code>/activate [كود_العميل] [المدة_بالأيام]</code> - تفعيل اشتراك عميل\n` +
        `• <code>/suspend [كود_العميل]</code> - إيقاف أو حظر عميل\n\n` +
        `<b>💬 الدعم والمراسلة:</b>\n` +
        `• <code>/reply [كود_العميل] [الرسالة]</code> - إرسال رد مباشر لتطبيق العميل`,
      actionTaken: "help_menu",
    };
  }

  // 2. /about
  if (text === "/about") {
    return {
      success: true,
      replyText: `📋 <b>بيانات صفحة «حول التطبيق» الحالية:</b>\n\n` +
        `• <b>اسم التطبيق:</b> ${settings.app_name}\n` +
        `• <b>الإصدار:</b> ${settings.app_version}\n` +
        `• <b>المطور:</b> ${settings.developer_name} (${settings.developer_title})\n` +
        `• <b>الهاتف:</b> ${settings.phone}\n` +
        `• <b>واتساب:</b> ${settings.whatsapp}\n` +
        `• <b>تليجرام:</b> ${settings.telegram}\n` +
        `• <b>البريد:</b> ${settings.email}\n` +
        `• <b>السعر الشهري:</b> ${settings.monthly_price} ر.س\n` +
        `• <b>السعر السنوي:</b> ${settings.yearly_price} ر.س\n` +
        `• <b>نبذة:</b>\n${settings.about_text}`,
      actionTaken: "view_about",
    };
  }

  // 3. /set_name
  if (text.startsWith("/set_name ") || text.startsWith("تغيير_الاسم ")) {
    const val = text.replace(/^(\/set_name|تغيير_الاسم)\s+/, "").trim();
    if (!val) return { success: false, replyText: "⚠️ يرجى كتابة الاسم الجديد للتطبيق." };
    saveAppSettings({ app_name: val });
    return {
      success: true,
      replyText: `✅ تم تحديث اسم التطبيق بنجاح إلى: <b>${val}</b> (ينعكس فوراً في واجهة وصفحة حول التطبيق).`,
      actionTaken: "update_name",
    };
  }

  // 4. /set_phone
  if (text.startsWith("/set_phone ") || text.startsWith("تغيير_الهاتف ")) {
    const val = text.replace(/^(\/set_phone|تغيير_الهاتف)\s+/, "").trim();
    if (!val) return { success: false, replyText: "⚠️ يرجى كتابة رقم الهاتف." };
    saveAppSettings({ phone: val });
    return {
      success: true,
      replyText: `✅ تم تحديث رقم الهاتف بنجاح إلى: <code>${val}</code>`,
      actionTaken: "update_phone",
    };
  }

  // 5. /set_whatsapp
  if (text.startsWith("/set_whatsapp ") || text.startsWith("تغيير_الواتساب ")) {
    const val = text.replace(/^(\/set_whatsapp|تغيير_الواتساب)\s+/, "").trim();
    if (!val) return { success: false, replyText: "⚠️ يرجى كتابة رقم الواتساب." };
    saveAppSettings({ whatsapp: val });
    return {
      success: true,
      replyText: `✅ تم تحديث رقم الواتساب بنجاح إلى: <code>${val}</code>`,
      actionTaken: "update_whatsapp",
    };
  }

  // 6. /set_about
  if (text.startsWith("/set_about ") || text.startsWith("تغيير_النبذة ")) {
    const val = text.replace(/^(\/set_about|تغيير_النبذة)\s+/, "").trim();
    if (!val) return { success: false, replyText: "⚠️ يرجى كتابة النص الجديد للنبذة." };
    saveAppSettings({ about_text: val });
    return {
      success: true,
      replyText: `✅ تم تحديث نبذة التطبيق بنجاح.`,
      actionTaken: "update_about",
    };
  }

  // 7. /set_price
  if (text.startsWith("/set_price ") || text.startsWith("تغيير_الاسعار ")) {
    const parts = text.replace(/^(\/set_price|تغيير_الاسعار)\s+/, "").trim().split(/\s+/);
    const monthly = Number(parts[0]) || 100;
    const yearly = Number(parts[1]) || 1000;
    saveAppSettings({ monthly_price: monthly, yearly_price: yearly });
    return {
      success: true,
      replyText: `✅ تم تحديث أسعار الباقات بنجاح:\n• شهري: <b>${monthly} ر.س</b>\n• سنوي: <b>${yearly} ر.س</b>`,
      actionTaken: "update_prices",
    };
  }

  // 8. /keygen
  if (text.startsWith("/keygen") || text.startsWith("اصدار_كود")) {
    const parts = text.split(/\s+/);
    const clientCode = parts[1] || company.client_code || "CL-DEFAULT";
    const plan = (parts[2] || "monthly").toLowerCase();

    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const randomSuffix2 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const key = `LOGIST-${plan.toUpperCase()}-${randomSuffix}-${randomSuffix2}`;

    return {
      success: true,
      replyText: `🔑 <b>تم إصدار كود تفعيل ترخيص جديد!</b>\n\n` +
        `🏷️ <b>رمز الترخيص:</b>\n<code>${key}</code>\n\n` +
        `📦 <b>نوع الباقة:</b> ${plan === "yearly" ? "سنوي (365 يوماً)" : plan === "open" ? "اشتراك مفتوح مدى الحياة" : "شهري (30 يوماً)"}\n` +
        `👤 <b>كود العميل:</b> <code>${clientCode}</code>\n\n` +
        `<i>يمكن للعميل إدخال هذا الكود فوراً في التطبيق لتفعيل النظام والعمل أوفلاين دون إنترنت.</i>`,
      actionTaken: "generated_key",
    };
  }

  // 9. /subscribers or /clients
  if (text === "/subscribers" || text === "/clients" || text === "المشتركين") {
    const lic = getLicenseInfo();
    const statusText = lic.isTrial
      ? `🟡 تجريبي (متبقي ${lic.trialDaysLeft} أيام)`
      : lic.isLicensed
      ? `🟢 مفعّل بنجاح (${lic.planType === "open" ? "مفتوح" : `متبقي ${lic.daysLeft} يوماً`})`
      : `🔴 منتهي الصلاحية`;

    return {
      success: true,
      replyText: `👥 <b>قائمة المشتركين الحاليين:</b>\n\n` +
        `1. 🏢 <b>${company.name}</b>\n` +
        `   • كود العميل: <code>${company.client_code}</code>\n` +
        `   • معرف الجهاز: <code>${lic.deviceId}</code>\n` +
        `   • حالة الاشتراك: ${statusText}\n` +
        `   • تاريخ الانتهاء: ${lic.expiryDate ? lic.expiryDate.slice(0, 10) : "—"}\n` +
        `   • مفتاح الترخيص: <code>${lic.licenseKey || "بدون مفتاح (تجريبي)"}</code>`,
      actionTaken: "list_subscribers",
    };
  }

  // 10. /activate
  if (text.startsWith("/activate ") || text.startsWith("تفعيل ")) {
    const parts = text.replace(/^(\/activate|تفعيل)\s+/, "").trim().split(/\s+/);
    const days = Number(parts[1]) || 30;
    const planType = days >= 365 ? "yearly" : "monthly";

    const now = new Date();
    const newEnd = new Date(now.getTime() + days * 86400000).toISOString();

    saveCompany({
      plan_type: planType,
      subscription_start: now.toISOString(),
      subscription_end: newEnd,
      is_active: true,
    });

    return {
      success: true,
      replyText: `✅ تم تفعيل وتمديد اشتراك العميل بنجاح لمدة <b>${days} يوماً</b>! (حتى تاريخ: ${newEnd.slice(0, 10)})`,
      actionTaken: "remote_activated",
    };
  }

  // 11. /suspend
  if (text.startsWith("/suspend ") || text.startsWith("ايقاف ")) {
    saveCompany({ is_active: false });
    return {
      success: true,
      replyText: `⛔ تم إيقاف وتعليق حساب العميل بنجاح.`,
      actionTaken: "suspended_client",
    };
  }

  // 12. /reply (Send message to client in-app chat)
  if (text.startsWith("/reply ") || text.startsWith("رد ")) {
    const parts = text.replace(/^(\/reply|رد)\s+/, "").trim();
    const firstSpace = parts.indexOf(" ");
    let replyBody = parts;
    if (firstSpace !== -1) {
      replyBody = parts.substring(firstSpace + 1).trim();
    }

    sendSupportMessage(replyBody, "admin");

    return {
      success: true,
      replyText: `💬 تم إرسال الرد فوراً إلى شات الدعم الفني في تطبيق العميل:\n\n<i>"${replyBody}"</i>`,
      actionTaken: "client_replied",
    };
  }

  return {
    success: false,
    replyText: `❓ عذراً، الأمر غير مفهوم. اكتب <code>/help</code> لعرض قائمة الأوامر المتاحة.`,
  };
}
