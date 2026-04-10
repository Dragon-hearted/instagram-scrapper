import { buildHeaders } from "./session";
import type {
	SessionData,
	InstagramPost,
	InstagramProfile,
	MediaInfo,
	ScrapeOptions,
	ScrapeResult,
	VideoVersion,
	ImageVersion,
} from "./types";

const API_BASE = "https://www.instagram.com/api/v1";

const DEFAULT_OPTIONS: Required<
	Pick<ScrapeOptions, "maxPages" | "maxRetries" | "retryDelayMs">
> = {
	maxPages: 5,
	maxRetries: 3,
	retryDelayMs: 3000,
};

export class InstagramApiClient {
	private session: SessionData;
	private options: typeof DEFAULT_OPTIONS;

	constructor(session: SessionData, options?: ScrapeOptions) {
		this.session = session;
		this.options = { ...DEFAULT_OPTIONS, ...options };
	}

	async getProfileInfo(
		username: string,
	): Promise<{ profile: InstagramProfile; userId: string } | null> {
		const url = `${API_BASE}/users/web_profile_info/?username=${encodeURIComponent(username)}`;
		const data = await this.apiRequest(url);
		const dataObj = data?.data as Record<string, unknown> | undefined;
		if (!dataObj?.user) return null;

		const user = dataObj.user as Record<string, unknown>;
		const edgeFollowedBy = user.edge_followed_by as Record<string, number> | undefined;
		const edgeFollow = user.edge_follow as Record<string, number> | undefined;
		const edgeMedia = user.edge_owner_to_timeline_media as Record<string, number> | undefined;
		const biography = user.biography as string | undefined;
		const userId = (user.id as string) || user.pk?.toString() || "";

		return {
			profile: {
				userid: userId,
				username: (user.username as string) || username,
				followers: (
					edgeFollowedBy?.count ??
					(user.follower_count as number) ??
					0
				).toString(),
				followings: (
					edgeFollow?.count ??
					(user.following_count as number) ??
					0
				).toString(),
				postsCount: (
					edgeMedia?.count ??
					(user.media_count as number) ??
					0
				).toString(),
				bio: biography
					? biography.split("\n").filter(Boolean)
					: null,
			},
			userId,
		};
	}

	async getUserFeed(
		userId: string,
		maxId?: string,
	): Promise<{
		posts: InstagramPost[];
		moreAvailable: boolean;
		nextMaxId: string | null;
	}> {
		const params = new URLSearchParams({ count: "33" });
		if (maxId) params.set("max_id", maxId);

		const url = `${API_BASE}/feed/user/${userId}/?${params.toString()}`;
		const data = await this.apiRequest(url);

		if (!data?.items) {
			return { posts: [], moreAvailable: false, nextMaxId: null };
		}

		const items = data.items as Record<string, unknown>[];
		const posts: InstagramPost[] = items.map((item) =>
			this.mapFeedItemToPost(item),
		);

		return {
			posts,
			moreAvailable: (data.more_available as boolean) ?? false,
			nextMaxId: data.next_max_id?.toString() ?? null,
		};
	}

	async getMediaInfo(mediaId: string): Promise<MediaInfo | null> {
		const url = `${API_BASE}/media/${mediaId}/info/`;
		const data = await this.apiRequest(url);
		const items = data?.items as Record<string, unknown>[] | undefined;
		if (!items?.[0]) return null;
		return items[0] as unknown as MediaInfo;
	}

	async scrapeProfile(
		username: string,
		options?: ScrapeOptions,
	): Promise<ScrapeResult> {
		const maxPages = options?.maxPages ?? this.options.maxPages;
		const profileResult = await this.getProfileInfo(username);

		if (!profileResult) {
			return {
				profile: null,
				accountStatus: "missing",
				updatedAt: new Date(),
				posts: [],
			};
		}

		const { profile, userId } = profileResult;
		const allPosts: InstagramPost[] = [];
		const seen = new Set<string>();
		let nextMaxId: string | undefined;
		let page = 0;

		while (page < maxPages) {
			const feed = await this.getUserFeed(userId, nextMaxId);

			for (const post of feed.posts) {
				if (!seen.has(post.shortcode)) {
					seen.add(post.shortcode);
					allPosts.push(post);
				}
			}

			if (!feed.moreAvailable || !feed.nextMaxId) break;
			nextMaxId = feed.nextMaxId;
			page++;
		}

		return {
			profile,
			accountStatus: "public",
			updatedAt: new Date(),
			posts: allPosts,
		};
	}

