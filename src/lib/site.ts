import type { QrType } from "./payloads";

export const SITE = {
  name: "QR Code Generator",
  /** Full product name used in titles and metadata. */
  fullName: "EpiFive QR Code Generator",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://qr-code-generator-demo.pages.dev",
  tagline: "Free QR code generator with logos, colours and UPI",
  description:
    "Create QR codes for links, UPI payments, WiFi, vCards, WhatsApp, email, SMS and maps. Add colours, gradients, a logo and a frame, then download PNG, SVG or print-ready PDF. Free, no sign-up, runs in your browser.",
  proUrl: "https://www.epifive.com/products/qr-code-generator-pro",
  githubUrl: "https://github.com/epifive/qr-code-generator",
  openSourceUrl: "https://www.epifive.com/open-source",
  servicesUrl: "https://www.epifive.com/services#custom-app-development",
  brandUrl: "https://www.epifive.com",
};

export interface TypeInfo {
  type: QrType;
  label: string;
  short: string;
  /** SEO landing page slug. */
  slug: string;
  h1: string;
  intro: string;
  tips: { q: string; a: string }[];
}

export const TYPE_INFO: TypeInfo[] = [
  {
    type: "url",
    label: "Website / URL",
    short: "URL",
    slug: "url-qr-code-generator",
    h1: "Free URL QR code generator",
    intro: "Turn any link into a styled QR code for posters, packaging, menus and business cards. No sign-up and no expiry.",
    tips: [
      { q: "Will my QR code stop working?", a: "No. A static QR code stores the link itself, so it works for as long as the link works. Nothing passes through our servers." },
      { q: "Can I change the link later?", a: "Not on a static code, because the link is printed in the pattern. QR Code Generator Pro adds dynamic codes whose destination you can edit after printing." },
    ],
  },
  {
    type: "upi",
    label: "UPI payment",
    short: "UPI",
    slug: "upi-qr-code-generator",
    h1: "Free UPI QR code generator",
    intro: "Make a UPI payment QR for your shop, invoice or donation page. Customers scan with GPay, PhonePe, Paytm or any UPI app and pay straight into your account.",
    tips: [
      { q: "Is there a fee?", a: "No. The code is a standard upi://pay link with your UPI ID. Money goes straight from the customer's UPI app to your bank. QR Code Generator never touches the payment." },
      { q: "Should I fix the amount?", a: "Leave the amount empty for a counter QR (the customer types the amount). Fill it in for a specific invoice or a fixed-price product." },
      { q: "Is this a merchant QR?", a: "It is a personal UPI deep link. Very large businesses may prefer the merchant QR from their bank or payment gateway, which also gives settlement reports." },
    ],
  },
  {
    type: "wifi",
    label: "WiFi",
    short: "WiFi",
    slug: "wifi-qr-code-generator",
    h1: "Free WiFi QR code generator",
    intro: "Let guests join your WiFi by pointing their camera at a code. Works on iPhone and Android without typing the password.",
    tips: [
      { q: "Is my WiFi password safe?", a: "The code is created in your browser and nothing is uploaded. Anyone who scans the printed code can join, so print it only where guests are welcome." },
      { q: "Which security type do I pick?", a: "Pick WPA/WPA2/WPA3 for almost every modern router, WEP only for very old ones, and None for open networks." },
    ],
  },
  {
    type: "vcard",
    label: "Contact card (vCard)",
    short: "vCard",
    slug: "vcard-qr-code-generator",
    h1: "Free vCard QR code generator",
    intro: "Put your contact details on a business card or badge. One scan saves your name, phone, email, company and website to the phone's contacts.",
    tips: [
      { q: "Why is my vCard QR code so dense?", a: "A vCard stores every field inside the code. Leave out fields you do not need, or use error correction L or M, to keep it easy to scan." },
    ],
  },
  {
    type: "whatsapp",
    label: "WhatsApp chat",
    short: "WhatsApp",
    slug: "whatsapp-qr-code-generator",
    h1: "Free WhatsApp QR code generator",
    intro: "Open a WhatsApp chat with your business number, with a ready-made message. Perfect for orders, bookings and support.",
    tips: [
      { q: "Which number format do I use?", a: "Use the full international number with the country code and no leading zero, e.g. 91 98765 43210 for India." },
    ],
  },
  {
    type: "text",
    label: "Plain text",
    short: "Text",
    slug: "text-qr-code-generator",
    h1: "Free text QR code generator",
    intro: "Encode a short message, a coupon code or instructions. The text shows up on the phone as soon as the code is scanned, with no internet needed.",
    tips: [],
  },
  {
    type: "email",
    label: "Email",
    short: "Email",
    slug: "email-qr-code-generator",
    h1: "Free email QR code generator",
    intro: "Open a pre-filled email to your address with a subject and message. Great for feedback, enquiries and RSVPs.",
    tips: [],
  },
  {
    type: "sms",
    label: "SMS",
    short: "SMS",
    slug: "sms-qr-code-generator",
    h1: "Free SMS QR code generator",
    intro: "Open the messages app with your number and a ready-made text, for opt-ins, votes and quick bookings.",
    tips: [],
  },
  {
    type: "location",
    label: "Location / map",
    short: "Location",
    slug: "location-qr-code-generator",
    h1: "Free location QR code generator",
    intro: "Share a map pin for your shop, venue or meeting point. Opens Google Maps (or the phone's default maps app with geo: links).",
    tips: [],
  },
];

export const typeInfo = (t: QrType) => TYPE_INFO.find((i) => i.type === t) ?? TYPE_INFO[0];
