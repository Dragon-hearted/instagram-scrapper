---
system: "instagram-scrapper"
type: domain
version: 2
lastUpdated: "2026-04-10"
lastUpdatedBy: build-mode
---

# Domain Knowledge — Instagram Scrapper

## Core Domain
Instagram content scraping for ad creative research and UGC content collection. The system extracts structured data (posts, reels, profiles) from Instagram using login-based access to Instagram's private API, with Apify as a fallback. Supports media downloading for offline content analysis.

### Key Concepts
- **Shortcode**: Instagram's unique identifier for a post/reel (e.g., `CxYz123AbC`), found in URLs like `instagram.com/p/{shortcode}/`
- **Media Types**: `1` = photo, `2` = video, `8` = album/carousel
- **Product Types**: `feed` (regular posts), `igtv` (long-form video), `clips` (reels)
- **User ID (pk)**: Instagram's internal numeric user identifier, needed for API pagination
- **Session Cookies**: `csrftoken`, `sessionid`, `ds_user_id`, `mid` — required for authenticated API access

## Process Knowledge

### Two Scraping Approaches

**1. Login-Based Scraping (Primary)**
- Uses browser automation (Playwright) to log into Instagram and extract session cookies
- Authenticated requests hit Instagram's private API (`/api/v1/`) for reliable, structured data
- Session cookies are persisted and reused across runs
- Endpoints used:
  - `GET /api/v1/users/web_profile_info/?username={username}` — profile info
  - `GET /api/v1/feed/user/{userId}/?count=33&max_id={maxId}` — paginated user feed
  - `GET /api/v1/media/{mediaId}/info/` — single media details
- Requires valid Instagram account credentials

**2. Apify-Based Scraping (Fallback)**
- Uses Apify's `apify/instagram-post-scraper` actor
- Requires APIFY_API_TOKEN environment variable
- More reliable but costs per API call
- Better for single post/reel scraping when login is unavailable

### Session Management Flow
1. **First login**: Browser automation opens Instagram, fills credentials, handles 2FA/prompts, extracts cookies
2. **Session persistence**: Cookies saved to disk (`~/.instagram-scrapper/session.json`)
3. **Session reuse**: Subsequent runs load saved session, validate via API call
4. **Session refresh**: If expired, re-open browser with existing cookies to refresh
5. **Session validation**: Test request to `/api/v1/users/web_profile_info/` — 200 = valid

### Browser Login Flow
1. Launch Chromium with anti-detection (disable automation flags, realistic viewport)
2. Navigate to instagram.com, fill username/password with keystroke delays
3. Handle 2FA challenge if redirected (wait for user in browser window)
4. Dismiss "Save Login Info" and "Turn on Notifications" prompts
5. Verify login by waiting for Home icon SVG
6. Extract session cookies and persist

### URL Parsing
- Profile: `instagram.com/{username}/` or `instagram.com/{username}`
- Post: `instagram.com/p/{shortcode}/`
- Reel: `instagram.com/reel/{shortcode}/` or `instagram.com/reels/{shortcode}/`
- Must handle with/without `www.`, `http://`/`https://`, trailing slashes

### Pagination Flow (Private API)
1. Fetch profile info via `/users/web_profile_info/` → extract userId
2. Fetch user feed via `/feed/user/{userId}/` → get posts + `next_max_id`
3. Repeat with `max_id` parameter until `more_available` is false or maxPages reached

### Media Download Flow
1. Extract best-quality media URLs from API response (highest resolution video/image)
2. Handle carousel/album posts by iterating `carousel_media`
3. Download via fetch with Instagram Referer header
4. Save as `{shortcode}_{index}.{ext}` with deduplication by base URL

## Quality Signals
- **Completeness**: All available public posts should be scraped (within pagination limits)
- **Accuracy**: Media URLs should be valid and accessible; rich API data includes dimensions and multiple versions
- **Deduplication**: No duplicate posts in results (deduplicate by shortcode)
- **Graceful degradation**: Private accounts return `accountStatus: "private"` with empty posts, missing accounts return `accountStatus: "missing"`

## Edge Cases & Gotchas
- **2FA**: If the account has two-factor authentication, the browser window stays open for manual completion (120s timeout)
- **Session expiry**: Instagram sessions expire after extended inactivity; the system detects 401/403 responses and throws descriptive errors
- **Rate limiting**: Instagram's private API rate-limits aggressive requests — implement retry with progressive backoff (3s × attempt)
- **Authentication errors**: 401/403 responses are thrown as errors (not silently retried) to distinguish from transient failures
- Instagram CDN URLs are temporary and expire — media URLs should be consumed or downloaded promptly
- Some accounts have zero posts but are still public
- Reels and posts use the same shortcode format but different URL patterns
- Username validation: must not contain spaces, must be 1-30 characters, only alphanumeric + underscores + periods
- **Shortcode conversion**: Shortcodes are base64-encoded media IDs; conversion is needed for `/media/{mediaId}/info/` endpoint

## Tacit Expertise
- Instagram's private API returns structured JSON with `video_versions[]` and `image_versions2.candidates[]` — always pick highest resolution by pixel area
- The `X-Ig-App-Id: 936619743392459` header is required for authenticated API requests
- Progressive backoff of `3000ms * retryCount` works well for rate limiting
- Always deduplicate by shortcode before returning results, as pagination can overlap
- Anti-detection basics: `--disable-blink-features=AutomationControlled`, realistic viewport (1920×1080), standard Chrome user agent, keystroke delays during typing
