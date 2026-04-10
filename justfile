# instagram-scrapper
set dotenv-load := true

# List all recipes
default:
  @just --list

# Run in development mode (watch)
dev:
  bun run dev

# Run tests
test:
  bun test

# Build for production
build:
  bun run build

# Lint code
lint:
  bun run lint

# Check and fix formatting
check:
  bun run check

# Login to Instagram (opens browser for authentication)
login:
  bun run src/cli.ts --login dummy

# Scrape a profile or post (usage: just scrape <url-or-username> [args...])
scrape target *args:
  bun run src/cli.ts {{target}} {{args}}

# Install Playwright browser for login support
install-browser:
  bunx playwright install chromium
