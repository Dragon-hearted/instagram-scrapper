export interface SessionData {
	csrftoken: string;
	sessionid: string;
	ds_user_id: string;
	mid: string;
	cookies_path: string;
}

export interface LoginCredentials {
	username: string;
	password: string;
}

export interface VideoVersion {
	url: string;
	width: number;
	height: number;
	type: number;
}

export interface ImageVersion {
	url: string;
	width: number;
	height: number;
}

export interface MediaInfo {
	pk: string;
	id: string;
	code: string;
	media_type: number;
	video_versions?: VideoVersion[];
	image_versions2?: {
		candidates: ImageVersion[];
	};
	carousel_media?: Array<{
		pk: string;
		id: string;
		media_type: number;
		video_versions?: VideoVersion[];
		image_versions2?: {
			candidates: ImageVersion[];
		};
	}>;
	caption?: { text: string } | null;
	like_count?: number;
	comment_count?: number;
	taken_at?: number;
	user?: { pk: string; username: string };
}

export interface DownloadedMedia {
	type: "video" | "image";
	url: string;
	filePath: string;
	width: number;
	height: number;
	mediaId: string;
}

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
	mediaId?: string;
	videoVersions?: VideoVersion[];
	imageVersions?: ImageVersion[];
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
	method?: "login" | "apify";
	downloadMedia?: boolean;
	outputDir?: string;
}

export type ParsedUrl =
	| { type: "profile"; username: string }
	| { type: "post"; shortcode: string }
	| { type: "reel"; shortcode: string };
