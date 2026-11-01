// Builders that turn form fields into the text encoded in a QR code.
// Every builder returns { value, errors }. `value` is empty when required fields are missing.

export type QrType =
  | "url"
  | "text"
  | "upi"
  | "wifi"
  | "vcard"
  | "email"
  | "sms"
  | "whatsapp"
  | "location";

export interface UrlFields {
  url: string;
}
export interface TextFields {
  text: string;
}
export interface UpiFields {
  vpa: string;
  name: string;
  amount: string;
  note: string;
  currency: string;
}
export interface WifiFields {
  ssid: string;
  password: string;
  encryption: "WPA" | "WEP" | "nopass";
  hidden: boolean;
}
export interface VcardFields {
  firstName: string;
  lastName: string;
  org: string;
  title: string;
  phone: string;
  mobile: string;
  email: string;
  website: string;
  street: string;
  city: string;
  region: string;
  zip: string;
  country: string;
  note: string;
}
export interface EmailFields {
  to: string;
  subject: string;
  body: string;
}
export interface SmsFields {
  phone: string;
  message: string;
}
export interface WhatsappFields {
  phone: string;
  message: string;
}
export interface LocationFields {
  lat: string;
  lng: string;
  label: string;
  mode: "maps" | "geo";
}

export interface FieldsByType {
  url: UrlFields;
  text: TextFields;
  upi: UpiFields;
  wifi: WifiFields;
  vcard: VcardFields;
  email: EmailFields;
  sms: SmsFields;
  whatsapp: WhatsappFields;
  location: LocationFields;
}

export type AnyFields = FieldsByType[QrType];

export interface PayloadResult {
  value: string;
  errors: Record<string, string>;
}

export const EMPTY_FIELDS: FieldsByType = {
  url: { url: "" },
  text: { text: "" },
  upi: { vpa: "", name: "", amount: "", note: "", currency: "INR" },
  wifi: { ssid: "", password: "", encryption: "WPA", hidden: false },
  vcard: {
    firstName: "",
    lastName: "",
    org: "",
    title: "",
    phone: "",
    mobile: "",
    email: "",
    website: "",
    street: "",
    city: "",
    region: "",
    zip: "",
    country: "",
    note: "",
  },
  email: { to: "", subject: "", body: "" },
  sms: { phone: "", message: "" },
  whatsapp: { phone: "", message: "" },
  location: { lat: "", lng: "", label: "", mode: "maps" },
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VPA_RE = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z][a-zA-Z0-9.-]{1,64}$/;

/** Keep digits and a leading +. */
export function cleanPhone(phone: string): string {
  const t = phone.trim();
  const digits = t.replace(/\D/g, "");
  return t.startsWith("+") ? `+${digits}` : digits;
}

/** Adds https:// when the user typed a bare domain. */
export function normalizeUrl(input: string): string {
  const t = input.trim();
  if (!t) return "";
  if (/^[a-z][a-z0-9+.-]*:/i.test(t)) return t;
  return `https://${t}`;
}

export function isValidUrl(input: string): boolean {
  try {
    const u = new URL(normalizeUrl(input));
    if (u.protocol === "http:" || u.protocol === "https:") return /\./.test(u.hostname) || u.hostname === "localhost";
    return true;
  } catch {
    return false;
  }
}

export function buildUrl(f: UrlFields): PayloadResult {
  const errors: Record<string, string> = {};
  if (!f.url.trim()) return { value: "", errors: { url: "Enter a link" } };
  if (!isValidUrl(f.url)) errors.url = "This does not look like a valid link";
  return { value: errors.url ? "" : normalizeUrl(f.url), errors };
}

export function buildText(f: TextFields): PayloadResult {
  if (!f.text.trim()) return { value: "", errors: { text: "Enter some text" } };
  if (f.text.length > 2000) return { value: "", errors: { text: "Keep it under 2,000 characters" } };
  return { value: f.text, errors: {} };
}

