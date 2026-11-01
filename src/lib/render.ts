// Styled QR renderer. Pure function: matrix + style -> SVG string (works in the browser, Node and tests).
import { EC_RECOVERY, isDark, isFinder, type EcLevel, type QrMatrix } from "./qr";

export type DotShape = "square" | "rounded" | "dots" | "classy" | "fluid";
export type EyeFrameShape = "square" | "rounded" | "circle" | "leaf";
export type EyeBallShape = "square" | "rounded" | "circle" | "leaf";
export type FrameStyle = "none" | "banner-bottom" | "banner-top" | "bubble" | "outline";
export type LogoBackdrop = "none" | "square" | "rounded" | "circle";

export interface QrStyle {
  fg: string;
  bg: string;
  transparentBg: boolean;
  gradient: { enabled: boolean; type: "linear" | "radial"; color2: string; rotation: number };
  eyeFrameColor: string | null;
  eyeBallColor: string | null;
  dotShape: DotShape;
  eyeFrame: EyeFrameShape;
  eyeBall: EyeBallShape;
  margin: number;
  ecLevel: EcLevel;
  logo: {
    src: string | null;
    /** Fraction of the QR width (without margin), 0.1 - 0.35. */
    size: number;
    excavate: boolean;
    backdrop: LogoBackdrop;
  };
  frame: { style: FrameStyle; text: string; color: string; textColor: string };
}

export const DEFAULT_STYLE: QrStyle = {
  fg: "#111827",
  bg: "#ffffff",
  transparentBg: false,
  gradient: { enabled: false, type: "linear", color2: "#4f46e5", rotation: 45 },
  eyeFrameColor: null,
  eyeBallColor: null,
  dotShape: "square",
  eyeFrame: "square",
  eyeBall: "square",
  margin: 4,
  ecLevel: "M",
  logo: { src: null, size: 0.22, excavate: true, backdrop: "rounded" },
  frame: { style: "none", text: "SCAN ME", color: "#111827", textColor: "#ffffff" },
};

/** Fill in missing keys (older saved designs, partial API input). */
export function normalizeStyle(input?: Partial<QrStyle> | null): QrStyle {
  const s = input ?? {};
  return {
    ...DEFAULT_STYLE,
    ...s,
    gradient: { ...DEFAULT_STYLE.gradient, ...(s.gradient ?? {}) },
    logo: { ...DEFAULT_STYLE.logo, ...(s.logo ?? {}) },
    frame: { ...DEFAULT_STYLE.frame, ...(s.frame ?? {}) },
    margin: clamp(Math.round(Number(s.margin ?? DEFAULT_STYLE.margin)), 0, 12),
  };
}

export interface RenderOptions {
  /** Output width in px written to the svg width/height attributes. */
  width?: number;
  /** Prefix for gradient ids so several SVGs can live on one page. */
  idPrefix?: string;
}

export interface RenderResult {
  svg: string;
  /** Size of the drawing in module units. */
  width: number;
  height: number;
}

const FONT = "Inter, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Number.isFinite(n) ? n : min));
}

/** Number formatting: at most 3 decimals, no trailing zeros. */
function f(n: number): string {
  return String(Math.round(n * 1000) / 1000);
}

export function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Rectangle path with individual corner radii (tl, tr, br, bl). */
export function roundRectPath(x: number, y: number, w: number, h: number, r: [number, number, number, number]): string {
  const [tl, tr, br, bl] = r.map((v) => Math.max(0, Math.min(v, w / 2, h / 2)));
  let d = `M${f(x + tl)} ${f(y)}H${f(x + w - tr)}`;
  if (tr) d += `A${f(tr)} ${f(tr)} 0 0 1 ${f(x + w)} ${f(y + tr)}`;
  d += `V${f(y + h - br)}`;
  if (br) d += `A${f(br)} ${f(br)} 0 0 1 ${f(x + w - br)} ${f(y + h)}`;
  d += `H${f(x + bl)}`;
  if (bl) d += `A${f(bl)} ${f(bl)} 0 0 1 ${f(x)} ${f(y + h - bl)}`;
  d += `V${f(y + tl)}`;
  if (tl) d += `A${f(tl)} ${f(tl)} 0 0 1 ${f(x + tl)} ${f(y)}`;
  return d + "Z";
}

function circlePath(cx: number, cy: number, r: number): string {
  return `M${f(cx - r)} ${f(cy)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0Z`;
}

