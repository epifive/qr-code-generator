"use client";

import { useMemo, useRef, useState } from "react";
import { ArrowLeftRight, Frame, Image as ImageIcon, Palette, Settings2, Shapes, Sparkles, Upload, X } from "lucide-react";
import { buildMatrix, type EcLevel } from "@/lib/qr";
import { renderSvg, type DotShape, type EyeBallShape, type EyeFrameShape, type FrameStyle, type LogoBackdrop, type QrStyle } from "@/lib/render";
import { BUILTIN_LOGOS, builtinLogo, STYLE_PRESETS } from "@/lib/presets";
import { fileToLogoDataUrl } from "@/lib/exporters";
import { Button, ColorInput, Panel, Segmented, Slider, TextInput, Toggle, cx } from "./ui";

interface Props {
  style: QrStyle;
  onChange: (s: QrStyle) => void;
}

const DOTS: { value: DotShape; label: string }[] = [
  { value: "square", label: "Square" },
  { value: "rounded", label: "Rounded" },
  { value: "dots", label: "Dots" },
  { value: "classy", label: "Classy" },
  { value: "fluid", label: "Fluid" },
];
const EYE_FRAMES: { value: EyeFrameShape; label: string }[] = [
  { value: "square", label: "Square" },
  { value: "rounded", label: "Rounded" },
  { value: "circle", label: "Circle" },
  { value: "leaf", label: "Leaf" },
];
const EYE_BALLS: { value: EyeBallShape; label: string }[] = [
  { value: "square", label: "Square" },
  { value: "rounded", label: "Rounded" },
  { value: "circle", label: "Circle" },
  { value: "leaf", label: "Leaf" },
];
const FRAMES: { value: FrameStyle; label: string }[] = [
  { value: "none", label: "None" },
  { value: "banner-bottom", label: "Banner" },
  { value: "banner-top", label: "Top banner" },
  { value: "bubble", label: "Bubble" },
  { value: "outline", label: "Outline" },
];
const FRAME_TEXTS = ["SCAN ME", "SCAN TO PAY", "FREE WIFI", "VIEW MENU", "SAVE CONTACT", "CHAT WITH US", "FOLLOW US"];

function Thumb({ svg, label, active, onClick }: { svg: string; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cx(
        "group flex flex-col items-center gap-1 rounded-lg border p-1.5 text-[11px] font-medium transition",
        active
          ? "border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300"
          : "border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600",
      )}
    >
      <span className="block w-full overflow-hidden rounded-md bg-white [&_svg]:h-auto [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: svg }} />
      {label}
    </button>
  );
}

