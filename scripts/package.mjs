// Crea il pacchetto del modulo: dist/<id>-<versione>.cpkg (uno zip con
// manifest, testi, interfaccia e processo, con gli stessi percorsi della
// cartella del modulo) e stampa impronta e dimensione da scrivere nel registry.
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { zipSync } from "fflate";

const root = fileURLToPath(new URL("..", import.meta.url));
const manifest = JSON.parse(readFileSync(join(root, "cuelith-plugin.json"), "utf8"));
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

if (manifest.version !== pkg.version) {
  console.error(`Versioni diverse: manifest ${manifest.version}, package.json ${pkg.version}`);
  process.exit(1);
}
for (const needed of [manifest.ui.entry, manifest.runtime.entry]) {
  if (!existsSync(join(root, needed))) {
    console.error(`Manca ${needed}: esegui prima le build di vite.`);
    process.exit(1);
  }
}

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

/** Percorsi nello zip sempre con "/", relativi alla cartella del modulo. */
const entry = (file) => relative(root, file).split(sep).join("/");

// Data fissa: lo stesso sorgente produce lo stesso pacchetto (e la stessa impronta).
const mtime = new Date("2020-01-01T00:00:00Z");
const add = (files, file) => {
  files[entry(file)] = [readFileSync(file), { mtime }];
};
const files = {};
for (const name of ["cuelith-plugin.json", "LICENSE", "README.md", manifest.icon]) {
  if (typeof name === "string" && existsSync(join(root, name))) add(files, join(root, name));
}
for (const file of walk(join(root, "locales"))) add(files, file);
for (const file of walk(join(root, "dist", "ui"))) add(files, file);
add(files, join(root, manifest.runtime.entry));

const zip = zipSync(files, { level: 9 });
const name = `${manifest.id}-${manifest.version}.cpkg`;
writeFileSync(join(root, "dist", name), zip);
const sha256 = createHash("sha256").update(zip).digest("hex");
console.log(`dist/${name}`);
console.log(`sha256 ${sha256}`);
console.log(`size   ${zip.length}`);
