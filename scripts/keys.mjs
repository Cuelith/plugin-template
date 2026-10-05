// Crea la chiave d'autore: una coppia Ed25519 con cui firmi i pacchetti del
// plugin. La chiave privata resta nel file author.key (mai nel repository, mai
// da dare a nessuno); la pubblica, 43 caratteri, va nel modulo di proposta del
// marketplace e nel registry (campo authorKey).
//   pnpm keys
import { generateKeyPairSync } from "node:crypto";
import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
// CUELITH_KEY_FILE serve alle prove; di norma la chiave sta in author.key.
const file = process.env.CUELITH_KEY_FILE ?? join(root, "author.key");

if (existsSync(file)) {
  console.error(
    `${file} esiste gia': non lo sovrascrivo. Se vuoi una chiave nuova, spostalo prima.`,
  );
  process.exit(1);
}

const { publicKey, privateKey } = generateKeyPairSync("ed25519");
writeFileSync(file, privateKey.export({ format: "pem", type: "pkcs8" }), { mode: 0o600 });
// I 32 byte della chiave pubblica sono gli ultimi della sua forma standard (SPKI).
const authorKey = publicKey
  .export({ format: "der", type: "spki" })
  .subarray(-32)
  .toString("base64url");

console.log(`Chiave privata scritta in ${file}: tienila al sicuro e non pubblicarla.`);
console.log(`Chiave pubblica dell'autore (authorKey): ${authorKey}`);
