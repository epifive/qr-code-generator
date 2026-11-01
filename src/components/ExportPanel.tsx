"use client";

import { useState } from "react";
import { Check, ClipboardCopy, Download, FileImage, Printer } from "lucide-react";
import type { QrMatrix } from "@/lib/qr";
import { renderSvg, type QrStyle } from "@/lib/render";
import { copyPngToClipboard, downloadBlob, PAPER_SIZES, svgBlob, svgToPdfBlob, svgToPngBlob, tileLayout } from "@/lib/exporters";
import { Button, Select, Toggle, cx } from "./ui";

const PNG_SIZES = [256, 512, 1024, 2048, 4096];

export function ExportPanel({ matrix, style, fileBase, disabled }: { matrix: QrMatrix | null; style: QrStyle; fileBase: string; disabled: boolean }) {
  const [pngSize, setPngSize] = useState(1024);
  const [paper, setPaper] = useState("a4");
  const [sizeCm, setSizeCm] = useState(8);
  const [tile, setTile] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const run = async (key: string, fn: () => Promise<void>) => {
    if (!matrix) return;
    setBusy(key);
    setMsg(null);
    try {
      await fn();
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message || "Something went wrong" });
    } finally {
      setBusy(null);
    }
  };

  const render = (width: number) => renderSvg(matrix!, style, { width, idPrefix: "export" });

  const png = () =>
    run("png", async () => {
      const r = render(pngSize);
      downloadBlob(await svgToPngBlob(r.svg, pngSize, r.height / r.width), `${fileBase}.png`);
    });
  const svg = () =>
    run("svg", async () => {
      downloadBlob(svgBlob(render(1024).svg), `${fileBase}.svg`);
    });
  const copy = () =>
    run("copy", async () => {
      const r = render(1024);
      await copyPngToClipboard(r.svg, 1024, r.height / r.width);
      setMsg({ ok: true, text: "Copied. Paste it into a document or chat." });
    });
  const pdf = () =>
    run("pdf", async () => {
      const r = render(1024);
      downloadBlob(await svgToPdfBlob(r.svg, r.height / r.width, { paper, sizeCm, tile, title: fileBase }), `${fileBase}.pdf`);
    });

  const aspect = matrix ? (() => {
    const r = renderSvg(matrix, style, { width: 10 });
    return r.height / r.width;
  })() : 1;
  const p = PAPER_SIZES.find((x) => x.id === paper)!;
  const perPage = tile && paper !== "fit" ? tileLayout(p.w, p.h, sizeCm * 10, sizeCm * 10 * aspect).count : 1;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button variant="primary" className="flex-1" onClick={png} disabled={disabled || !!busy}>
          <Download className="h-4 w-4" /> {busy === "png" ? "Preparing…" : "Download PNG"}
        </Button>
        <select
          aria-label="PNG size"
          value={pngSize}
          onChange={(e) => setPngSize(Number(e.target.value))}
          className="rounded-lg border border-zinc-300 bg-white px-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          {PNG_SIZES.map((s) => (
            <option key={s} value={s}>
              {s}px
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button onClick={svg} disabled={disabled || !!busy}>
          <FileImage className="h-4 w-4" /> SVG (vector)
        </Button>
        <Button onClick={copy} disabled={disabled || !!busy}>
          {msg?.ok ? <Check className="h-4 w-4 text-emerald-500" /> : <ClipboardCopy className="h-4 w-4" />} Copy image
        </Button>
      </div>

      <details className="group rounded-xl border border-zinc-200 dark:border-zinc-800">
        <summary className="flex cursor-pointer items-center gap-2 px-3 py-2.5 text-sm font-medium">
          <Printer className="h-4 w-4 text-indigo-500" /> Print-ready PDF
          <span className="ml-auto text-xs text-zinc-500 group-open:hidden">A4, Letter, stickers</span>
        </summary>
        <div className="space-y-3 border-t border-zinc-100 p-3 dark:border-zinc-800">
          <Select label="Paper" value={paper} onChange={setPaper} options={PAPER_SIZES.map((x) => ({ value: x.id, label: x.label }))} />
          <div className="space-y-1.5">
            <label htmlFor="pdf-size" className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Printed width: {sizeCm} cm ({(sizeCm / 2.54).toFixed(1)} in)
            </label>
            <input id="pdf-size" type="range" min={2} max={20} step={0.5} value={sizeCm} onChange={(e) => setSizeCm(Number(e.target.value))} className="w-full accent-indigo-600" />
            <p className="text-xs text-zinc-500">Tip: keep codes at least 2 cm wide, and about 1/10 of the scanning distance.</p>
          </div>
          {paper !== "fit" && <Toggle label="Sticker sheet" hint={tile ? `${perPage} copies per page` : "Fill the page with copies"} checked={tile} onChange={setTile} />}
          <Button className="w-full" onClick={pdf} disabled={disabled || !!busy}>
            <Download className="h-4 w-4" /> {busy === "pdf" ? "Building PDF…" : "Download PDF"}
          </Button>
        </div>
      </details>
      {msg && <p className={cx("text-xs", msg.ok ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>{msg.text}</p>}
    </div>
  );
}
