"use client";

import { useEffect, useMemo, useState } from "react";
import { CircleCheck, CircleX, Contact, Eraser, Link2, LoaderCircle, Mail, MapPin, MessageCircle, MessageSquare, IndianRupee, Save, ScanLine, TriangleAlert, Type, Wifi } from "lucide-react";
import { buildPayload, EMPTY_FIELDS, type AnyFields, type FieldsByType, type QrType } from "@/lib/payloads";
import { buildMatrix, MAX_BYTES, utf8Length, type QrMatrix } from "@/lib/qr";
import { DEFAULT_STYLE, renderSvg, scanWarnings, type QrStyle } from "@/lib/render";
import { SAMPLE_FIELDS, sampleDesigns } from "@/lib/presets";
import { loadDesigns, loadDraft, newId, saveDesigns, saveDraft, shouldSeed, upsertDesign, type SavedDesign } from "@/lib/storage";
import { slugify } from "@/lib/exporters";
import { scanCheck } from "@/lib/scan";
import { TYPE_INFO, typeInfo } from "@/lib/site";
import { ContentForm } from "./ContentForm";
import { StylePanel } from "./StylePanel";
import { ExportPanel } from "./ExportPanel";
import { SavedDesigns } from "./SavedDesigns";
import { Button, cx } from "./ui";

const TYPE_ICONS: Record<QrType, typeof Link2> = {
  url: Link2,
  text: Type,
  upi: IndianRupee,
  wifi: Wifi,
  vcard: Contact,
  email: Mail,
  sms: MessageSquare,
  whatsapp: MessageCircle,
  location: MapPin,
};

type ScanState = "idle" | "checking" | "ok" | "fail";

function isEmpty(fields: AnyFields): boolean {
  return Object.values(fields).every((v) => typeof v !== "string" || v.trim() === "");
}

