// Copies the ZXing reader WebAssembly file into public/ so the scan test is self-hosted (no CDN).
import { copyFileSync, mkdirSync } from "node:fs";
mkdirSync("public", { recursive: true });
copyFileSync("node_modules/zxing-wasm/dist/reader/zxing_reader.wasm", "public/zxing_reader.wasm");
console.log("copied zxing_reader.wasm to public/");
