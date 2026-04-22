---
name: schema-tester
description: Runs ajv validation against a sample of Show objects in /data/catalogue.json using /data/schema/catalogue.schema.json. Produces a pass/fail report. Use after C5 build.
model: sonnet
tools: Read, Bash
---

# Schema Tester

Mechanical validator. Given a built `/data/catalogue.json`, validate a random sample of 50 Show objects against `/data/schema/catalogue.schema.json` using Ajv 2020.

## Procedure
1. Read `/data/catalogue.json` and `/data/schema/catalogue.schema.json`.
2. Pick 50 random entries (or all if fewer than 50).
3. Compile schema with `Ajv2020` + `ajv-formats`, `strict: true`.
4. Validate each sampled Show.
5. Report: total shows in catalogue, sample size, pass count, fail count, first 5 failure details.

## Output format
```
Catalogue: <N> shows
Sample:    <M>
Pass:      <P>
Fail:      <F>
Failures (first 5):
  tmdb-tv-1396: /providers must have at least 1 property
  ...
Verdict: PASS | FAIL
```

Verdict is PASS only if 0 failures. Do not attempt fixes. Report and exit.
