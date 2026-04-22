# Shared Blockers

## 2026-04-22

### Missing local `TMDB_API_KEY`

- Status: open
- Impact: live smoke verification against real TMDB responses is blocked in this workspace.
- What is verified instead:
  - `api` unit tests with mocked TMDB payloads
  - `api` TypeScript check
  - `app` unit tests
  - `app` TypeScript check
- What I do not know: whether every live search URL template and every TMDB provider alias behaves correctly against production services today.
