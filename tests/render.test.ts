// Scan tests: every style is rendered to SVG, rasterised with resvg and decoded with ZXing-C++.
import { describe, expect, it } from "vitest";
import { buildMatrix } from "@/lib/qr";
import { contrastRatio, DEFAULT_STYLE, normalizeStyle, renderSvg, roundRectPath, scanWarnings, type QrStyle } from "@/lib/render";
import { buildUpi, buildVcard, buildWifi, EMPTY_FIELDS } from "@/lib/payloads";
import { decodeSvg } from "./decode";

const URL = "https://www.epifive.com/products/qr-studio-pro";

// A simple square logo (data URL) for logo tests.
const LOGO =
  "data:image/svg+xml;base64," +
  Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" rx="2" fill="#e11d48"/><circle cx="5" cy="5" r="3" fill="#fff"/></svg>').toString("base64");

function style(p: Partial<QrStyle>): Partial<QrStyle> {
  return { ...DEFAULT_STYLE, ...p };
}

describe("matrix", () => {
  it("grows with data and EC level", () => {
    const a = buildMatrix("hi", "L");
    const b = buildMatrix("hi".repeat(100), "H");
    expect(a.size).toBe(21);
    expect(b.size).toBeGreaterThan(a.size);
    expect(b.data.length).toBe(b.size * b.size);
  });
  it("throws on empty input", () => {
    expect(() => buildMatrix("")).toThrow();
  });
});

describe("scan: dot and eye shapes", () => {
  const m = buildMatrix(URL, "M");
  const dots = ["square", "rounded", "dots", "classy", "fluid"] as const;
  const frames = ["square", "rounded", "circle", "leaf"] as const;
  const balls = ["square", "rounded", "circle", "leaf"] as const;
  for (const dotShape of dots)
    for (const eyeFrame of frames)
      it(`${dotShape} / ${eyeFrame} eyes`, async () => {
        for (const eyeBall of balls) {
          const { svg } = renderSvg(m, style({ dotShape, eyeFrame, eyeBall }));
          expect(await decodeSvg(svg)).toBe(URL);
        }
      });
});

describe("scan: colours, gradients, frames, margin", () => {
  const m = buildMatrix(URL, "M");
  it("custom colours and eye colours", async () => {
    const { svg } = renderSvg(m, style({ fg: "#1e3a8a", bg: "#fef3c7", eyeFrameColor: "#be123c", eyeBallColor: "#0f766e" }));
    expect(await decodeSvg(svg)).toBe(URL);
  });
  it("linear and radial gradients", async () => {
    for (const type of ["linear", "radial"] as const) {
      const { svg } = renderSvg(m, style({ fg: "#4338ca", gradient: { enabled: true, type, color2: "#0d9488", rotation: 30 }, dotShape: "dots" }));
      expect(svg).toContain(type === "linear" ? "linearGradient" : "radialGradient");
      expect(await decodeSvg(svg)).toBe(URL);
    }
  });
  it("every frame style with label text", async () => {
    for (const fs of ["banner-bottom", "banner-top", "bubble", "outline"] as const) {
      const { svg, height, width } = renderSvg(m, style({ frame: { style: fs, text: "Scan to pay <now> & save", color: "#4f46e5", textColor: "#ffffff" } }));
      expect(height).toBeGreaterThan(width);
      expect(svg).toContain("Scan to pay &lt;now&gt; &amp; save");
      expect(await decodeSvg(svg)).toBe(URL);
    }
  });
  it("transparent background and small margin", async () => {
    expect(await decodeSvg(renderSvg(m, style({ transparentBg: true })).svg)).toBe(URL);
    expect(await decodeSvg(renderSvg(m, style({ margin: 1 })).svg)).toBe(URL);
  });
  it("small and large output sizes", async () => {
    const { svg } = renderSvg(m, style({ dotShape: "fluid" }));
    expect(await decodeSvg(svg, 200)).toBe(URL);
    expect(await decodeSvg(svg, 1600)).toBe(URL);
  });
});

