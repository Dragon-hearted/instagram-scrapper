import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import type { LoginCredentials, SessionData } from "./types";

const INSTAGRAM_URL = "https://www.instagram.com/";
const USER_AGENT =
	"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const REQUIRED_COOKIES = ["csrftoken", "sessionid", "ds_user_id", "mid"] as const;

export interface BrowserLoginOptions {
	headless?: boolean;
	cookiesPath?: string;
	timeout?: number;
}

export class BrowserLogin {
	private options: Required<BrowserLoginOptions>;

	constructor(options?: BrowserLoginOptions) {
		this.options = {
			headless: options?.headless ?? false,
			cookiesPath: options?.cookiesPath ?? "./cookies.json",
			timeout: options?.timeout ?? (Number(process.env.IG_LOGIN_TIMEOUT_MS) || 180_000),
		};
	}

	async login(credentials: LoginCredentials): Promise<SessionData> {
		const browser = await this.launchBrowser();
		const context = await this.createContext(browser);
		const page = await context.newPage();

		try {
			await page.goto(INSTAGRAM_URL, { waitUntil: "domcontentloaded" });

			// Dismiss cookie consent dialog if present
			await this.dismissCookieConsent(page);

			// Wait for and fill username (Instagram uses name="email" or name="username")
			const usernameInput = page.locator('input[name="email"], input[name="username"]').first();
			await usernameInput.waitFor({ timeout: this.options.timeout });
			await usernameInput.click();
			await usernameInput.type(credentials.username, { delay: 50 });

			// Fill password (Instagram uses name="pass" or name="password")
			const passwordInput = page.locator('input[name="pass"], input[name="password"]').first();
			await passwordInput.click();
			await passwordInput.type(credentials.password, { delay: 50 });

			// Submit login form (Instagram uses a div[role=button] for the login button)
			const loginButton = page.locator('div[role="button"]:has-text("Log in"), button[type="submit"]').first();
			await loginButton.click();

			// Handle 2FA if needed
			await this.handle2FA(page);

			// Handle "Save Login Info" prompt
			await this.dismissPrompt(page, "Not Now");

			// Handle "Turn on Notifications" prompt
			await this.dismissPrompt(page, "Not Now");

			// Wait for home page to confirm login
			await page.waitForSelector('svg[aria-label="Home"]', {
				timeout: this.options.timeout,
			});

			const session = await this.extractSession(context);

			// Save cookies to disk
			await this.saveCookies(context, session.cookies_path);

			return session;
		} finally {
			await browser.close();
		}
	}

	async refreshSession(): Promise<SessionData> {
		const cookies = await this.loadCookies();
		if (!cookies) {
			throw new Error(
				`No saved cookies found at ${this.options.cookiesPath}. Run login() first.`,
			);
		}

		const browser = await this.launchBrowser();
		const context = await this.createContext(browser);

		try {
			await context.addCookies(cookies);
			const page = await context.newPage();
			await page.goto(INSTAGRAM_URL, { waitUntil: "networkidle" });

			// Check if we're still logged in
			try {
				await page.waitForSelector('svg[aria-label="Home"]', { timeout: 10_000 });
			} catch {
				throw new Error("Session expired. Cookies are no longer valid. Run login() again.");
			}

			const session = await this.extractSession(context);
			await this.saveCookies(context, session.cookies_path);
			return session;
		} finally {
			await browser.close();
		}
	}

	private async launchBrowser(): Promise<Browser> {
		return chromium.launch({
			headless: this.options.headless,
			args: [
				"--disable-blink-features=AutomationControlled",
				"--no-sandbox",
				"--disable-setuid-sandbox",
			],
		});
	}

	private async createContext(browser: Browser): Promise<BrowserContext> {
		return browser.newContext({
			viewport: { width: 1920, height: 1080 },
			userAgent: USER_AGENT,
		});
	}

	private async handle2FA(page: Page): Promise<void> {
		// Short wait to see if we land on a 2FA page
		await page.waitForTimeout(2000);

		const url = page.url();
		if (url.includes("challenge") || url.includes("two_factor")) {
			console.log(
				"[BrowserLogin] 2FA required. Please complete verification in the browser window.",
			);
			// Wait for user to complete 2FA and navigate away from challenge page
			await page.waitForURL((url) => {
				const href = url.toString();
				return !href.includes("challenge") && !href.includes("two_factor");
			}, { timeout: 120_000 });
			console.log("[BrowserLogin] 2FA completed.");
		}
	}

	private async dismissCookieConsent(page: Page): Promise<void> {
		try {
			// Instagram/Meta cookie consent buttons
			const consentSelectors = [
				'button:has-text("Allow all cookies")',
				'button:has-text("Allow essential and optional cookies")',
				'button:has-text("Accept All")',
				'button:has-text("Accept")',
				'button:has-text("Decline optional cookies")',
				'button:has-text("Only allow essential cookies")',
			];
			for (const selector of consentSelectors) {
				const btn = page.locator(selector).first();
				try {
					await btn.waitFor({ timeout: 3_000 });
					await btn.click();
					await page.waitForTimeout(1_000);
					return;
				} catch {
					continue;
				}
			}
		} catch {
			// No consent dialog — that's fine
		}
	}

	private async dismissPrompt(page: Page, buttonText: string): Promise<void> {
		try {
			const button = page.getByRole("button", { name: buttonText });
			await button.waitFor({ timeout: 5_000 });
			await button.click();
		} catch {
			// Prompt didn't appear — that's fine
		}
	}

	private async extractSession(context: BrowserContext): Promise<SessionData> {
		const cookies = await context.cookies(INSTAGRAM_URL);
		const cookieMap = new Map(cookies.map((c) => [c.name, c.value]));

		for (const name of REQUIRED_COOKIES) {
			if (!cookieMap.get(name)) {
				throw new Error(
					`Missing required cookie: ${name}. Login may have failed.`,
				);
			}
		}

		return {
			csrftoken: cookieMap.get("csrftoken")!,
			sessionid: cookieMap.get("sessionid")!,
			ds_user_id: cookieMap.get("ds_user_id")!,
			mid: cookieMap.get("mid")!,
			cookies_path: this.options.cookiesPath,
		};
	}

	private async saveCookies(context: BrowserContext, path: string): Promise<void> {
		const cookies = await context.cookies();
		await Bun.write(path, JSON.stringify(cookies, null, 2));
	}

	private async loadCookies(): Promise<Parameters<BrowserContext["addCookies"]>[0] | null> {
		const file = Bun.file(this.options.cookiesPath);
		if (!(await file.exists())) {
			return null;
		}
		try {
			return JSON.parse(await file.text());
		} catch {
			return null;
		}
	}
}
