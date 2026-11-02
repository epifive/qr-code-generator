import { afterEach, describe, expect, it, vi } from "vitest";

function fakeStorage(init: Record<string, string>) {
  const m = new Map(Object.entries(init));
  return {
    getItem: (k: string) => (m.has(k) ? m.get(k)! : null),
    setItem: (k: string, v: string) => void m.set(k, String(v)),
    removeItem: (k: string) => void m.delete(k),
    dump: () => Object.fromEntries(m),
  };
}

describe("legacy localStorage migration", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("moves data from the old key names once and keeps newer values", async () => {
    const design = { id: "a", name: "Old design", type: "text", fields: { text: "hi" }, style: {} };
    const store = fakeStorage({
      "qrzen.designs.v1": JSON.stringify([design]),
      "qrzen.seeded.v1": "1",
      "qrzen.theme": "dark",
      "qr-studio.theme": "light",
    });
    vi.stubGlobal("localStorage", store);
    vi.stubGlobal("window", { localStorage: store });
    const storage = await import("@/lib/storage");
    const list = storage.loadDesigns();
    expect(list.map((d) => d.name)).toEqual(["Old design"]);
    expect(storage.shouldSeed()).toBe(false);
    expect(store.dump()).toEqual({
      "qr-studio.designs.v1": JSON.stringify([design]),
      "qr-studio.seeded.v1": "1",
      "qr-studio.theme": "light",
    });
  });
});
