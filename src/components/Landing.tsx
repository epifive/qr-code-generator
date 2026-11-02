import Link from "next/link";
import { Check, Globe, Image as ImageIcon, IndianRupee, Infinity as InfinityIcon, Lock, Palette, Printer, ScanLine, ShieldCheck, Sparkles, X } from "lucide-react";
import { SITE, TYPE_INFO } from "@/lib/site";
import { Logo } from "./Chrome";

export function Hero({ title, intro }: { title: string; intro: string }) {
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-40 -z-10 h-[420px] bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.18),transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.22),transparent_60%)]" />
      <div className="mx-auto max-w-7xl px-4 pb-6 pt-10 sm:px-6 sm:pt-14">
        <div className="max-w-3xl">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300">
            <Sparkles className="h-3.5 w-3.5" /> Free &amp; open source · no sign-up · no watermark
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">{title}</h1>
          <p className="mt-4 text-lg text-pretty text-zinc-600 dark:text-zinc-400">{intro}</p>
          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-zinc-600 dark:text-zinc-400">
            {["Codes never expire", "Runs 100% in your browser", "PNG, SVG & print PDF", "Built-in scan test"].map((t) => (
              <li key={t} className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-teal-600 dark:text-teal-400" /> {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

const FEATURES = [
  { icon: IndianRupee, title: "9 QR types, UPI included", text: "Links, UPI payments, WiFi, vCards, WhatsApp, email, SMS, text and map locations, with validation that catches typos before you print." },
  { icon: Palette, title: "Make it yours", text: "Colours, linear or radial gradients, 5 dot styles, 4 eye frame and centre shapes, custom eye colours and one-click style presets." },
  { icon: ImageIcon, title: "Logo in the centre", text: "Upload your logo or pick an icon. Dots behind it are cleared and error correction is raised automatically so it still scans." },
  { icon: Printer, title: "Frames & print PDF", text: "Add a call to action like “Scan to pay”. Export PNG up to 4096 px, vector SVG, or a PDF on A4, Letter, A5 or a sticker sheet." },
  { icon: ScanLine, title: "Scan test built in", text: "Every design is decoded in your browser with the ZXing engine, so you know it works before it goes on 1,000 flyers." },
  { icon: ShieldCheck, title: "Private by design", text: "Nothing is uploaded. No account, no tracking, no ads. Saved designs stay in your browser and export to JSON any time." },
];

export function Features() {
  return (
    <section id="features" className="scroll-mt-20 border-t border-zinc-200 bg-zinc-50/60 py-20 dark:border-zinc-800 dark:bg-zinc-900/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <h2 className="text-3xl font-semibold tracking-tight">Everything a QR code needs. Nothing it doesn’t.</h2>
        <p className="mt-3 max-w-2xl text-zinc-600 dark:text-zinc-400">Static QR codes store your content in the pattern itself, so they work forever, with or without us.</p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-4 inline-flex rounded-xl bg-indigo-50 p-2.5 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{f.text}</p>
            </div>
          ))}
        </div>
        <div className="mt-12">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Generators</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {TYPE_INFO.map((t) => (
              <Link key={t.slug} href={`/${t.slug}`} className="rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 text-sm text-zinc-700 hover:border-indigo-400 hover:text-indigo-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                {t.label} QR code
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const ROWS: [string, boolean | string, boolean | string][] = [
  ["Static QR codes (9 types incl. UPI, WiFi, vCard)", true, true],
  ["Colours, gradients, shapes, logo, frames", true, true],
  ["PNG / SVG / print PDF export", true, true],
  ["Saved designs + JSON export", "This browser", "Server database"],
  ["Dynamic QR codes (edit the link after printing)", false, true],
  ["Short redirect links on your own domain", false, true],
  ["Scan analytics: time, country, device, referrer (no cookies)", false, true],
  ["Password protection & expiry dates for links", false, true],
  ["Bulk generation from CSV → ZIP of PNG/SVG", false, true],
  ["REST API with API keys", false, true],
  ["Team accounts & white-label branding", false, true],
  ["Licence", "MIT (open source)", "Pro licence, self-hosted"],
];

export function FreeVsPro() {
  return (
    <section id="pro" className="scroll-mt-20 py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="text-center">
          <h2 className="text-3xl font-semibold tracking-tight">Free vs Pro</h2>
          <p className="mx-auto mt-3 max-w-2xl text-zinc-600 dark:text-zinc-400">
            Free does the whole job for static codes. Pro is a self-hosted server app for businesses that need codes they can change later, with scan stats, bulk and an API, for a one-time price instead of a monthly plan.
          </p>
        </div>
        <div className="mt-10 overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900">
              <tr>
                <th className="px-5 py-4 font-medium text-zinc-500">Feature</th>
                <th className="px-5 py-4 text-center font-semibold">Free</th>
                <th className="px-5 py-4 text-center font-semibold text-indigo-600 dark:text-indigo-400">Pro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {ROWS.map(([label, free, pro]) => (
                <tr key={label}>
                  <td className="px-5 py-3.5 text-zinc-700 dark:text-zinc-300">{label}</td>
                  {[free, pro].map((v, i) => (
                    <td key={i} className="px-5 py-3.5 text-center">
                      {v === true ? (
                        <Check className="mx-auto h-5 w-5 text-teal-600 dark:text-teal-400" aria-label="Included" />
                      ) : v === false ? (
                        <X className="mx-auto h-5 w-5 text-zinc-300 dark:text-zinc-600" aria-label="Not included" />
                      ) : (
                        <span className="text-xs text-zinc-600 dark:text-zinc-400">{v}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl bg-gradient-to-br from-indigo-600 to-teal-600 p-8 text-center text-white sm:flex-row sm:text-left">
          <div className="flex-1">
            <p className="text-xl font-semibold">QR Studio Pro: ₹1,999 / $29, one time</p>
            <p className="mt-1 text-sm text-indigo-100">Full source code, unlimited codes and scans on your own server, 1 year of updates and support.</p>
          </div>
          <a href={SITE.proUrl} className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-indigo-700 shadow-lg transition hover:bg-indigo-50">
            Get Pro
          </a>
        </div>
      </div>
    </section>
  );
}

export const GENERAL_FAQ = [
  { q: "Is QR Studio really free?", a: "Yes. The generator is free and open source (MIT). There is no sign-up, no watermark, no scan limit and the codes never expire." },
  { q: "Do my QR codes expire?", a: "No. These are static codes: the link or text is stored inside the pattern. They keep working forever and do not depend on our website." },
  { q: "Is my data uploaded anywhere?", a: "No. Codes are made in your browser. Logos, WiFi passwords and contact details never leave your device. Saved designs live in your browser's local storage." },
  { q: "Can I use the codes commercially?", a: "Yes. Use them on packaging, menus, flyers, invoices and client work. You own your codes." },
  { q: "Why does my code not scan?", a: "Usually low contrast, a light code on a dark background, a logo that is too big, or a missing margin. QR Studio tests every design with a real decoder and shows warnings to help you fix it." },
  { q: "What size should I print?", a: "At least 2 × 2 cm, and roughly one tenth of the scanning distance (a poster read from 2 m needs a 20 cm code). Use SVG or PDF for sharp print." },
  { q: "What does Pro add?", a: "Dynamic codes you can edit after printing, scan analytics, password and expiry for links, CSV bulk generation, an API and team/white-label options, as a self-hosted app you own." },
];

export function Faq({ items }: { items: { q: string; a: string }[] }) {
  return (
    <section id="faq" className="scroll-mt-20 border-t border-zinc-200 bg-zinc-50/60 py-20 dark:border-zinc-800 dark:bg-zinc-900/30">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h2 className="text-3xl font-semibold tracking-tight">Questions &amp; answers</h2>
        <div className="mt-8 divide-y divide-zinc-200 rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
          {items.map((f) => (
            <details key={f.q} className="group px-5 py-4">
              <summary className="flex cursor-pointer items-center justify-between gap-4 font-medium">
                {f.q}
                <span className="text-xl leading-none text-zinc-400 transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
          }).replace(/</g, "\\u003c"),
        }}
      />
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-zinc-200 py-12 dark:border-zinc-800">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 text-sm sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 font-semibold">
            <Logo className="h-6 w-6" /> {SITE.name}
          </div>
          <p className="mt-3 max-w-sm text-zinc-600 dark:text-zinc-400">A free, open-source QR code generator by EpiFive. Static codes made in your browser, no strings attached.</p>
          <p className="mt-3 flex items-center gap-2 text-xs text-zinc-500">
            <Lock className="h-3.5 w-3.5" /> No cookies, no trackers, no uploads.
          </p>
        </div>
        <div>
          <p className="font-semibold">Product</p>
          <ul className="mt-3 space-y-2 text-zinc-600 dark:text-zinc-400">
            <li><a href={SITE.proUrl} className="hover:text-indigo-600">QR Studio Pro</a></li>
            <li><a href={SITE.githubUrl} className="hover:text-indigo-600">Source on GitHub</a></li>
            <li><Link href="/#faq" className="hover:text-indigo-600">FAQ</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold">EpiFive</p>
          <ul className="mt-3 space-y-2 text-zinc-600 dark:text-zinc-400">
            <li><a href={SITE.openSourceUrl} className="inline-flex items-center gap-1 hover:text-indigo-600"><Globe className="h-3.5 w-3.5" /> More open-source tools</a></li>
            <li><a href={SITE.servicesUrl} className="hover:text-indigo-600">Custom app development</a></li>
            <li><a href={SITE.brandUrl} className="hover:text-indigo-600">epifive.com</a></li>
          </ul>
        </div>
      </div>
      <p className="mx-auto mt-10 flex max-w-7xl items-center gap-2 px-4 text-xs text-zinc-500 sm:px-6">
        <InfinityIcon className="h-3.5 w-3.5" /> MIT licensed · © 2026 EpiFive · QR Code is a registered trademark of DENSO WAVE INCORPORATED.
      </p>
    </footer>
  );
}
