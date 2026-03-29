import type { ParsedUrl } from "./types";

const INSTAGRAM_HOST_REGEX = /^(?:https?:\/\/)?(?:www\.)?instagram\.com/;

const POST_REGEX = /^(?:https?:\/\/)?(?:www\.)?instagram\.com\/p\/([A-Za-z0-9_-]+)\/?/;
const REEL_REGEX = /^(?:https?:\/\/)?(?:www\.)?instagram\.com\/reels?\/([A-Za-z0-9_-]+)\/?/;
const PROFILE_REGEX =
	/^(?:https?:\/\/)?(?:www\.)?instagram\.com\/([A-Za-z0-9_.]+)\/?(?:\?.*)?$/;

const USERNAME_REGEX = /^[A-Za-z0-9_.]{1,30}$/;

export function parseInstagramUrl(input: string): ParsedUrl | null {
	const trimmed = input.trim();

	// Check if it's a bare username (no URL structure)
	if (!trimmed.includes("/") && !trimmed.includes(".com")) {
		if (USERNAME_REGEX.test(trimmed)) {
			return { type: "profile", username: trimmed };
		}
		return null;
	}

	// Must be an Instagram URL
	if (!INSTAGRAM_HOST_REGEX.test(trimmed)) {
		return null;
	}

	// Try post URL first
	const postMatch = trimmed.match(POST_REGEX);
	if (postMatch) {
		return { type: "post", shortcode: postMatch[1] };
	}

	// Try reel URL
	const reelMatch = trimmed.match(REEL_REGEX);
	if (reelMatch) {
		return { type: "reel", shortcode: reelMatch[1] };
	}

	// Try profile URL
	const profileMatch = trimmed.match(PROFILE_REGEX);
	if (profileMatch) {
		const username = profileMatch[1];
		// Exclude known non-profile paths
		const reserved = ["p", "reel", "reels", "explore", "accounts", "stories", "direct"];
		if (reserved.includes(username.toLowerCase())) {
			return null;
		}
		return { type: "profile", username };
	}

	return null;
}

export function normalizeUrl(input: string): string {
	let url = input.trim();
	if (!url.startsWith("http")) {
		url = `https://www.instagram.com/${url}`;
	}
	return url;
}