/** Path for all data modules (finder patterns excluded, excavated logo area removed). */
function dotsPath(m: QrMatrix, shape: DotShape, ox: number, oy: number, skip: (r: number, c: number) => boolean): string {
  const n = m.size;
  const on = (r: number, c: number) => isDark(m, r, c) && !isFinder(n, r, c) && !skip(r, c);
  const parts: string[] = [];
  if (shape === "square") {
    // Merge horizontal runs to keep the SVG small.
    for (let r = 0; r < n; r++) {
      let c = 0;
      while (c < n) {
        if (!on(r, c)) {
          c++;
          continue;
        }
        let end = c;
        while (end + 1 < n && on(r, end + 1)) end++;
        parts.push(`M${f(ox + c)} ${f(oy + r)}h${end - c + 1}v1h${-(end - c + 1)}Z`);
        c = end + 1;
      }
    }
    return parts.join("");
  }
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!on(r, c)) continue;
      const x = ox + c;
      const y = oy + r;
      if (shape === "dots") {
        parts.push(circlePath(x + 0.5, y + 0.5, 0.46));
      } else if (shape === "rounded") {
        parts.push(roundRectPath(x + 0.04, y + 0.04, 0.92, 0.92, [0.3, 0.3, 0.3, 0.3]));
      } else {
        const t = on(r - 1, c);
        const b = on(r + 1, c);
        const l = on(r, c - 1);
        const rt = on(r, c + 1);
        const R = 0.5;
        if (shape === "fluid") {
          parts.push(roundRectPath(x, y, 1, 1, [!t && !l ? R : 0, !t && !rt ? R : 0, !b && !rt ? R : 0, !b && !l ? R : 0]));
        } else {
          // classy: round the top-left and bottom-right outer corners only
          parts.push(roundRectPath(x, y, 1, 1, [!t && !l ? R : 0, 0, !b && !rt ? R : 0, 0]));
        }
      }
    }
  }
  return parts.join("");
}

type Corner = "tl" | "tr" | "bl";

function leafRadii(corner: Corner, r: number): [number, number, number, number] {
  // Two opposite corners rounded, mirrored so the three eyes look symmetric.
  if (corner === "tl") return [r, 0, r, 0];
  return [0, r, 0, r];
}

function eyePaths(shapeF: EyeFrameShape, shapeB: EyeBallShape, x: number, y: number, corner: Corner) {
  let frame: string;
  switch (shapeF) {
    case "rounded":
      frame = roundRectPath(x, y, 7, 7, [2.2, 2.2, 2.2, 2.2]) + roundRectPath(x + 1, y + 1, 5, 5, [1.4, 1.4, 1.4, 1.4]);
      break;
    case "circle":
      frame = circlePath(x + 3.5, y + 3.5, 3.5) + circlePath(x + 3.5, y + 3.5, 2.5);
      break;
    case "leaf":
      frame = roundRectPath(x, y, 7, 7, leafRadii(corner, 3.2)) + roundRectPath(x + 1, y + 1, 5, 5, leafRadii(corner, 2.2));
      break;
    default:
      frame = roundRectPath(x, y, 7, 7, [0, 0, 0, 0]) + roundRectPath(x + 1, y + 1, 5, 5, [0, 0, 0, 0]);
  }
  let ball: string;
  switch (shapeB) {
    case "rounded":
      ball = roundRectPath(x + 2, y + 2, 3, 3, [0.9, 0.9, 0.9, 0.9]);
      break;
    case "circle":
      ball = circlePath(x + 3.5, y + 3.5, 1.5);
      break;
    case "leaf":
      ball = roundRectPath(x + 2, y + 2, 3, 3, leafRadii(corner, 1.4));
      break;
    default:
      ball = roundRectPath(x + 2, y + 2, 3, 3, [0, 0, 0, 0]);
  }
  return { frame, ball };
}

/** Logo box in module coordinates (relative to the code, without margin). */
export function logoBox(m: QrMatrix, style: QrStyle) {
  const size = clamp(style.logo.size, 0.08, 0.38) * m.size;
  const start = (m.size - size) / 2;
  return { x: start, y: start, size };
}

/** Text width estimate (em) used to fit frame labels. */
function textFits(text: string, maxWidth: number, maxFont: number): number {
  const est = Math.max(1, text.length) * 0.62;
  return Math.min(maxFont, maxWidth / est);
}

