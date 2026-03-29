import * as cheerio from "cheerio";
import type { InstagramPost, InstagramProfile, ScrapeOptions, ScrapeResult } from "./types";

const DEFAULT_OPTIONS: Required<ScrapeOptions> = {
	maxPages: 5,
	maxRetries: 3,
	retryDelayMs: 3000,
};

const PROFILE_BASE_URL = "https://www.picnob.com/zh-hant/profile";
const POSTS_API_URL = "https://www.piokok.com/api/posts";

const DEFAULT_HEADERS = {
	"User-Agent":
		"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
	Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
	"Accept-Language": "en-US,en;q=0.9",
};

export class InstagramScraper {
	private options: Required<ScrapeOptions>;

	constructor(options?: ScrapeOptions) {
		this.options = { ...DEFAULT_OPTIONS, ...options };
	}

	async scrapeProfile(username: string): Promise<ScrapeResult> {
		const profileData = await this.fetchProfilePage(username);
		if (!profileData) {
			return {
				profile: null,
				accountStatus: "missing",
				updatedAt: new Date(),
				posts: [],
			};
		}

		if (profileData.isPrivate) {
			return {
				profile: profileData.profile,
				accountStatus: "private",
				updatedAt: new Date(),
				posts: [],
			};
		}

		const allPosts = [...profileData.posts];
		const seen = new Set(allPosts.map((p) => p.shortcode));

		let next = profileData.next;
		let maxid = profileData.maxid;
		let page = 1;

		while (next && page < this.options.maxPages) {
			const apiResult = await this.fetchPostsApi(
				profileData.profile.userid,
				username,
				next,
				maxid,
			);
			if (!apiResult) break;

			for (const post of apiResult.posts) {
				if (!seen.has(post.shortcode)) {
					seen.add(post.shortcode);
					allPosts.push(post);
				}
			}

			next = apiResult.next;
			maxid = apiResult.maxid;
			page++;
		}

		return {
			profile: profileData.profile,
			accountStatus: "public",
			updatedAt: new Date(),
			posts: allPosts,
		};
	}

	async scrapePost(shortcode: string): Promise<InstagramPost | null> {
		// Use the profile-based approach: try to find the post via picnob
		const url = `https://www.picnob.com/zh-hant/post/${shortcode}`;
		try {
			const html = await this.fetchWithRetry(url);
			if (!html) return null;

			const $ = cheerio.load(html);

			const caption =
				$(".photo_content .desc, .post-desc, .post_content .desc").first().text().trim() ||
				null;
			const displayUrl =
				$(".photo_content img, .post-image img, .post_media img").first().attr("src") ||
				null;
			const videoUrl =
				$(".photo_content video source, .post-video source, .post_media video source")
					.first()
					.attr("src") || null;
			const ownerUsername =
				$(".user_info .username, .post-user .username").first().text().trim() || "";
			const likeText =
				$(".like_count, .post-likes, .post_stats .likes").first().text().trim() || "0";
			const commentText =
				$(".comment_count, .post-comments, .post_stats .comments").first().text().trim() ||
				"0";

			return {
				shortcode,
				id: shortcode,
				caption,
				displayUrl,
				videoUrl,
				mediaType: videoUrl ? 2 : 1,
				productType: videoUrl ? "clips" : "feed",
				likeCount: this.parseCount(likeText),
				commentCount: this.parseCount(commentText),
				commentsDisabled: false,
				timestamp: Math.floor(Date.now() / 1000),
				owner: { username: ownerUsername, pk: "" },
			};
		} catch {
			return null;
		}
	}

	private async fetchProfilePage(username: string): Promise<{
		profile: InstagramProfile;
		posts: InstagramPost[];
		isPrivate: boolean;
		next: string | null;
		maxid: string | null;
	} | null> {
		const url = `${PROFILE_BASE_URL}/${username}`;
		const html = await this.fetchWithRetry(url);
		if (!html) return null;

		return this.parseProfileHtml(html, username);
	}

