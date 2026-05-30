<div align="center">

![Instagram Scrapper](images/hero.svg)

### Instagram post, reel, and profile extractor

![Status](https://img.shields.io/badge/Status-active-brightgreen)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
![Playwright](https://img.shields.io/badge/Playwright-1-2EAD33?logo=playwright&logoColor=white)
[![Bun](https://img.shields.io/badge/Bun-Runtime-f9f1e1?logo=bun&logoColor=000)](https://bun.sh/)

</div>

---

## 📑 Table of Contents

- [✨ Features](#-features)
- [🏗 Architecture](#-architecture)
- [🛠 Tech Stack](#-tech-stack)
- [🚀 Getting Started](#-getting-started)
- [🚀 Usage](#-usage)
- [⚙️ Configuration](#️-configuration)
- [💻 Development](#-development)
- [📂 Project Structure](#-project-structure)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Profile scraping** | Paginate a public account's feed via Instagram's private API (/api/v1/feed/user/{id}/), returning a normalized profile (followers, following, posts count, bio) plus a deduplicated InstagramPost[]. |
| **Single post extraction** | Resolve a /p/{shortcode}/ URL by converting the base64 shortcode to a numeric media ID and fetching /api/v1/media/{id}/info/ for full metadata. |
| **Reel extraction** | Handle /reel/ and /reels/ URLs with the same shortcode→media-info path as posts, surfacing video versions and clips product type. |
| **Browser-driven login** | Playwright (Chromium) automates Instagram login: fills credentials with keystroke delays, dismisses cookie-consent and 'Save Login Info'/'Notifications' prompts, waits for 2FA completion (120s), and extracts session cookies. |
| **Session persistence & reuse** | Saves session cookies (csrftoken, sessionid, ds_user_id, mid) to ~/.instagram-scrapper/session.json and cookies.json; validates a saved session via an API probe and re-authenticates only when expired. |
| **Apify fallback method** | --method apify runs the apify~instagram-post-scraper actor (polls run to completion, then pulls dataset items) as a credential-light alternative when login is unavailable. |
| **Media download to disk** | --download fetches the highest-resolution video/image for each post (picked by pixel area), is carousel/album aware (downloads every child), dedupes by base URL, and writes {shortcode}_{index}.{mp4\|jpg} to the output dir. |
| **Flexible URL & username parsing** | Accepts bare usernames or full profile/post/reel URLs with or without scheme, www, and trailing slash; rejects reserved paths (explore, accounts, stories, direct). |
| **Output formats** | --format json (default, full structured dump) or summary (human-readable profile header + first 10 posts with type, likes, comments). |
| **Pagination control** | --max-pages caps feed pages (33 items/page); stops early when the API reports no more_available. |
| **Account status detection** | Distinguishes public, private (no granted feed access), and missing accounts in the scrape result instead of silently returning empty. |
| **Rate-limit & auth resilience** | Retries 429/5xx with progressive backoff (3s × attempt, 3 tries); raises descriptive errors on 401/403 (expired session) rather than retrying. |

---

## 🏗 Architecture

![Pipeline](images/pipeline.svg)

Instagram Scrapper processes data through a multi-stage pipeline.

---

## 🛠 Tech Stack

### Backend

| Technology | Purpose |
|------------|---------|
| **TypeScript 5.7** | Type safety |
| **Bun** | JavaScript runtime & package manager |
| **Playwright 1** | Browser automation & scraping |
| **Zod 3** | Schema validation |

---

## 🚀 Getting Started

### Prerequisites

- Bun v1.0+ — curl -fsSL https://bun.sh/install | bash
- Playwright Chromium (login method only) — bunx playwright install chromium
- An Instagram account (login method) or an Apify account + token (apify method)

### Install

```bash
cd systems/instagram-scrapper
bun install
bunx playwright install chromium   # only needed for the login method
```

---

## 🚀 Usage

### 1. Show all commands and flags

```bash
bun run src/cli.ts --help
```

> **Expected:** Prints usage, options (--format/--method/--max-pages/--download/--output-dir/--headless/--login), env vars, and examples. (verified)

### 2. Scrape a public profile (login method)

```bash
INSTAGRAM_USERNAME=you INSTAGRAM_PASSWORD=pass bun run src/cli.ts nasa --max-pages 3
```

> **Expected:** On first run opens Chromium to log in, persists the session, then prints JSON with profile + paginated posts. requires INSTAGRAM_USERNAME/INSTAGRAM_PASSWORD — not executed.

### 3. Scrape a single post

```bash
bun run src/cli.ts https://www.instagram.com/p/Cabc123XYZ/
```

> **Expected:** Prints a single InstagramPost JSON (caption, media URLs, likes, comments). requires Instagram credentials/session — not executed.

### 4. Scrape a reel

```bash
bun run src/cli.ts https://www.instagram.com/reel/Cxyz789ABC/ --format summary
```

> **Expected:** Prints a summary line (type VIDEO, owner, likes, comments) for the reel. requires Instagram credentials/session — not executed.

### 5. Download media for a profile to disk

```bash
bun run src/cli.ts nasa --download --output-dir ./media --max-pages 2
```

> **Expected:** Writes best-quality media as ./media/{shortcode}_{index}.{mp4|jpg} (carousel-aware, deduped). requires Instagram credentials/session — not executed.

### 6. Use the Apify fallback method

```bash
APIFY_API_TOKEN=apify_xxx bun run src/cli.ts nasa --method apify
```

> **Expected:** Runs the apify~instagram-post-scraper actor and prints scraped posts JSON. requires APIFY_API_TOKEN — not executed.

### 7. Force a fresh browser login (clear saved session)

```bash
INSTAGRAM_USERNAME=you INSTAGRAM_PASSWORD=pass bun run src/cli.ts nasa --login --headless
```

> **Expected:** Clears the saved session, re-logs in via headless Chromium, prints 'Session refreshed.' then the scrape. requires Instagram credentials — not executed.

### Command Reference

| Command | Description |
|---------|-------------|
| `bun run src/cli.ts <url-or-username> [options]` | Scrape a profile, post, or reel. Accepts a bare username or a full Instagram URL. |
| `bun run src/cli.ts --help` | List all commands, flags, environment variables, and examples. |
| `--format <json\|summary>` | Output format. json (default) is the full structured dump; summary is human-readable. |
| `--method <login\|apify>` | Scraper backend. login (default) uses an authenticated browser session; apify uses the Apify actor. |
| `--max-pages <n>` | Maximum feed pages to paginate for a profile (default 5, 33 posts/page). |
| `--download` | Download each post's best-quality media to disk. |
| `--output-dir <dir>` | Destination directory for downloaded media (default ./downloads). |
| `--headless` | Run the Playwright browser login without a visible window (no 2FA UI). |
| `--login` | Clear the saved session and force a fresh browser login before scraping. |
| `just scrape <target> [args...]` | justfile shortcut for the CLI; also: just login, just install-browser, just build, just lint, just check, just test. |

---

## ⚙️ Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `INSTAGRAM_USERNAME` | No | Instagram account username. Required for the default --method login. |
| `INSTAGRAM_PASSWORD` | No | Instagram account password. Required for the default --method login. |
| `APIFY_API_TOKEN` | No | Apify API token. Required only when using --method apify. |

---

## 💻 Development

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development mode |
| `bun run build` | Build for production |
| `bun test` | Run tests |
| `bun run lint` | Check code quality |

---

## 📂 Project Structure

```
instagram-scrapper/
├── README.md
├── biome.json
├── images
│   ├── hero.svg
│   └── pipeline.svg
├── justfile
├── knowledge
│   ├── acceptance-criteria.md
│   ├── dependencies.md
│   ├── domain.md
│   ├── history.md
│   └── index.md
├── package.json
├── src
│   ├── apify-scraper.ts
│   ├── browser-login.ts
│   ├── cli.ts
│   ├── index.ts
│   ├── instagram-api.ts
│   ├── media-downloader.ts
│   ├── scraper.ts
│   ├── session.ts
│   ├── types.ts
│   └── url-parser.ts
└── tsconfig.json
```

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Make your changes and ensure tests pass
4. Commit your changes and open a pull request

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">

**Built with** 🧡 **using Bun, TypeScript**

</div>