/** upi://pay deep link (NPCI UPI linking spec). */
export function buildUpi(f: UpiFields): PayloadResult {
  const errors: Record<string, string> = {};
  const vpa = f.vpa.trim();
  if (!vpa) errors.vpa = "Enter the UPI ID (e.g. shop@okaxis)";
  else if (!VPA_RE.test(vpa)) errors.vpa = "UPI IDs look like name@bank";
  if (!f.name.trim()) errors.name = "Enter the payee name";
  const amount = f.amount.trim();
  if (amount) {
    if (!/^\d{1,7}(\.\d{1,2})?$/.test(amount) || Number(amount) <= 0)
      errors.amount = "Use a positive amount with up to 2 decimals";
  }
  if (f.note.length > 80) errors.note = "Keep the note under 80 characters";
  if (Object.keys(errors).length) return { value: "", errors };
  const params = new URLSearchParams();
  params.set("pa", vpa);
  params.set("pn", f.name.trim());
  if (amount) params.set("am", Number(amount).toFixed(2));
  params.set("cu", (f.currency || "INR").toUpperCase());
  if (f.note.trim()) params.set("tn", f.note.trim());
  // URLSearchParams encodes spaces as "+"; UPI apps expect %20.
  return { value: `upi://pay?${params.toString().replace(/\+/g, "%20")}`, errors };
}

