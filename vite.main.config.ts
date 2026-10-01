import { defineConfig } from "vite";

// Il processo del modulo: un solo file con dentro l'SDK. Il motore lo avvia
// col modello dei permessi di Node, che lascia leggere solo la cartella del
// modulo: niente node_modules da cercare altrove.
export default defineConfig({
  ssr: { noExternal: true },
  build: {
    ssr: "src/main.ts",
    outDir: "dist",
    emptyOutDir: false,
    target: "node24",
    sourcemap: false,
    rollupOptions: { output: { entryFileNames: "main.mjs", format: "es" } },
  },
});
