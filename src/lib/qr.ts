import QRCode from "qrcode";

export type EcLevel = "L" | "M" | "Q" | "H";

export interface QrMatrix {
  size: number;
  version: number;
  ecLevel: EcLevel;
  /** Row-major, 1 = dark module. */
  data: Uint8Array;
}

/** Encode text into a QR module matrix (uses the MIT "qrcode" package). */
export function buildMatrix(text: string, ecLevel: EcLevel = "M"): QrMatrix {
  if (!text) throw new Error("Nothing to encode");
  const qr = QRCode.create(text, { errorCorrectionLevel: ecLevel });
  const size = qr.modules.size;
  return { size, version: qr.version, ecLevel, data: Uint8Array.from(qr.modules.data) };
}

export function isDark(m: QrMatrix, row: number, col: number): boolean {
  if (row < 0 || col < 0 || row >= m.size || col >= m.size) return false;
  return m.data[row * m.size + col] === 1;
}

/** True for modules inside the three 7x7 finder patterns. */
export function isFinder(size: number, row: number, col: number): boolean {
  const inBox = (r: number, c: number) => row >= r && row < r + 7 && col >= c && col < c + 7;
  return inBox(0, 0) || inBox(0, size - 7) || inBox(size - 7, 0);
}

/** Approximate share of the code that can be damaged/covered for each level. */
export const EC_RECOVERY: Record<EcLevel, number> = { L: 0.07, M: 0.15, Q: 0.25, H: 0.3 };

/** Rough capacity check: bytes that fit at version 40 per level (byte mode). */
export const MAX_BYTES: Record<EcLevel, number> = { L: 2953, M: 2331, Q: 1663, H: 1273 };

export function utf8Length(text: string): number {
  return new TextEncoder().encode(text).length;
}
