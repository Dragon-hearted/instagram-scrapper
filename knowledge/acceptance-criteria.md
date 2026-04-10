---
system: "instagram-scrapper"
type: acceptance-criteria
version: 2
lastUpdated: "2026-04-10"
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
- [ ] Must support browser-automated login to Instagram via Playwright
- [ ] Must persist and reuse session cookies across runs (`~/.instagram-scrapper/session.json`)
- [ ] Must extract all four required session cookies (csrftoken, sessionid, ds_user_id, mid)
- [ ] Must authenticate API requests using extracted session cookies and CSRF token

## Soft Criteria
_Quality guidance for human judgment at approval gates. Surfaced to the engineer for review._

### Pagination Support
System **should support paginated scraping** of profile posts using Instagram's private API. Pagination uses `max_id` cursor from `/feed/user/{userId}/` responses. The `--max-pages` flag should limit how many pages are fetched.

### Rate Limiting & Retry
System **should implement retry logic with progressive backoff** when Instagram rate-limits or returns server errors. Default MAX_RETRIES=3 with `3s * retryCount` delay. Authentication errors (401/403) should throw immediately rather than retry.

### Deduplication
Results **should be deduplicated by shortcode** before returning, as pagination boundaries can overlap and return duplicate posts.

### Alternative Scraping Method
System **should provide an Apify-based fallback** via the `--method apify` flag for cases where login-based scraping is unavailable.

### Media Downloading
System **should support downloading media files** (images and videos) to a local directory. Downloads should select the highest resolution available, handle carousel/album posts, and deduplicate by base URL. The `--download` flag should enable media downloading with `--output-dir` for the destination.

### Two-Factor Authentication
System **should handle 2FA gracefully** by detecting challenge/two_factor URLs, logging a message to the user, and waiting for manual completion in the browser window (120s timeout).

### Session Lifecycle
System **should validate sessions before use** and provide clear error messages when sessions expire, prompting the user to re-login.
