import { connectPanel, PanelCallError } from "@cuelith/panel";

// Pannello laterale del modulo: gira in un iframe isolato e parla col motore
// solo attraverso la postazione. Il lavoro vero lo fa il processo del modulo
// (src/main.ts), chiamato con plugin.command.

const element = (id: string): HTMLElement => {
  const found = document.getElementById(id);
  if (found === null) throw new Error(`manca #${id}`);
  return found;
};

const panel = await connectPanel();
const name = element("name") as HTMLInputElement;
const button = element("greet") as HTMLButtonElement;
const status = element("status");

element("name-label").textContent = panel.t("cuelith.hello.name");
button.textContent = panel.t("cuelith.hello.greet");

const showCount = (count: number) => {
  status.textContent = panel.t("cuelith.hello.count", { count });
};

/** Il comando del modulo: risponde il suo processo, non la postazione. */
const command = async <T>(command: string, params: Record<string, unknown> = {}) =>
  (await panel.call("plugin.command", { pluginId: panel.pluginId, command, params })).result as T;

const greet = async () => {
  const who = name.value.trim();
  if (who === "") {
    status.textContent = panel.t("cuelith.hello.error.nameMissing");
    return;
  }
  button.disabled = true;
  try {
    const { count } = await command<{ count: number }>("greet", {
      title: panel.t("cuelith.hello.itemTitle", { name: who }),
      text: panel.t("cuelith.hello.greeting", { name: who }),
    });
    showCount(count);
    name.value = "";
  } catch (error) {
    // Es. il processo del modulo e' in riavvio: lo si dice, senza bloccare nulla.
    status.textContent =
      error instanceof PanelCallError ? panel.t("cuelith.hello.error.failed") : String(error);
  } finally {
    button.disabled = false;
  }
};

button.addEventListener("click", () => void greet());
name.addEventListener("keydown", (event) => {
  if (event.key === "Enter") void greet();
});

try {
  showCount((await command<{ count: number }>("count")).count);
} catch {
  // Il processo sta ancora partendo: il conto arrivera' col primo saluto.
}
