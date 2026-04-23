# DIAGNOSTIC — c4 failure

Date: 2026-04-23
Branch read: `v2-rebuild`
Document purpose: explain why the deployed app Al walked does not work.

This is not a fix plan disguised as optimism. The deployed app is broken for hard technical reasons.

## 1. Why the TMDB key is not reaching the runtime

Short answer: the runtime serving `GET /api/library` does not have `TMDB_API_KEY` available. I cannot read Vercel's env-var dashboard from the tools I have, so I cannot prove what the dashboard says. I can prove what the live runtime says:

- `https://mychannel-universal-b6cs2z0s9-albert-snymans-projects.vercel.app/api/library?region=US&page=1&type=all`
  returns `502` with:
  `{"error":{"code":"tmdb_error","message":"TMDB_API_KEY is not configured"}}`
- `https://mychannel-universal-app.vercel.app/api/library?region=US&page=1&type=all`
  returns the same `502` and the same message.
- `https://mychannel-universal-q8sc3kmce-albert-snymans-projects.vercel.app/api/library?region=US&page=1&type=all`
  also returns the same `502` and the same message.

That means this is not just a preview-scope miss on one URL. The app project's preview and production runtime are both missing the key.

### What API base the app is using

`shared/constants.ts` sets:

```ts
export const API_BASE = '/api';
```

So the deployed app calls same-origin `/api/...`.

### Is `/api` part of this Vercel project or separate?

The repo says one thing and the live runtime says another.

`vercel.json` says:

```json
"rewrites": [
  {
    "source": "/api/:path*",
    "destination": "https://mychannel-api.vercel.app/api/:path*"
  }
]
```

That implies the frontend project should proxy `/api/*` to a separate project: `mychannel-api`.

But the live behavior shows the app project is serving API handlers itself:

- `https://mychannel-universal-app.vercel.app/api/health` returns `200` with the JSON from `api/health.ts`.
- `https://mychannel-universal-app.vercel.app/api/library/providers?region=US` returns `200` with the JSON from `api/library/providers.ts`.
- `https://mychannel-universal-app.vercel.app/api/library?region=US&page=1&type=all` returns `502` with the JSON shape from `api/library.ts`.

Direct requests to the supposed separate backend do not match that path structure:

- `https://mychannel-api.vercel.app/api/library/providers?region=US` returns `404`
- `https://mychannel-api.vercel.app/api/library?region=US&page=1&type=all` returns `404`
- `https://mychannel-api.vercel.app/health` returns `404`

So the rewrite target in `vercel.json` is not the runtime that is actually serving the live `/api/library` response Al saw.

Bluntly: the deployment story is confused. The config says "separate backend." The live app is clearly serving at least some API routes locally. The external backend domain does not answer those same routes.

### Is this a CORS issue?

No.

This is not the browser being blocked by CORS. The browser is getting JSON back.

- `/api/health` works
- `/api/library/providers` works
- `/api/library` returns structured JSON with a `502` body

That is application failure, not CORS failure.

### Is this an env-scope issue?

Possibly, but not a preview-only one.

What I can prove:

- preview app URL broken
- production app URL broken

So if this is a Vercel env-var scope issue, it is affecting both preview and production on the app project. It is not confined to one environment.

### Literal request chain when the deployed picker loads

At `#/wizard/shows`, the current picker code in `app/src/screens/shows.ts` does this on mount:

1. Read filters from `localStorage` key `mc.picker.filters`
2. `fetchProviders(state.region)` → `GET /api/library/providers?region=<US|ZA>`
3. `fetchLibrary({ page: 1, region, providers, type, query, genre })`
   → `GET /api/library?...`

Live results:

1. `GET /api/library/providers?region=US` succeeds
2. `GET /api/library?region=US&page=1&type=all` fails with `502` / `TMDB_API_KEY is not configured`

If the user later taps a title, the picker would also call `fetchTitle(...)` against `/api/title/:tmdbType/:tmdbId`. That is another problem: those dynamic title routes are currently `404` on the deployed app project.

So even after the TMDB key is fixed, pick-time title detail is still broken until those routes are actually live.

## 2. Why the UI rendered empty instead of showing a real error state

The picker did not block on the API failure. It rendered the shell first, then failed inside the data region.

`app/src/screens/shows.ts` always renders:

