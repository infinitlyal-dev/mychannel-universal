# Deep-Link Resolver Options

Assessed in:
- Repo: `C:\dev\mychannel-universal`
- Branch: `codex-assessment`
- Context: [CODEX-REBUILD-PLAN.md](C:/dev/mychannel-universal/shared/CODEX-REBUILD-PLAN.md)

Problem:
- MyChannel Universal needs to move a user from a title card to the right provider player on iOS, Android, and web.
- The catalogue is not 278 hand-curated titles. It is effectively TMDB-scale browse/search filtered by region + subscriptions.
- Manual per-title mapping is dead on arrival.

Hard truth:
- TMDB watch-provider data is good for availability.
- TMDB is not a reliable exact deep-link map.
- If the product promise is “tap and land on the correct playback page,” then the resolver layer is its own system, not a string-template helper.

## Assumptions used for the cost math

- Full-library planning scale: `100,000 titles x 200 regions x 3 platforms = 60,000,000 resolver combinations`
- Costs are monthly at that scale.
- Storage assumption: 60M resolver records, 300-800 bytes each after indexing and metadata, roughly `20-80 GB` active storage
- CDN cost is negligible relative to resolver cost in every option here
- “Correct” means the title page or playback entry page for that title on that provider, not the provider homepage and not a search results page
- If I do not know public list pricing, I say so

## Option 1 — LLM-resolved with caching

Definition:
- At discovery time or on-demand, send `(title, year, provider, region, platform)` to an LLM.
- The model returns the canonical provider deep link.
- Cache the result.
- Refresh on TTL expiry or failed launch.
- Use heuristic fallback when the model cannot resolve.

My blunt read:
- Clever.
- Expensive.
- Not trustworthy enough.
- The model does not have a ground-truth source for provider content IDs unless you add search or browsing on top, which then makes the cost explode.

### 1. Scaling cost at 100k titles x 200 regions x 3 platforms

Assumption for a realistic implementation:
- 1 LLM call per resolver combination
- 1 web-search call per resolver combination, because without live web retrieval the model is mostly guessing
- Average prompt/output size: `500 input tokens + 150 output tokens`

