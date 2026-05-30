import type { ImageVersion, InstagramPost, VideoVersion } from "./types";

const APIFY_BASE_URL = "https://api.apify.com/v2";
const ACTOR_ID = "apify~instagram-post-scraper";

export class ApifyInstagramScraper {
	private apiToken: string;

	constructor(apiToken?: string) {
		const token = apiToken || process.env.APIFY_API_TOKEN;
		if (!token) {
			throw new Error(
				"APIFY_API_TOKEN is required. Set it as an environment variable or pass it to the constructor.",
			);
		}
		this.apiToken = token;
	}

	async scrapePosts(username: string, limit = 20): Promise<InstagramPost[]> {
		const input = {
			username: [username],
			resultsLimit: limit,
		};

		return this.runActor(input);
	}

	async scrapeByUrl(url: string): Promise<InstagramPost[]> {
		const input = {
			directUrls: [url],
			resultsLimit: 1,
		};

		return this.runActor(input);
	}

	private async runActor(input: Record<string, unknown>): Promise<InstagramPost[]> {
		const runUrl = `${APIFY_BASE_URL}/acts/${ACTOR_ID}/runs?token=${this.apiToken}`;

		const runResponse = await fetch(runUrl, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(input),
		});

		if (!runResponse.ok) {
			throw new Error(`Apify actor start failed: ${runResponse.status} ${runResponse.statusText}`);
		}

		const runData = (await runResponse.json()) as { data: { id: string } };
		const runId = runData.data.id;

		// Poll for completion
		const result = await this.waitForRun(runId);
		if (!result) return [];

		// Fetch dataset items
		const datasetUrl = `${APIFY_BASE_URL}/actor-runs/${runId}/dataset/items?token=${this.apiToken}`;
		const datasetResponse = await fetch(datasetUrl);

		if (!datasetResponse.ok) {
			throw new Error(`Failed to fetch dataset: ${datasetResponse.status}`);
		}

		const items = (await datasetResponse.json()) as Record<string, unknown>[];
		return items.map((item) => this.mapToInstagramPost(item));
	}

	private async waitForRun(runId: string, timeoutMs = 120000): Promise<boolean> {
		const startTime = Date.now();
		const pollInterval = 3000;

		while (Date.now() - startTime < timeoutMs) {
			const statusUrl = `${APIFY_BASE_URL}/actor-runs/${runId}?token=${this.apiToken}`;
			const response = await fetch(statusUrl);

			if (!response.ok) return false;

			const data = (await response.json()) as { data: { status: string } };
			const status = data.data.status;

			if (status === "SUCCEEDED") return true;
			if (status === "FAILED" || status === "ABORTED" || status === "TIMED-OUT") return false;

			await new Promise((resolve) => setTimeout(resolve, pollInterval));
		}

		return false;
	}

	private mapToInstagramPost(item: Record<string, unknown>): InstagramPost {
		const caption = item.caption as string | null;
		const ownerUsername = (item.ownerUsername as string) || "";
		const ownerId = (item.ownerId as string) || "";
		const mediaId = (item.id as string) || "";
		const displayUrl =
			(item.displayUrl as string) || (item.imageUrl as string) || null;
		const videoUrl = (item.videoUrl as string) || null;
		const width = (item.dimensionsWidth as number) || 0;
		const height = (item.dimensionsHeight as number) || 0;

		// Apify dataset rows are flat (single best URL each). Reconstruct the
		// version arrays the downloader needs so apify-method posts are
		// downloadable just like login-method posts.
		const videoVersions: VideoVersion[] = videoUrl
			? [{ url: videoUrl, width, height, type: 101 }]
			: [];
		const imageVersions: ImageVersion[] = displayUrl
			? [{ url: displayUrl, width, height }]
			: [];

		return {
			shortcode: (item.shortCode as string) || (item.shortcode as string) || "",
			id: mediaId,
			caption: caption || null,
			displayUrl,
			videoUrl,
			mediaType: (item.type as string) === "Video" ? 2 : (item.type as string) === "Sidecar" ? 8 : 1,
			productType: (item.productType as string) || "feed",
			likeCount: (item.likesCount as number) || 0,
			commentCount: (item.commentsCount as number) || 0,
			commentsDisabled: (item.commentsDisabled as boolean) || false,
			timestamp: item.timestamp
				? Math.floor(new Date(item.timestamp as string).getTime() / 1000)
				: 0,
			owner: { username: ownerUsername, pk: ownerId },
			mediaId,
			videoVersions,
			imageVersions,
		};
	}
}
