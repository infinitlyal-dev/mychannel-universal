# Screenshot pass harness (Lane 3)

Scaffolded in Lane 1 (non-blocking prep). Exercised once Lane 2 screens land. Do **not** run this before the app dev server is up and the picker routes render.

## Run it

```powershell
# From repo root. Dev server must already be up on --base URL.
cd app
npm run dev   # starts vite at http://localhost:5173 (separate shell)
cd ..

# First time only — install Playwright's Chromium binary.
npx playwright install chromium

node orchestration/screenshots/run-screenshot-pass.mjs
# → orchestration/screenshots/out/<ISO-date>/{<route>.png, manifest.json}
```

### Flags

| Flag            | Default                                                                                          | Purpose                                           |
| --------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------- |
| `--routes=csv`  | `/`, `/channel`, `/preview`, `/scheduling`, `/shows`, `/slot-edit/test-slot-1`                   | Routes to capture, joined with `--base`.          |
| `--base=url`    | `http://localhost:5173`                                                                          | Origin of the dev server. No trailing slash.      |
| `--out=path`    | `orchestration/screenshots/out/<UTC timestamp>`                                                  | Override the output directory. Relative to repo.  |

Examples:

```powershell
node orchestration/screenshots/run-screenshot-pass.mjs --routes=/,/channel
node orchestration/screenshots/run-screenshot-pass.mjs --base=http://127.0.0.1:4173
node orchestration/screenshots/run-screenshot-pass.mjs --out=orchestration/screenshots/out/smoke
```

## Expected output

```
orchestration/screenshots/out/2026-04-23T1432Z/
├── root.png
├── channel.png
├── preview.png
├── scheduling.png
├── shows.png
├── slot-edit-test-slot-1.png
└── manifest.json
```

### Reading the manifest

`manifest.json` is the single source of truth for a pass. Entries:

```json
{
  "base": "http://localhost:5173",
  "routes": ["/", "/channel", "…"],
  "outDir": "…/out/2026-04-23T1432Z",
  "viewport": { "width": 390, "height": 844 },
  "capturedAt": "2026-04-23T14:32:00.000Z",
  "results": [
    { "route": "/", "url": "…/", "file": "root.png", "bytes": 54321, "tookMs": 812,
      "viewportW": 390, "viewportH": 844, "ok": true }
  ]
}
```

A failed route has `"ok": false` and an `"error"` string; `bytes` is 0. The harness exits `1` if any route failed, `2` if Playwright isn't installed, `0` on all-clear.

## Conventions

- Viewport is 390×844 (iPhone-ish), full-page screenshots. Adjust in the script if you need a desktop viewport.
- Navigation waits for `networkidle` plus a 2 s grace to let lit-html renders settle.
- Route slugs: leading/trailing slashes dropped, remaining non-alphanumerics collapsed to `-`. `/` becomes `root`.
- Output folders are timestamped (UTC) so back-to-back passes don't overwrite.