	async scrapePost(shortcode: string): Promise<InstagramPost | null> {
		// Convert shortcode to media ID and fetch info
		const mediaId = shortcodeToMediaId(shortcode);
		const mediaInfo = await this.getMediaInfo(mediaId);
		if (!mediaInfo) return null;

		return this.mapMediaInfoToPost(mediaInfo, shortcode);
	}

	private mapFeedItemToPost(item: Record<string, unknown>): InstagramPost {
		const caption = item.caption as Record<string, unknown> | null;
		const user = item.user as Record<string, unknown> | undefined;
		const videoVersions = item.video_versions as VideoVersion[] | undefined;
		const imageVersions2 = item.image_versions2 as
			| { candidates: ImageVersion[] }
			| undefined;

		return {
			shortcode: (item.code as string) || "",
			id: (item.pk as string) || item.id?.toString() || "",
			caption: caption?.text?.toString() ?? null,
			displayUrl: imageVersions2?.candidates?.[0]?.url ?? null,
			videoUrl: videoVersions?.[0]?.url ?? null,
			mediaType: (item.media_type as number) || 1,
			productType: (item.product_type as string) || "feed",
			likeCount: (item.like_count as number) || 0,
			commentCount: (item.comment_count as number) || 0,
			commentsDisabled:
				(item.comments_disabled as boolean) || false,
			timestamp: (item.taken_at as number) || 0,
			owner: {
				username: (user?.username as string) || "",
				pk: (user?.pk as string) || user?.id?.toString() || "",
			},
			mediaId: item.pk?.toString() || item.id?.toString() || "",
			videoVersions: videoVersions || [],
			imageVersions: imageVersions2?.candidates || [],
		};
	}

	private mapMediaInfoToPost(
		info: MediaInfo,
		shortcode: string,
	): InstagramPost {
		return {
			shortcode,
			id: info.id || info.pk,
			caption: info.caption?.text ?? null,
			displayUrl: info.image_versions2?.candidates?.[0]?.url ?? null,
			videoUrl: info.video_versions?.[0]?.url ?? null,
			mediaType: info.media_type || 1,
			productType: "feed",
			likeCount: info.like_count || 0,
			commentCount: info.comment_count || 0,
			commentsDisabled: false,
			timestamp: info.taken_at || 0,
			owner: {
				username: info.user?.username || "",
				pk: info.user?.pk || "",
			},
			mediaId: info.pk,
			videoVersions: info.video_versions || [],
			imageVersions: info.image_versions2?.candidates || [],
		};
	}

	private async apiRequest(url: string): Promise<Record<string, unknown> | null> {
		for (let attempt = 1; attempt <= this.options.maxRetries; attempt++) {
			try {
				const response = await fetch(url, {
					headers: {
						...buildHeaders(this.session),
						Accept: "application/json",
					},
				});

				if (response.ok) {
					return (await response.json()) as Record<string, unknown>;
				}

				if (response.status === 404) return null;

				if (
					response.status === 401 ||
					response.status === 403
				) {
					throw new Error(
						`Authentication failed (${response.status}). Session may be expired.`,
					);
				}

				// Rate limited or server error — retry with backoff
				if (response.status === 429 || response.status >= 500) {
					if (attempt < this.options.maxRetries) {
						await delay(this.options.retryDelayMs * attempt);
						continue;
					}
				}

				return null;
			} catch (error) {
				if (
					error instanceof Error &&
					error.message.includes("Authentication failed")
				) {
					throw error;
				}
				if (attempt < this.options.maxRetries) {
					await delay(this.options.retryDelayMs * attempt);
					continue;
				}
				return null;
			}
		}
		return null;
	}
}

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Converts an Instagram shortcode to a numeric media ID.
 * Instagram shortcodes are base64-encoded media IDs.
 */
function shortcodeToMediaId(shortcode: string): string {
	const alphabet =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
	let id = BigInt(0);
	for (const char of shortcode) {
		id = id * BigInt(64) + BigInt(alphabet.indexOf(char));
	}
	return id.toString();
}