- top bar
- filter bar
- counter row
- grid container

Then it chooses an empty-state variant below that.

So when `/api/library/providers` succeeds but `/api/library` fails, the user gets:

- search input
- type buttons
- genre dropdown
- counter row
- no posters
- weak error text

That matches what Al saw.

### Where the error handling is

It exists, but it is weak:

- `loadPage()` catches the failure
- sets `screenState.error`
- `emptyVariant()` returns `api-error`
- `renderEmpty()` renders `<mc-empty-state ...>`

The problem is not "there is zero error handling." The problem is:

1. The picker shell still renders as if the screen is usable.
2. The error state is not a full-screen blocking state.
3. `mc-empty-state` does not support the `variant` prop that the c4 brief expected.
4. There are no CSS rules in `app/www/css/components.css` for the c2 primitives that matter here:
   - `mc-empty-state`
   - `mc-filter-bar`
   - `mc-library-card`

So the screen reads like an empty broken picker, not a deliberate failure screen.

### Why the screen was reachable with no wizard prerequisites

Because the app allows it.

In `app/src/main.ts`, when `state.onboarded === false`, the bootstrap only redirects these routes back to splash:

- `now`
- `week`
- `shows-picks`
- `settings`
- `about`

It does **not** block:

- `wizard/streamers`
- `wizard/shows`
- `wizard/times`
- `wizard/preview`

So a direct hash to `#/wizard/shows` is allowed even for a brand-new user with:

- `state.region = 'US'` default
- `state.streamers = []`
- `state.selectedTitles = []`

Then `shows.ts` does not guard `state.streamers.length === 0`. It just loads the picker with an empty provider selection.

So yes: the picker has no route guard and no prerequisite guard. Direct deep-linking to `#/wizard/shows` is allowed when it should not be.

## 3. Why the previous wizard screens were skipped

Because the router and bootstrap do not enforce the wizard sequence.

This is not Safari doing something weird. This is the app accepting the URL.

Facts:

- Router accepts `wizard/shows` directly.
- Bootstrap does not redirect non-onboarded users away from `wizard/shows`.
- Picker screen does not redirect back if region/streamers are missing.

So the earlier wizard screens were skipped because nothing stopped them from being skipped.

## 4. Why the Playwright screenshot harness did not catch this

Because it was scaffolded and then never run as a real gate.

The repo evidence is explicit:

- `orchestration/screenshots/run-screenshot-pass.mjs` exists
- `orchestration/screenshots/README.md` says its default base is `http://localhost:5173`
- `orchestration/evidence-log.md` says:
  - `node --check orchestration/screenshots/run-screenshot-pass.mjs` passed
  - it was **not run against a live server**
  - follow-up was to run it later after Lane 2 landed

There is no `orchestration/screenshots/out/` run in the repo.
There is no committed manifest from an actual pass.
There is no screenshot review record.

So the answer is simple:

- Did it run? No.
- Did it run against the deployed URL? No.
- Did anyone review screenshots? No.

If it had been run against the deployed URL Al used, it would have captured the same empty picker shell.

## 5. What should have happened differently

### When someone should have opened the deployed URL

Before Al touched it.

Specifically:

1. Immediately after commit `a949ac3` when the first Vercel preview URL was logged
2. Again after c4 (`583218c`) because that is the first commit that made the picker live-TMDB dependent
3. Again after c5/c6 before calling the iPhone walk a gate

The first real browser pass should have happened as soon as the preview URL existed and again once c4 landed.

### What gates failed

These gates failed:

1. Deployed-browser verification was not done.
2. The screenshot harness was not run.
3. `/api/health` was treated as proof that the backend wiring was correct. It was not.
4. No one tested `/api/library`, the actual TMDB-dependent route.
5. No one tested the deep-link route `#/wizard/shows` as a fresh user in a real browser before handing it to Al.

### What verification was claimed but not done

Claimed:

- preview URL live
- backend proxy verified
- c4 shipped
- c5 shipped

Actually done:

- local `tsc`
- local `vitest`
- URL existence check
- `/api/health` check

Not done:

- deployed picker load
- deployed TMDB-backed library call
- deployed title-detail call
- deployed end-to-end wizard walk
- screenshot harness run

### Who reported "shipped" when it was broken

