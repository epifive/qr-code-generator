import { describe, expect, it } from "vitest";
import {
  buildEmail,
  buildLocation,
  buildPayload,
  buildSms,
  buildText,
  buildUpi,
  buildUrl,
  buildVcard,
  buildWhatsapp,
  buildWifi,
  cleanPhone,
  EMPTY_FIELDS,
  escapeVcard,
  escapeWifi,
  normalizeUrl,
  parseCoordinates,
} from "@/lib/payloads";

describe("url", () => {
  it("adds https:// to bare domains", () => {
    expect(normalizeUrl("epifive.com")).toBe("https://epifive.com");
    expect(buildUrl({ url: "epifive.com/products" }).value).toBe("https://epifive.com/products");
  });
  it("keeps explicit schemes", () => {
    expect(buildUrl({ url: "http://example.com" }).value).toBe("http://example.com");
    expect(buildUrl({ url: "tel:+911234" }).value).toBe("tel:+911234");
  });
  it("rejects empty and invalid input", () => {
    expect(buildUrl({ url: "" }).errors.url).toBeTruthy();
    expect(buildUrl({ url: "not a url" }).value).toBe("");
  });
});

describe("text", () => {
  it("passes text through and validates", () => {
    expect(buildText({ text: "Hello" }).value).toBe("Hello");
    expect(buildText({ text: "  " }).errors.text).toBeTruthy();
    expect(buildText({ text: "x".repeat(2001) }).value).toBe("");
  });
});

describe("upi", () => {
  const base = { vpa: "shop@okaxis", name: "Sharma General Store", amount: "", note: "", currency: "INR" };
  it("builds a upi://pay link with encoded spaces", () => {
    expect(buildUpi(base).value).toBe("upi://pay?pa=shop%40okaxis&pn=Sharma%20General%20Store&cu=INR");
  });
  it("formats amount and note", () => {
    const v = buildUpi({ ...base, amount: "499.5", note: "Order #42" }).value;
    expect(v).toContain("am=499.50");
    expect(v).toContain("tn=Order%20%2342");
  });
  it("validates the UPI id, name and amount", () => {
    expect(buildUpi({ ...base, vpa: "nope" }).errors.vpa).toBeTruthy();
    expect(buildUpi({ ...base, name: "" }).errors.name).toBeTruthy();
    expect(buildUpi({ ...base, amount: "-5" }).errors.amount).toBeTruthy();
    expect(buildUpi({ ...base, amount: "1.234" }).errors.amount).toBeTruthy();
    expect(buildUpi({ ...base, amount: "0" }).errors.amount).toBeTruthy();
  });
});

describe("wifi", () => {
  it("escapes special characters", () => {
    expect(escapeWifi('a;b,c:d"e\\f')).toBe('a\\;b\\,c\\:d\\"e\\\\f');
  });
  it("builds WPA, open and hidden networks", () => {
    expect(buildWifi({ ssid: "Cafe", password: "secret123", encryption: "WPA", hidden: false }).value).toBe("WIFI:T:WPA;S:Cafe;P:secret123;;");
    expect(buildWifi({ ssid: "Open", password: "", encryption: "nopass", hidden: true }).value).toBe("WIFI:T:nopass;S:Open;H:true;;");
  });
  it("requires a password for secured networks", () => {
    expect(buildWifi({ ssid: "x", password: "", encryption: "WPA", hidden: false }).errors.password).toBeTruthy();
    expect(buildWifi({ ssid: "x", password: "short", encryption: "WPA", hidden: false }).errors.password).toBeTruthy();
    expect(buildWifi({ ssid: "", password: "secret123", encryption: "WPA", hidden: false }).errors.ssid).toBeTruthy();
  });
});

describe("vcard", () => {
  it("escapes values", () => {
    expect(escapeVcard("a,b;c\\d\ne")).toBe("a\\,b\\;c\\\\d\\ne");
  });
  it("builds a vCard 3.0", () => {
    const v = buildVcard({
      ...EMPTY_FIELDS.vcard,
      firstName: "Asha",
      lastName: "Rao",
      org: "Rao & Co, Ltd",
      mobile: "+91 98765-43210",
      email: "asha@example.com",
      website: "example.com",
      city: "Pune",
    }).value;
    expect(v.split("\n")).toEqual([
      "BEGIN:VCARD",
      "VERSION:3.0",
      "N:Rao;Asha;;;",
      "FN:Asha Rao",
      "ORG:Rao & Co\\, Ltd",
      "TEL;TYPE=CELL:+919876543210",
      "EMAIL;TYPE=INTERNET:asha@example.com",
      "URL:https://example.com",
      "ADR;TYPE=WORK:;;;Pune;;;",
      "END:VCARD",
    ]);
  });
  it("needs a name or company and a valid email", () => {
    expect(buildVcard(EMPTY_FIELDS.vcard).errors.firstName).toBeTruthy();
    expect(buildVcard({ ...EMPTY_FIELDS.vcard, org: "X", email: "bad" }).errors.email).toBeTruthy();
  });
});

describe("email, sms, whatsapp", () => {
  it("builds mailto links", () => {
    expect(buildEmail({ to: "hi@example.com", subject: "Hello there", body: "" }).value).toBe("mailto:hi@example.com?subject=Hello%20there");
    expect(buildEmail({ to: "bad", subject: "", body: "" }).errors.to).toBeTruthy();
  });
  it("builds SMSTO", () => {
    expect(buildSms({ phone: "+1 (555) 010-9999", message: "Hi" }).value).toBe("SMSTO:+15550109999:Hi");
    expect(cleanPhone(" 98 76 ")).toBe("9876");
  });
  it("builds wa.me links", () => {
    expect(buildWhatsapp({ phone: "+91 98765 43210", message: "Hi! Order?" }).value).toBe("https://wa.me/919876543210?text=Hi!%20Order%3F");
    expect(buildWhatsapp({ phone: "12", message: "" }).errors.phone).toBeTruthy();
  });
});

describe("location", () => {
  it("builds Google Maps and geo: links", () => {
    expect(buildLocation({ lat: "18.5204", lng: "73.8567", label: "", mode: "maps" }).value).toBe(
      "https://www.google.com/maps/search/?api=1&query=18.5204,73.8567",
    );
    expect(buildLocation({ lat: "18.5204", lng: "73.8567", label: "Office", mode: "geo" }).value).toBe("geo:18.5204,73.8567?q=18.5204,73.8567(Office)");
  });
  it("validates ranges", () => {
    expect(buildLocation({ lat: "91", lng: "0", label: "", mode: "maps" }).errors.lat).toBeTruthy();
    expect(buildLocation({ lat: "", lng: "0", label: "", mode: "maps" }).errors.lat).toBeTruthy();
  });
  it("parses pasted coordinates", () => {
    expect(parseCoordinates("https://maps.google.com/?q=12.9716,77.5946")).toEqual({ lat: "12.9716", lng: "77.5946" });
    expect(parseCoordinates("hello")).toBeNull();
  });
});

it("buildPayload dispatches by type", () => {
  expect(buildPayload("text", { text: "x" }).value).toBe("x");
});
