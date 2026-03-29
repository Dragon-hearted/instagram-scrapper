#!/usr/bin/env bun
import { ApifyInstagramScraper } from "./apify-scraper";
import { InstagramScraper } from "./scraper";
import type { InstagramPost, ScrapeResult } from "./types";
import { parseInstagramUrl } from "./url-parser";

interface CliArgs {
	input: string;
	format: "json" | "summary";
	method: "web" | "apify";
	maxPages: number;
}

function parseArgs(): CliArgs {
	const args = process.argv.slice(2);

	if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
		console.log(`Usage: bun run src/cli.ts <url-or-username> [options]

Arguments:
  url-or-username    Instagram URL or username to scrape

Options:
  --format <type>    Output format: json (default), summary
  --method <type>    Scraper method: web (default), apify
  --max-pages <n>    Max pages to paginate (default: 5)
  -h, --help         Show this help message

Examples:
  bun run src/cli.ts https://instagram.com/p/ABC123/
  bun run src/cli.ts https://instagram.com/reel/XYZ789/
  bun run src/cli.ts https://instagram.com/username/
  bun run src/cli.ts username --method apify
  bun run src/cli.ts username --format summary --max-pages 10`);
		process.exit(0);
	}

	let format: "json" | "summary" = "json";
	let method: "web" | "apify" = "web";
	let maxPages = 5;
	let input = "";

	for (let i = 0; i < args.length; i++) {
		switch (args[i]) {
			case "--format":
				format = args[++i] as "json" | "summary";
				break;
			case "--method":
				method = args[++i] as "web" | "apify";
				break;
			case "--max-pages":
				maxPages = Number.parseInt(args[++i], 10);
				break;
			default:
				if (!args[i].startsWith("-")) {
					input = args[i];
				}
				break;
		}
	}

	if (!input) {
		console.error("Error: Please provide an Instagram URL or username");
		process.exit(1);
	}

	return { input, format, method, maxPages };
}

function formatSummary(result: ScrapeResult): string {
	const lines: string[] = [];

	if (result.profile) {
		lines.push(`Profile: @${result.profile.username}`);
		lines.push(`Status: ${result.accountStatus}`);
		lines.push(`Followers: ${result.profile.followers}`);
		lines.push(`Following: ${result.profile.followings}`);
		lines.push(`Posts: ${result.profile.postsCount}`);
		if (result.profile.bio) {
			lines.push(`Bio: ${result.profile.bio.join(" | ")}`);
		}
		lines.push("");
	}

	lines.push(`Scraped ${result.posts.length} posts`);
	lines.push(`Updated: ${result.updatedAt.toISOString()}`);
	lines.push("");

	for (const post of result.posts.slice(0, 10)) {
		const type = post.mediaType === 2 ? "VIDEO" : post.mediaType === 8 ? "ALBUM" : "PHOTO";
		const caption = post.caption ? post.caption.slice(0, 80) : "(no caption)";
		lines.push(`[${type}] ${post.shortcode} — ${caption}`);
		lines.push(`  Likes: ${post.likeCount} | Comments: ${post.commentCount}`);
	}

	if (result.posts.length > 10) {
		lines.push(`\n... and ${result.posts.length - 10} more posts`);
	}

	return lines.join("\n");
}

function formatPostSummary(post: InstagramPost): string {
	const type = post.mediaType === 2 ? "VIDEO" : post.mediaType === 8 ? "ALBUM" : "PHOTO";
	const lines = [
		`[${type}] ${post.shortcode}`,
		`Owner: @${post.owner.username}`,
		`Caption: ${post.caption || "(no caption)"}`,
		`Likes: ${post.likeCount} | Comments: ${post.commentCount}`,
		`Display URL: ${post.displayUrl || "N/A"}`,
		`Video URL: ${post.videoUrl || "N/A"}`,
	];
	return lines.join("\n");
}

async function main() {
	const { input, format, method, maxPages } = parseArgs();

	const parsed = parseInstagramUrl(input);
	if (!parsed) {
		console.error(`Error: Could not parse "${input}" as an Instagram URL or username`);
		process.exit(1);
	}

	try {
		if (method === "apify") {
			const scraper = new ApifyInstagramScraper();

			if (parsed.type === "profile") {
				const posts = await scraper.scrapePosts(parsed.username);
				if (format === "json") {
					console.log(JSON.stringify(posts, null, 2));
				} else {
					console.log(`Scraped ${posts.length} posts from @${parsed.username}\n`);
					for (const post of posts.slice(0, 10)) {
						console.log(formatPostSummary(post));
						console.log("");
					}
				}
			} else {
				const posts = await scraper.scrapeByUrl(
					`https://www.instagram.com/${parsed.type === "post" ? "p" : "reel"}/${parsed.shortcode}/`,
				);
				if (format === "json") {
					console.log(JSON.stringify(posts, null, 2));
				} else {
					for (const post of posts) {
						console.log(formatPostSummary(post));
					}
				}
			}
		} else {
			const scraper = new InstagramScraper({ maxPages });

			if (parsed.type === "profile") {
				const result = await scraper.scrapeProfile(parsed.username);
				if (format === "json") {
					console.log(JSON.stringify(result, null, 2));
				} else {
					console.log(formatSummary(result));
				}
			} else {
				const post = await scraper.scrapePost(parsed.shortcode);
				if (!post) {
					console.error("Error: Could not scrape post");
					process.exit(1);
				}
				if (format === "json") {
					console.log(JSON.stringify(post, null, 2));
				} else {
					console.log(formatPostSummary(post));
				}
			}
		}
	} catch (error) {
		console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
		process.exit(1);
	}
}

main();