export default function Generator({ initialType }: { initialType?: QrType }) {
  // Lazy init from localStorage (this component only renders in the browser).
  const [draft] = useState(() => loadDraft());
  const [type, setType] = useState<QrType>(() => initialType ?? draft?.type ?? "url");
  const [fieldsByType, setFieldsByType] = useState<FieldsByType>(() => {
    const merged = { ...SAMPLE_FIELDS };
    if (draft) for (const k of Object.keys(draft.fields) as QrType[]) merged[k] = { ...EMPTY_FIELDS[k], ...draft.fields[k] } as never;
    return merged;
  });
  const [style, setStyle] = useState<QrStyle>(() => draft?.style ?? DEFAULT_STYLE);
  const [designs, setDesigns] = useState<SavedDesign[]>(() => {
    if (shouldSeed()) {
      const seeded = [...sampleDesigns(), ...loadDesigns()];
      saveDesigns(seeded);
      return seeded;
    }
    return loadDesigns();
  });
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [scan, setScan] = useState<{ state: ScanState; svg: string }>({ state: "idle", svg: "" });

  const fields = fieldsByType[type];
  const payload = useMemo(() => buildPayload(type, fields), [type, fields]);
  const tooLong = payload.value ? utf8Length(payload.value) > MAX_BYTES[style.ecLevel] : false;
  const matrix: QrMatrix | null = useMemo(() => {
    if (!payload.value || tooLong) return null;
    try {
      return buildMatrix(payload.value, style.ecLevel);
    } catch {
      return null;
    }
  }, [payload.value, style.ecLevel, tooLong]);
  const preview = useMemo(() => (matrix ? renderSvg(matrix, style, { width: 512, idPrefix: "preview" }) : null), [matrix, style]);
  const warnings = useMemo(() => scanWarnings(style), [style]);
  const isSample = JSON.stringify(fields) === JSON.stringify(SAMPLE_FIELDS[type]);

  // Persist the working draft.
  useEffect(() => {
    const t = setTimeout(() => saveDraft({ type, fields: fieldsByType, style }), 400);
    return () => clearTimeout(t);
  }, [type, fieldsByType, style]);

  // Decode the rendered code in the browser to prove it scans.
  useEffect(() => {
    if (!preview) return;
    let cancelled = false;
    const svg = preview.svg;
    const t = setTimeout(async () => {
      setScan({ state: "checking", svg });
      try {
        const text = await scanCheck(svg, preview.height / preview.width);
        if (!cancelled) setScan({ state: text === payload.value ? "ok" : "fail", svg });
      } catch {
        if (!cancelled) setScan({ state: "idle", svg });
      }
    }, 700);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [preview, payload.value]);
  const scanState: ScanState = preview && scan.svg === preview.svg ? scan.state : "checking";

  const updateDesigns = (list: SavedDesign[]) => {
    try {
      saveDesigns(list);
      setDesigns(list);
    } catch (e) {
      setSaveMsg({ ok: false, text: (e as Error).message });
    }
  };

  const defaultName = () => {
    const f = fields as unknown as Record<string, string>;
    const label: Record<QrType, string> = {
      url: payload.value.replace(/^https?:\/\/(www\.)?/, ""),
      text: f.text ?? "",
      upi: f.name || f.vpa || "",
      wifi: f.ssid ?? "",
      vcard: [f.firstName, f.lastName].filter(Boolean).join(" ") || f.org || "",
      email: f.to ?? "",
      sms: f.phone ?? "",
      whatsapp: f.phone ?? "",
      location: f.label || `${f.lat}, ${f.lng}`,
    };
    return `${typeInfo(type).short}: ${label[type].trim().slice(0, 40)}`;
  };

  const save = (asNew: boolean) => {
    if (!payload.value) return;
    const now = new Date().toISOString();
    const existing = !asNew && currentId ? designs.find((d) => d.id === currentId) : undefined;
    const design: SavedDesign = {
      id: existing?.id ?? newId(),
      name: (name.trim() || defaultName()).slice(0, 80),
      type,
      fields,
      style,
      sample: false,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    updateDesigns(upsertDesign(designs, design));
    setCurrentId(design.id);
    setName(design.name);
    setSaveMsg({ ok: true, text: existing ? "Design updated." : "Saved to My designs." });
  };

  const open = (d: SavedDesign) => {
    setType(d.type);
    setFieldsByType((prev) => ({ ...prev, [d.type]: d.fields }));
    setStyle(d.style);
    setCurrentId(d.id);
    setName(d.sample ? "" : d.name);
    setSaveMsg(null);
    document.getElementById("generator")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const fileBase = `qr-studio-${slugify(name || (payload.value ? defaultName() : type))}`;

  return (
    <div className="space-y-12">
      <div id="generator" className="grid scroll-mt-20 gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:grid-rows-[auto_1fr] xl:grid-cols-[minmax(0,1fr)_420px]">
        {/* Content (left, row 1). On phones the preview follows right after it. */}
        <div className="min-w-0 space-y-5 lg:col-start-1 lg:row-start-1">
          <div role="tablist" aria-label="QR code type" className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible">
            {TYPE_INFO.map((t) => {
              const Icon = TYPE_ICONS[t.type];
              const active = t.type === type;
              return (
                <button
                  key={t.type}
                  role="tab"
                  aria-selected={active}
                  type="button"
                  onClick={() => {
                    setType(t.type);
                    setCurrentId(null);
                    setSaveMsg(null);
                  }}
                  className={cx(
                    "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition",
                    active
                      ? "border-indigo-600 bg-indigo-600 text-white shadow-sm shadow-indigo-600/25"
                      : "border-zinc-200 bg-white text-zinc-700 hover:border-indigo-300 hover:text-indigo-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-indigo-500/50",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {t.short}
                </button>
              );
            })}
          </div>

          <section aria-labelledby="content-h" className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
            <div className="mb-4 flex items-center gap-2">
              <h2 id="content-h" className="text-base font-semibold">
                {typeInfo(type).label}
              </h2>
              {isSample && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">SAMPLE DATA</span>}
              <button
                type="button"
                onClick={() => setFieldsByType((p) => ({ ...p, [type]: EMPTY_FIELDS[type] }))}
                className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                <Eraser className="h-3.5 w-3.5" /> Clear
              </button>
            </div>
            <ContentForm
              type={type}
              fields={fields}
              errors={payload.errors}
              showErrors={!isEmpty(fields)}
              onChange={(f) => setFieldsByType((p) => ({ ...p, [type]: f }))}
            />
            {tooLong && <p className="mt-3 text-sm text-rose-600">That is too much data for one QR code at error correction {style.ecLevel}. Shorten it or lower the error correction.</p>}
          </section>
        </div>

        {/* Preview + export (right column, sticky on desktop) */}
        <aside className="lg:sticky lg:top-20 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:max-h-[calc(100vh-6rem)] lg:self-start lg:overflow-y-auto lg:overscroll-contain lg:rounded-2xl">
          <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
            <div className="checker relative flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-zinc-100 p-6 dark:border-zinc-800">
              {preview ? (
                <div className="preview-svg w-full max-w-[340px] drop-shadow-sm" role="img" aria-label="QR code preview" dangerouslySetInnerHTML={{ __html: preview.svg }} />
              ) : (
                <div className="px-6 text-center">
                  <ScanLine className="mx-auto mb-3 h-12 w-12 text-zinc-300 dark:text-zinc-600" />
                  <p className="font-medium text-zinc-700 dark:text-zinc-300">Your QR code appears here</p>
                  <p className="mt-1 text-sm text-zinc-500">{Object.values(payload.errors)[0] ?? "Fill in the details on the left."}</p>
                </div>
              )}
            </div>

            {preview && (
              <div className="flex items-center justify-between gap-3 text-xs">
                <span
                  className={cx(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium",
                    scanState === "ok" && "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
                    scanState === "fail" && "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
                    (scanState === "checking" || scanState === "idle") && "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
                  )}
                  aria-live="polite"
                >
                  {scanState === "ok" && <CircleCheck className="h-3.5 w-3.5" />}
                  {scanState === "fail" && <CircleX className="h-3.5 w-3.5" />}
                  {scanState === "checking" && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />}
                  {scanState === "ok" ? "Scan test passed" : scanState === "fail" ? "Scan test failed" : scanState === "checking" ? "Testing scan…" : "Scan test unavailable"}
                </span>
                <span className="text-zinc-500">
                  v{matrix!.version} · {matrix!.size}×{matrix!.size} · EC {style.ecLevel}
                </span>
              </div>
            )}

            {(warnings.length > 0 || scanState === "fail") && preview && (
              <ul className="space-y-1.5">
                {scanState === "fail" && (
                  <li className="flex gap-2 rounded-lg bg-rose-50 p-2.5 text-xs text-rose-800 dark:bg-rose-500/10 dark:text-rose-200">
                    <TriangleAlert className="mt-px h-3.5 w-3.5 shrink-0" /> Our test scanner could not read this design. Increase contrast, shrink the logo or raise error correction.
                  </li>
                )}
                {warnings.map((w) => (
                  <li
                    key={w.text}
                    className={cx("flex gap-2 rounded-lg p-2.5 text-xs", w.level === "error" ? "bg-rose-50 text-rose-800 dark:bg-rose-500/10 dark:text-rose-200" : "bg-amber-50 text-amber-900 dark:bg-amber-500/10 dark:text-amber-200")}
                  >
                    <TriangleAlert className="mt-px h-3.5 w-3.5 shrink-0" /> {w.text}
                  </li>
                ))}
              </ul>
            )}

            <ExportPanel matrix={matrix} style={style} fileBase={fileBase} disabled={!preview} />

            <div className="space-y-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
              <label htmlFor="design-name" className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Design name
              </label>
              <div className="flex gap-2">
                <input
                  id="design-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={payload.value ? defaultName() : "My QR code"}
                  maxLength={80}
                  className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 dark:border-zinc-700 dark:bg-zinc-900"
                />
                <Button onClick={() => save(false)} disabled={!payload.value}>
                  <Save className="h-4 w-4" /> {currentId ? "Update" : "Save"}
                </Button>
              </div>
              {currentId && (
                <button type="button" onClick={() => save(true)} className="text-xs text-indigo-600 hover:underline dark:text-indigo-400">
                  Save as a new design
                </button>
              )}
              {saveMsg && <p className={cx("text-xs", saveMsg.ok ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600")}>{saveMsg.text}</p>}
            </div>

            {payload.value && (
              <details className="text-xs">
                <summary className="cursor-pointer text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200">Show encoded content</summary>
                <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-zinc-100 p-2.5 font-mono text-[11px] text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">{payload.value}</pre>
              </details>
            )}
          </div>
        </aside>

        <div className="min-w-0 lg:col-start-1 lg:row-start-2">
          <section aria-label="Design">
            <StylePanel style={style} onChange={setStyle} />
          </section>
        </div>
      </div>

      <section id="designs" className="scroll-mt-20">
        <SavedDesigns designs={designs} currentId={currentId} onChange={updateDesigns} onOpen={open} />
      </section>
    </div>
  );
}
