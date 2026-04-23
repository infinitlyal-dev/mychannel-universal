#!/usr/bin/env node
// orchestration/screenshots/run-screenshot-pass.mjs
//
// Lane 3 screenshot harness. Scaffolded in Lane 1; exercised once Lane 2 lands.
// Do NOT run before the app dev server is up and the picker routes exist.
//
// Usage:
//   node orchestration/screenshots/run-screenshot-pass.mjs \
//     [--routes=/,/channel,/preview,/scheduling,/shows,/slot-edit/test-slot-1] \
//     [--base=http://localhost:5173] \
//     [--out=orchestration/screenshots/out/<ISO-date>]
//
// Exit codes:
//   0  — all routes captured, manifest written
//   1  — any route errored (timeout, 4xx/5xx, render failure)
//   2  — harness misconfiguration (bad arg, playwright missing)

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';

const DEFAULT_ROUTES = [
  '/',
  '/channel',
  '/preview',
  '/scheduling',
  '/shows',
  '/slot-edit/test-slot-1',
];
const DEFAULT_BASE = 'http://localhost:5173';
const DEFAULT_VIEWPORT = { width: 390, height: 844 }; // Capacitor/iPhone-ish default
const NAV_TIMEOUT_MS = 15000;
const NETWORKIDLE_GRACE_MS = 2000;

function parseArgs(argv) {
  const out = { routes: null, base: null, outDir: null };
  for (const raw of argv) {
    if (!raw.startsWith('--')) continue;
    const eq = raw.indexOf('=');
    if (eq === -1) continue;
    const key = raw.slice(2, eq);
    const value = raw.slice(eq + 1);
    if (key === 'routes') out.routes = value.split(',').map((r) => r.trim()).filter(Boolean);
    else if (key === 'base') out.base = value.trim();
    else if (key === 'out') out.outDir = value.trim();
  }
  return out;
}

function isoDateFolder(d = new Date()) {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mi = String(d.getUTCMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}${mi}Z`;
}

function slugify(route) {
  const clean = route === '/' ? 'root' : route.replace(/^\/+/, '').replace(/\/+$/, '');
  return clean.replace(/[^a-zA-Z0-9_-]+/g, '-') || 'root';
}

async function loadPlaywright() {
  try {
    const mod = await import('playwright');
    return mod;
  } catch (err) {
    const hint =
      'Playwright is not installed. From repo root: npm install, then ' +
      'npx playwright install chromium';
    const wrapped = new Error(`${err?.message ?? err}\n${hint}`);
    wrapped.code = 'PLAYWRIGHT_MISSING';
    throw wrapped;
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const routes = args.routes ?? DEFAULT_ROUTES;
  const base = args.base ?? DEFAULT_BASE;

  const here = dirname(fileURLToPath(import.meta.url));
  const repoRoot = resolve(here, '..', '..');
  const outDir = args.outDir
    ? resolve(repoRoot, args.outDir)
    : resolve(here, 'out', isoDateFolder());

  await mkdir(outDir, { recursive: true });

  let pw;
  try {
    pw = await loadPlaywright();
  } catch (err) {
    console.error(`[screenshot-pass] ${err.message}`);
    return 2;
  }

  const browser = await pw.chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: DEFAULT_VIEWPORT });
  const manifest = [];
  let hadError = false;

  try {
    for (const route of routes) {
      const page = await context.newPage();
      const url = base.replace(/\/+$/, '') + route;
      const file = `${slugify(route)}.png`;
      const filePath = join(outDir, file);
      const started = performance.now();
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: NAV_TIMEOUT_MS });
        await page.waitForTimeout(NETWORKIDLE_GRACE_MS);
        const buf = await page.screenshot({ fullPage: true, type: 'png' });
        await writeFile(filePath, buf);
        const tookMs = Math.round(performance.now() - started);
        manifest.push({
          route,
          url,
          file,
          bytes: buf.length,
          tookMs,
          viewportW: DEFAULT_VIEWPORT.width,
          viewportH: DEFAULT_VIEWPORT.height,
          ok: true,
        });
        console.log(`[screenshot-pass] ok   ${route} -> ${file} (${buf.length}B, ${tookMs}ms)`);
      } catch (err) {
        const tookMs = Math.round(performance.now() - started);
        hadError = true;
        manifest.push({
          route,
          url,
          file,
          bytes: 0,
          tookMs,
          viewportW: DEFAULT_VIEWPORT.width,
          viewportH: DEFAULT_VIEWPORT.height,
          ok: false,
          error: err?.message ?? String(err),
        });
        console.error(`[screenshot-pass] FAIL ${route}: ${err?.message ?? err}`);
      } finally {
        await page.close().catch(() => undefined);
      }
    }
  } finally {
    await context.close().catch(() => undefined);
    await browser.close().catch(() => undefined);
  }

  const manifestPath = join(outDir, 'manifest.json');
  await writeFile(
    manifestPath,
    JSON.stringify(
      {
        base,
        routes,
        outDir,
        viewport: DEFAULT_VIEWPORT,
        capturedAt: new Date().toISOString(),
        results: manifest,
      },
      null,
      2,
    ),
  );
  console.log(`[screenshot-pass] manifest -> ${manifestPath}`);

  return hadError ? 1 : 0;
}

main().then(
  (code) => process.exit(code ?? 0),
  (err) => {
    console.error('[screenshot-pass] unhandled', err);
    process.exit(1);
  },
);
