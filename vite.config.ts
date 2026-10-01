import { defineConfig } from "vite";

// Il pannello e' servito dal motore sotto /plugins/<id>/<versione>/dist/ui/:
// percorsi relativi, niente file incorporati come data: (CSP del motore).
export default defineConfig({
  base: "./",
  root: "src/ui",
  build: {
    outDir: "../../dist/ui",
    emptyOutDir: true,
    assetsInlineLimit: 0,
    sourcemap: false,
    modulePreload: { polyfill: false },
  },
});
