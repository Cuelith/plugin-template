# plugin-template

Punto di partenza per scrivere un modulo di [Cuelith](https://github.com/Cuelith/cuelith-core). Contiene il modulo d'esempio **Ciao** (`cuelith.hello`, "hello-panel"): un pannello nella colonna di sinistra e un comando che gira nel processo del modulo.

## Cosa mostra

- **Un processo tutto suo** (`src/main.ts`): il motore lo avvia con i soli permessi del manifest (qui `storage`). Se si blocca o cade, il motore lo riavvia; le uscite continuano a proiettare.
- **Un comando** (`greet`): mette un testo in scaletta, conta i saluti nello spazio dati del modulo ed emette l'evento `cuelith.hello.greeted`, che altri moduli possono ascoltare.
- **Un pannello** (`src/ui/`): gira in un riquadro isolato, senza rete, e chiama il comando attraverso la postazione.

## Come iniziare un modulo nuovo

1. Copia questo repo e cambia `id`, `name`, `repository` in `cuelith-plugin.json` (l'id è un dominio inverso, unico nel registry).
2. Rinomina le chiavi dei testi in `locales/it.json`: devono iniziare con l'id del modulo.
3. Scrivi i comandi in `src/main.ts` e il pannello in `src/ui/`. Un modulo senza codice (solo pannelli o dati) usa `"runtime": { "type": "none" }`.
4. `pnpm install && pnpm build`, poi in Cuelith: **Moduli → Installati → Installa da cartella…** e scegli la cartella del modulo.

I repo `cuelith-sdk` e questo stanno affiancati nella stessa cartella: l'SDK arriva da `link:../cuelith-sdk/packages/*`.

## Permessi

Un modulo dichiara in `permissions` ciò che gli serve; l'utente li vede prima di installare. Il processo non può andare oltre: legge solo la propria cartella, scrive solo nella sua cartella privata, non avvia programmi e non usa la rete se non ha i permessi (`network`, `network:<host>`, `fs:read`, `fs:write`, `process`, `addons`, `storage`, ...). Un modulo nativo (`runtime: native`, es. per protocolli video o audio con SDK in C/C++) dichiara il permesso `native`: ha accesso completo al computer e l'utente lo sa.

Licenza Apache 2.0.
