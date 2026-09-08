import { describe, it, expect, beforeEach } from "vitest";
import { executeTelegramBotCommand } from "../lib/telegram-bot";
import { getAppSettings, getCompany, resetAllDataToDemo } from "../lib/storage";

describe("Cloudflare & Telegram Bot Commands Engine", () => {
  beforeEach(() => {
    // Reset seed data before each test
    resetAllDataToDemo();
  });

  it("responds to /start with command list", async () => {
    const res = await executeTelegramBotCommand("/start");
    expect(res.success).toBe(true);
    expect(res.replyText).toContain("لوحة تحكم البوت");
    expect(res.replyText).toContain("/about");
    expect(res.replyText).toContain("/keygen");
    expect(res.replyText).toContain("/subscribers");
  });

  it("responds to /about with application & developer info", async () => {
    const res = await executeTelegramBotCommand("/about");
    expect(res.success).toBe(true);
    expect(res.replyText).toContain("بيانات صفحة «حول التطبيق»");
    expect(res.replyText).toContain("محمد عبده");
  });

  it("updates developer name via /set_name", async () => {
    const res = await executeTelegramBotCommand("/set_name أسطول لوجستكس بلس");
    expect(res.success).toBe(true);
    expect(res.replyText).toContain("تم تحديث اسم التطبيق بنجاح إلى");

    const settings = getAppSettings();
    expect(settings.app_name).toBe("أسطول لوجستكس بلس");
  });

  it("updates phone via /set_phone", async () => {
    const res = await executeTelegramBotCommand("/set_phone +966509998877");
    expect(res.success).toBe(true);

    const settings = getAppSettings();
    expect(settings.phone).toBe("+966509998877");
  });

  it("updates whatsapp via /set_whatsapp", async () => {
    const res = await executeTelegramBotCommand("/set_whatsapp +966509998877");
    expect(res.success).toBe(true);

    const settings = getAppSettings();
    expect(settings.whatsapp).toBe("+966509998877");
  });

  it("updates subscription pricing via /set_price", async () => {
    const res = await executeTelegramBotCommand("/set_price 150 1400");
    expect(res.success).toBe(true);
    expect(res.replyText).toContain("تم تحديث أسعار الباقات");

    const settings = getAppSettings();
    expect(settings.monthly_price).toBe(150);
    expect(settings.yearly_price).toBe(1400);
  });

  it("generates license key via /keygen", async () => {
    const company = getCompany();
    const res = await executeTelegramBotCommand(`/keygen ${company.client_code} monthly`);
    expect(res.success).toBe(true);
    expect(res.replyText).toContain("تم إصدار كود تفعيل ترخيص جديد");
    expect(res.replyText).toContain("LOGIST-");
  });

  it("lists active subscribers via /subscribers", async () => {
    const res = await executeTelegramBotCommand("/subscribers");
    expect(res.success).toBe(true);
    expect(res.replyText).toContain("قائمة المشتركين الحاليين");
  });

  it("activates subscription remotely via /activate", async () => {
    const company = getCompany();
    const res = await executeTelegramBotCommand(`/activate ${company.client_code} 60`);
    expect(res.success).toBe(true);
    expect(res.replyText).toContain("تم تفعيل وتمديد اشتراك العميل بنجاح");
  });

  it("suspends subscription remotely via /suspend", async () => {
    const company = getCompany();
    const res = await executeTelegramBotCommand(`/suspend ${company.client_code}`);
    expect(res.success).toBe(true);
    expect(res.replyText).toContain("تم إيقاف وتعليق حساب العميل بنجاح");
  });

  it("sends developer reply to customer support chat via /reply", async () => {
    const company = getCompany();
    const res = await executeTelegramBotCommand(
      `/reply ${company.client_code} تم استلام طلبك وسيتم تفعيل الباقة خلال دقائق`
    );
    expect(res.success).toBe(true);
    expect(res.replyText).toContain("تم إرسال الرد");
  });
});