export function renderSvg(m: QrMatrix, styleIn: Partial<QrStyle>, opts: RenderOptions = {}): RenderResult {
  const style = normalizeStyle(styleIn);
  const id = opts.idPrefix ?? "qz";
  const n = m.size;
  const margin = style.margin;
  const Q = n + margin * 2; // QR block incl. quiet zone

  // Frame geometry
  const fs = style.frame.style;
  const text = style.frame.text.trim();
  const b = fs === "none" ? 0 : fs === "outline" ? Q * 0.025 : Q * 0.045; // border thickness
  const labelH = fs === "none" ? 0 : Q * 0.2;
  const gap = fs === "bubble" ? Q * 0.06 : 0;
  const W = Q + 2 * b;
  const H = fs === "none" ? Q : Q + 2 * b + labelH + gap;
  const qrX = b;
  const qrY = fs === "banner-top" ? b + labelH : b;
  const ox = qrX + margin;
  const oy = qrY + margin;

  const logo = style.logo.src ? logoBox(m, style) : null;
  const pad = 0.6;
  const skip = (r: number, c: number) => {
    if (!logo || !style.logo.excavate) return false;
    return c + 1 > logo.x - pad && c < logo.x + logo.size + pad && r + 1 > logo.y - pad && r < logo.y + logo.size + pad;
  };

  const defs: string[] = [];
  let dotFill = style.fg;
  if (style.gradient.enabled) {
    const gid = `${id}-grad`;
    const cx = ox + n / 2;
    const cy = oy + n / 2;
    if (style.gradient.type === "radial") {
      defs.push(
        `<radialGradient id="${gid}" gradientUnits="userSpaceOnUse" cx="${f(cx)}" cy="${f(cy)}" r="${f(n * 0.72)}"><stop offset="0" stop-color="${escapeXml(style.fg)}"/><stop offset="1" stop-color="${escapeXml(style.gradient.color2)}"/></radialGradient>`,
      );
    } else {
      const a = (style.gradient.rotation * Math.PI) / 180;
      const dx = (Math.cos(a) * n) / 2;
      const dy = (Math.sin(a) * n) / 2;
      defs.push(
        `<linearGradient id="${gid}" gradientUnits="userSpaceOnUse" x1="${f(cx - dx)}" y1="${f(cy - dy)}" x2="${f(cx + dx)}" y2="${f(cy + dy)}"><stop offset="0" stop-color="${escapeXml(style.fg)}"/><stop offset="1" stop-color="${escapeXml(style.gradient.color2)}"/></linearGradient>`,
      );
    }
    dotFill = `url(#${gid})`;
  }
  const eyeFrameFill = style.eyeFrameColor ? escapeXml(style.eyeFrameColor) : dotFill;
  const eyeBallFill = style.eyeBallColor ? escapeXml(style.eyeBallColor) : dotFill;
  const fill = dotFill.startsWith("url(") ? dotFill : escapeXml(dotFill);

  const body: string[] = [];

  // Frame
  if (fs !== "none") {
    const frameColor = escapeXml(style.frame.color);
    const radius = Q * 0.06;
    const labelY = fs === "banner-top" ? b : qrY + Q + b + gap;
    if (fs === "banner-bottom" || fs === "banner-top") {
      body.push(`<path d="${roundRectPath(0, 0, W, H, [radius, radius, radius, radius])}" fill="${frameColor}"/>`);
    } else if (fs === "outline") {
      body.push(
        `<path d="${roundRectPath(0, 0, W, Q + 2 * b, [radius, radius, radius, radius])}${roundRectPath(b, b, Q, Q, [radius * 0.6, radius * 0.6, radius * 0.6, radius * 0.6])}" fill="${frameColor}" fill-rule="evenodd"/>`,
      );
    } else if (fs === "bubble") {
      body.push(
        `<path d="${roundRectPath(0, 0, W, Q + 2 * b, [radius, radius, radius, radius])}${roundRectPath(b, b, Q, Q, [radius * 0.6, radius * 0.6, radius * 0.6, radius * 0.6])}" fill="${frameColor}" fill-rule="evenodd"/>`,
      );
      const px = W / 2;
      const top = Q + 2 * b;
      body.push(`<path d="M${f(px - gap)} ${f(top + gap + 0.01)}L${f(px)} ${f(top)}L${f(px + gap)} ${f(top + gap + 0.01)}Z" fill="${frameColor}"/>`);
      body.push(`<path d="${roundRectPath(0, labelY, W, labelH, [labelH / 2, labelH / 2, labelH / 2, labelH / 2])}" fill="${frameColor}"/>`);
    }
    if (text) {
      const fontSize = textFits(text, W * 0.86, labelH * 0.5);
      const textColor = fs === "outline" ? frameColor : escapeXml(style.frame.textColor);
      body.push(
        `<text x="${f(W / 2)}" y="${f(labelY + labelH / 2 + fontSize * 0.36)}" text-anchor="middle" font-family="${escapeXml(FONT)}" font-weight="700" font-size="${f(fontSize)}" letter-spacing="${f(fontSize * 0.04)}" fill="${textColor}">${escapeXml(text)}</text>`,
      );
    }
  }

  // QR background (inside frame)
  if (!style.transparentBg) {
    const r = fs === "none" ? 0 : Q * 0.036;
    body.push(`<path d="${roundRectPath(qrX, qrY, Q, Q, [r, r, r, r])}" fill="${escapeXml(style.bg)}"/>`);
  }

  // Data modules
  body.push(`<path d="${dotsPath(m, style.dotShape, ox, oy, skip)}" fill="${fill}"/>`);

  // Eyes
  const corners: [Corner, number, number][] = [
    ["tl", 0, 0],
    ["tr", 0, n - 7],
    ["bl", n - 7, 0],
  ];
  const frames: string[] = [];
  const balls: string[] = [];
  for (const [corner, r, c] of corners) {
    const p = eyePaths(style.eyeFrame, style.eyeBall, ox + c, oy + r, corner);
    frames.push(p.frame);
    balls.push(p.ball);
  }
  body.push(`<path d="${frames.join("")}" fill="${eyeFrameFill}" fill-rule="evenodd"/>`);
  body.push(`<path d="${balls.join("")}" fill="${eyeBallFill}"/>`);

  // Logo
  if (logo && style.logo.src) {
    const lx = ox + logo.x;
    const ly = oy + logo.y;
    const s = logo.size;
    if (style.logo.backdrop !== "none" && !style.transparentBg) {
      const bp = 0.35;
      const bgc = escapeXml(style.bg);
      if (style.logo.backdrop === "circle") body.push(`<path d="${circlePath(lx + s / 2, ly + s / 2, s / 2 + bp)}" fill="${bgc}"/>`);
      else {
        const rr = style.logo.backdrop === "rounded" ? s * 0.18 : 0;
        body.push(`<path d="${roundRectPath(lx - bp, ly - bp, s + 2 * bp, s + 2 * bp, [rr, rr, rr, rr])}" fill="${bgc}"/>`);
      }
    }
    body.push(
      `<image href="${escapeXml(style.logo.src)}" x="${f(lx)}" y="${f(ly)}" width="${f(s)}" height="${f(s)}" preserveAspectRatio="xMidYMid meet"/>`,
    );
  }

  const pxW = opts.width ?? 512;
  const pxH = Math.round((pxW * H) / W);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${f(W)} ${f(H)}" width="${pxW}" height="${pxH}" shape-rendering="geometricPrecision">` +
    (defs.length ? `<defs>${defs.join("")}</defs>` : "") +
    body.join("") +
    `</svg>`;
  return { svg, width: W, height: H };
}

