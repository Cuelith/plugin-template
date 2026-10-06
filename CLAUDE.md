# Instructions for the AI assistant (and for you)

This folder is a **plugin for Cuelith** (live projection software), started from the official template. If you are an AI assistant working here, follow these rules. If you are a person, they are a good checklist too. The full guide, with every known way to break a plugin, is the [Author guide](https://github.com/Cuelith/.github/blob/main/AUTHOR-GUIDE.md).

Talk to the user in the language they use. If a rule conflicts with what the user asks, tell them instead of breaking the rule.

## Structure

- `cuelith-plugin.json` is the manifest. `id` is a reverse-domain name in lowercase letters and digits (`yourname.something`); never use ids starting with `cuelith.`. Change `id`, `name`, `publisher`, `license`, `repository` first.
- `version` is SemVer and must be the same in `cuelith-plugin.json`, `package.json` and the git tag. Raise it on every release.
- `engines`: `{"cuelith": ">=0.3.0 <1.0.0", "protocol": "^1.9.0"}`. Never `^0.x` for `cuelith`, never `*`.
- `src/main.ts` is the plugin's process (`@cuelith/sdk`, `definePlugin`). `src/ui/` is the panel. `locales/` has the texts.
- `pnpm build` produces `dist/<id>-<version>.cpkg`. Never zip by hand.

## Rules that keep it working

- **Process**: bundled into one file (`dist/main.mjs`); it can read only its own folder, so no `node_modules` at run time. Answer every command in under 5 seconds; do slow work in the background. Never call `process.exit()`, never leave a server or timer running after deactivate, never throw an uncaught error. Data goes in `ctx.storage` (max 10 MB) or `ctx.dataDir`, nowhere else.
- **Permissions**: declare only what the code uses (`storage`, `network`, `network:<host>`, `fs:read`, `fs:write`, `devices:*`, `serial`, `process`, `addons`, `native`). Prefer `network:<host>` over `network`. Without a permission the engine blocks the action.
- **Panels** run isolated with a strict policy: everything must come from files inside the package. No CDN, no web fonts, no external images, no inline `<script>`, no `onclick=`, no `<form>` submission.
- **Texts**: no visible text in code. Keys start with the plugin id, no hyphens, defined in `locales/<lang>.json`; every key used in the manifest must exist.
- **Data from the engine**: never validate it with a strict schema. Read what you need, ignore the rest, treat unknown option values as "other".
- **Do not** copy code from `cuelith-core`, import anything but `@cuelith/sdk`, `@cuelith/panel`, `@cuelith/ui`, `@cuelith/protocol`, put secrets in the package (`author.key`, tokens, `.env`), invent protocol methods or manifest fields (the types in `node_modules/@cuelith/protocol` are the truth), or name other products in descriptions. Name the plugin "Something for Cuelith", never "Cuelith Something".

## Workflow

After every change: `pnpm check && pnpm build && pnpm conformance`. The work is finished only when it prints `PASSED`. Never say a plugin is "safe" or "certified": passing is a technical test, not a guarantee.

Work on `dev`; `main` receives only tagged releases.

## Licence

This template is Apache 2.0 on purpose: give your plugin any licence you like, keeping the Apache notices of what you copy. Do not copy code from `cuelith-core` (GPL).
