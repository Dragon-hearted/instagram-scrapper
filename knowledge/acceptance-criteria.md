---
system: "instagram-scrapper"
type: acceptance-criteria
version: 1
lastUpdated: "2026-03-30"
lastUpdatedBy: build-mode
---

# Acceptance Criteria — Instagram Scrapper

## Hard Gates
_Binary pass/fail criteria. ALL must pass for output to be considered valid._

- [ ] Must correctly parse Instagram profile URLs and extract username
- [ ] Must correctly parse Instagram post URLs (`/p/{shortcode}/`) and extract shortcode
- [ ] Must correctly parse Instagram reel URLs (`/reel/{shortcode}/` and `/reels/{shortcode}/`) and extract shortcode
- [ ] Must extract media URLs (displayUrl and/or videoUrl) from scraped posts
- [ ] Must return structured data matching the InstagramPost interface
- [ ] Must handle private accounts gracefully (return `accountStatus: "private"` with empty posts)
- [ ] Must handle missing/non-existent accounts gracefully (return `accountStatus: "missing"`)
- [ ] CLI must accept a URL or username argument and output JSON to stdout

## Soft Criteria
_Quality guidance for human judgment at approval gates. Surfaced to the engineer for review._

### Pagination Support
System **should support paginated scraping** of profile posts beyond the initial page load. Pagination uses userid + next/maxid cursor parameters. The `--max-pages` flag should limit how many pages are fetched.

### Rate Limiting & Retry
System **should implement retry logic with progressive backoff** when proxy services rate-limit or fail. Default MAX_RETRIES=3 with `3s * retryCount` delay. Failed requests should not crash the process.

### Deduplication
Results **should be deduplicated by shortcode** before returning, as pagination boundaries can overlap and return duplicate posts.

### Alternative Scraping Method
System **should provide an Apify-based alternative** via the `--method apify` flag for cases where web proxy scraping is unavailable or unreliable.
