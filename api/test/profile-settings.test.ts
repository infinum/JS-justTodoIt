import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import { createLoggedInUser, getJson, postJson, startServer } from './helpers.ts';
import type { TestServer } from './helpers.ts';

const settings = [
	{
		path: '/auth/demographic-profile',
		relation: 'demographicProfile',
		valid: { gender: 'other', age: 30 },
		updated: { gender: 'female', age: 31 },
		invalid: { gender: 'nope', age: 30 },
	},
	{
		path: '/auth/newsletter-preferences',
		relation: 'newsletterPreferences',
		valid: { weeklyNewsletter: true, specialOffers: false },
		updated: { weeklyNewsletter: false, specialOffers: true },
		invalid: { weeklyNewsletter: true },
	},
];

describe('profile settings', () => {
	let server: TestServer;

	before(async () => {
		server = await startServer();
	});

	after(async () => {
		await server?.stop();
	});

	for (const setting of settings) {
		describe(setting.path, () => {
			test('requires a session', async () => {
				const getResponse = await getJson(server, setting.path);
				assert.equal(getResponse.status, 401);

				const postResponse = await postJson(server, setting.path, setting.valid);
				assert.equal(postResponse.status, 401);
			});

			test('returns 404 before anything is set', async () => {
				const { cookie } = await createLoggedInUser(server);

				const response = await getJson(server, setting.path, cookie);
				assert.equal(response.status, 404);
				const body = await response.json();
				assert.equal(typeof body.code, 'string');
				assert.equal(typeof body.message, 'string');
			});

			test('can be set, read back and updated', async () => {
				const { cookie } = await createLoggedInUser(server);

				const setResponse = await postJson(server, setting.path, setting.valid, cookie);
				assert.equal(setResponse.status, 200);
				assert.deepEqual(pick(await setResponse.json(), setting.valid), setting.valid);

				const getResponse = await getJson(server, setting.path, cookie);
				assert.equal(getResponse.status, 200);
				assert.deepEqual(pick(await getResponse.json(), setting.valid), setting.valid);

				const updateResponse = await postJson(server, setting.path, setting.updated, cookie);
				assert.equal(updateResponse.status, 200);

				const userResponse = await getJson(server, `/auth/user?relations=${setting.relation}`, cookie);
				assert.equal(userResponse.status, 200);
				const user = await userResponse.json();
				assert.deepEqual(pick(user[setting.relation], setting.updated), setting.updated);
				assert.equal(user.password, undefined);
			});

			test('rejects an invalid body with 400', async () => {
				const { cookie } = await createLoggedInUser(server);

				const response = await postJson(server, setting.path, setting.invalid, cookie);
				assert.equal(response.status, 400);
				const body = await response.json();
				assert.equal(typeof body.code, 'string');
			});
		});
	}
});

function pick(source: Record<string, unknown>, shape: Record<string, unknown>): Record<string, unknown> {
	return Object.fromEntries(Object.keys(shape).map((key) => [key, source[key]]));
}
