// Saved designs live in this browser's localStorage. Export/import as JSON is always available.
import { EMPTY_FIELDS, type FieldsByType, type QrType } from "./payloads";
import { normalizeStyle, type QrStyle } from "./render";

export interface SavedDesign {
  id: string;
  name: string;
  type: QrType;
  fields: FieldsByType[QrType];
  style: QrStyle;
  sample?: boolean;
  createdAt: string;
  updatedAt: string;
}

const KEY = "qrzen.designs.v1";
const DRAFT_KEY = "qrzen.draft.v1";
const SEEDED_KEY = "qrzen.seeded.v1";

export const QR_TYPES: QrType[] = ["url", "text", "upi", "wifi", "vcard", "email", "sms", "whatsapp", "location"];

function hasStorage(): boolean {
  try {
    return typeof window !== "undefined" && !!window.localStorage;
  } catch {
    return false;
  }
}

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Validate and clean one design object (from storage or an imported file). */
export function sanitizeDesign(raw: unknown): SavedDesign | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const type = r.type as QrType;
  if (!QR_TYPES.includes(type)) return null;
  const fields = { ...EMPTY_FIELDS[type], ...((r.fields as object) ?? {}) } as FieldsByType[QrType];
  const now = new Date().toISOString();
  return {
    id: typeof r.id === "string" && r.id ? r.id : newId(),
    name: typeof r.name === "string" && r.name.trim() ? r.name.trim().slice(0, 80) : "Untitled QR code",
    type,
    fields,
    style: normalizeStyle(r.style as Partial<QrStyle>),
    sample: r.sample === true,
    createdAt: typeof r.createdAt === "string" ? r.createdAt : now,
    updatedAt: typeof r.updatedAt === "string" ? r.updatedAt : now,
  };
}

export function loadDesigns(): SavedDesign[] {
  if (!hasStorage()) return [];
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    if (!Array.isArray(raw)) return [];
    return raw.map(sanitizeDesign).filter((d): d is SavedDesign => !!d);
  } catch {
    return [];
  }
}

export function saveDesigns(list: SavedDesign[]): void {
  if (!hasStorage()) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    throw new Error("Browser storage is full. Delete a few designs or use smaller logos.");
  }
}

export function upsertDesign(list: SavedDesign[], design: SavedDesign): SavedDesign[] {
  const i = list.findIndex((d) => d.id === design.id);
  const next = { ...design, updatedAt: new Date().toISOString() };
  if (i === -1) return [next, ...list];
  const copy = list.slice();
  copy[i] = next;
  return copy;
}

export function exportJson(list: SavedDesign[]): string {
  return JSON.stringify({ app: "qrzen", version: 1, exportedAt: new Date().toISOString(), designs: list }, null, 2);
}

/** Merge designs from an exported JSON file. Returns the merged list and how many were added/updated. */
export function importJson(list: SavedDesign[], text: string): { list: SavedDesign[]; count: number } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("That file is not valid JSON");
  }
  const items = Array.isArray(parsed) ? parsed : (parsed as { designs?: unknown[] })?.designs;
  if (!Array.isArray(items)) throw new Error("No designs found in that file");
  let next = list;
  let count = 0;
  for (const item of items) {
    const d = sanitizeDesign(item);
    if (!d) continue;
    next = upsertDesign(next, d);
    count++;
  }
  if (!count) throw new Error("No valid designs found in that file");
  return { list: next, count };
}

export interface Draft {
  type: QrType;
  fields: Partial<FieldsByType>;
  style: QrStyle;
}

export function loadDraft(): Draft | null {
  if (!hasStorage()) return null;
  try {
    const d = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "null");
    if (!d || !QR_TYPES.includes(d.type)) return null;
    return { type: d.type, fields: d.fields ?? {}, style: normalizeStyle(d.style) };
  } catch {
    return null;
  }
}

export function saveDraft(d: Draft): void {
  if (!hasStorage()) return;
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
  } catch {
    /* storage full: drafts are best effort */
  }
}

/** True the first time this browser opens the app (used to add sample designs once). */
export function shouldSeed(): boolean {
  if (!hasStorage()) return false;
  if (localStorage.getItem(SEEDED_KEY)) return false;
  localStorage.setItem(SEEDED_KEY, "1");
  return true;
}
