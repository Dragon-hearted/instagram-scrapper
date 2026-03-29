---
system: "instagram-scrapper"
type: domain
version: 1
lastUpdated: "2026-03-30"
lastUpdatedBy: build-mode
---

# Domain Knowledge — Instagram Scrapper

## Core Domain
Instagram content scraping for ad creative research and UGC content collection. The system extracts structured data (posts, reels, profiles) from Instagram without requiring authentication by using web proxy services.

### Key Concepts
- **Shortcode**: Instagram's unique identifier for a post/reel (e.g., `CxYz123AbC`), found in URLs like `instagram.com/p/{shortcode}/`
- **Media Types**: `1` = photo, `2` = video, `8` = album/carousel
- **Product Types**: `feed` (regular posts), `igtv` (long-form video), `clips` (reels)
- **User ID (pk)**: Instagram's internal numeric user identifier, needed for API pagination

## Process Knowledge

### Two Scraping Approaches

**1. Web Proxy Scraping (Primary)**
- Uses picnob.com (profile pages) and piokok.com (posts API) as proxy services
- Profile endpoint: `https://www.picnob.com/zh-hant/profile/{username}` — returns HTML with profile info and initial posts
- Posts API: `https://www.piokok.com/api/posts?userid={userid}&username={username}&next={next}&maxid={maxid}` — returns JSON for pagination
- No authentication required; relies on proxy service availability

**2. Apify-Based Scraping (Alternative)**
- Uses Apify's `apify/instagram-post-scraper` actor
- Requires APIFY_API_TOKEN environment variable
- More reliable but costs per API call
- Better for single post/reel scraping

### URL Parsing
- Profile: `instagram.com/{username}/` or `instagram.com/{username}`
- Post: `instagram.com/p/{shortcode}/`
- Reel: `instagram.com/reel/{shortcode}/` or `instagram.com/reels/{shortcode}/`
- Must handle with/without `www.`, `http://`/`https://`, trailing slashes

### Pagination Flow (Web Proxy)
1. Fetch profile HTML page → extract userid, profile info, and first batch of posts
2. Extract `next` and `maxid` cursors from the page
3. Call posts API with cursors to get next page
4. Repeat until no more `next` cursor or maxPages reached

## Quality Signals
- **Completeness**: All available public posts should be scraped (within pagination limits)
- **Accuracy**: Media URLs should be valid and accessible
- **Deduplication**: No duplicate posts in results (deduplicate by shortcode)
- **Graceful degradation**: Private accounts return `accountStatus: "private"` with empty posts, missing accounts return `accountStatus: "missing"`

## Edge Cases & Gotchas
- Proxy services may rate-limit or block requests — implement retry with backoff
- picnob.com HTML structure may change without notice — cheerio selectors need maintenance
- Instagram CDN URLs are temporary and expire — media URLs should be consumed promptly
- Some accounts have zero posts but are still public
- Reels and posts use the same shortcode format but different URL patterns
- Username validation: must not contain spaces, must be 1-30 characters, only alphanumeric + underscores + periods

## Tacit Expertise
- The picnob.com profile page loads via SSR, so cheerio can parse it without a headless browser
- The piokok.com API returns a JSON object with a `posts` array and pagination cursors
- Progressive backoff of `3000ms * retryCount` works well for rate limiting
- Always deduplicate by shortcode before returning results, as pagination can overlap
