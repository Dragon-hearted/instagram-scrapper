---
system: "instagram-scrapper"
type: dependencies
version: 2
lastUpdated: "2026-04-10"
lastUpdatedBy: build-mode
---

# Dependencies — Instagram Scrapper

## Runtime Dependencies
_Required for the system to execute._

| Dependency | Version | Purpose |
|-----------|---------|---------|
| playwright | ^1.52.0 | Browser automation for Instagram login and session cookie extraction |
| zod | ^3.23.0 | Runtime validation of scraped data structures |

## Build Dependencies
_Required for development and building._

| Dependency | Version | Purpose |
|-----------|---------|---------|
| @biomejs/biome | ^1.9.0 | Linting and formatting |
| @types/bun | latest | Bun runtime type definitions |
| typescript | ^5.7.0 | TypeScript compiler |

## Optional Dependencies
_Enhance functionality but not required._

None. Apify integration uses fetch (built into Bun) with an API token.

## External Services
_APIs, models, or services the system depends on._

| Service | Purpose | Failure Impact |
|---------|---------|---------------|
| Instagram Private API (`/api/v1/`) | Primary data source for profiles, feeds, and media info | System cannot scrape; fall back to Apify |
| Instagram CDN (`scontent-*.cdninstagram.com`) | Media file hosting for image/video downloads | Media downloads fail; metadata still available |
| Apify API | Fallback scraping via instagram-post-scraper actor | Fallback method unavailable; login-based method required |
