import { BrowserLogin, type BrowserLoginOptions } from "./browser-login";
import { InstagramApiClient } from "./instagram-api";
import { MediaDownloader } from "./media-downloader";
import { SessionManager } from "./session";
import type { InstagramPost, ScrapeOptions, ScrapeResult, SessionData } from "./types";

const DEFAULT_OPTIONS: Required<ScrapeOptions> = {
	maxPages: 5,
	maxRetries: 3,
	retryDelayMs: 3000,
	method: "login",
	downloadMedia: false,
	outputDir: "./downloads",
};

export class InstagramScraper {
	private options: Required<ScrapeOptions>;
	private sessionManager: SessionManager;
	private browserLoginOptions: BrowserLoginOptions;

	constructor(options?: ScrapeOptions, browserLoginOptions?: BrowserLoginOptions) {
		this.options = { ...DEFAULT_OPTIONS, ...options };
		this.sessionManager = new SessionManager();
		this.browserLoginOptions = browserLoginOptions ?? {};
	}

	async scrapeProfile(username: string): Promise<ScrapeResult> {
		const session = await this.ensureSession();
		const api = new InstagramApiClient(session, this.options);
		const result = await api.scrapeProfile(username, this.options);

		if (this.options.downloadMedia && result.posts.length > 0) {
			const downloader = new MediaDownloader();
			await downloader.downloadAll(result.posts, this.options.outputDir);
		}

		return result;
	}

	async scrapePost(shortcode: string): Promise<InstagramPost | null> {
		const session = await this.ensureSession();
		const api = new InstagramApiClient(session, this.options);
		const post = await api.scrapePost(shortcode);

		if (post && this.options.downloadMedia) {
			const downloader = new MediaDownloader();
			await downloader.downloadAll([post], this.options.outputDir);
		}

		return post;
	}

	async forceLogin(): Promise<SessionData> {
		this.sessionManager.clearSession();
		return this.loginViaBrowser();
	}

	private async ensureSession(): Promise<SessionData> {
		// Try loading an existing session
		const existing = this.sessionManager.loadSession();
		if (existing) {
			const valid = await this.sessionManager.isSessionValid(existing);
			if (valid) return existing;
			console.log("[InstagramScraper] Saved session expired, re-authenticating...");
		}

		return this.loginViaBrowser();
	}

	private async loginViaBrowser(): Promise<SessionData> {
		const username = process.env.INSTAGRAM_USERNAME;
		const password = process.env.INSTAGRAM_PASSWORD;

		if (!username || !password) {
			throw new Error(
				"INSTAGRAM_USERNAME and INSTAGRAM_PASSWORD environment variables are required for login-based scraping.",
			);
		}

		console.log("[InstagramScraper] Logging in via browser...");
		const browserLogin = new BrowserLogin(this.browserLoginOptions);
		const session = await browserLogin.login({ username, password });
		this.sessionManager.saveSession(session);
		console.log("[InstagramScraper] Login successful, session saved.");
		return session;
	}
}
