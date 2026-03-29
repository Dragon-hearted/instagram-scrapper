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
