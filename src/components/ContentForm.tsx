"use client";

import { MapPin } from "lucide-react";
import {
  parseCoordinates,
  type AnyFields,
  type EmailFields,
  type LocationFields,
  type QrType,
  type SmsFields,
  type TextFields,
  type UpiFields,
  type UrlFields,
  type VcardFields,
  type WhatsappFields,
  type WifiFields,
} from "@/lib/payloads";
import { Button, Segmented, Select, TextArea, TextInput, Toggle } from "./ui";

interface Props {
  type: QrType;
  fields: AnyFields;
  errors: Record<string, string>;
  /** Only show errors for fields the user touched (or after a download attempt). */
  showErrors: boolean;
  onChange: (fields: AnyFields) => void;
}

export function ContentForm({ type, fields, errors, showErrors, onChange }: Props) {
  const err = (k: string) => (showErrors ? errors[k] : undefined);
  const set = <T extends AnyFields>(patch: Partial<T>) => onChange({ ...(fields as T), ...patch });

  switch (type) {
    case "url": {
      const f = fields as UrlFields;
      return (
        <TextInput label="Website or link" value={f.url} onChange={(url) => set<UrlFields>({ url })} error={err("url")} placeholder="https://example.com" inputMode="url" hint="https:// is added for you." />
      );
    }
    case "text": {
      const f = fields as TextFields;
      return (
        <TextArea label="Text" value={f.text} onChange={(text) => set<TextFields>({ text })} error={err("text")} rows={4} maxLength={2000} hint={`${f.text.length}/2000 characters. Shorter text makes a simpler, easier-to-scan code.`} />
      );
    }
    case "upi": {
      const f = fields as UpiFields;
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput label="UPI ID (VPA)" value={f.vpa} onChange={(vpa) => set<UpiFields>({ vpa: vpa.trim() })} error={err("vpa")} placeholder="yourshop@okaxis" />
          <TextInput label="Payee name" value={f.name} onChange={(name) => set<UpiFields>({ name })} error={err("name")} placeholder="Sharma General Store" />
          <TextInput label="Amount (optional)" value={f.amount} onChange={(amount) => set<UpiFields>({ amount })} error={err("amount")} placeholder="Leave empty to let the customer enter it" inputMode="decimal" />
          <TextInput label="Note (optional)" value={f.note} onChange={(note) => set<UpiFields>({ note })} error={err("note")} placeholder="Invoice #1024" maxLength={80} />
          <p className="text-xs text-zinc-500 sm:col-span-2">
            Works with GPay, PhonePe, Paytm, BHIM and every UPI app. Payments go straight to your bank account; always check a test payment of ₹1 before printing.
          </p>
        </div>
      );
    }
    case "wifi": {
      const f = fields as WifiFields;
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput label="Network name (SSID)" value={f.ssid} onChange={(ssid) => set<WifiFields>({ ssid })} error={err("ssid")} placeholder="Cafe Guest" />
          <TextInput label="Password" value={f.password} onChange={(password) => set<WifiFields>({ password })} error={err("password")} placeholder={f.encryption === "nopass" ? "Not needed" : "At least 8 characters"} />
          <Select
            label="Security"
            value={f.encryption}
            onChange={(encryption) => set<WifiFields>({ encryption })}
            options={[
              { value: "WPA", label: "WPA / WPA2 / WPA3" },
              { value: "WEP", label: "WEP (old routers)" },
              { value: "nopass", label: "None (open network)" },
            ]}
          />
          <div className="flex items-end pb-2">
            <Toggle label="Hidden network" checked={f.hidden} onChange={(hidden) => set<WifiFields>({ hidden })} />
          </div>
        </div>
      );
    }
    case "vcard": {
      const f = fields as VcardFields;
      const t = (k: keyof VcardFields, label: string, extra: Partial<Parameters<typeof TextInput>[0]> = {}) => (
        <TextInput key={k} label={label} value={f[k]} onChange={(v) => set<VcardFields>({ [k]: v } as Partial<VcardFields>)} error={err(k)} {...extra} />
      );
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          {t("firstName", "First name", { autoComplete: "given-name" })}
          {t("lastName", "Last name", { autoComplete: "family-name" })}
          {t("org", "Company")}
          {t("title", "Job title")}
          {t("mobile", "Mobile", { inputMode: "tel", placeholder: "+91 98765 43210" })}
          {t("phone", "Work phone", { inputMode: "tel" })}
          {t("email", "Email", { inputMode: "email" })}
          {t("website", "Website", { inputMode: "url" })}
          {t("street", "Street", { className: "sm:col-span-2" })}
          {t("city", "City")}
          {t("region", "State / region")}
          {t("zip", "PIN / ZIP code")}
          {t("country", "Country")}
          <div className="sm:col-span-2">
            <TextArea label="Note" value={f.note} onChange={(note) => set<VcardFields>({ note })} rows={2} maxLength={300} />
          </div>
        </div>
      );
    }
    case "email": {
      const f = fields as EmailFields;
      return (
        <div className="grid gap-4">
          <TextInput label="Send to" value={f.to} onChange={(to) => set<EmailFields>({ to: to.trim() })} error={err("to")} placeholder="hello@example.com" inputMode="email" />
          <TextInput label="Subject" value={f.subject} onChange={(subject) => set<EmailFields>({ subject })} />
          <TextArea label="Message" value={f.body} onChange={(body) => set<EmailFields>({ body })} rows={3} maxLength={1000} />
        </div>
      );
    }
    case "sms": {
      const f = fields as SmsFields;
      return (
        <div className="grid gap-4">
          <TextInput label="Phone number" value={f.phone} onChange={(phone) => set<SmsFields>({ phone })} error={err("phone")} placeholder="+91 98765 43210" inputMode="tel" />
          <TextArea label="Message" value={f.message} onChange={(message) => set<SmsFields>({ message })} rows={3} maxLength={300} />
        </div>
      );
    }
    case "whatsapp": {
      const f = fields as WhatsappFields;
      return (
        <div className="grid gap-4">
          <TextInput label="WhatsApp number with country code" value={f.phone} onChange={(phone) => set<WhatsappFields>({ phone })} error={err("phone")} placeholder="91 98765 43210" inputMode="tel" />
          <TextArea label="Pre-filled message (optional)" value={f.message} onChange={(message) => set<WhatsappFields>({ message })} rows={3} maxLength={500} />
        </div>
      );
    }
    case "location": {
      const f = fields as LocationFields;
      const useMyLocation = () => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition((p) =>
          set<LocationFields>({ lat: p.coords.latitude.toFixed(6), lng: p.coords.longitude.toFixed(6) }),
        );
      };
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput
            label="Paste coordinates or a map link (optional)"
            value=""
            onChange={(v) => {
              const c = parseCoordinates(v);
              if (c) set<LocationFields>(c);
            }}
            placeholder="18.5204, 73.8567"
            className="sm:col-span-2"
            hint="We pick up the latitude and longitude automatically."
          />
          <TextInput label="Latitude" value={f.lat} onChange={(lat) => set<LocationFields>({ lat })} error={err("lat")} inputMode="decimal" />
          <TextInput label="Longitude" value={f.lng} onChange={(lng) => set<LocationFields>({ lng })} error={err("lng")} inputMode="decimal" />
          <Segmented
            label="Opens in"
            value={f.mode}
            onChange={(mode) => set<LocationFields>({ mode })}
            options={[
              { value: "maps", label: "Google Maps link" },
              { value: "geo", label: "geo: (default maps app)" },
            ]}
          />
          {f.mode === "geo" ? (
            <TextInput label="Label (optional)" value={f.label} onChange={(label) => set<LocationFields>({ label })} />
          ) : (
            <div className="flex items-end">
              <Button onClick={useMyLocation} variant="secondary" className="w-full">
                <MapPin className="h-4 w-4" /> Use my location
              </Button>
            </div>
          )}
        </div>
      );
    }
  }
}
