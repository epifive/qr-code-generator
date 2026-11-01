"use client";

import { useMemo, useRef, useState } from "react";
import { Braces, CopyPlus, FolderOpen, Pencil, QrCode, Trash, Upload } from "lucide-react";
import { buildPayload } from "@/lib/payloads";
import { buildMatrix } from "@/lib/qr";
import { renderSvg } from "@/lib/render";
import { typeInfo } from "@/lib/site";
import { exportJson, importJson, newId, type SavedDesign } from "@/lib/storage";
import { downloadBlob } from "@/lib/exporters";
import { Button, cx } from "./ui";

function thumb(d: SavedDesign): string | null {
  const p = buildPayload(d.type, d.fields);
  if (!p.value) return null;
  try {
    return renderSvg(buildMatrix(p.value, d.style.ecLevel), d.style, { width: 160, idPrefix: `sd-${d.id}` }).svg;
  } catch {
    return null;
  }
}

export function SavedDesigns({
  designs,
  currentId,
  onChange,
  onOpen,
}: {
  designs: SavedDesign[];
  currentId: string | null;
  onChange: (list: SavedDesign[]) => void;
  onOpen: (d: SavedDesign) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const thumbs = useMemo(() => new Map(designs.map((d) => [d.id, thumb(d)])), [designs]);

  const rename = (d: SavedDesign) => {
    const name = window.prompt("Rename design", d.name);
    if (name && name.trim()) onChange(designs.map((x) => (x.id === d.id ? { ...x, name: name.trim().slice(0, 80), sample: false, updatedAt: new Date().toISOString() } : x)));
  };
  const duplicate = (d: SavedDesign) => {
    const now = new Date().toISOString();
    onChange([{ ...d, id: newId(), name: `${d.name.replace(/^Sample: /, "")} (copy)`, sample: false, createdAt: now, updatedAt: now }, ...designs]);
  };
  const remove = (d: SavedDesign) => {
    if (window.confirm(`Delete "${d.name}"? This cannot be undone.`)) onChange(designs.filter((x) => x.id !== d.id));
  };
  const exportAll = () => downloadBlob(new Blob([exportJson(designs)], { type: "application/json" }), `qrzen-designs-${new Date().toISOString().slice(0, 10)}.json`);
  const importFile = async (file?: File) => {
    if (!file) return;
    try {
      const { list, count } = importJson(designs, await file.text());
      onChange(list);
      setMsg({ ok: true, text: `Imported ${count} design${count === 1 ? "" : "s"}.` });
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    }
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h2 className="mr-auto text-lg font-semibold">My saved designs</h2>
        <Button onClick={() => fileRef.current?.click()} className="text-xs">
          <Upload className="h-3.5 w-3.5" /> Import JSON
        </Button>
        <Button onClick={exportAll} disabled={!designs.length} className="text-xs">
          <Braces className="h-3.5 w-3.5" /> Export all (JSON)
        </Button>
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => importFile(e.target.files?.[0]).finally(() => (e.target.value = ""))} />
      </div>
      {msg && <p className={cx("mb-3 text-sm", msg.ok ? "text-emerald-600" : "text-rose-600")}>{msg.text}</p>}
      {designs.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-zinc-300 px-6 py-12 text-center dark:border-zinc-700">
          <QrCode className="mb-3 h-10 w-10 text-zinc-300 dark:text-zinc-600" />
          <p className="font-medium">No saved designs yet</p>
          <p className="mt-1 max-w-sm text-sm text-zinc-500">Press “Save design” under the preview to keep a code and its style in this browser. Export them as JSON any time.</p>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {designs.map((d) => {
            const svg = thumbs.get(d.id);
            return (
              <li
                key={d.id}
                className={cx(
                  "group flex flex-col overflow-hidden rounded-xl border bg-white transition dark:bg-zinc-900",
                  currentId === d.id ? "border-indigo-500 ring-2 ring-indigo-500/20" : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700",
                )}
              >
                <button type="button" onClick={() => onOpen(d)} className="checker relative block p-3" aria-label={`Open ${d.name}`}>
                  {svg ? (
                    <span className="preview-svg mx-auto block max-w-[140px]" dangerouslySetInnerHTML={{ __html: svg }} />
                  ) : (
                    <span className="flex aspect-square items-center justify-center text-xs text-zinc-400">Incomplete</span>
                  )}
                  {d.sample && <span className="absolute left-2 top-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">SAMPLE</span>}
                </button>
                <div className="flex flex-1 flex-col gap-1 border-t border-zinc-100 p-3 dark:border-zinc-800">
                  <p className="truncate text-sm font-medium" title={d.name}>
                    {d.name}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {typeInfo(d.type).short} · {new Date(d.updatedAt).toLocaleDateString()}
                  </p>
                  <div className="mt-1 flex gap-1">
                    <button type="button" onClick={() => onOpen(d)} className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-indigo-600 dark:hover:bg-zinc-800" title="Open" aria-label={`Open ${d.name}`}>
                      <FolderOpen className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => rename(d)} className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-indigo-600 dark:hover:bg-zinc-800" title="Rename" aria-label={`Rename ${d.name}`}>
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => duplicate(d)} className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-indigo-600 dark:hover:bg-zinc-800" title="Duplicate" aria-label={`Duplicate ${d.name}`}>
                      <CopyPlus className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => remove(d)} className="ml-auto rounded-md p-1.5 text-zinc-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10" title="Delete" aria-label={`Delete ${d.name}`}>
                      <Trash className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
