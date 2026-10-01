import { readFileSync } from "node:fs";
import { PluginManifestSchema } from "@cuelith/protocol";
import { runPlugin, type Transport } from "@cuelith/sdk";
import { describe, expect, it } from "vitest";
import plugin from "../src/main.js";

/** Motore finto: risponde alle chiamate del modulo come farebbe quello vero. */
function fakeEngine() {
  const sent: Record<string, unknown>[] = [];
  const storage = new Map<string, unknown>();
  const created: unknown[] = [];
  let deliver: (line: string) => void = () => undefined;
  const reply = (id: unknown, result: unknown) => {
    deliver(JSON.stringify({ jsonrpc: "2.0", id, result }));
  };
  const transport: Transport = {
    send: (line) => {
      const message = JSON.parse(line) as {
        id?: number;
        method?: string;
        params?: Record<string, unknown>;
      };
      sent.push(message);
      const p = message.params ?? {};
      switch (message.method) {
        case "storage.get":
          reply(
            message.id,
            storage.has(p.key as string)
              ? { found: true, value: storage.get(p.key as string) }
              : { found: false },
          );
          break;
        case "storage.set":
          storage.set(p.key as string, p.value);
          reply(message.id, {});
          break;
        case "item.create":
          created.push(p);
          reply(message.id, { id: "01ARZ3NDEKTSV4RRFFQ69G5FAV", rev: 1 });
          break;
        case "playlist.add":
          reply(message.id, { id: "01ARZ3NDEKTSV4RRFFQ69G5FAW", rev: 2 });
          break;
      }
    },
    onLine: (listener) => {
      deliver = listener;
    },
    onClose: () => undefined,
  };
  const request = async (id: number, method: string, params: unknown) => {
    deliver(JSON.stringify({ jsonrpc: "2.0", id, method, params }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    return sent.find((m) => m.id === id && !("method" in m));
  };
  return { transport, sent, storage, created, request };
}

const context = {
  pluginId: "cuelith.hello",
  version: "0.1.0",
  protocol: "1.8.0",
  lang: "it",
  settings: {},
  permissions: ["storage"],
  dataDir: "/dati/cuelith.hello",
};

describe("hello-panel", () => {
  it("il manifest e' valido e i testi ci sono tutti", () => {
    const manifest = PluginManifestSchema.parse(
      JSON.parse(readFileSync(new URL("../cuelith-plugin.json", import.meta.url), "utf8")),
    );
    const catalog = JSON.parse(
      readFileSync(new URL("../locales/it.json", import.meta.url), "utf8"),
    ) as Record<string, string>;
    const keys = [
      ...(manifest.contributes.panels ?? []).map((p) => p.title),
      ...(manifest.contributes.commands ?? []).map((c) => c.title),
    ];
    const source = readFileSync(new URL("../src/ui/panel.ts", import.meta.url), "utf8");
    keys.push(...[...source.matchAll(/"(cuelith\.hello\.[a-zA-Z.]+)"/g)].map((m) => m[1] ?? ""));
    for (const key of keys) expect(catalog, key).toHaveProperty([key]);
  });

  it("greet mette un testo in scaletta, conta i saluti ed emette un evento", async () => {
    const engine = fakeEngine();
    runPlugin(plugin, engine.transport, { exit: () => undefined });
    expect(await engine.request(1, "plugin.activate", { context })).toMatchObject({ result: {} });

    const greet = { command: "greet", params: { title: "Saluto a Anna", text: "Ciao, Anna!" } };
    expect(await engine.request(2, "command.execute", greet)).toMatchObject({
      result: { result: { count: 1 } },
    });
    expect(await engine.request(3, "command.execute", greet)).toMatchObject({
      result: { result: { count: 2 } },
    });
    expect(engine.created[0]).toEqual({
      type: "core.text",
      title: "Saluto a Anna",
      slides: [{ fields: { text: { kind: "text", value: "Ciao, Anna!" } } }],
    });
    expect(engine.storage.get("count")).toBe(2);
    expect(engine.sent.filter((m) => m.method === "event.emit")).toHaveLength(2);
    expect(await engine.request(4, "command.execute", { command: "count" })).toMatchObject({
      result: { result: { count: 2 } },
    });
  });

  it("senza nome risponde con un errore del modulo", async () => {
    const engine = fakeEngine();
    runPlugin(plugin, engine.transport, { exit: () => undefined });
    await engine.request(1, "plugin.activate", { context });
    expect(
      await engine.request(2, "command.execute", {
        command: "greet",
        params: { title: "x", text: "  " },
      }),
    ).toMatchObject({ error: { code: 4220, message: "cuelith.hello.error.nameMissing" } });
  });
});
