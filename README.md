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

L'SDK arriva da npm (`@cuelith/sdk`, `@cuelith/panel`, `@cuelith/ui`, `@cuelith/protocol`): `pnpm install` basta. Per provare il pacchetto: `pnpm build I repo `cuelith-sdk`e questo stanno affiancati nella stessa cartella: l'SDK arriva da`link:../cuelith-sdk/packages/_`.I repo `cuelith-sdk`e questo stanno affiancati nella stessa cartella: l'SDK arriva da`link:../cuelith-sdk/packages/_`. pnpm conformance`.

## Permessi

Un modulo dichiara in `permissions` ciò che gli serve; l'utente li vede prima di installare. Il processo non può andare oltre: legge solo la propria cartella, scrive solo nella sua cartella privata, non avvia programmi e non usa la rete se non ha i permessi (`network`, `network:<host>`, `fs:read`, `fs:write`, `process`, `addons`, `storage`, ...). Un modulo nativo (`runtime: native`, es. per protocolli video o audio con SDK in C/C++) dichiara il permesso `native`: ha accesso completo al computer e l'utente lo sa.

## Chiave d'autore e firma dei pacchetti

Per pubblicare nel marketplace (obbligatoria per un plugin a pagamento) firmi i pacchetti con una chiave tua:

```bash
pnpm keys   # crea author.key (privata, non va nel repo) e stampa la chiave pubblica da dare al marketplace
pnpm build  # crea dist/<id>-<versione>.cpkg
pnpm sign   # stampa impronta, dimensione e firma Ed25519 del pacchetto
```

La firma lega il pacchetto all'id, alla versione e all'impronta: non vale per altro. Perdere `author.key` significa non poter più firmare aggiornamenti; non darla a nessuno.

Licenza Apache 2.0: parti da questo modello e dai al tuo plugin la licenza che vuoi, anche chiusa e a pagamento, mantenendo gli avvisi Apache di ciò che copi. Il nucleo di Cuelith è GPL, ma l'[eccezione per i plugin](https://github.com/Cuelith/cuelith-core/blob/main/PLUGIN-EXCEPTION.md) ti lascia libero finché usi solo protocollo e SDK. Non copiare codice di `cuelith-core`.
