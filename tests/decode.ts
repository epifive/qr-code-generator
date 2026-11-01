import { readFileSync } from "node:fs";
import path from "node:path";
import { Resvg } from "@resvg/resvg-js";
import { prepareZXingModule, readBarcodes } from "zxing-wasm/reader";

prepareZXingModule({
  overrides: {
    wasmBinary: readFileSync(path.resolve("node_modules/zxing-wasm/dist/reader/zxing_reader.wasm")).buffer as ArrayBuffer,
  },
});

export interface Raster {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

/** Rasterise an SVG string (white behind transparent parts). */
export function rasterize(svg: string, width = 600): Raster {
  const img = new Resvg(svg, { background: "white", fitTo: { mode: "width", value: width }, font: { loadSystemFonts: false } }).render();
  return { data: new Uint8ClampedArray(img.pixels), width: img.width, height: img.height };
}

/** Decode with ZXing-C++ (the engine behind many phone scanners). */
export async function decodeZxing(r: Raster): Promise<string | null> {
  const res = await readBarcodes({ data: r.data, width: r.width, height: r.height, colorSpace: "srgb" } as unknown as ImageData, {
    formats: ["QRCode"],
    tryHarder: true,
    maxNumberOfSymbols: 1,
  });
  return res[0]?.text ?? null;
}

export async function decodeSvg(svg: string, width = 600): Promise<string | null> {
  return decodeZxing(rasterize(svg, width));
}
