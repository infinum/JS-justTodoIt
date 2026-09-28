import type { CookieOptions, Response } from 'express';
import { COOKIE_HTTP_ONLY, COOKIE_SECURE, JWT_EXPIRATION_TIME_S } from '../../constants';

export const SESSION_COOKIE_NAME = 'token';

// Shared by set and clear: browsers only drop a cookie when path/domain/flags match the ones it was set with
const sessionCookieOptions: CookieOptions = {
	httpOnly: COOKIE_HTTP_ONLY,
	secure: COOKIE_SECURE,
	sameSite: 'lax',
	path: '/',
};

export function setSessionCookie(res: Response, token: string): void {
	res.cookie(SESSION_COOKIE_NAME, token, {
		...sessionCookieOptions,
		maxAge: JWT_EXPIRATION_TIME_S * 1000,
	});
}

export function clearSessionCookie(res: Response): void {
	res.clearCookie(SESSION_COOKIE_NAME, sessionCookieOptions);
}