describe("scan: logo", () => {
  it("logo with excavation at EC H", async () => {
    const m = buildMatrix(URL, "H");
    for (const backdrop of ["none", "square", "rounded", "circle"] as const) {
      const { svg } = renderSvg(m, style({ ecLevel: "H", logo: { src: LOGO, size: 0.26, excavate: true, backdrop } }));
      expect(svg).toContain("<image");
      expect(await decodeSvg(svg)).toBe(URL);
    }
  });
  it("logo without excavation at EC Q", async () => {
    const m = buildMatrix(URL, "Q");
    const { svg } = renderSvg(m, style({ ecLevel: "Q", dotShape: "dots", logo: { src: LOGO, size: 0.2, excavate: false, backdrop: "none" } }));
    expect(await decodeSvg(svg)).toBe(URL);
  });
});

describe("scan: real payloads round-trip", () => {
  it("UPI, WiFi, vCard and Unicode text", async () => {
    const payloads = [
      buildUpi({ vpa: "sharma.store@okhdfcbank", name: "Sharma Store", amount: "250", note: "Thanks", currency: "INR" }).value,
      buildWifi({ ssid: "Cafe;Guest", password: 'p@ss:"word"', encryption: "WPA", hidden: false }).value,
      buildVcard({ ...EMPTY_FIELDS.vcard, firstName: "Asha", lastName: "Rao", org: "Rao & Co", mobile: "+919876543210", note: "Line 1\nLine 2" }).value,
      "नमस्ते ₹500 — café ✓",
    ];
    for (const p of payloads) {
      expect(p).not.toBe("");
      for (const ec of ["L", "H"] as const) {
        const { svg } = renderSvg(buildMatrix(p, ec), style({ dotShape: "rounded", ecLevel: ec }));
        expect(await decodeSvg(svg, 800)).toBe(p);
      }
    }
  });
});

describe("helpers", () => {
  it("normalizeStyle fills defaults and clamps margin", () => {
    const s = normalizeStyle({ margin: 99, frame: { style: "bubble" } as QrStyle["frame"] });
    expect(s.margin).toBe(12);
    expect(s.frame.text).toBe("SCAN ME");
    expect(s.logo.size).toBe(DEFAULT_STYLE.logo.size);
  });
  it("roundRectPath without radii is a plain rectangle", () => {
    expect(roundRectPath(0, 0, 2, 3, [0, 0, 0, 0])).toBe("M0 0H2V3H0V0Z");
  });
  it("contrast ratio", () => {
    expect(Math.round(contrastRatio("#000000", "#ffffff"))).toBe(21);
    expect(contrastRatio("#777", "#777")).toBe(1);
  });
  it("scan warnings", () => {
    expect(scanWarnings(DEFAULT_STYLE)).toEqual([]);
    expect(scanWarnings({ fg: "#eeeeee", bg: "#ffffff" }).some((w) => w.level === "error")).toBe(true);
    expect(scanWarnings({ fg: "#ffffff", bg: "#111111" }).some((w) => /inverted/i.test(w.text))).toBe(true);
    expect(scanWarnings({ ecLevel: "L", logo: { src: LOGO, size: 0.3, excavate: true, backdrop: "rounded" } }).length).toBeGreaterThan(0);
    expect(scanWarnings({ margin: 0 }).some((w) => /quiet zone/i.test(w.text))).toBe(true);
  });
});

describe("scan: built-in sample designs", () => {
  it("every sample design decodes at phone-camera resolution", async () => {
    const { sampleDesigns } = await import("@/lib/presets");
    const { buildPayload } = await import("@/lib/payloads");
    for (const d of sampleDesigns()) {
      const p = buildPayload(d.type, d.fields).value;
      const { svg } = renderSvg(buildMatrix(p, d.style.ecLevel), d.style);
      expect(await decodeSvg(svg, 720)).toBe(p);
    }
  });
});

describe("presets", () => {
  it("no built-in preset triggers a scan warning", async () => {
    const { STYLE_PRESETS } = await import("@/lib/presets");
    for (const p of STYLE_PRESETS) expect(scanWarnings({ ...DEFAULT_STYLE, ...p.style }), p.name).toEqual([]);
  });
});
