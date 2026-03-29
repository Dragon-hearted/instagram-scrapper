---
system: "instagram-scrapper"
type: index
version: 1
lastUpdated: "2026-03-30"
lastUpdatedBy: build-mode
---

# Instagram Scrapper

## Summary
CLI-based Instagram content scraper that extracts posts, reels, and profile data from Instagram URLs. Supports two scraping approaches: web proxy scraping (picnob.com/piokok.com) and Apify-based scraping. Serves content collection workflows for ad creative research and UGC analysis.

## Entry Points
- **Main**: `src/index.ts`
- **CLI**: `src/cli.ts`

## Stage Definitions
1. **url-parsing** — Parse and validate Instagram URLs, extract type (profile/post/reel) and identifier (username/shortcode)
2. **data-extraction** — Fetch raw data from Instagram via web proxy endpoints or Apify API
3. **data-normalization** — Transform raw scraped data into structured InstagramPost[] and InstagramProfile objects

## Knowledge Files
- [Domain Knowledge](domain.md) — Domain expertise and tacit knowledge
- [Acceptance Criteria](acceptance-criteria.md) — Hard gates and soft quality criteria
- [Dependencies](dependencies.md) — Runtime, build, and optional dependencies
- [History](history.md) — Build, fix, and diagnosis history

## Cross-References
- **scene-board** — Storyboard system may use scraped content for reference material
- **pinboard** — Reference board can ingest scraped media URLs
