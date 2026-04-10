import { homedir } from "node:os";
import { join, dirname } from "node:path";
import {
	existsSync,
	mkdirSync,
	unlinkSync,
	readFileSync,
	writeFileSync,
} from "node:fs";
import type { SessionData } from "./types";

const SESSION_DIR = join(homedir(), ".instagram-scrapper");
const SESSION_PATH = join(SESSION_DIR, "session.json");

export class SessionManager {
	private sessionPath: string;

	constructor(sessionPath?: string) {
		this.sessionPath = sessionPath ?? SESSION_PATH;
	}

	saveSession(data: SessionData): void {
		const dir = dirname(this.sessionPath);
		if (!existsSync(dir)) {
			mkdirSync(dir, { recursive: true });
		}
		writeFileSync(this.sessionPath, JSON.stringify(data, null, 2));
	}

	loadSession(): SessionData | null {
		if (!existsSync(this.sessionPath)) {
			return null;
		}
		try {
			const raw = JSON.parse(readFileSync(this.sessionPath, "utf-8"));
			if (raw.csrftoken && raw.sessionid && raw.ds_user_id && raw.mid) {
				return raw as SessionData;
			}
			return null;
		} catch {
			return null;
		}
	}

	async isSessionValid(session: SessionData): Promise<boolean> {
		try {
			const response = await fetch(
				"https://www.instagram.com/api/v1/users/web_profile_info/?username=instagram",
				{
					headers: buildHeaders(session),
					redirect: "manual",
				},
			);
			return response.status === 200;
		} catch {
			return false;
		}
	}

	clearSession(): void {
		if (existsSync(this.sessionPath)) {
			unlinkSync(this.sessionPath);
		}
	}
}

export function buildCookieString(session: SessionData): string {
	return `csrftoken=${session.csrftoken}; sessionid=${session.sessionid}; ds_user_id=${session.ds_user_id}; mid=${session.mid}`;
}

export function buildHeaders(session: SessionData): Record<string, string> {
	return {
		Cookie: buildCookieString(session),
		"X-Csrftoken": session.csrftoken,
		"X-Ig-App-Id": "936619743392459",
		"X-Requested-With": "XMLHttpRequest",
		"User-Agent":
			"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
		Referer: "https://www.instagram.com/",
	};
}
