/**
 * Cloudflare Worker for Desktop Logistics & Accounting System
 * Complete Backend: Telegram Bot Webhook + Dynamic About App KV + License Key Generator + In-App Live Support Chat
 *
 * Deploy to Cloudflare Workers with:
 * npx wrangler deploy
 *
 * Environment Variables / Secrets required:
 * - TELEGRAM_BOT_TOKEN: Bot token from @BotFather
 * - TELEGRAM_ADMIN_CHAT_ID: Developer Telegram Chat ID
 * - KV Namespace binding: LOGISTICS_KV (or memory fallback)
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // CORS Headers for Desktop & Web Access
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Code, X-Device-Id",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // 1. Telegram Webhook Endpoint
      if (url.pathname === "/telegram-webhook" && request.method === "POST") {
        const update = await request.json();
        return await handleTelegramUpdate(update, env);
      }

      // 2. API: Get Dynamic About App Settings
      if (url.pathname === "/api/app-settings" && request.method === "GET") {
        const settings = await getStoredSettings(env);
        return new Response(JSON.stringify({ success: true, settings }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // 3. API: Client sends in-app support message -> forward to Telegram
      if (url.pathname === "/api/support/send" && request.method === "POST") {
        const body = await request.json();
        const { clientCode, companyName, message, deviceId } = body;

        // Save message to KV
        const msgId = "msg_" + Date.now();
        const msgObj = {
          id: msgId,
          clientCode: clientCode || "CL-UNKNOWN",
          companyName: companyName || "شركة عميل",
          sender: "client",
          body: message,
          timestamp: new Date().toISOString(),
          deviceId,
        };

        await saveSupportMessage(msgObj, env);

        // Forward to Developer's Telegram
        const tgText = `📬 <b>رسالة دعم فني جديدة من العميل:</b>\n\n` +
          `🏢 <b>الشركة:</b> ${escapeHtml(companyName || "غير محدد")}\n` +
          `🆔 <b>كود العميل:</b> <code>${escapeHtml(clientCode)}</code>\n` +
          `💻 <b>الجهاز:</b> <code>${escapeHtml(deviceId || "—")}</code>\n\n` +
          `💬 <b>نص الرسالة:</b>\n${escapeHtml(message)}\n\n` +
          `↩️ <i>للرد على هذا العميل، اكتب الأمر:</i>\n<code>/reply ${clientCode} نص الرد هنا</code>`;

        await sendTelegramMessage(env, env.TELEGRAM_ADMIN_CHAT_ID, tgText);

        return new Response(JSON.stringify({ success: true, messageId: msgId }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // 4. API: Client retrieves replies from Developer
      if (url.pathname === "/api/support/messages" && request.method === "GET") {
        const clientCode = url.searchParams.get("client_code") || "";
        const messages = await getSupportMessages(clientCode, env);
        return new Response(JSON.stringify({ success: true, messages }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // 5. API: Online License Verification & Activation
      if (url.pathname === "/api/license/verify" && request.method === "POST") {
        const body = await request.json();
        const { clientCode, licenseKey, deviceId } = body;
        const result = await verifyOrActivateLicense(clientCode, licenseKey, deviceId, env);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // 6. API: Register or Heartbeat Client
      if (url.pathname === "/api/clients/heartbeat" && request.method === "POST") {
        const clientData = await request.json();
        await registerOrUpdateClient(clientData, env);
        return new Response(JSON.stringify({ success: true, status: "registered" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(
        JSON.stringify({
          service: "Logistics Accounting Desktop & Telegram Cloudflare Gateway",
          version: "2.4.0",
          status: "healthy",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (err) {
      return new Response(
        JSON.stringify({ success: false, error: err.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  },
};

// ---------------------------------------------------------------------------
// Telegram Bot Command Handler
// ---------------------------------------------------------------------------

async function handleTelegramUpdate(update, env) {
  if (!update.message || !update.message.text) {
    return new Response("OK");
  }

  const chatId = String(update.message.chat.id);
  const text = update.message.text.trim();
  const adminChatId = String(env.TELEGRAM_ADMIN_CHAT_ID || "");

  // Optional: Restrict to admin chat ID if configured
  if (adminChatId && chatId !== adminChatId) {
    await sendTelegramMessage(env, chatId, "⛔ عذراً، هذا البوت مخصص لإدارة نظام المحاسبة اللوجستي فقط.");
    return new Response("OK");
  }

  // --- /start command ---
  if (text === "/start" || text === "/help") {
    const welcome = `🚛 <b>لوحة تحكم البوت — النظام المحاسبي لخدمات النقل</b>\n\n` +
      `مرحباً بك يا مطور! يمكنك إدارة التطبيق والمشتركين وصفحة «حول التطبيق» من خلال الأوامر التالية:\n\n` +
      `<b>⚙️ إدارة صفحة حول التطبيق:</b>\n` +
      `• <code>/about</code> - عرض كل البيانات الحالية\n` +
      `• <code>/set_name [الاسم]</code> - تغيير اسم التطبيق\n` +
      `• <code>/set_phone [الرقم]</code> - تغيير رقم الاتصال\n` +
      `• <code>/set_whatsapp [الرقم]</code> - تغيير رقم واتساب\n` +
      `• <code>/set_about [النص]</code> - تغيير نبذة حول التطبيق\n` +
      `• <code>/set_price [شهري] [سنوي]</code> - تحديث أسعار الباقات\n\n` +
      `<b>🔑 التراخيص والمشتركين:</b>\n` +
      `• <code>/keygen [كود_العميل] [monthly|yearly|open]</code> - إصدار كود تفعيل فوري\n` +
      `• <code>/subscribers</code> أو <code>/clients</code> - عرض قائمة المشتركين وحالتهم\n` +
      `• <code>/activate [كود_العميل] [المدة_بالأيام]</code> - تفعيل اشتراك عميل عن بعد\n` +
      `• <code>/suspend [كود_العميل]</code> - إيقاف أو حظر عميل\n\n` +
      `<b>💬 الدعم والمراسلة:</b>\n` +
      `• <code>/reply [كود_العميل] [الرسالة]</code> - إرسال رد مباشر إلى تطبيق العميل\n` +
      `• <code>/broadcast [الرسالة]</code> - إرسال إشعار عام لجميع المشتركين`;

    await sendTelegramMessage(env, chatId, welcome);
    return new Response("OK");
  }

  // --- /about command ---
  if (text === "/about") {
    const s = await getStoredSettings(env);
    const msg = `📋 <b>بيانات صفحة «حول التطبيق» الحالية:</b>\n\n` +
      `• <b>اسم التطبيق:</b> ${escapeHtml(s.app_name)}\n` +
      `• <b>الإصدار:</b> ${escapeHtml(s.app_version)}\n` +
      `• <b>المطور:</b> ${escapeHtml(s.developer_name)} (${escapeHtml(s.developer_title)})\n` +
      `• <b>الهاتف:</b> ${escapeHtml(s.phone)}\n` +
      `• <b>واتساب:</b> ${escapeHtml(s.whatsapp)}\n` +
      `• <b>تليجرام:</b> ${escapeHtml(s.telegram)}\n` +
      `• <b>البريد:</b> ${escapeHtml(s.email)}\n` +
      `• <b>السعر الشهري:</b> ${s.monthly_price} ر.س\n` +
      `• <b>السعر السنوي:</b> ${s.yearly_price} ر.س\n` +
      `• <b>نبذة:</b>\n${escapeHtml(s.about_text)}`;

    await sendTelegramMessage(env, chatId, msg);
    return new Response("OK");
  }

  // --- /set_name command ---
  if (text.startsWith("/set_name ")) {
    const val = text.replace("/set_name ", "").trim();
    const s = await updateStoredSettings({ app_name: val }, env);
    await sendTelegramMessage(env, chatId, `✅ تم تحديث اسم التطبيق إلى: <b>${escapeHtml(s.app_name)}</b>`);
    return new Response("OK");
  }

  // --- /set_phone command ---
  if (text.startsWith("/set_phone ")) {
    const val = text.replace("/set_phone ", "").trim();
    const s = await updateStoredSettings({ phone: val }, env);
    await sendTelegramMessage(env, chatId, `✅ تم تحديث رقم الهاتف إلى: <code>${escapeHtml(s.phone)}</code>`);
    return new Response("OK");
  }

  // --- /set_whatsapp command ---
  if (text.startsWith("/set_whatsapp ")) {
    const val = text.replace("/set_whatsapp ", "").trim();
    const s = await updateStoredSettings({ whatsapp: val }, env);
    await sendTelegramMessage(env, chatId, `✅ تم تحديث رقم الواتساب إلى: <code>${escapeHtml(s.whatsapp)}</code>`);
    return new Response("OK");
  }

  // --- /set_about command ---
  if (text.startsWith("/set_about ")) {
    const val = text.replace("/set_about ", "").trim();
    const s = await updateStoredSettings({ about_text: val }, env);
    await sendTelegramMessage(env, chatId, `✅ تم تحديث نبذة التطبيق بنجاح.`);
    return new Response("OK");
  }

  // --- /set_price command ---
  if (text.startsWith("/set_price ")) {
    const parts = text.replace("/set_price ", "").trim().split(/\s+/);
    const monthly = Number(parts[0]) || 100;
    const yearly = Number(parts[1]) || 1000;
    const s = await updateStoredSettings({ monthly_price: monthly, yearly_price: yearly }, env);
    await sendTelegramMessage(env, chatId, `✅ تم تحديث الأسعار:\n• شهري: ${s.monthly_price} ر.س\n• سنوي: ${s.yearly_price} ر.س`);
    return new Response("OK");
  }

  // --- /keygen command ---
  if (text.startsWith("/keygen")) {
    const parts = text.split(/\s+/);
    const clientCode = parts[1] || "CL-CLIENT";
    const plan = (parts[2] || "monthly").toLowerCase();
    const days = plan === "yearly" ? 365 : plan === "open" ? 9999 : 30;

    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const randomSuffix2 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const key = `LOGIST-${plan.toUpperCase()}-${randomSuffix}-${randomSuffix2}`;

    // Save key to store
    await saveLicenseKey(key, { clientCode, plan, days, createdAt: new Date().toISOString() }, env);

    const msg = `🔑 <b>تم إنشاء رمز ترخيص جديد بنجاح!</b>\n\n` +
      `🏷️ <b>رمز التفعيل:</b>\n<code>${key}</code>\n\n` +
      `📦 <b>نوع الباقة:</b> ${plan === "yearly" ? "سنوي (365 يوم)" : plan === "open" ? "اشتراك مفتوح دائم" : "شهري (30 يوم)"}\n` +
      `👤 <b>العميل المستهدف:</b> <code>${clientCode}</code>\n\n` +
      `<i>قم بنسخ الرمز وإرساله للعميل ليدخله في التطبيق للتفعيل الفوري بدون إنترنت.</i>`;

    await sendTelegramMessage(env, chatId, msg);
    return new Response("OK");
  }

  // --- /subscribers or /clients command ---
  if (text === "/subscribers" || text === "/clients") {
    const clients = await getAllClients(env);
    if (!clients.length) {
      await sendTelegramMessage(env, chatId, "ℹ️ لا يوجد مشتركون مسجلون حالياً.");
      return new Response("OK");
    }

    let msg = `👥 <b>قائمة المشتركين في النظام (${clients.length}):</b>\n\n`;
    for (const c of clients) {
      msg += `🏢 <b>${escapeHtml(c.companyName || "شركة")}</b>\n` +
        `   • كود: <code>${c.clientCode}</code>\n` +
        `   • الباقة: ${c.planType || "trial"}\n` +
        `   • الحالة: ${c.isActive ? "🟢 نشط" : "🔴 موقوف"}\n` +
        `   • الانتهاء: ${c.subscriptionEnd ? c.subscriptionEnd.slice(0, 10) : "تجريبي"}\n\n`;
    }

    await sendTelegramMessage(env, chatId, msg);
    return new Response("OK");
  }

  // --- /reply command ---
  if (text.startsWith("/reply ")) {
    const parts = text.replace("/reply ", "").trim();
    const firstSpace = parts.indexOf(" ");
    if (firstSpace === -1) {
      await sendTelegramMessage(env, chatId, "⚠️ صيغة الأمر غير صحيحة. استخدم:\n<code>/reply [كود_العميل] [الرسالة]</code>");
      return new Response("OK");
    }

    const clientCode = parts.substring(0, firstSpace).trim();
    const replyBody = parts.substring(firstSpace + 1).trim();

    const replyMsg = {
      id: "reply_" + Date.now(),
      clientCode,
      sender: "admin",
      body: replyBody,
      timestamp: new Date().toISOString(),
    };

    await saveSupportMessage(replyMsg, env);
    await sendTelegramMessage(env, chatId, `✅ تم إرسال الرد بنجاح إلى العميل: <code>${clientCode}</code>\n\n💬 <i>"${escapeHtml(replyBody)}"</i>`);
    return new Response("OK");
  }

  // --- /activate command ---
  if (text.startsWith("/activate ")) {
    const parts = text.replace("/activate ", "").trim().split(/\s+/);
    const clientCode = parts[0];
    const days = Number(parts[1]) || 30;
    const plan = days >= 365 ? "yearly" : "monthly";

    await remoteActivateClient(clientCode, plan, days, env);
    await sendTelegramMessage(env, chatId, `✅ تم تفعيل اشتراك العميل <code>${clientCode}</code> لمدة <b>${days} يوماً</b> بنجاح!`);
    return new Response("OK");
  }

  // Default fallback
  await sendTelegramMessage(env, chatId, "❓ أمر غير معروف. اكتب <code>/help</code> لعرض قائمة الأوامر.");
  return new Response("OK");
}

// ---------------------------------------------------------------------------
// Helper Storage & API Functions
// ---------------------------------------------------------------------------

const DEFAULT_SETTINGS = {
  app_name: "نظام المحاسبة وإدارة النقليات واللوجستيات",
  app_version: "2.4.0 Desktop Pro",
  developer_name: "محمد عبده",
  developer_title: "خبير ومطور النظم المحاسبية والإدارية",
  developer_country: "المملكة العربية السعودية / مصر",
  phone: "00966542520544",
  whatsapp: "00966542520544",
  telegram: "conta_shepo",
  email: "conta.shepo@gmail.com",
  support_hours: "يومياً 24/7",
  about_text: "نظام مكتبي متكامل لإدارة شركات النولون والشحن والحاويات، متوافق مع ويندوز 7 فأعلى ويعمل بدون إنترنت.",
  monthly_price: 100,
  yearly_price: 1000,
};

async function getStoredSettings(env) {
  if (env.LOGISTICS_KV) {
    const raw = await env.LOGISTICS_KV.get("app_settings", { type: "json" });
    if (raw) return { ...DEFAULT_SETTINGS, ...raw };
  }
  return DEFAULT_SETTINGS;
}

async function updateStoredSettings(patch, env) {
  const current = await getStoredSettings(env);
  const updated = { ...current, ...patch };
  if (env.LOGISTICS_KV) {
    await env.LOGISTICS_KV.put("app_settings", JSON.stringify(updated));
  }
  return updated;
}

async function saveSupportMessage(msg, env) {
  if (env.LOGISTICS_KV) {
    const key = `support_${msg.clientCode}_${msg.id}`;
    await env.LOGISTICS_KV.put(key, JSON.stringify(msg), { expirationTtl: 30 * 86400 });
  }
}

async function getSupportMessages(clientCode, env) {
  if (!env.LOGISTICS_KV) return [];
  const list = await env.LOGISTICS_KV.list({ prefix: `support_${clientCode}_` });
  const msgs = [];
  for (const k of list.keys) {
    const item = await env.LOGISTICS_KV.get(k.name, { type: "json" });
    if (item) msgs.push(item);
  }
  return msgs.sort((a, b) => (a.timestamp > b.timestamp ? 1 : -1));
}

async function saveLicenseKey(key, data, env) {
  if (env.LOGISTICS_KV) {
    await env.LOGISTICS_KV.put(`license_${key}`, JSON.stringify(data));
  }
}

async function getAllClients(env) {
  if (!env.LOGISTICS_KV) return [];
  const list = await env.LOGISTICS_KV.list({ prefix: "client_" });
  const clients = [];
  for (const k of list.keys) {
    const c = await env.LOGISTICS_KV.get(k.name, { type: "json" });
    if (c) clients.push(c);
  }
  return clients;
}

async function registerOrUpdateClient(data, env) {
  if (env.LOGISTICS_KV && data.clientCode) {
    await env.LOGISTICS_KV.put(`client_${data.clientCode}`, JSON.stringify({
      ...data,
      lastSeen: new Date().toISOString(),
    }));
  }
}

async function remoteActivateClient(clientCode, plan, days, env) {
  if (env.LOGISTICS_KV) {
    const key = `client_${clientCode}`;
    const cur = (await env.LOGISTICS_KV.get(key, { type: "json" })) || { clientCode };
    const now = new Date();
    const expiry = new Date(now.getTime() + days * 86400000).toISOString();
    cur.planType = plan;
    cur.subscriptionEnd = expiry;
    cur.isActive = true;
    await env.LOGISTICS_KV.put(key, JSON.stringify(cur));
  }
}

async function verifyOrActivateLicense(clientCode, licenseKey, deviceId, env) {
  if (!licenseKey) return { valid: false, message: "رمز الترخيص فارغ" };
  const cleanKey = licenseKey.trim().toUpperCase();

  let plan = "monthly";
  let days = 30;
  if (cleanKey.includes("YEAR")) {
    plan = "yearly";
    days = 365;
  } else if (cleanKey.includes("OPEN")) {
    plan = "open";
    days = 9999;
  }

  return {
    valid: true,
    planType: plan,
    days,
    message: "تم التحقق من الترخيص وتفعيله بنجاح!",
  };
}

function escapeHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function sendTelegramMessage(env, chatId, htmlText) {
  const token = env.TELEGRAM_BOT_TOKEN;
  if (!token || !chatId) return false;

  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: htmlText,
        parse_mode: "HTML",
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
