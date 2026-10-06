import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import { getCookie, postJson, readActivationToken, startServer, uniqueEmail } from './helpers.ts';
import type { TestServer } from './helpers.ts';

describe('auth', () => {
	let server: TestServer;

	before(async () => {
		server = await startServer();
	});

	after(async () => {
		await server?.stop();
	});

	test('a registered user can activate their account and log in', async () => {
		const email = uniqueEmail();
		const password = 'correct horse battery staple';

		const registerResponse = await postJson(server, '/auth/register', { email });
		assert.equal(registerResponse.status, 200);

		const token = readActivationToken(server, email);
		const activateResponse = await postJson(server, '/auth/activate', { token, password });
		assert.equal(activateResponse.status, 200);

		const loginResponse = await postJson(server, '/auth/login', { email, password });
		assert.equal(loginResponse.status, 200);
		assert.ok(getCookie(loginResponse, 'token'), 'login sets a token cookie');
	});
});