Example using official OpenAI pricing for `gpt-5.4-mini` standard:
- Input: `$0.75 / 1M tokens`
- Output: `$4.50 / 1M tokens`
- Web search: `$10 / 1k calls`
- Source: [OpenAI API pricing](https://developers.openai.com/api/docs/pricing)

Cost math:
- Tokens: 60M calls x 500 input = 30B input tokens = about `$22,500`
- Tokens: 60M calls x 150 output = 9B output tokens = about `$40,500`
- Web search: 60M calls = 60,000 x `$10 / 1k` = about `$600,000`
- Storage + cache DB + CDN: about `$100-$1,500`

Monthly total:
- **$663,000-$900,000/month** if you do this honestly with live retrieval

If you remove web search and let the model guess:
- **$60,000-$250,000/month**
- Accuracy collapses, so this is a fake saving

### 2. Accuracy floor

- **10%-25%** in the worst realistic case

Why so low:
- The model does not know provider-private or provider-specific canonical IDs at scale
- Provider URLs are not consistently derivable from TMDB IDs
- Region-specific availability changes faster than model memory
- “Looks plausible” URLs will still be wrong URLs

What fails first:
- exact provider content IDs

### 3. Build effort

- **5-8 engineer-weeks**

That includes:
- prompt design
- retrieval setup
- cache model
- retry/fallback logic
- bad-link detection
- launch telemetry
- re-resolution loop

### 4. Maintenance burden per quarter

- **4-6 engineer-weeks/quarter**

What breaks routinely:
- prompt drift
- retrieval quality
- false positives that look valid but land wrong
- bad cached links that keep recirculating until somebody builds a quarantine loop

Who fixes it:
- backend owner plus one person doing resolver QA

Rot after 3 months ignored:
- fast
- cached garbage accumulates
- wrong links stay “fresh” because the system has no deterministic truth source

### 5. Breakdown points

Top 3 catastrophic failures:
- Model hallucination of provider URLs or IDs
- Search cost explosion once you add the retrieval needed to make the model even remotely useful
- Model/provider drift: provider routing changes and the model keeps emitting yesterday’s shape

### 6. Confidence

- **15%**

This does not survive 12 months in production at full scale without a rewrite.

## Option 2 — JustWatch or equivalent licensed mapping feed

Definition:
- Buy a licensed feed that maps titles to provider availability and provider destination URLs across regions/platforms.
- Ingest it into the resolver service.
- Cache and refresh on vendor cadence.

My blunt read:
- This is the only option here that actually matches the “correct playback page at scale” requirement.
- It is the boring answer because it is the real answer.
- If exact title launch is non-negotiable, this is the baseline.

Important:
- I do not have a public JustWatch list price.
- JustWatch’s public business page is contact-sales only, and it states coverage across “hundreds of services” and “over 120 countries.”
- Source: [JustWatch Streaming API](https://www.justwatch.com/us/JustWatch-Streaming-API)

### 1. Scaling cost at 100k titles x 200 regions x 3 platforms

Public list pricing:
- **I do not know**

Working budget range:
- Earlier research range from the prompt: `$500-$2,000/month`
- At true full-library, multi-region, multi-platform production scale with SLA and ingestion rights, I would budget:
- **$6,000-$25,000/month total**

Breakdown:
- License/feed: **$5,000-$20,000/month**
- Ingestion/storage/search/cache infra: **$500-$3,000/month**
- CDN: **$50-$500/month**

Why I am not using the `$500-$2,000` figure as the main answer:
- That range may be real for a smaller footprint, lighter contract, or earlier conversation state
- It is not what I would put in a production budget for 100k x 200 x 3 planning scale

### 2. Accuracy floor

- **90%-97%** in the worst realistic case

What fails first:
- feed lag on rights changes

Why not 99.9%:
- provider catalog rights move fast
- some app-level launch behaviors still differ by platform version
- vendor feeds are good, not magical

### 3. Build effort

- **2-4 engineer-weeks** after contract signature and feed access

That includes:
- ingest pipeline
- resolver API
- cache model
- launch telemetry
- failure fallback

### 4. Maintenance burden per quarter

- **1-2 engineer-weeks/quarter**

What breaks routinely:
- vendor schema changes
- periodic mismatches between feed freshness and provider reality
- contract and access management

Who fixes it:
- one backend/data engineer

Rot after 3 months ignored:
- moderate
- the system keeps working, but stale mappings and unnoticed vendor regressions build up

### 5. Breakdown points

Top 3 catastrophic failures:
- Licensing dispute or commercial terms change
- Vendor coverage gap for a provider, region, or platform you care about
- Feed freshness misses a rights-change window and your notifications launch dead links

### 6. Confidence

- **82%**

This is the only option here I would expect to survive 12 months at scale without needing a new resolver architecture.

## Option 3 — Provider-specific search-and-verify resolver

Definition:
- Build a resolver service with one adapter per provider.
- For each `(title, year, provider, region)`:
- query the provider’s public web search, sitemap, or catalog page
- extract candidate title URLs
- validate by title/year/media-type match using page metadata or structured data
- store the canonical web URL
- for iOS and Android, prefer universal links instead of custom schemes unless the scheme is explicitly documented and tested
- re-verify on a TTL or on launch failure

This is not an LLM system.
This is not a hand-authored template system.
This is a deterministic crawler/resolver layer.

Concrete spec:
- `resolver-adapters/netflix.ts`
- `resolver-adapters/disney.ts`
- `resolver-adapters/prime.ts`
- `resolver-adapters/max.ts`
- `resolver-adapters/hulu.ts`
- `resolver-adapters/paramount.ts`
- `resolver-adapters/peacock.ts`
- `resolver-adapters/appletv.ts`
- `resolver-adapters/youtube.ts`

For each adapter:
- define search endpoint or crawl path
- define parser for candidate URLs
- define title/year matcher
- define universal-link launch URL
- define retry, TTL, and ban-detection logic

My blunt read:
- If Options 1 and 2 are both disqualified, this is the only alternative I would actually build.
- It is real engineering.
- It is also a maintenance tax factory.

### 1. Scaling cost at 100k titles x 200 regions x 3 platforms

At true monthly full-refresh scale, this is ugly.

Budget range:
- **$20,000-$150,000/month**

Breakdown:
- Proxy network / anti-bot / residential or rotating egress: **$10,000-$100,000/month**
- Compute for crawling, parsing, validation, retry, screenshots, and queueing: **$5,000-$30,000/month**
- Storage, indexes, object evidence, and CDN: **$500-$5,000/month**

Why this is so wide:
- If providers barely resist scraping, you land near the bottom
- If they rate-limit, challenge, geo-fence, and rotate markup aggressively, you get wrecked

### 2. Accuracy floor

- **55%-75%** in the worst realistic case

What fails first:
- provider search surfaces and anti-bot defenses

Why it is still higher than LLM:
- deterministic parsing beats guessing
- provider page metadata is better evidence than model recall

Why it is still far below licensed mapping:
- no guarantee of stable search endpoints
- no guarantee that public title pages map cleanly to app launch targets

### 3. Build effort

- **12-18 engineer-weeks**

That includes:
- 9 provider adapters
- proxy layer
- queueing
- verification harness
- retry/failure telemetry
- launch QA on iOS/Android/web

### 4. Maintenance burden per quarter

- **6-10 engineer-weeks/quarter**

What breaks routinely:
- provider HTML changes
- anti-bot changes
- geo-behavior differences
- title search ranking changes
- app launch behavior changes off the same web URL

Who fixes it:
- backend engineer plus someone doing resolver QA
- this is not part-time janitorial work; it is a product subsystem

Rot after 3 months ignored:
- severe
- you do not just get a little worse
- multiple provider adapters quietly die

### 5. Breakdown points

Top 3 catastrophic failures:
- Provider blocking or legal pressure against scraping/crawling
- Provider URL/search UX changes across multiple major services at once
- Region expansion multiplying adapter complexity faster than the team can keep up

### 6. Confidence

- **38%**

This can survive 12 months only if you accept that a chunk of engineering time becomes resolver maintenance forever.

## Recommendation

Recommendation:
- **Option 2 as the primary resolver**
- **Option 3-style deterministic fallback only for uncovered cases**
- **Do not use Option 1 as a primary resolver**

Spec the hybrid clearly:
- Primary path:
  - licensed mapping feed supplies canonical provider URLs / IDs
  - backend caches and serves them
- Fallback path:
  - deterministic provider search-and-verify resolver runs only when the licensed feed has no usable mapping
  - fallback can populate cache and create review queues
- Explicitly banned:
  - LLM-generated “exact” deep links as a core product path

Why:
- Option 2 is the only one that has a believable 12-month future if exact-launch is a real requirement
- Option 3 is the only fallback worth having because it is at least evidence-based
- Option 1 burns money to manufacture false confidence

When the recommendation flips:
- If exact-title playback is no longer required and “open provider search for this title” is acceptable, then skip Option 2 and build a much cheaper degraded resolver around provider search URLs and universal links
- If the licensed feed cost comes back absurdly high, like true enterprise pricing well north of **$25k-$40k/month**, then the decision becomes commercial rather than technical
- If you only support a tiny provider set and a tiny region set, Option 3 becomes more defensible

If Al insists on:
- exact title landing
- multi-region scale
- low maintenance

Then the honest answer is:
- pay for the feed

## Open Questions

- Is “correct playback page” a hard product requirement, or is “provider search opened with the right title” acceptable for v1?
- What provider/region footprint is actually required in the first 12 months? Real launch footprint, not ambition footprint.
- Is there budget approval for a recurring licensed data cost in the low five figures if needed?
- Which providers matter enough to deserve exact-launch guarantees first?
- Are universal web links acceptable on mobile if they open the native app when installed, even if a custom scheme exists?
- Do we want the resolver to store one canonical web URL and let iOS/Android rely on universal link handoff, or do we truly need per-platform resolved URLs?
- How much launch telemetry can we collect without crossing privacy or platform-policy lines?
- Who owns resolver QA long-term if we choose the non-licensed path?
