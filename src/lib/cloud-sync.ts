// جسر الربط الحقيقي بين التطبيق و Cloudflare Worker + بوت تليجرام
// لا يوجد هنا أي محاكاة داخلية لأوامر البوت — كل التحكم الفعلي يتم من تليجرام عبر الويب هوك
// المنشور على Cloudflare Worker (راجع cloudflare-worker/worker.js)، وهذا الملف هو فقط
// طبقة الاتصال (HTTP Client) التي تُستخدمها الواجهة للتواصل مع ذلك الـ Worker متى تم ضبط رابطه.

import type { SupportMessage } from "@/types";
import { getAppSettings, getCompany, getLicenseInfo, mergeSupportMessagesFromCloud } from "./storage";

export interface CloudSyncResult {
  success: boolean;
  message: string;
}

function getWorkerUrl(): string {
  const settings = getAppSettings();
  return (settings.cloudflare_worker_url || "").trim().replace(/\/+$/, "");
}

export function isCloudConfigured(): boolean {
  return getWorkerUrl().length > 0;
}

/** إرسال رسالة دعم فني من العميل إلى بوت تليجرام المطور عبر Cloudflare Worker */
export async function sendSupportMessageToCloud(message: string): Promise<CloudSyncResult> {
  const workerUrl = getWorkerUrl();
  if (!workerUrl) {
    return {
      success: false,
      message: "لم يتم ربط التطبيق بعد بخدمة كلاود فلير. يرجى ضبط رابط الـ Worker من الإعدادات.",
    };
  }

  const company = getCompany();
  const license = getLicenseInfo();

  try {
    const res = await fetch(`${workerUrl}/api/support/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientCode: company.client_code,
        companyName: company.name,
        message,
        deviceId: license.deviceId,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, message: data.error || "تعذر إرسال الرسالة إلى الخادم السحابي." };
    }
    return { success: true, message: "تم إرسال الرسالة بنجاح." };
  } catch (err: any) {
    return {
      success: false,
      message: "تعذر الاتصال بخدمة كلاود فلير. تحقق من اتصال الإنترنت ورابط الـ Worker.",
    };
  }
}

/** جلب الردود الواردة من المطور عبر تليجرام وحفظها محلياً */
export async function fetchSupportMessagesFromCloud(): Promise<CloudSyncResult & { messages?: SupportMessage[] }> {
  const workerUrl = getWorkerUrl();
  if (!workerUrl) {
    return { success: false, message: "لم يتم ربط التطبيق بعد بخدمة كلاود فلير." };
  }

  const company = getCompany();

  try {
    const res = await fetch(
      `${workerUrl}/api/support/messages?client_code=${encodeURIComponent(company.client_code)}`
    );
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, message: data.error || "تعذر جلب الرسائل من الخادم السحابي." };
    }

    const cloudMessages: SupportMessage[] = (data.messages || []).map((m: any) => ({
      id: m.id,
      company_id: company.id,
      sender: m.sender === "admin" ? "admin" : "client",
      sender_name: m.sender === "admin" ? "الدعم الفني (تليجرام)" : company.name,
      body: m.body,
      is_read: m.sender === "client",
      created_at: m.timestamp || new Date().toISOString(),
    }));

    mergeSupportMessagesFromCloud(cloudMessages);
    return { success: true, message: "تم تحديث الرسائل.", messages: cloudMessages };
  } catch (err: any) {
    return { success: false, message: "تعذر الاتصال بخدمة كلاود فلير." };
  }
}

/** إرسال نبضة تسجيل/تحديث بيانات العميل إلى الخادم السحابي (لأغراض المتابعة عن بعد) */
export async function sendHeartbeatToCloud(): Promise<CloudSyncResult> {
  const workerUrl = getWorkerUrl();
  if (!workerUrl) {
    return { success: false, message: "لم يتم ربط التطبيق بعد بخدمة كلاود فلير." };
  }

  const company = getCompany();
  const license = getLicenseInfo();

  try {
    const res = await fetch(`${workerUrl}/api/clients/heartbeat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientCode: company.client_code,
        companyName: company.name,
        deviceId: license.deviceId,
        planType: license.planType,
        isActive: license.isLicensed,
        subscriptionEnd: license.expiryDate,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, message: "تعذر تحديث بيانات المتابعة السحابية." };
    }
    return { success: true, message: "تم تحديث بيانات المتابعة السحابية." };
  } catch (err: any) {
    return { success: false, message: "تعذر الاتصال بخدمة كلاود فلير." };
  }
}

/** التحقق من صحة رمز الترخيص عبر الخادم السحابي (اختياري، بالإضافة للتفعيل الأوفلاين) */
export async function verifyLicenseWithCloud(licenseKey: string): Promise<CloudSyncResult & { planType?: string; days?: number }> {
  const workerUrl = getWorkerUrl();
  if (!workerUrl) {
    return { success: false, message: "لم يتم ربط التطبيق بعد بخدمة كلاود فلير." };
  }

  const company = getCompany();
  const license = getLicenseInfo();

  try {
    const res = await fetch(`${workerUrl}/api/license/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientCode: company.client_code,
        licenseKey,
        deviceId: license.deviceId,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.valid) {
      return { success: false, message: data.message || "رمز الترخيص غير صالح." };
    }
    return { success: true, message: data.message, planType: data.planType, days: data.days };
  } catch (err: any) {
    return { success: false, message: "تعذر الاتصال بخدمة كلاود فلير للتحقق من الترخيص عبر الإنترنت." };
  }
}