/** Escape \ ; , : " for the WIFI: format. */
export function escapeWifi(value: string): string {
  return value.replace(/([\\;,:"])/g, "\\$1");
}

export function buildWifi(f: WifiFields): PayloadResult {
  const errors: Record<string, string> = {};
  if (!f.ssid.trim()) errors.ssid = "Enter the network name (SSID)";
  if (f.encryption !== "nopass") {
    if (!f.password) errors.password = "Enter the WiFi password";
    else if (f.encryption === "WPA" && f.password.length < 8)
      errors.password = "WPA passwords have at least 8 characters";
  }
  if (Object.keys(errors).length) return { value: "", errors };
  const parts = [`T:${f.encryption}`, `S:${escapeWifi(f.ssid)}`];
  if (f.encryption !== "nopass") parts.push(`P:${escapeWifi(f.password)}`);
  if (f.hidden) parts.push("H:true");
  return { value: `WIFI:${parts.join(";")};;`, errors };
}

/** Escape text values for vCard 3.0. */
export function escapeVcard(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

export function buildVcard(f: VcardFields): PayloadResult {
  const errors: Record<string, string> = {};
  if (!f.firstName.trim() && !f.lastName.trim() && !f.org.trim())
    errors.firstName = "Enter a name or a company";
  if (f.email.trim() && !EMAIL_RE.test(f.email.trim())) errors.email = "Enter a valid email";
  if (f.website.trim() && !isValidUrl(f.website)) errors.website = "Enter a valid website";
  if (Object.keys(errors).length) return { value: "", errors };
  const e = escapeVcard;
  const full = [f.firstName.trim(), f.lastName.trim()].filter(Boolean).join(" ") || f.org.trim();
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${e(f.lastName.trim())};${e(f.firstName.trim())};;;`,
    `FN:${e(full)}`,
  ];
  if (f.org.trim()) lines.push(`ORG:${e(f.org.trim())}`);
  if (f.title.trim()) lines.push(`TITLE:${e(f.title.trim())}`);
  if (f.mobile.trim()) lines.push(`TEL;TYPE=CELL:${cleanPhone(f.mobile)}`);
  if (f.phone.trim()) lines.push(`TEL;TYPE=WORK,VOICE:${cleanPhone(f.phone)}`);
  if (f.email.trim()) lines.push(`EMAIL;TYPE=INTERNET:${f.email.trim()}`);
  if (f.website.trim()) lines.push(`URL:${normalizeUrl(f.website)}`);
  if ([f.street, f.city, f.region, f.zip, f.country].some((v) => v.trim()))
    lines.push(
      `ADR;TYPE=WORK:;;${e(f.street.trim())};${e(f.city.trim())};${e(f.region.trim())};${e(f.zip.trim())};${e(f.country.trim())}`,
    );
  if (f.note.trim()) lines.push(`NOTE:${e(f.note.trim())}`);
  lines.push("END:VCARD");
  return { value: lines.join("\n"), errors };
}

export function buildEmail(f: EmailFields): PayloadResult {
  const to = f.to.trim();
  if (!to) return { value: "", errors: { to: "Enter an email address" } };
  if (!EMAIL_RE.test(to)) return { value: "", errors: { to: "Enter a valid email" } };
  const q: string[] = [];
  if (f.subject.trim()) q.push(`subject=${encodeURIComponent(f.subject.trim())}`);
  if (f.body.trim()) q.push(`body=${encodeURIComponent(f.body.trim())}`);
  return { value: `mailto:${to}${q.length ? `?${q.join("&")}` : ""}`, errors: {} };
}

export function buildSms(f: SmsFields): PayloadResult {
  const phone = cleanPhone(f.phone);
  if (phone.replace("+", "").length < 3) return { value: "", errors: { phone: "Enter a phone number" } };
  return { value: `SMSTO:${phone}:${f.message}`, errors: {} };
}

export function buildWhatsapp(f: WhatsappFields): PayloadResult {
  const digits = f.phone.replace(/\D/g, "");
  if (digits.length < 8)
    return { value: "", errors: { phone: "Enter the number with country code, e.g. 91 98765 43210" } };
  const text = f.message.trim() ? `?text=${encodeURIComponent(f.message.trim())}` : "";
  return { value: `https://wa.me/${digits}${text}`, errors: {} };
}

export function buildLocation(f: LocationFields): PayloadResult {
  const errors: Record<string, string> = {};
  const lat = Number(f.lat);
  const lng = Number(f.lng);
  if (f.lat.trim() === "" || !Number.isFinite(lat) || lat < -90 || lat > 90) errors.lat = "Latitude is between -90 and 90";
  if (f.lng.trim() === "" || !Number.isFinite(lng) || lng < -180 || lng > 180) errors.lng = "Longitude is between -180 and 180";
  if (Object.keys(errors).length) return { value: "", errors };
  const la = Number(lat.toFixed(6));
  const ln = Number(lng.toFixed(6));
  if (f.mode === "geo") {
    const label = f.label.trim() ? `?q=${la},${ln}(${encodeURIComponent(f.label.trim())})` : "";
    return { value: `geo:${la},${ln}${label}`, errors };
  }
  return { value: `https://www.google.com/maps/search/?api=1&query=${la},${ln}`, errors };
}

export function buildPayload<T extends QrType>(type: T, fields: FieldsByType[T]): PayloadResult {
  switch (type) {
    case "url":
      return buildUrl(fields as UrlFields);
    case "text":
      return buildText(fields as TextFields);
    case "upi":
      return buildUpi(fields as UpiFields);
    case "wifi":
      return buildWifi(fields as WifiFields);
    case "vcard":
      return buildVcard(fields as VcardFields);
    case "email":
      return buildEmail(fields as EmailFields);
    case "sms":
      return buildSms(fields as SmsFields);
    case "whatsapp":
      return buildWhatsapp(fields as WhatsappFields);
    case "location":
      return buildLocation(fields as LocationFields);
    default:
      return { value: "", errors: { _: "Unknown type" } };
  }
}

/** Parse a URL/coordinates pasted into the location form ("12.97, 77.59" or a Google Maps link). */
export function parseCoordinates(input: string): { lat: string; lng: string } | null {
  const m = input.match(/(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)/);
  if (!m) return null;
  const lat = Number(m[1]);
  const lng = Number(m[2]);
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat: m[1], lng: m[2] };
}
