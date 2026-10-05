import { createHash, createPublicKey, verify } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { packageSignatureMessage } from "@cuelith/protocol";
import { afterAll, describe, expect, it } from "vitest";

// Chiave d'autore e firma dei pacchetti (decisione 0013): le due procedure
// "pnpm keys" e "pnpm sign" producono una firma che si verifica come fa il
// marketplace.

const scripts = join(import.meta.dirname, "..", "scripts");
const temp = mkdtempSync(join(tmpdir(), "cuelith-sign-"));
afterAll(() => {
  rmSync(temp, { recursive: true, force: true });
});

const manifest = JSON.parse(
  readFileSync(join(import.meta.dirname, "..", "cuelith-plugin.json"), "utf8"),
) as { id: string; version: string };

const run = (script: string, args: string[], keyFile: string) => {
  try {
    return {
      ok: true,
      out: execFileSync(process.execPath, [join(scripts, script), ...args], {
        encoding: "utf8",
        stdio: "pipe",
        env: { ...process.env, CUELITH_KEY_FILE: keyFile },
      }),
    };
  } catch (error) {
    const failed = error as { stdout?: string; stderr?: string };
    return { ok: false, out: `${failed.stdout ?? ""}${failed.stderr ?? ""}` };
  }
};
const field = (out: string, name: string) =>
  new RegExp(`^${name}\\s+(\\S+)$`, "m").exec(out)?.[1] ?? "";

describe("chiave d'autore e firma del pacchetto", () => {
  const keyFile = join(temp, "author.key");
  const pack = join(temp, "prova.cpkg");
  writeFileSync(pack, "contenuto di prova del pacchetto");

  it("keys crea la chiave e non la sovrascrive", () => {
    const first = run("keys.mjs", [], keyFile);
    expect(first.ok).toBe(true);
    expect(existsSync(keyFile)).toBe(true);
    expect(/authorKey\): (\S{43})$/m.exec(first.out)?.[1]).toBeDefined();
    const second = run("keys.mjs", [], keyFile);
    expect(second.ok).toBe(false);
    expect(second.out).toContain("esiste gia'");
  });

  it("sign produce una firma che si verifica con la chiave pubblica, e solo per quel pacchetto", () => {
    const authorKey = /authorKey\): (\S{43})$/m.exec(
      run("keys.mjs", [], join(temp, "k2")).out,
    )?.[1];
    // Le due chiavi sono diverse: si firma con quella di keyFile e si verifica con la sua.
    const publicOf = /authorKey\): (\S{43})$/m.exec(run("keys.mjs", [], join(temp, "k3")).out)?.[1];
    expect(authorKey).not.toBe(publicOf);

    const keyFile3 = join(temp, "k3");
    const signed = run("sign.mjs", [pack], keyFile3);
    expect(signed.ok).toBe(true);
    const sha256 = createHash("sha256").update(readFileSync(pack)).digest("hex");
    expect(field(signed.out, "sha256")).toBe(sha256);
    expect(field(signed.out, "id")).toBe(manifest.id);

    const signature = Buffer.from(field(signed.out, "signature"), "base64url");
    expect(signature.length).toBe(64);
    const spki = Buffer.concat([
      Buffer.from("302a300506032b6570032100", "hex"),
      Buffer.from(publicOf ?? "", "base64url"),
    ]);
    const key = createPublicKey({ key: spki, format: "der", type: "spki" });
    const message = (id: string, version: string, sha: string) =>
      Buffer.from(packageSignatureMessage(id, version, sha));

    expect(verify(null, message(manifest.id, manifest.version, sha256), key, signature)).toBe(true);
    // Non vale per un'altra versione, un altro pacchetto o un altro plugin.
    expect(verify(null, message(manifest.id, "9.9.9", sha256), key, signature)).toBe(false);
    expect(
      verify(null, message(manifest.id, manifest.version, "b".repeat(64)), key, signature),
    ).toBe(false);
    expect(verify(null, message("acme.altro", manifest.version, sha256), key, signature)).toBe(
      false,
    );
    // E non vale con la chiave di qualcun altro.
    const otherKey = createPublicKey({
      key: Buffer.concat([
        Buffer.from("302a300506032b6570032100", "hex"),
        Buffer.from(authorKey ?? "", "base64url"),
      ]),
      format: "der",
      type: "spki",
    });
    expect(verify(null, message(manifest.id, manifest.version, sha256), otherKey, signature)).toBe(
      false,
    );
  });

  it("sign dice cosa manca invece di fallire in silenzio", () => {
    const noKey = run("sign.mjs", [pack], join(temp, "non-esiste"));
    expect(noKey.ok).toBe(false);
    expect(noKey.out).toContain("pnpm keys");
    const noPackage = run("sign.mjs", [join(temp, "non-esiste.cpkg")], join(temp, "k3"));
    expect(noPackage.ok).toBe(false);
    expect(noPackage.out).toContain("pnpm build");
  });
});
