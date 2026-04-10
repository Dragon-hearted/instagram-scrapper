---
system: "instagram-scrapper"
type: index
version: 2
lastUpdated: "2026-04-10"
lastUpdatedBy: build-mode
---

# Instagram Scrapper

## Summary
CLI-based Instagram content scraper that extracts posts, reels, and profile data from Instagram URLs. Uses login-based access to Instagram's private API (primary) with Apify as a fallback. Supports media downloading for offline content analysis. Serves content collection workflows for ad creative research and UGC analysis.

## Entry Points
- **Main**: `src/index.ts`
- **CLI**: `src/cli.ts`

## Stage Definitions
1. **authentication** — Browser-automated login via Playwright, session cookie extraction and persistence
2. **url-parsing** — Parse and validate Instagram URLs, extract type (profile/post/reel) and identifier (username/shortcode)
3. **data-extraction** — Fetch structured data from Instagram's private API (`/api/v1/`) using authenticated session
4. **data-normalization** — Transform raw API responses into structured InstagramPost[] and InstagramProfile objects
5. **media-download** — Download highest-quality media files (images/videos) from Instagram CDN to local storage

## Knowledge Files
- [Domain Knowledge](domain.md) — Domain expertise and tacit knowledge
- [Acceptance Criteria](acceptance-criteria.md) — Hard gates and soft quality criteria
- [Dependencies](dependencies.md) — Runtime, build, and optional dependencies
- [History](history.md) — Build, fix, and diagnosis history

## Cross-References
- **scene-board** — Storyboard system may use scraped content for reference material
- **pinboard** — Reference board can ingest scraped media URLs