// ---------- Scannability hints ----------

function hexToRgb(hex: string): [number, number, number] | null {
  const h = hex.trim().replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  if (!/^[0-9a-f]{6}$/i.test(full)) return null;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as [number, number, number];
}

export function luminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

export interface Warning {
  level: "warn" | "error";
  text: string;
}

export function scanWarnings(styleIn: Partial<QrStyle>): Warning[] {
  const s = normalizeStyle(styleIn);
  const out: Warning[] = [];
  const bg = s.transparentBg ? "#ffffff" : s.bg;
  const colors = [s.fg, ...(s.gradient.enabled ? [s.gradient.color2] : []), ...(s.eyeFrameColor ? [s.eyeFrameColor] : []), ...(s.eyeBallColor ? [s.eyeBallColor] : [])];
  const worst = Math.min(...colors.map((c) => contrastRatio(c, bg)));
  if (worst < 2.5) out.push({ level: "error", text: "Very low contrast between the code and the background. Most phones will not scan it." });
  else if (worst < 4) out.push({ level: "warn", text: "Contrast is on the low side. Use a darker code colour for reliable scanning." });
  if (!s.transparentBg && colors.some((c) => luminance(c) > luminance(bg)))
    out.push({ level: "warn", text: "Light code on a dark background (inverted) is not supported by some scanner apps." });
  if (s.transparentBg) out.push({ level: "warn", text: "Transparent background: place the code on a light surface when you print it." });
  if (s.margin < 2) out.push({ level: "warn", text: "A quiet zone (margin) of at least 2 modules helps scanners find the code." });
  if (s.logo.src) {
    const covered = s.logo.size * s.logo.size * 1.25;
    if (covered > EC_RECOVERY[s.ecLevel] * 0.85)
      out.push({
        level: covered > EC_RECOVERY[s.ecLevel] * 1.2 ? "error" : "warn",
        text: `The logo covers about ${Math.round(covered * 100)}% of the code. Use error correction ${s.ecLevel === "H" ? "H with a smaller logo" : "H"} or a smaller logo.`,
      });
  }
  return out;
}
