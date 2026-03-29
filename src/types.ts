export interface InstagramPost {
	shortcode: string;
	id: string;
	caption: string | null;
	displayUrl: string | null;
	videoUrl: string | null;
	mediaType: number; // 1=photo, 2=video, 8=album
	productType: string; // "feed" | "igtv" | "clips"
	likeCount: number;
	commentCount: number;
	commentsDisabled: boolean;
	timestamp: number;
	owner: { username: string; pk: string };
}

export interface InstagramProfile {
	userid: string;
	username: string;
	followers: string;
	followings: string;
	postsCount: string;
	bio: string[] | null;
}

export interface ScrapeResult {
	profile: InstagramProfile | null;
	accountStatus: "public" | "private" | "missing";
	updatedAt: Date;
	posts: InstagramPost[];
}

export interface ScrapeOptions {
	maxPages?: number;
	maxRetries?: number;
	retryDelayMs?: number;
}

export type ParsedUrl =
	| { type: "profile"; username: string }
	| { type: "post"; shortcode: string }
	| { type: "reel"; shortcode: string };
