// Prepara la voce da proporre al registro (cuelith-registry): il file plugins/<id>.json e
// l'icona plugins/<id>.svg, con impronta e dimensione del pacchetto gia' calcolate.
//   pnpm registry                        crea dist/registry/<id>.json e <id>.svg (plugin nuovo)
//   pnpm registry --add-to voce.json     aggiunge questa versione in cima a una voce esistente
// Va eseguito dopo "pnpm build" e DOPO aver pubblicato la release su GitHub con lo stesso
// pacchetto: l'indirizzo punta a quel file e non si deve piu' cambiare.
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { RegistryPluginSchema } from "@cuelith/protocol";

const root = fileURLToPath(new URL("..", import.meta.url));
const manifest = JSON.parse(readFileSync(join(root, "cuelith-plugin.json"), "utf8"));
const fail = (message) => {
  console.error(message);
  process.exit(1);
};

const file = `${manifest.id}-${manifest.version}.cpkg`;
const pack = join(root, "dist", file);
if (!existsSync(pack)) fail(`Manca ${pack}: esegui prima "pnpm build".`);
if (manifest.description === undefined)
  fail('Nel manifest manca "description": il catalogo la mostra.');
if (!/^https:\/\/github\.com\/[^/]+\/[^/]+$/.test(manifest.repository)) {
  fail(
    `"repository" deve essere un indirizzo GitHub tipo https://github.com/nome/repo (ora: ${manifest.repository}).`,
  );
}

const data = readFileSync(pack);
const version = {
  version: manifest.version,
  engines: manifest.engines,
  url: `${manifest.repository}/releases/download/v${manifest.version}/${file}`,
  sha256: createHash("sha256").update(data).digest("hex"),
  size: data.length,
  permissions: manifest.permissions,
  published: new Date().toISOString(),
};

const addTo = process.argv.indexOf("--add-to");
let entry;
if (addTo === -1) {
  entry = {
    id: manifest.id,
    name: manifest.name,
    description: manifest.description,
    publisher: manifest.publisher,
    license: manifest.license,
    repository: manifest.repository,
    family: manifest.family,
    verified: false,
    versions: [version],
  };
} else {
  entry = JSON.parse(readFileSync(resolve(process.argv[addTo + 1]), "utf8"));
  if (entry.id !== manifest.id) fail(`La voce indicata e' di ${entry.id}, non di ${manifest.id}.`);
  if (entry.versions.some((v) => v.version === manifest.version)) {
    fail(`La versione ${manifest.version} e' gia' nella voce: alza la versione per ogni release.`);
  }
  entry.versions = [version, ...entry.versions];
}

const checked = RegistryPluginSchema.safeParse(entry);
if (!checked.success) {
  fail(
    `La voce non e' valida:\n${checked.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`).join("\n")}`,
  );
}

const out = join(root, "dist", "registry");
mkdirSync(out, { recursive: true });
writeFileSync(join(out, `${manifest.id}.json`), `${JSON.stringify(entry, null, 2)}\n`);
if (manifest.icon !== undefined)
  copyFileSync(join(root, manifest.icon), join(out, `${manifest.id}.svg`));
console.log(`dist/registry/${manifest.id}.json`);
console.log(
  `Copia ${manifest.id}.json${manifest.icon ? ` e ${manifest.id}.svg` : ""} nella cartella plugins/ di cuelith-registry e apri la pull request.`,
);
console.log(`Prima verifica che questo indirizzo scarichi il pacchetto: ${version.url}`);
