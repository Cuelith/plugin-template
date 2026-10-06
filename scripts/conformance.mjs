// Prova il pacchetto con il programma di verifica di Cuelith (lo stesso che gira sul registro).
//   pnpm conformance                 prova dist/<id>-<versione>.cpkg
//   pnpm conformance --static        solo lettura dei file
// Il programma si scarica una volta dall'ultima release di cuelith-core e resta in .cache/.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const manifest = JSON.parse(readFileSync(join(root, "cuelith-plugin.json"), "utf8"));
const target = join(root, "dist", `${manifest.id}-${manifest.version}.cpkg`);
if (!existsSync(target)) {
  console.error(`Manca ${target}: esegui prima "pnpm build".`);
  process.exit(1);
}

const tool = join(root, ".cache", "cuelith-conformance.mjs");
if (!existsSync(tool) || process.argv.includes("--update")) {
  const url =
    "https://github.com/Cuelith/cuelith-core/releases/latest/download/cuelith-conformance.mjs";
  const response = await fetch(url);
  if (!response.ok) {
    console.error(
      `Non riesco a scaricare il programma di verifica (${String(response.status)}) da ${url}`,
    );
    process.exit(1);
  }
  mkdirSync(join(root, ".cache"), { recursive: true });
  writeFileSync(tool, Buffer.from(await response.arrayBuffer()));
}

const args = process.argv.slice(2).filter((arg) => arg !== "--update");
const run = spawnSync(process.execPath, [tool, target, ...args], { stdio: "inherit" });
process.exit(run.status ?? 1);
