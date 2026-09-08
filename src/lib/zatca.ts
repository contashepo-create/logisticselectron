// محرك امتثال الفوترة الإلكترونية زاتكا (هيئة الزكاة والضريبة والجمارك — السعودية)
// TLV Encoding Base64 + Phase 1 & 2 QR + QR Image Generation

import QRCode from "qrcode";

export interface ZatcaQrInput {
  sellerName: string;
  vatNumber: string;
  timestamp: string;
  totalWithVat: number;
  vatAmount: number;
}

/** ترميز قيمة واحدة بصيغة TLV: [tag][length][value] بترميز UTF-8 */
export function tlv(tag: number, value: string): Uint8Array {
  const bytes = new TextEncoder().encode(value);
  if (bytes.length > 255) {
    // If > 255, clamp to 255
    const clamped = bytes.slice(0, 255);
    const out = new Uint8Array(clamped.length + 2);
    out[0] = tag;
    out[1] = clamped.length;
    out.set(clamped, 2);
    return out;
  }
  const out = new Uint8Array(bytes.length + 2);
  out[0] = tag;
  out[1] = bytes.length;
  out.set(bytes, 2);
  return out;
}

/** تحويل بايتات إلى Base64 */
export function bytesToBase64(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) {
    bin += String.fromCharCode(bytes[i]);
  }
  return btoa(bin);
}

export function zatcaAmount(v: number): string {
  return (Math.round((Number(v) || 0) * 100) / 100).toFixed(2);
}

export function zatcaTimestamp(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const iso = isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
  return iso.replace(/\.\d{3}Z$/, "Z");
}

/** توليد رمز الاستجابة السريعة المعتمد من زاتكا بصيغة Base64 TLV */
export function buildZatcaQr(input: ZatcaQrInput): string {
  const parts = [
    tlv(1, String(input.sellerName ?? "").trim()),
    tlv(2, String(input.vatNumber ?? "").replace(/\D/g, "")),
    tlv(3, zatcaTimestamp(input.timestamp)),
    tlv(4, zatcaAmount(input.totalWithVat)),
    tlv(5, zatcaAmount(input.vatAmount)),
  ];

  const totalLength = parts.reduce((acc, p) => acc + p.length, 0);
  const merged = new Uint8Array(totalLength);
  let offset = 0;
  for (const part of parts) {
    merged.set(part, offset);
    offset += part.length;
  }
  return bytesToBase64(merged);
}

/** توليد صورة QR كـ Data URL للطباعة الفورية */
export async function generateQrDataUrl(qrString: string): Promise<string> {
  try {
    return await QRCode.toDataURL(qrString, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 200,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });
  } catch (error) {
    console.error("QR Code generation error:", error);
    return "";
  }
}
