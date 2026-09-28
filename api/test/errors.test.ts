import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import { createLoggedInUser, getJson, postJson, startServer, uniqueEmail } from './helpers.ts';
import type { TestServer, TestUser } from './helpers.ts';

const LEAK_PATTERN = /SQLITE|SELECT|INSERT|UNIQUE|constraint|\btodo_list\b|\buser\b\./i;

interface ErrorBody {
	code: string;
	message: string;
	requestId: string;
	details?: unknown;
}

async function readError(response: Response): Promise<ErrorBody> {
	const text = await response.text();
	assert.doesNotMatch(text, LEAK_PATTERN, `error body leaks internals: ${text}`);

	const body = JSON.parse(text) as ErrorBody;
	assert.equal(typeof body.code, 'string', `error body has a code: ${text}`);
	assert.equal(typeof body.message, 'string', `error body has a message: ${text}`);
	assert.ok(body.requestId, `error body has a requestId: ${text}`);

	return body;
}

describe('error contract', () => {
	let server: TestServer;
	let user: TestUser;

	before(async () => {
		server = await startServer();
		user = await createLoggedInUser(server);
	});

	after(async () => {
		await server?.stop();
	});

	test('registering an email that is already taken is a 409 with the user-exists code', async () => {
		const email = uniqueEmail();
		await postJson(server, '/auth/register', { email });

		const response = await postJson(server, '/auth/register', { email });

		assert.equal(response.status, 409);
		assert.equal((await readError(response)).code, 'user_with_same_email_exists');
	});

	test('an unknown sort column is a 400 validation error', async () => {
		const response = await getJson(server, '/todo-lists?sortBy=passwordHash', user.cookie);

		assert.equal(response.status, 400);
		const body = await readError(response);
		assert.equal(body.code, 'validation_error');
		assert.ok(body.details, 'validation errors carry details');
	});

	test('an unknown sort direction is a 400 validation error', async () => {
		const response = await getJson(server, '/todo-lists?sortDirection=sideways', user.cookie);

		assert.equal(response.status, 400);
		assert.equal((await readError(response)).code, 'validation_error');
	});

	test('an unknown relation is a 400 with a code', async () => {
		const response = await getJson(server, '/todo-lists?relations=bogus', user.cookie);

		assert.equal(response.status, 400);
		assert.equal((await readError(response)).code, 'invalid_relation');
	});

	test('a unique-constraint violation is a 409 with a resource-specific code', async () => {
		const title = `Groceries ${crypto.randomUUID()}`;
		const first = await postJson(server, '/todo-lists', { title }, user.cookie);
		assert.equal(first.status, 200);

		const response = await postJson(server, '/todo-lists', { title }, user.cookie);

		assert.equal(response.status, 409);
		assert.equal((await readError(response)).code, 'todo_list_with_same_title_exists');
	});

	test('a missing session is a 401 with a code', async () => {
		const response = await getJson(server, '/auth/user');

		assert.equal(response.status, 401);
		assert.equal((await readError(response)).code, 'token_missing');
	});

	test('an invalid request body is a 400 validation error with details', async () => {
		const response = await postJson(server, '/auth/register', { email: 'not-an-email' });

		assert.equal(response.status, 400);
		const body = await readError(response);
		assert.equal(body.code, 'validation_error');
		assert.ok(body.details, 'validation errors carry details');
	});

	test('an unknown todo list is a 404 with a code', async () => {
		const response = await getJson(server, `/todo-lists/${crypto.randomUUID()}`, user.cookie);

		assert.equal(response.status, 404);
		assert.equal((await readError(response)).code, 'not_found');
	});
});
