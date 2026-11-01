// In-browser scan check: renders the code to a canvas and decodes it with ZXing-C++ (WebAssembly).
// The .wasm file is self-hosted from /zxing_reader.wasm (copied from node_modules at build time).
import { svgToCanvas } from "./exporters";

let prepared = false;

export async function scanCheck(svg: string, aspect: number, width = 480): Promise<string | null> {
  const zx = await import("zxing-wasm/reader");
  if (!prepared) {
    zx.prepareZXingModule({
      overrides: {
        locateFile: (path: string, prefix: string) => (path.endsWith(".wasm") ? `${window.location.origin}/zxing_reader.wasm` : prefix + path),
      },
      fireImmediately: false,
    });
    prepared = true;
  }
  const canvas = await svgToCanvas(svg, width, aspect, "#ffffff");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const res = await zx.readBarcodes(data, { formats: ["QRCode"], tryHarder: true, maxNumberOfSymbols: 1 });
  return res[0]?.text ?? null;
}
