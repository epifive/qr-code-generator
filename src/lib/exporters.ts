// Browser-only export helpers: PNG (canvas), SVG, PDF (jsPDF, loaded on demand).

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function svgBlob(svg: string): Blob {
  return new Blob([`<?xml version="1.0" encoding="UTF-8"?>\n${svg}`], { type: "image/svg+xml" });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not draw the QR code"));
    img.src = src;
  });
}

/** Draw an SVG string onto a canvas `width` px wide (height keeps the aspect ratio). */
export async function svgToCanvas(svg: string, width: number, aspect: number, background?: string): Promise<HTMLCanvasElement> {
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  try {
    const img = await loadImage(url);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(width);
    canvas.height = Math.round(width * aspect);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is not available");
    if (background) {
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function canvasToBlob(canvas: HTMLCanvasElement, type = "image/png", quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Export failed"))), type, quality),
  );
}

export async function svgToPngBlob(svg: string, width: number, aspect: number): Promise<Blob> {
  return canvasToBlob(await svgToCanvas(svg, width, aspect));
}

export async function copyPngToClipboard(svg: string, width: number, aspect: number): Promise<void> {
  if (!("clipboard" in navigator) || typeof ClipboardItem === "undefined") throw new Error("Your browser cannot copy images");
  const blob = await svgToPngBlob(svg, width, aspect);
  await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
}

export interface PaperSize {
  id: string;
  label: string;
  w: number; // mm
  h: number; // mm
}

export const PAPER_SIZES: PaperSize[] = [
  { id: "a4", label: "A4 (210 × 297 mm)", w: 210, h: 297 },
  { id: "letter", label: "US Letter (8.5 × 11 in)", w: 215.9, h: 279.4 },
  { id: "a5", label: "A5 (148 × 210 mm)", w: 148, h: 210 },
  { id: "a6", label: "A6 postcard (105 × 148 mm)", w: 105, h: 148 },
  { id: "fit", label: "Fit to code (no margins)", w: 0, h: 0 },
];

export interface PdfOptions {
  paper: string;
  /** Width of the printed code (incl. frame) in cm. */
  sizeCm: number;
  /** Fill the page with copies (sticker sheet). */
  tile: boolean;
  title?: string;
}

/** Number of copies that fit on a page for the given options. */
export function tileLayout(paperW: number, paperH: number, codeW: number, codeH: number, margin = 10, gap = 6) {
  const cols = Math.max(1, Math.floor((paperW - 2 * margin + gap) / (codeW + gap)));
  const rows = Math.max(1, Math.floor((paperH - 2 * margin + gap) / (codeH + gap)));
  return { cols, rows, count: cols * rows };
}

export async function svgToPdfBlob(svg: string, aspect: number, opts: PdfOptions): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const codeW = Math.max(10, opts.sizeCm * 10); // mm
  const codeH = codeW * aspect;
  const paper = PAPER_SIZES.find((p) => p.id === opts.paper) ?? PAPER_SIZES[0];
  const fit = paper.id === "fit";
  const pageW = fit ? codeW : paper.w;
  const pageH = fit ? codeH : paper.h;
  if (!fit && (codeW > pageW - 10 || codeH > pageH - 10)) throw new Error("The code is larger than the page. Pick a smaller size or a bigger paper.");
  // 300 dpi raster keeps print quality high while staying light.
  const px = Math.min(6000, Math.round((codeW / 25.4) * 300));
  const canvas = await svgToCanvas(svg, px, aspect);
  const dataUrl = canvas.toDataURL("image/png");
  const doc = new jsPDF({ unit: "mm", format: [pageW, pageH], orientation: pageW > pageH ? "landscape" : "portrait", compress: true });
  doc.setProperties({ title: opts.title || "QR code", creator: "Qrzen" });
  if (fit) {
    doc.addImage(dataUrl, "PNG", 0, 0, codeW, codeH, undefined, "FAST");
  } else if (opts.tile) {
    const gap = 6;
    const { cols, rows } = tileLayout(pageW, pageH, codeW, codeH, 10, gap);
    const totalW = cols * codeW + (cols - 1) * gap;
    const totalH = rows * codeH + (rows - 1) * gap;
    const x0 = (pageW - totalW) / 2;
    const y0 = (pageH - totalH) / 2;
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) doc.addImage(dataUrl, "PNG", x0 + c * (codeW + gap), y0 + r * (codeH + gap), codeW, codeH, "qr", "FAST");
  } else {
    doc.addImage(dataUrl, "PNG", (pageW - codeW) / 2, (pageH - codeH) / 2, codeW, codeH, undefined, "FAST");
  }
  return doc.output("blob");
}

/** Read an uploaded image and downscale it to a small PNG data URL (keeps saved designs light). */
export async function fileToLogoDataUrl(file: File, max = 320): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Choose an image file (PNG, JPG, SVG or WebP)");
  if (file.size > 5 * 1024 * 1024) throw new Error("The image is larger than 5 MB");
  const src = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Could not read the file"));
    r.readAsDataURL(file);
  });
  const img = await loadImage(src);
  const w = img.naturalWidth || max;
  const h = img.naturalHeight || max;
  const scale = Math.min(1, max / Math.max(w, h));
  // Draw centred in a square so the logo keeps its aspect ratio inside the QR.
  const side = Math.round(Math.max(w, h) * scale);
  const canvas = document.createElement("canvas");
  canvas.width = side;
  canvas.height = side;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available");
  const dw = w * scale;
  const dh = h * scale;
  ctx.drawImage(img, (side - dw) / 2, (side - dh) / 2, dw, dh);
  return canvas.toDataURL("image/png");
}

export function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "qr-code"
  );
}
