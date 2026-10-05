// Firma un pacchetto con la chiave d'autore (vedi keys.mjs) e stampa i dati da
// dare al marketplace: impronta, dimensione e firma Ed25519.
//   pnpm sign                      firma dist/<id>-<versione>.cpkg
//   pnpm sign percorso/del.cpkg    firma un altro pacchetto
// La firma e' sul testo di packageSignatureMessage (id, versione e impronta del
// pacchetto): non vale per un altro plugin, un'altra versione o un altro file.
import { createHash, createPrivateKey, sign } from "node:crypto";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { packageSignatureMessage } from "@cuelith/protocol";

const root = fileURLToPath(new URL("..", import.meta.url));
const manifest = JSON.parse(readFileSync(join(root, "cuelith-plugin.json"), "utf8"));
const keyFile = process.env.CUELITH_KEY_FILE ?? join(root, "author.key");
const target = process.argv[2]
  ? resolve(process.argv[2])
  : join(root, "dist", `${manifest.id}-${manifest.version}.cpkg`);

let key;
try {
  key = createPrivateKey(readFileSync(keyFile));
} catch {
  console.error(`Non trovo la chiave in ${keyFile}: crea prima la chiave con "pnpm keys".`);
  process.exit(1);
}
let data;
try {
  data = readFileSync(target);
} catch {
  console.error(`Non trovo il pacchetto ${target}: crealo prima con "pnpm build".`);
  process.exit(1);
}

const sha256 = createHash("sha256").update(data).digest("hex");
const message = packageSignatureMessage(manifest.id, manifest.version, sha256);
const signature = sign(null, Buffer.from(message), key).toString("base64url");

console.log(`pacchetto  ${target}`);
console.log(`id         ${manifest.id}`);
console.log(`versione   ${manifest.version}`);
console.log(`sha256     ${sha256}`);
console.log(`size       ${data.length}`);
console.log(`signature  ${signature}`);
