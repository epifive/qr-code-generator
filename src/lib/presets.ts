import { EMPTY_FIELDS, type FieldsByType, type QrType } from "./payloads";
import { DEFAULT_STYLE, type QrStyle } from "./render";
import type { SavedDesign } from "./storage";

export interface StylePreset {
  id: string;
  name: string;
  style: Partial<QrStyle>;
}

/** One-click looks. Applying a preset keeps the logo and frame text. */
export const STYLE_PRESETS: StylePreset[] = [
  { id: "classic", name: "Classic", style: { fg: "#111827", bg: "#ffffff", dotShape: "square", eyeFrame: "square", eyeBall: "square", gradient: { ...DEFAULT_STYLE.gradient, enabled: false }, eyeFrameColor: null, eyeBallColor: null } },
  { id: "indigo", name: "Indigo dots", style: { fg: "#4338ca", bg: "#ffffff", dotShape: "dots", eyeFrame: "rounded", eyeBall: "circle", gradient: { ...DEFAULT_STYLE.gradient, enabled: false }, eyeFrameColor: "#312e81", eyeBallColor: "#0f766e" } },
  { id: "ocean", name: "Ocean", style: { fg: "#1d4ed8", bg: "#ffffff", dotShape: "fluid", eyeFrame: "rounded", eyeBall: "rounded", gradient: { enabled: true, type: "linear", color2: "#0f766e", rotation: 45 }, eyeFrameColor: null, eyeBallColor: null } },
  { id: "sunset", name: "Sunset", style: { fg: "#be123c", bg: "#fffbeb", dotShape: "rounded", eyeFrame: "leaf", eyeBall: "leaf", gradient: { enabled: true, type: "linear", color2: "#c2410c", rotation: 90 }, eyeFrameColor: null, eyeBallColor: null } },
  { id: "forest", name: "Forest", style: { fg: "#14532d", bg: "#f0fdf4", dotShape: "classy", eyeFrame: "leaf", eyeBall: "circle", gradient: { ...DEFAULT_STYLE.gradient, enabled: false }, eyeFrameColor: null, eyeBallColor: "#15803d" } },
  { id: "midnight", name: "Midnight", style: { fg: "#0f172a", bg: "#e0e7ff", dotShape: "dots", eyeFrame: "circle", eyeBall: "circle", gradient: { enabled: true, type: "radial", color2: "#6d28d9", rotation: 0 }, eyeFrameColor: null, eyeBallColor: null } },
  { id: "mono-round", name: "Soft mono", style: { fg: "#27272a", bg: "#ffffff", dotShape: "fluid", eyeFrame: "circle", eyeBall: "rounded", gradient: { ...DEFAULT_STYLE.gradient, enabled: false }, eyeFrameColor: null, eyeBallColor: null } },
];

// Small built-in logos (icons adapted from Lucide, ISC licence), drawn as white strokes on a coloured tile.
const ICONS: Record<string, { color: string; paths: string }> = {
  link: { color: "#4f46e5", paths: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>' },
  rupee: { color: "#0f766e", paths: '<path d="M6 3h12"/><path d="M6 8h12"/><path d="m6 13 8.5 8"/><path d="M6 13h3"/><path d="M9 13c6.667 0 6.667-10 0-10"/>' },
  wifi: { color: "#2563eb", paths: '<path d="M12 20h.01"/><path d="M2 8.82a15 15 0 0 1 20 0"/><path d="M5 12.859a10 10 0 0 1 14 0"/><path d="M8.5 16.429a5 5 0 0 1 7 0"/>' },
  chat: { color: "#16a34a", paths: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>' },
  mail: { color: "#db2777", paths: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>' },
  pin: { color: "#dc2626", paths: '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>' },
  phone: { color: "#7c3aed", paths: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>' },
  user: { color: "#0891b2", paths: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/>' },
  star: { color: "#d97706", paths: '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>' },
  food: { color: "#ea580c", paths: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>' },
};

export const BUILTIN_LOGOS = Object.keys(ICONS);

export function builtinLogo(id: string): string {
  const icon = ICONS[id] ?? ICONS.link;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="12" fill="${icon.color}"/><g transform="translate(12 12)" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${icon.paths}</g></svg>`;
  return `data:image/svg+xml;base64,${typeof btoa === "function" ? btoa(svg) : Buffer.from(svg).toString("base64")}`;
}

/** Default logo suggestion per QR type. */
export const TYPE_LOGO: Record<QrType, string> = {
  url: "link",
  text: "star",
  upi: "rupee",
  wifi: "wifi",
  vcard: "user",
  email: "mail",
  sms: "phone",
  whatsapp: "chat",
  location: "pin",
};

/** Sample fields shown when a type is opened with empty fields. */
export const SAMPLE_FIELDS: FieldsByType = {
  url: { url: "https://www.epifive.com/products/qr-studio-pro" },
  text: { text: "Thank you for visiting! Show this code at the counter for 10% off." },
  upi: { vpa: "sharmastore@okaxis", name: "Sharma General Store", amount: "", note: "", currency: "INR" },
  wifi: { ssid: "Cafe Guest", password: "welcome2026", encryption: "WPA", hidden: false },
  vcard: { ...EMPTY_FIELDS.vcard, firstName: "Asha", lastName: "Rao", org: "Rao Design Studio", title: "Founder", mobile: "+91 98765 43210", email: "asha@example.com", website: "example.com", city: "Pune", country: "India" },
  email: { to: "hello@example.com", subject: "Enquiry", body: "Hi, I saw your poster and would like to know more." },
  sms: { phone: "+91 98765 43210", message: "YES, book a table for 2" },
  whatsapp: { phone: "+91 98765 43210", message: "Hi! I'd like to place an order." },
  location: { lat: "18.5204", lng: "73.8567", label: "Our shop", mode: "maps" },
};

/** Sample designs added on the very first visit (clearly marked as samples, deletable). */
export function sampleDesigns(): SavedDesign[] {
  const now = new Date().toISOString();
  const mk = (id: string, name: string, type: QrType, style: Partial<QrStyle>): SavedDesign => ({
    id: `sample-${id}`,
    name,
    type,
    fields: SAMPLE_FIELDS[type],
    style: { ...DEFAULT_STYLE, ...style },
    sample: true,
    createdAt: now,
    updatedAt: now,
  });
  return [
    mk("upi", "Sample: Shop UPI payment", "upi", {
      ...STYLE_PRESETS[4].style,
      ecLevel: "H",
      logo: { src: builtinLogo("rupee"), size: 0.22, excavate: true, backdrop: "rounded" },
      frame: { style: "banner-bottom", text: "SCAN & PAY WITH UPI", color: "#14532d", textColor: "#ffffff" },
    }),
    mk("wifi", "Sample: Cafe WiFi", "wifi", {
      ...STYLE_PRESETS[2].style,
      ecLevel: "Q",
      logo: { src: builtinLogo("wifi"), size: 0.2, excavate: true, backdrop: "circle" },
      frame: { style: "bubble", text: "FREE WIFI", color: "#1d4ed8", textColor: "#ffffff" },
    }),
    mk("vcard", "Sample: Business card", "vcard", {
      ...STYLE_PRESETS[1].style,
      ecLevel: "M",
      frame: { style: "outline", text: "SAVE MY CONTACT", color: "#4338ca", textColor: "#ffffff" },
    }),
  ];
}
