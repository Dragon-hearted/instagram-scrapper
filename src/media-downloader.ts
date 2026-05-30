import { existsSync, mkdirSync } from "node:fs";
import type {
	DownloadedMedia,
	ImageVersion,
	InstagramPost,
	MediaInfo,
	VideoVersion,
} from "./types";

interface ExtractedMedia {
	type: "video" | "image";
	url: string;
	width: number;
	height: number;
	mediaId: string;
}

export class MediaDownloader {
	async downloadAll(
		posts: InstagramPost[],
		outputDir: string,
	): Promise<DownloadedMedia[]> {
		if (!existsSync(outputDir)) {
			mkdirSync(outputDir, { recursive: true });
		}

		const results: DownloadedMedia[] = [];
		const seenUrls = new Set<string>();

		for (const post of posts) {
			const mediaItems = this.extractMediaFromPost(post);
			let index = 1;

			for (const item of mediaItems) {
				const baseUrl = this.stripQueryParams(item.url);
				if (seenUrls.has(baseUrl)) continue;
				seenUrls.add(baseUrl);

				const ext = item.type === "video" ? "mp4" : "jpg";
				const filename = `${post.shortcode}_${index}.${ext}`;
				const filePath = `${outputDir}/${filename}`;

				const success = await this.downloadMedia(item.url, filePath);
				if (success) {
					results.push({
						type: item.type,
						url: item.url,
						filePath,
						width: item.width,
						height: item.height,
						mediaId: item.mediaId,
					});
				}
				index++;
			}
		}

		return results;
	}

	async downloadMedia(url: string, filePath: string): Promise<boolean> {
		try {
			const response = await fetch(url, {
				headers: {
					Referer: "https://www.instagram.com/",
					"User-Agent":
						"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
				},
			});

			if (!response.ok) return false;

			const buffer = await response.arrayBuffer();
			await Bun.write(filePath, buffer);
			return true;
		} catch {
			return false;
		}
	}

	extractMediaUrls(mediaInfo: MediaInfo): ExtractedMedia[] {
		const results: ExtractedMedia[] = [];

		// Handle carousel (album) media
		if (mediaInfo.carousel_media?.length) {
			for (const item of mediaInfo.carousel_media) {
				results.push(
					...this.extractSingleMedia(
						item.media_type,
						item.video_versions,
						item.image_versions2?.candidates,
						item.pk || item.id,
					),
				);
			}
			return results;
		}

		// Single media item
		results.push(
			...this.extractSingleMedia(
				mediaInfo.media_type,
				mediaInfo.video_versions,
				mediaInfo.image_versions2?.candidates,
				mediaInfo.pk || mediaInfo.id,
			),
		);

		return results;
	}

	private extractSingleMedia(
		mediaType: number,
		videoVersions?: VideoVersion[],
		imageVersions?: ImageVersion[],
		mediaId?: string,
	): ExtractedMedia[] {
		const results: ExtractedMedia[] = [];
		const id = mediaId ?? "";

		// Video (media_type 2)
		if (mediaType === 2 && videoVersions?.length) {
			const best = this.bestVideo(videoVersions);
			results.push({
				type: "video",
				url: best.url,
				width: best.width,
				height: best.height,
				mediaId: id,
			});
		}

		// Image (media_type 1) or fallback
		if (imageVersions?.length) {
			const best = this.bestImage(imageVersions);
			// For videos, still include a thumbnail image
			// For photos, this is the main media
			if (mediaType !== 2) {
				results.push({
					type: "image",
					url: best.url,
					width: best.width,
					height: best.height,
					mediaId: id,
				});
			}
		}

		return results;
	}

	private extractMediaFromPost(post: InstagramPost): ExtractedMedia[] {
		// Carousel/album posts: download every child, not just the cover.
		// Mirrors the carousel branch of extractMediaUrls().
		if (post.carouselMedia?.length) {
			const results: ExtractedMedia[] = [];
			for (const item of post.carouselMedia) {
				results.push(
					...this.extractSingleMedia(
						item.media_type,
						item.video_versions,
						item.image_versions2?.candidates,
						item.pk || item.id,
					),
				);
			}
			if (results.length) return results;
		}

		// If we have rich API data (videoVersions/imageVersions), use it
		if (post.videoVersions?.length || post.imageVersions?.length) {
			const results: ExtractedMedia[] = [];

			if (post.videoVersions?.length) {
				const best = this.bestVideo(post.videoVersions);
				results.push({
					type: "video",
					url: best.url,
					width: best.width,
					height: best.height,
					mediaId: post.mediaId ?? post.id,
				});
			} else if (post.imageVersions?.length) {
				const best = this.bestImage(post.imageVersions);
				results.push({
					type: "image",
					url: best.url,
					width: best.width,
					height: best.height,
					mediaId: post.mediaId ?? post.id,
				});
			}

			return results;
		}

		// Fallback to basic URL fields
		const results: ExtractedMedia[] = [];

		if (post.videoUrl) {
			results.push({
				type: "video",
				url: post.videoUrl,
				width: 0,
				height: 0,
				mediaId: post.mediaId ?? post.id,
			});
		} else if (post.displayUrl) {
			results.push({
				type: "image",
				url: post.displayUrl,
				width: 0,
				height: 0,
				mediaId: post.mediaId ?? post.id,
			});
		}

		return results;
	}

	private bestVideo(versions: VideoVersion[]): VideoVersion {
		return versions.reduce((best, v) =>
			v.width * v.height > best.width * best.height ? v : best,
		);
	}

	private bestImage(versions: ImageVersion[]): ImageVersion {
		return versions.reduce((best, v) =>
			v.width * v.height > best.width * best.height ? v : best,
		);
	}

	private stripQueryParams(url: string): string {
		try {
			const parsed = new URL(url);
			return `${parsed.origin}${parsed.pathname}`;
		} catch {
			return url;
		}
	}
}
