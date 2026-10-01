# plugin-template

Modello per i moduli di Cuelith e modulo d'esempio **hello-panel** (`cuelith.hello`), richiesto dalla Fase 0 (cap. 28). Fonte di verità: il documento di progetto e le decisioni in `cuelith-docs` (in particolare 0007, processi dei moduli).

- Modulo con codice (`runtime: node`, `dist/main.mjs`): il motore lo avvia in un processo separato col modello dei permessi di Node, gli parla con JSON-RPC su stdio e lo riavvia se cade (3 volte in 60 s). Deve rispondere entro 5 s.
- `src/main.ts` usa `@cuelith/sdk` (`definePlugin`); Vite lo impacchetta in un solo file con l'SDK dentro, perché il processo può leggere solo la cartella del modulo.
- `src/ui/` è il pannello (iframe isolato, `@cuelith/panel`): chiama i comandi del modulo con `plugin.command`. Nessun testo nel codice: chiavi `cuelith.hello.*` in `locales/it.json`; il test fallisce se ne manca una.
- Permessi minimi: qui solo `storage`. Ogni permesso in più va motivato (vedi `PermissionSchema` in `@cuelith/protocol`).
- Durante lo sviluppo l'SDK arriva da `link:../cuelith-sdk/packages/*` (repo affiancati); la CI fa lo stesso. Il nucleo usa questo repo nella prova e2e "le uscite non cadono".
- `pnpm check` prima di ogni commit; `pnpm build` crea `dist/` (installabile come cartella da Moduli → Installa da cartella…) e `dist/cuelith.hello-<versione>.cpkg`.
- Lavoro su `dev`; `main` riceve solo release taggate (SemVer).
- Rispondi al fondatore sempre in italiano.