	private parseProfileHtml(
		html: string,
		username: string,
	): {
		profile: InstagramProfile;
		posts: InstagramPost[];
		isPrivate: boolean;
		next: string | null;
		maxid: string | null;
	} | null {
		const $ = cheerio.load(html);

		// Check for missing account
		const pageTitle = $("title").text().toLowerCase();
		if (pageTitle.includes("not found") || pageTitle.includes("404")) {
			return null;
		}

		// Check for private account
		const isPrivate =
			$(".private_account, .private-notice").length > 0 ||
			$("body").text().toLowerCase().includes("this account is private");

		// Extract profile info
		const userid =
			$('[data-userid]').attr("data-userid") ||
			$('input[name="userid"]').val()?.toString() ||
			$("script")
				.text()
				.match(/userid['":\s]+['"]?(\d+)/)?.[1] ||
			"";

		const followers =
			$(".followers .count, .stat_followers .num, [data-followers]")
				.first()
				.text()
				.trim() || "0";
		const followings =
			$(".followings .count, .stat_following .num, [data-following]")
				.first()
				.text()
				.trim() || "0";
		const postsCount =
			$(".posts .count, .stat_posts .num, [data-posts]").first().text().trim() || "0";

		const bioElements = $(".biography, .bio, .user_bio")
			.first()
			.find("p, span, br")
			.toArray();
		const bio =
			bioElements.length > 0
				? bioElements.map((el) => $(el).text().trim()).filter(Boolean)
				: $(".biography, .bio, .user_bio").first().text().trim().split("\n").filter(Boolean);

		const profile: InstagramProfile = {
			userid,
			username,
			followers,
			followings,
			postsCount,
			bio: bio.length > 0 ? bio : null,
		};

		// Extract posts
		const posts: InstagramPost[] = [];
		$(".item, .post_item, .photo_item, [data-shortcode]").each((_, el) => {
			const $el = $(el);
			const shortcode =
				$el.attr("data-shortcode") ||
				$el.find("a").attr("href")?.match(/\/p\/([A-Za-z0-9_-]+)/)?.[1] ||
				"";
			if (!shortcode) return;

			const imgSrc = $el.find("img").first().attr("src") || null;
			const videoSrc = $el.find("video source").first().attr("src") || null;
			const isVideo = $el.hasClass("video") || $el.find(".video_icon, .play_icon").length > 0;
			const captionText = $el.find(".desc, .caption").first().text().trim() || null;
			const likeText = $el.find(".like_count, .likes").first().text().trim() || "0";
			const commentText = $el.find(".comment_count, .comments").first().text().trim() || "0";
			const timeAttr = $el.find("time").attr("datetime") || "";

			posts.push({
				shortcode,
				id: shortcode,
				caption: captionText,
				displayUrl: imgSrc,
				videoUrl: isVideo ? videoSrc : null,
				mediaType: isVideo ? 2 : 1,
				productType: isVideo ? "clips" : "feed",
				likeCount: this.parseCount(likeText),
				commentCount: this.parseCount(commentText),
				commentsDisabled: false,
				timestamp: timeAttr ? Math.floor(new Date(timeAttr).getTime() / 1000) : 0,
				owner: { username, pk: userid },
			});
		});

		// Extract pagination cursors
		const next =
			$('[data-next]').attr("data-next") ||
			$('input[name="next"]').val()?.toString() ||
			$("script")
				.text()
				.match(/next['":\s]+['"]([^'"]+)['"]/)?.[1] ||
			null;
		const maxid =
			$('[data-maxid]').attr("data-maxid") ||
			$('input[name="maxid"]').val()?.toString() ||
			$("script")
				.text()
				.match(/maxid['":\s]+['"]([^'"]+)['"]/)?.[1] ||
			null;

		return { profile, posts, isPrivate, next, maxid };
	}

	private async fetchPostsApi(
		userid: string,
		username: string,
		next: string,
		maxid: string | null,
	): Promise<{
		posts: InstagramPost[];
		next: string | null;
		maxid: string | null;
	} | null> {
		const params = new URLSearchParams({
			userid,
			username,
			next,
		});
		if (maxid) params.set("maxid", maxid);

		const url = `${POSTS_API_URL}?${params.toString()}`;

		try {
			const response = await this.fetchWithRetry(url, true);
			if (!response) return null;

			const data = JSON.parse(response);
			return this.parseApiResponse(data, username, userid);
		} catch {
			return null;
		}
	}

	private parseApiResponse(
		data: Record<string, unknown>,
		username: string,
		userid: string,
	): {
		posts: InstagramPost[];
		next: string | null;
		maxid: string | null;
	} {
		const rawPosts = (data.posts as Record<string, unknown>[]) || [];
		const posts: InstagramPost[] = rawPosts.map((p) => ({
			shortcode: (p.shortcode as string) || (p.code as string) || "",
			id: (p.id as string) || (p.pk as string) || "",
			caption:
				(p.caption as string) ||
				((p.caption as Record<string, unknown>)?.text as string) ||
				null,
			displayUrl:
				(p.display_url as string) ||
				(p.image_url as string) ||
				(p.thumbnail_src as string) ||
				null,
			videoUrl: (p.video_url as string) || null,
			mediaType: (p.media_type as number) || (p.video_url ? 2 : 1),
			productType: (p.product_type as string) || (p.video_url ? "clips" : "feed"),
			likeCount: (p.like_count as number) || (p.likes as number) || 0,
			commentCount: (p.comment_count as number) || (p.comments as number) || 0,
			commentsDisabled: (p.comments_disabled as boolean) || false,
			timestamp: (p.taken_at as number) || (p.timestamp as number) || 0,
			owner: { username, pk: userid },
		}));

		const next = (data.next as string) || null;
		const maxid = (data.maxid as string) || (data.max_id as string) || null;

		return { posts, next, maxid };
	}

	private async fetchWithRetry(url: string, expectJson = false): Promise<string | null> {
		for (let attempt = 1; attempt <= this.options.maxRetries; attempt++) {
			try {
				const response = await fetch(url, {
					headers: {
						...DEFAULT_HEADERS,
						...(expectJson ? { Accept: "application/json" } : {}),
					},
				});

				if (response.ok) {
					return await response.text();
				}

				if (response.status === 404) {
					return null;
				}

				// Rate limited or server error — retry
				if (response.status === 429 || response.status >= 500) {
					if (attempt < this.options.maxRetries) {
						await this.delay(this.options.retryDelayMs * attempt);
						continue;
					}
				}

				return null;
			} catch {
				if (attempt < this.options.maxRetries) {
					await this.delay(this.options.retryDelayMs * attempt);
					continue;
				}
				return null;
			}
		}
		return null;
	}

	private parseCount(text: string): number {
		const cleaned = text.replace(/[,\s]/g, "").toLowerCase();
		const match = cleaned.match(/([\d.]+)(k|m|b)?/);
		if (!match) return 0;
		const num = Number.parseFloat(match[1]);
		const suffix = match[2];
		if (suffix === "k") return Math.round(num * 1000);
		if (suffix === "m") return Math.round(num * 1000000);
		if (suffix === "b") return Math.round(num * 1000000000);
		return Math.round(num);
	}

	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}