export function StylePanel({ style, onChange }: Props) {
  const set = (patch: Partial<QrStyle>) => onChange({ ...style, ...patch });
  const fileRef = useRef<HTMLInputElement>(null);
  const [logoError, setLogoError] = useState("");

  const sample = useMemo(() => buildMatrix("qrzen", "L"), []);
  const thumbs = useMemo(() => {
    const base: Partial<QrStyle> = { fg: "#18181b", bg: "#ffffff", margin: 1 };
    return {
      dots: DOTS.map((d) => renderSvg(sample, { ...base, dotShape: d.value, eyeFrame: style.eyeFrame, eyeBall: style.eyeBall }, { width: 64, idPrefix: `t-d-${d.value}` }).svg),
      frames: EYE_FRAMES.map((d) => renderSvg(sample, { ...base, dotShape: style.dotShape, eyeFrame: d.value, eyeBall: style.eyeBall }, { width: 64, idPrefix: `t-f-${d.value}` }).svg),
      balls: EYE_BALLS.map((d) => renderSvg(sample, { ...base, dotShape: style.dotShape, eyeFrame: style.eyeFrame, eyeBall: d.value }, { width: 64, idPrefix: `t-b-${d.value}` }).svg),
      presets: STYLE_PRESETS.map((p) => renderSvg(sample, { ...p.style, margin: 1 }, { width: 64, idPrefix: `t-p-${p.id}` }).svg),
      qrFrames: FRAMES.map(
        (fr) =>
          renderSvg(sample, { ...base, margin: 2, dotShape: style.dotShape, frame: { style: fr.value, text: "SCAN", color: "#4f46e5", textColor: "#ffffff" } }, { width: 64, idPrefix: `t-fr-${fr.value}` }).svg,
      ),
    };
  }, [sample, style.dotShape, style.eyeFrame, style.eyeBall]);

  const setLogo = (src: string | null) => {
    // A logo hides part of the code, so raise error correction when needed.
    const ec: EcLevel = src && (style.ecLevel === "L" || style.ecLevel === "M") ? "H" : style.ecLevel;
    set({ logo: { ...style.logo, src }, ecLevel: ec });
  };

  const onFile = async (file?: File) => {
    setLogoError("");
    if (!file) return;
    try {
      setLogo(await fileToLogoDataUrl(file));
    } catch (e) {
      setLogoError((e as Error).message);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="mb-2 flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
          <Sparkles className="h-3.5 w-3.5 text-indigo-500" /> Quick styles
        </p>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
          {STYLE_PRESETS.map((p, i) => (
            <Thumb
              key={p.id}
              svg={thumbs.presets[i]}
              label={p.name}
              active={false}
              onClick={() => onChange({ ...style, ...p.style, logo: style.logo, frame: { ...style.frame, color: (p.style.eyeFrameColor ?? p.style.fg) || style.frame.color } })}
            />
          ))}
        </div>
      </div>

      <Panel title="Colours" icon={<Palette className="h-4 w-4" />} defaultOpen>
        <div className="grid grid-cols-2 gap-3">
          <ColorInput label={style.gradient.enabled ? "Gradient start" : "Code colour"} value={style.fg} onChange={(fg) => set({ fg })} />
          <ColorInput label="Background" value={style.bg} onChange={(bg) => set({ bg })} disabled={style.transparentBg} />
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <Toggle label="Transparent background" checked={style.transparentBg} onChange={(transparentBg) => set({ transparentBg })} />
          <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => set({ fg: style.bg, bg: style.fg })}>
            <ArrowLeftRight className="h-3.5 w-3.5" /> Swap colours
          </Button>
        </div>
        <Toggle label="Gradient" checked={style.gradient.enabled} onChange={(enabled) => set({ gradient: { ...style.gradient, enabled } })} />
        {style.gradient.enabled && (
          <div className="grid gap-3 rounded-lg bg-zinc-50 p-3 sm:grid-cols-2 dark:bg-zinc-800/40">
            <ColorInput label="Gradient end" value={style.gradient.color2} onChange={(color2) => set({ gradient: { ...style.gradient, color2 } })} />
            <Segmented
              label="Type"
              value={style.gradient.type}
              onChange={(type) => set({ gradient: { ...style.gradient, type } })}
              options={[
                { value: "linear", label: "Linear" },
                { value: "radial", label: "Radial" },
              ]}
            />
            {style.gradient.type === "linear" && (
              <div className="sm:col-span-2">
                <Slider label="Angle" value={style.gradient.rotation} min={0} max={360} step={15} onChange={(rotation) => set({ gradient: { ...style.gradient, rotation } })} format={(v) => `${v}°`} />
              </div>
            )}
          </div>
        )}
        <Toggle
          label="Custom eye colours"
          hint="Colour the three corner squares separately."
          checked={style.eyeFrameColor !== null}
          onChange={(on) => set(on ? { eyeFrameColor: "#4f46e5", eyeBallColor: "#0f766e" } : { eyeFrameColor: null, eyeBallColor: null })}
        />
        {style.eyeFrameColor !== null && (
          <div className="grid grid-cols-2 gap-3">
            <ColorInput label="Eye frame" value={style.eyeFrameColor} onChange={(eyeFrameColor) => set({ eyeFrameColor })} />
            <ColorInput label="Eye centre" value={style.eyeBallColor ?? style.fg} onChange={(eyeBallColor) => set({ eyeBallColor })} />
          </div>
        )}
      </Panel>

      <Panel title="Shapes" icon={<Shapes className="h-4 w-4" />} defaultOpen>
        <div>
          <p className="mb-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">Dots</p>
          <div className="grid grid-cols-5 gap-2">
            {DOTS.map((d, i) => (
              <Thumb key={d.value} svg={thumbs.dots[i]} label={d.label} active={style.dotShape === d.value} onClick={() => set({ dotShape: d.value })} />
            ))}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">Eye frame</p>
            <div className="grid grid-cols-4 gap-2">
              {EYE_FRAMES.map((d, i) => (
                <Thumb key={d.value} svg={thumbs.frames[i]} label={d.label} active={style.eyeFrame === d.value} onClick={() => set({ eyeFrame: d.value })} />
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">Eye centre</p>
            <div className="grid grid-cols-4 gap-2">
              {EYE_BALLS.map((d, i) => (
                <Thumb key={d.value} svg={thumbs.balls[i]} label={d.label} active={style.eyeBall === d.value} onClick={() => set({ eyeBall: d.value })} />
              ))}
            </div>
          </div>
        </div>
      </Panel>

      <Panel
        title="Logo"
        icon={<ImageIcon className="h-4 w-4" />}
        badge={style.logo.src ? <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">ON</span> : null}
      >
        <div className="flex flex-wrap items-center gap-3">
          {style.logo.src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={style.logo.src} alt="Current logo" className="h-12 w-12 rounded-lg border border-zinc-200 bg-white object-contain p-1 dark:border-zinc-700" />
          ) : null}
          <Button onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4" /> Upload logo
          </Button>
          {style.logo.src ? (
            <Button variant="danger" onClick={() => setLogo(null)}>
              <X className="h-4 w-4" /> Remove
            </Button>
          ) : null}
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" className="hidden" onChange={(e) => onFile(e.target.files?.[0]).finally(() => (e.target.value = ""))} />
        </div>
        {logoError ? <p className="text-xs text-rose-600">{logoError}</p> : <p className="text-xs text-zinc-500">PNG, JPG, SVG or WebP. Your image stays in this browser.</p>}
        <div>
          <p className="mb-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">Or pick an icon</p>
          <div className="flex flex-wrap gap-2">
            {BUILTIN_LOGOS.map((id) => {
              const src = builtinLogo(id);
              return (
                <button
                  key={id}
                  type="button"
                  title={id}
                  aria-label={`Use the ${id} icon`}
                  onClick={() => setLogo(src)}
                  className={cx("rounded-lg border p-1 transition hover:scale-105", style.logo.src === src ? "border-indigo-500 ring-2 ring-indigo-500/30" : "border-zinc-200 dark:border-zinc-700")}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-8 w-8" />
                </button>
              );
            })}
          </div>
        </div>
        {style.logo.src && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Slider label="Logo size" value={Math.round(style.logo.size * 100)} min={10} max={35} onChange={(v) => set({ logo: { ...style.logo, size: v / 100 } })} format={(v) => `${v}%`} />
            <Segmented<LogoBackdrop>
              label="Backdrop"
              value={style.logo.backdrop}
              onChange={(backdrop) => set({ logo: { ...style.logo, backdrop } })}
              options={[
                { value: "none", label: "None" },
                { value: "square", label: "Square" },
                { value: "rounded", label: "Rounded" },
                { value: "circle", label: "Circle" },
              ]}
            />
            <div className="sm:col-span-2">
              <Toggle label="Clear the dots behind the logo" hint="Recommended. Keeps the logo crisp and the code easy to scan." checked={style.logo.excavate} onChange={(excavate) => set({ logo: { ...style.logo, excavate } })} />
            </div>
          </div>
        )}
      </Panel>

      <Panel
        title="Frame & call to action"
        icon={<Frame className="h-4 w-4" />}
        badge={style.frame.style !== "none" ? <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">ON</span> : null}
      >
        <div className="grid grid-cols-5 gap-2">
          {FRAMES.map((fr, i) => (
            <Thumb key={fr.value} svg={thumbs.qrFrames[i]} label={fr.label} active={style.frame.style === fr.value} onClick={() => set({ frame: { ...style.frame, style: fr.value } })} />
          ))}
        </div>
        {style.frame.style !== "none" && (
          <>
            <TextInput label="Call-to-action text" value={style.frame.text} onChange={(text) => set({ frame: { ...style.frame, text } })} maxLength={32} placeholder="SCAN ME" />
            <div className="flex flex-wrap gap-1.5">
              {FRAME_TEXTS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => set({ frame: { ...style.frame, text: t } })}
                  className="rounded-full border border-zinc-200 px-2.5 py-1 text-[11px] font-medium text-zinc-600 hover:border-indigo-400 hover:text-indigo-600 dark:border-zinc-700 dark:text-zinc-400"
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <ColorInput label="Frame colour" value={style.frame.color} onChange={(color) => set({ frame: { ...style.frame, color } })} />
              <ColorInput label="Text colour" value={style.frame.textColor} onChange={(textColor) => set({ frame: { ...style.frame, textColor } })} disabled={style.frame.style === "outline"} />
            </div>
          </>
        )}
      </Panel>

      <Panel title="Advanced" icon={<Settings2 className="h-4 w-4" />}>
        <Segmented<EcLevel>
          label="Error correction"
          value={style.ecLevel}
          onChange={(ecLevel) => set({ ecLevel })}
          options={[
            { value: "L", label: "L · 7%", title: "Smallest code, least damage tolerance" },
            { value: "M", label: "M · 15%", title: "Good default" },
            { value: "Q", label: "Q · 25%", title: "Good with small logos" },
            { value: "H", label: "H · 30%", title: "Best with logos and for print" },
          ]}
        />
        <p className="text-xs text-zinc-500">Higher levels survive scratches and logos but make the code denser. Use H when you add a logo.</p>
        <Slider label="Quiet zone (margin)" value={style.margin} min={0} max={10} onChange={(margin) => set({ margin })} format={(v) => `${v} modules`} />
      </Panel>
    </div>
  );
}
