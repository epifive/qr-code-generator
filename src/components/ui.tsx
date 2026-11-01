"use client";

import { useId, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

export const inputCls =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500";

export function Field({
  label,
  error,
  hint,
  children,
  id,
  className,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: (id: string) => ReactNode;
  id?: string;
  className?: string;
}) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <div className={cx("space-y-1.5", className)}>
      <label htmlFor={fid} className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
        {label}
      </label>
      {children(fid)}
      {error ? (
        <p className="text-xs text-rose-600 dark:text-rose-400" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-zinc-500 dark:text-zinc-500">{hint}</p>
      ) : null}
    </div>
  );
}

export function TextInput({
  label,
  value,
  onChange,
  error,
  hint,
  placeholder,
  type = "text",
  className,
  inputMode,
  autoComplete,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  hint?: string;
  placeholder?: string;
  type?: string;
  className?: string;
  inputMode?: "text" | "decimal" | "tel" | "email" | "url" | "numeric";
  autoComplete?: string;
  maxLength?: number;
}) {
  return (
    <Field label={label} error={error} hint={hint} className={className}>
      {(id) => (
        <input
          id={id}
          type={type}
          value={value}
          placeholder={placeholder}
          inputMode={inputMode}
          autoComplete={autoComplete ?? "off"}
          maxLength={maxLength}
          aria-invalid={!!error}
          onChange={(e) => onChange(e.target.value)}
          className={cx(inputCls, error && "border-rose-400 focus:border-rose-500 focus:ring-rose-500/25 dark:border-rose-500/60")}
        />
      )}
    </Field>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  error,
  hint,
  placeholder,
  rows = 3,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  hint?: string;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
}) {
  return (
    <Field label={label} error={error} hint={hint}>
      {(id) => (
        <textarea
          id={id}
          value={value}
          rows={rows}
          placeholder={placeholder}
          maxLength={maxLength}
          aria-invalid={!!error}
          onChange={(e) => onChange(e.target.value)}
          className={cx(inputCls, "resize-y", error && "border-rose-400")}
        />
      )}
    </Field>
  );
}

export function Select<T extends string>({
  label,
  value,
  onChange,
  options,
  className,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  className?: string;
}) {
  return (
    <Field label={label} className={className}>
      {(id) => (
        <select id={id} value={value} onChange={(e) => onChange(e.target.value as T)} className={cx(inputCls, "pr-8")}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}

export function ColorInput({ label, value, onChange, disabled }: { label: string; value: string; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <Field label={label}>
      {(id) => (
        <div className={cx("flex items-center gap-2 rounded-lg border border-zinc-300 bg-white p-1.5 dark:border-zinc-700 dark:bg-zinc-900", disabled && "opacity-50")}>
          <input id={id} type="color" value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} className="h-7 w-9 shrink-0 rounded-md ring-1 ring-zinc-300 dark:ring-zinc-600" />
          <input
            aria-label={`${label} hex`}
            value={value}
            disabled={disabled}
            maxLength={7}
            onChange={(e) => {
              const v = e.target.value.startsWith("#") ? e.target.value : `#${e.target.value}`;
              if (/^#[0-9a-fA-F]{0,6}$/.test(v)) onChange(v);
            }}
            className="w-full min-w-0 bg-transparent font-mono text-xs uppercase text-zinc-700 outline-none dark:text-zinc-300"
          />
        </div>
      )}
    </Field>
  );
}

export function Toggle({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 text-sm">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cx(
          "relative mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full transition",
          checked ? "bg-indigo-600" : "bg-zinc-300 dark:bg-zinc-700",
        )}
      >
        <span className={cx("inline-block h-4 w-4 rounded-full bg-white shadow transition", checked ? "translate-x-4.5" : "translate-x-0.5")} />
      </button>
      <span>
        <span className="text-zinc-800 dark:text-zinc-200">{label}</span>
        {hint ? <span className="block text-xs text-zinc-500">{hint}</span> : null}
      </span>
    </label>
  );
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  return (
    <Field label={`${label}: ${format ? format(value) : value}`}>
      {(id) => (
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full accent-indigo-600"
        />
      )}
    </Field>
  );
}

export function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; title?: string }[];
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{label}</p>
      <div role="group" aria-label={label} className="flex flex-wrap gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800/70">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            title={o.title}
            aria-pressed={value === o.value}
            onClick={() => onChange(o.value)}
            className={cx(
              "flex-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition",
              value === o.value
                ? "bg-white text-indigo-700 shadow-sm dark:bg-zinc-950 dark:text-indigo-300"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Panel({
  title,
  icon,
  children,
  defaultOpen = false,
  badge,
}: {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  badge?: ReactNode;
}) {
  return (
    <details open={defaultOpen} className="group rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60">
      <summary className="flex cursor-pointer select-none items-center gap-2.5 px-4 py-3 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
        <span className="text-indigo-600 dark:text-indigo-400">{icon}</span>
        <span className="flex-1">{title}</span>
        {badge}
        <ChevronDown className="h-4 w-4 text-zinc-400 transition group-open:rotate-180" />
      </summary>
      <div className="space-y-4 border-t border-zinc-100 px-4 py-4 dark:border-zinc-800">{children}</div>
    </details>
  );
}

export function Button({
  children,
  onClick,
  variant = "secondary",
  className,
  disabled,
  title,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  className?: string;
  disabled?: boolean;
  title?: string;
  type?: "button" | "submit";
}) {
  const v = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm shadow-indigo-600/20",
    secondary:
      "border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800",
    ghost: "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800",
    danger: "text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10",
  }[variant];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:cursor-not-allowed disabled:opacity-50",
        v,
        className,
      )}
    >
      {children}
    </button>
  );
}
