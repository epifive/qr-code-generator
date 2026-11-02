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

const design = (name: string) => JSON.stringify([{ id: name, name, type: "text", fields: { text: "hi" }, style: {} }]);

describe("legacy localStorage migration", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  async function load(init: Record<string, string>) {
    const store = fakeStorage(init);
    vi.stubGlobal("localStorage", store);
    vi.stubGlobal("window", { localStorage: store });
    return { store, storage: await import("@/lib/storage") };
  }

  it("moves data from both earlier key prefixes once and keeps newer values", async () => {
    const { store, storage } = await load({
      "qrzen.designs.v1": design("Oldest"),
      "qrzen.seeded.v1": "1",
      "qrzen.theme": "dark",
      "qr-studio.draft.v1": "null",
      "qr-code-generator.theme": "light",
    });
    expect(storage.loadDesigns().map((d) => d.name)).toEqual(["Oldest"]);
    expect(storage.shouldSeed()).toBe(false);
    expect(store.dump()).toEqual({
      "qr-code-generator.designs.v1": design("Oldest"),
      "qr-code-generator.seeded.v1": "1",
      "qr-code-generator.draft.v1": "null",
      "qr-code-generator.theme": "light",
    });
  });

  it("prefers the newer earlier prefix when both exist", async () => {
    const { store, storage } = await load({ "qrzen.designs.v1": design("Oldest"), "qr-studio.designs.v1": design("Newer") });
    expect(storage.loadDesigns().map((d) => d.name)).toEqual(["Newer"]);
    expect(Object.keys(store.dump())).toEqual(["qr-code-generator.designs.v1"]);
  });
});
