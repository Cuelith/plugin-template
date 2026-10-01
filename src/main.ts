import { ErrorCode } from "@cuelith/protocol";
import { definePlugin, PluginError, type PluginContext } from "@cuelith/sdk";

// Processo del modulo (runtime "node"). Il motore lo avvia da solo, con i
// permessi del manifest (qui solo "storage"), e lo riavvia se cade: le uscite
// non ne risentono. Questo file e' tutto cio' che serve per un comando.

/** Parametri del comando "greet", inviati dal pannello. */
export interface GreetParams {
  /** Titolo dell'elemento da mettere in scaletta, gia' tradotto dal pannello. */
  readonly title: string;
  /** Testo della slide, gia' tradotto dal pannello. */
  readonly text: string;
}

export interface GreetResult {
  /** Saluti inviati da quando il modulo e' installato (dallo spazio dati). */
  readonly count: number;
}

function greetParams(params: Readonly<Record<string, unknown>>): GreetParams {
  const { title, text } = params;
  if (typeof title !== "string" || typeof text !== "string" || text.trim() === "") {
    throw new PluginError(ErrorCode.InvalidParameters, "cuelith.hello.error.nameMissing");
  }
  return { title: title.trim(), text: text.trim() };
}

/** Il comando "greet": un testo in scaletta, il conto salvato, un evento per gli altri moduli. */
export async function greet(ctx: PluginContext, params: GreetParams): Promise<GreetResult> {
  const previous = await ctx.storage.get("count");
  const count = (typeof previous === "number" ? previous : 0) + 1;
  const { id } = await ctx.engine.call("item.create", {
    type: "core.text",
    title: params.title,
    slides: [{ fields: { text: { kind: "text", value: params.text } } }],
  });
  await ctx.engine.call("playlist.add", { itemId: id });
  await ctx.storage.set("count", count);
  ctx.events.emit("greeted", { count });
  return { count };
}

export default definePlugin({
  activate(ctx) {
    ctx.commands.register("greet", (params) => greet(ctx, greetParams(params)));
    ctx.commands.register("count", async () => {
      const count = await ctx.storage.get("count");
      return { count: typeof count === "number" ? count : 0 };
    });
    ctx.log.info("pronto");
  },
});
