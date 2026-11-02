import { ImageResponse } from "next/og";
import { buildMatrix } from "@/lib/qr";
import { renderSvg } from "@/lib/render";
import { builtinLogo } from "@/lib/presets";

export const dynamic = "force-static";
export const alt = "EpiFive QR Code Generator: free, with logos, colours and UPI";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  const m = buildMatrix("https://qr-code-generator-demo.pages.dev", "H");
  const { svg } = renderSvg(
    m,
    {
      fg: "#4338ca",
      bg: "#ffffff",
      gradient: { enabled: true, type: "linear", color2: "#0d9488", rotation: 45 },
      dotShape: "fluid",
      eyeFrame: "rounded",
      eyeBall: "circle",
      ecLevel: "H",
      margin: 2,
      logo: { src: builtinLogo("rupee"), size: 0.22, excavate: true, backdrop: "rounded" },
      frame: { style: "banner-bottom", text: "SCAN ME", color: "#312e81", textColor: "#ffffff" },
    },
    { width: 360 },
  );
  const qr = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", background: "linear-gradient(135deg,#eef2ff 0%,#ffffff 50%,#f0fdfa 100%)", padding: 72 }}>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, paddingRight: 48 }}>
          <div style={{ display: "flex", alignItems: "center", fontSize: 36, fontWeight: 700, color: "#4f46e5" }}>EpiFive QR Code Generator</div>
          <div style={{ fontSize: 64, fontWeight: 700, color: "#18181b", lineHeight: 1.1, marginTop: 20 }}>Free QR code generator</div>
          <div style={{ fontSize: 30, color: "#52525b", marginTop: 24, lineHeight: 1.35 }}>UPI, WiFi, vCard, WhatsApp and links. Colours, logos and frames. PNG, SVG and print PDF.</div>
          <div style={{ display: "flex", marginTop: 36, fontSize: 24, color: "#0f766e" }}>No sign-up · No watermark · Open source</div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
        <img src={qr} width={360} height={Math.round(360 * 1.2)} style={{ borderRadius: 24 }} />
      </div>
    ),
    { ...size },
  );
}
