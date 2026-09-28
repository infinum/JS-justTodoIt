import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { after, before, describe, test } from 'node:test';
import { createLoggedInUser, getJson, postJson, startServer, uniqueEmail } from './helpers.ts';
import type { TestServer } from './helpers.ts';

const TEN_DAYS_S = 60 * 60 * 24 * 10;
const TEST_JWT_SECRET = 'test-secret';

function base64url(value: string | Buffer): string {
	return Buffer.from(value).toString('base64url');
}

/** HS256 JWT signed with the test server's secret, so tests can mint expired or stale tokens. */
function signToken(payload: Record<string, unknown>): string {
	const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
	const body = base64url(JSON.stringify(payload));
	const signature = createHmac('sha256', TEST_JWT_SECRET).update(`${header}.${body}`).digest('base64url');

	return `${header}.${body}.${signature}`;
}

function decodeTokenPayload(cookie: string): Record<string, unknown> {
	const token = cookie.slice(cookie.indexOf('=') + 1);

	return JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
}

function getSetCookieHeader(response: Response, name: string): string | undefined {
	return response.headers.getSetCookie().find((header) => header.startsWith(`${name}=`));
}

function cookieAttributes(header: string): Map<string, string> {
	return new Map(
		header
			.split(';')
			.slice(1)
			.map((part) => {
				const [key, ...value] = part.trim().split('=');
				return [key.toLowerCase(), value.join('=')];
			})
	);
}

function assertSessionCookieFlags(header: string | undefined): void {
	assert.ok(header, 'response sets the token cookie');
	const attributes = cookieAttributes(header);

	assert.ok(attributes.has('httponly'), 'cookie is HttpOnly');
	assert.equal(attributes.get('samesite')?.toLowerCase(), 'lax');
	assert.equal(attributes.get('path'), '/');
	assert.equal(attributes.get('max-age'), String(TEN_DAYS_S));
	// The test server runs with COOKIE_SECURE=false
	assert.ok(!attributes.has('secure'), 'cookie follows COOKIE_SECURE');
}

async function assertUnauthorized(response: Response): Promise<void> {
	assert.equal(response.status, 401);
	const body = await response.json();
	assert.equal(typeof body.code, 'string');
}

describe('auth contract', () => {
	let server: TestServer;

	before(async () => {
		server = await startServer();
	});

	after(async () => {
		await server?.stop();
	});

	describe('session cookie', () => {
		test('login sets the token cookie with the session flags', async () => {
			const { email, password } = await createLoggedInUser(server);

			const response = await postJson(server, '/auth/login', { email, password });

			assert.equal(response.status, 200);
			assertSessionCookieFlags(getSetCookieHeader(response, 'token'));
		});

		test('a token refresh keeps the same cookie flags', async () => {
			const { email, cookie } = await createLoggedInUser(server);
			const { uuid } = decodeTokenPayload(cookie);
			// Issued two hours ago, so the middleware extends it (refresh happens after one hour)
			const iat = Math.floor(Date.now() / 1000) - 2 * 60 * 60;
			const staleToken = signToken({ uuid, email, iat, exp: iat + TEN_DAYS_S });

			const response = await getJson(server, '/auth/user', `token=${staleToken}`);

			assert.equal(response.status, 200);
			assertSessionCookieFlags(getSetCookieHeader(response, 'token'));
		});

		test('logout returns 204 and clears the cookie with matching options', async () => {
			const { cookie } = await createLoggedInUser(server);

			const response = await postJson(server, '/auth/logout', {}, cookie);

			assert.equal(response.status, 204);
			const header = getSetCookieHeader(response, 'token');
			assert.ok(header, 'logout sets a clearing token cookie');
			const attributes = cookieAttributes(header);
			assert.ok(header.startsWith('token=;'), 'cookie value is emptied');
			assert.ok(attributes.has('httponly'));
			assert.equal(attributes.get('samesite')?.toLowerCase(), 'lax');
			assert.equal(attributes.get('path'), '/');
			assert.ok(new Date(attributes.get('expires') ?? '').getTime() <= Date.now(), 'cookie is expired');

			const afterLogout = await getJson(server, '/auth/user', cookie);
			await assertUnauthorized(afterLogout);
		});
	});

	describe('authentication failures are 401', () => {
		test('missing token', async () => {
			await assertUnauthorized(await getJson(server, '/auth/user'));
		});

		test('garbage token', async () => {
			await assertUnauthorized(await getJson(server, '/auth/user', 'token=not-a-jwt'));
		});

		test('expired token', async () => {
			const { email, cookie } = await createLoggedInUser(server);
			const { uuid } = decodeTokenPayload(cookie);
			const iat = Math.floor(Date.now() / 1000) - 120;
			const expiredToken = signToken({ uuid, email, iat, exp: iat + 60 });

			await assertUnauthorized(await getJson(server, '/auth/user', `token=${expiredToken}`));
		});

		test('token for a user that no longer exists', async () => {
			const token = signToken({
				uuid: '00000000-0000-4000-8000-000000000000',
				email: uniqueEmail(),
				iat: Math.floor(Date.now() / 1000),
				exp: Math.floor(Date.now() / 1000) + 60,
			});

			await assertUnauthorized(await getJson(server, '/auth/user', `token=${token}`));
		});

		test('wrong password', async () => {
			const { email } = await createLoggedInUser(server);

			await assertUnauthorized(await postJson(server, '/auth/login', { email, password: 'wrong password' }));
		});

		test('unknown email', async () => {
			await assertUnauthorized(await postJson(server, '/auth/login', { email: uniqueEmail(), password: 'whatever' }));
		});

		test('not-activated user with a wrong password does not reveal the account', async () => {
			const email = uniqueEmail();
			await postJson(server, '/auth/register', { email });

			await assertUnauthorized(await postJson(server, '/auth/login', { email, password: 'wrong password' }));
		});
	});

	test('request-password-reset responds 204 for a known user', async () => {
		const { email } = await createLoggedInUser(server);

		const response = await postJson(server, '/auth/request-password-reset', { email });

		assert.equal(response.status, 204);
	});
});
