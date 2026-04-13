<div align="center">

![Instagram Scrapper](images/hero.svg)

### Instagram content scraper that extracts posts, reels, and profile data using login-based Instagram Private API access with browser-automated authentication and media downloading

![Status](https://img.shields.io/badge/Status-active-brightgreen)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
![Playwright](https://img.shields.io/badge/Playwright-1-2EAD33?logo=playwright&logoColor=white)
[![Bun](https://img.shields.io/badge/Bun-Runtime-f9f1e1?logo=bun&logoColor=000)](https://bun.sh/)

</div>

---

## 📑 Table of Contents

- [✨ Features](#features)
- [🏗 Architecture](#architecture)
- [🛠 Tech Stack](#tech-stack)
- [🚀 Getting Started](#getting-started)
- [💻 Development](#development)
- [📂 Project Structure](#project-structure)
- [🤝 Contributing](#contributing)
- [📄 License](#license)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **instagram-scraping** | Core task type |
| **social-media-data-extraction** | Core task type |
| **content-collection** | Core task type |
| **instagram-url Input** | Supported input type |
| **instagram-username Input** | Supported input type |
| **instagram-post-data Output** | Supported output type |
| **instagram-profile-data Output** | Supported output type |
| **media-urls Output** | Supported output type |
| **downloaded-media Output** | Supported output type |

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
| **Playwright 1** | Browser automation & testing |
| **Zod 3** | Schema validation |

---

## 🚀 Getting Started

### Prerequisites

- [**Bun**](https://bun.sh/) v1.0+ — `curl -fsSL https://bun.sh/install | bash`

### Install

```bash
cd systems/instagram-scrapper
bun install
```

### Run

```bash
bun run systems/instagram-scrapper/src/cli.ts
```

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
├── cookies.json
├── downloads
│   └── DTta61JEWmj_1.mp4
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
├── logs
│   ├── 17b21e4e-e682-4a98-b052-8c7be36d5dbe
│   │   ├── chat.json
│   │   ├── post_tool_use.json
│   │   ├── pre_tool_use.json
│   │   └── stop.json
│   ├── 51e51611-824d-4bd6-98cf-fd8997a9b124
│   │   ├── post_tool_use.json
│   │   └── pre_tool_use.json
│   ├── 77efce5f-eaff-4dfc-a443-2b7f1dd7d54a
│   │   ├── chat.json
│   │   ├── post_tool_use.json
│   │   └── stop.json
│   ├── 8654e07c-67eb-4b0b-b069-602244930fc7
│   │   ├── chat.json
│   │   ├── notification.json
│   │   ├── post_tool_use.json
│   │   ├── post_tool_use_failure.json
│   │   ├── pre_tool_use.json
│   │   └── stop.json
│   ├── 86873d53-1b8d-455a-a014-54eeea3696b8
│   │   ├── chat.json
│   │   ├── post_tool_use.json
│   │   ├── pre_tool_use.json
│   │   └── stop.json
│   ├── ccfb962d-cf3e-4002-93c4-eb941b3a43a9
│   │   ├── chat.json
│   │   ├── post_tool_use.json
│   │   ├── pre_tool_use.json
│   │   └── stop.json
│   ├── f0226b0d-266c-4949-b926-dce6a0ecb219
│   │   ├── chat.json
│   │   ├── notification.json
│   │   ├── post_tool_use.json
│   │   ├── post_tool_use_failure.json
│   │   ├── pre_tool_use.json
│   │   └── stop.json
│   ├── f2c741b0-bb55-4fcb-8848-451d3716025c
│   │   ├── chat.json
│   │   ├── post_tool_use.json
│   │   ├── pre_tool_use.json
│   │   └── stop.json
│   ├── fd009500-a07b-4f7f-b6dc-b98e66e9cd79
│   │   ├── chat.json
│   │   ├── notification.json
│   │   ├── post_tool_use.json
│   │   ├── post_tool_use_failure.json
│   │   ├── pre_tool_use.json
│   │   ├── stop.json
│   │   ├── subagent_start.json
│   │   └── subagent_stop.json
│   ├── session_end.json
│   └── user_prompt_submit.json
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
