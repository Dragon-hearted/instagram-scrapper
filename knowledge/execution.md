---
system: "instagram-scrapper"
type: execution
driver: cli
entry: "just scrape <url-or-username> [--method login|apify] [--download] [--output-dir <dir>] [--headless] [--format json|summary]"
mode: orchestrate
gates: executor
version: 1
lastUpdated: "2026-06-04"
lastUpdatedBy: build-mode
---

# Execution — Instagram Scrapper

How Execute Mode (`/adcelerate-execute`) runs this system. Execute Mode reads ONLY this manifest to decide how to run, then branches on `driver`.

## Invocation
Run the CLI (equivalently `bun run src/cli.ts <target> [flags]`). The `login` method needs `INSTAGRAM_USERNAME` / `INSTAGRAM_PASSWORD`; the `apify` method needs `APIFY_API_TOKEN`. Install the browser once with `just install-browser`.

```
just login                                   # authenticate (bun run src/cli.ts --login dummy)
just scrape <url-or-username> --download --output-dir <dir>   # parse → extract → normalize → download
```

## Natural flow (awareness only — the system drives this on the skill path)
1. **authentication** — `just login` performs a browser-driven login, persisting session cookies (csrftoken, sessionid, ds_user_id, mid).
2. **url-parsing** — the CLI parses the target into a type (profile/post/reel) + identifier.
3. **data-extraction** — pulls raw data from the Instagram Private API with the authenticated session.
4. **data-normalization** — normalizes into structured `InstagramPost[]` / `InstagramProfile` with media versions.
5. **media-download** — with `--download`, writes media files to `--output-dir` (default `./downloads`).

## Where the agent must check / supply input
- **authentication** — supply **credentials** (`INSTAGRAM_USERNAME`/`INSTAGRAM_PASSWORD`) or choose **`--method apify`** with `APIFY_API_TOKEN`; run `just login` first if no valid session.
- **url-parsing** — supply the **target** (profile/post/reel URL or bare username) as the first argument.
- **media-download** — confirm **`--download`** (without it only metadata/URLs are returned) and the **`--output-dir`**.

## Validation
After execution, validate the output against [acceptance-criteria.md](acceptance-criteria.md) (hard gates inline, soft criteria via the validator). Applies to both drivers.