The "shipped" language came from us, not from reality.

- I reported c4 shipped locally after `tsc` and `vitest`.
- I reported c5 shipped locally after `tsc` and `vitest`.
- Vos logged the Vercel preview URL as live and said "backend proxy verified."

That slipped because local compile/tests were treated as product verification, and nobody did the obvious next check: open the deployed URL and watch `/api/library` fail.

The "backend proxy verified" line is specifically wrong. `/api/health` working did not prove the TMDB-backed routes were reachable or correctly wired. It proved only that one health route responded.

## 6. Minimum path to a working app

Not a rewrite. These are the minimum fixes, in order.

### 1. Put `TMDB_API_KEY` into the runtime that is actually serving `/api/library`

Priority: P0
Estimate: 0.5 hours
Needs Al: yes, if he controls Vercel envs

What matters is not "some project has the key." What matters is:

- the deployment serving `https://mychannel-universal-app.vercel.app/api/library`
  must have `TMDB_API_KEY` available at runtime

Right now it does not.

### 2. Decide the API topology and make it true

Priority: P0
Estimate: 1 to 2 hours
Needs Al: yes, for Vercel project config if we change routing

Current state is contradictory:

- `vercel.json` says `/api/*` proxies to `mychannel-api`
- live app project serves `/api/health`, `/api/library/providers`, `/api/library`
- direct `mychannel-api` routes do not match that shape

Pick one:

- monolith: frontend project serves its own `/api`
- split: frontend rewrites to a real separate backend with matching routes

Right now the repo says split, runtime behaves mostly monolith, and the separate backend domain is not compatible with the rewrite path.

### 3. Make `/api/title/:tmdbType/:tmdbId` and `/api/title/:tmdbType/:tmdbId/providers` actually exist on the deployed app

Priority: P0
Estimate: 1 to 2 hours
Needs Al: maybe, if this turns into Vercel routing/build config work

These routes are in the repo.
They are `404` on the deployed app.

That means even after the TMDB key is fixed, pick-time title detail is still broken.

I do not know exactly why Vercel is dropping those dynamic routes from this project without the deployment logs. I only know they are missing live.

### 4. Add wizard prerequisite guards

Priority: P1
Estimate: 1 to 2 hours
Needs Al: no

Fix the app so a new user cannot deep-link to `#/wizard/shows` with:

- no region chosen
- no streamers chosen

The app should redirect back to the missing step instead of rendering a broken picker shell.

### 5. Turn API failure into a real blocking error state

Priority: P1
Estimate: 1 to 2 hours
Needs Al: no

When `/api/library` fails, the user should not get a mostly-normal picker shell with no posters.

They should get a strong error state that says:

- library failed
- why
- what to do next

And the c2 primitives need actual styling support for that state, not raw unstyled custom-element output.

### 6. Run real browser verification against the deployed URL before handing it back

Priority: P1
Estimate: 0.5 to 1 hour
Needs Al: no

Minimum:

- iPhone Safari manual walk
- desktop browser manual walk
- Playwright screenshot pass against the deployed URL, not just localhost

This should happen before anyone says "shipped" again.

### 7. Point Al at the current deployment, not the stale preview URL

Priority: P2
Estimate: 0.25 hours
Needs Al: maybe

The URL Al walked, `b6cs2z0s9`, is a stale deployment from commit `a949ac3`.

The latest preview for `v2-rebuild` is:

- `https://mychannel-universal-q8sc3kmce-albert-snymans-projects.vercel.app`

That does **not** solve the TMDB problem. It is still broken for `/api/library`.
But it matters because review should happen against the latest deployment, not a stale one.

## Bottom line

Why the deployed app does not work:

1. The runtime serving `/api/library` does not have `TMDB_API_KEY`.
2. The deployment topology is confused. The config says split backend; the live app mostly serves API locally.
3. The dynamic `/api/title/...` routes c4 relies on are missing live.
4. The wizard does not enforce step order, so `#/wizard/shows` is reachable with zero setup.
5. The picker's API failure state is weak and visually incomplete.
6. The screenshot harness was scaffolded, not run.
7. "Shipped" was called from local `tsc`/`vitest`, not from a real deployed browser walk.

That is why Al got an empty picker shell and a TMDB configuration error instead of a working channel-builder wizard.
