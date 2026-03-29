---
system: "instagram-scrapper"
type: dependencies
version: 1
lastUpdated: "2026-03-30"
lastUpdatedBy: build-mode
---

# Dependencies — Instagram Scrapper

## Runtime Dependencies
_Required for the system to execute._

| Dependency | Version | Purpose |
|-----------|---------|---------|
| cheerio | ^1.0.0 | HTML parsing for web proxy scraping (profile pages) |
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
| picnob.com | Web proxy for Instagram profile scraping | Primary scraping method unavailable; fall back to Apify |
| piokok.com | API proxy for Instagram post pagination | Pagination unavailable; only initial page posts returned |
| Apify API | Alternative scraping via instagram-post-scraper actor | Alternative method unavailable; use web proxy method |
