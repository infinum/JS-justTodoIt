import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import { createLoggedInUser, getJson, postJson, startServer } from './helpers.ts';
import type { TestServer, TestUser } from './helpers.ts';

// Checks the claims README §4 makes that other test files don't already cover

interface TodoList {
	uuid: string;
	title: string;
	created: string;
	todos?: Array<{ uuid: string; title: string; done: boolean }>;
}

async function listTitles(server: TestServer, user: TestUser, query: string): Promise<Array<string>> {
	const response = await getJson(server, `/todo-lists${query}`, user.cookie);
	assert.equal(response.status, 200, await response.clone().text());

	return ((await response.json()) as Array<TodoList>).map(({ title }) => title);
}

describe('README API claims', () => {
	let server: TestServer;
	let user: TestUser;
	// Created in this order, so `created DESC` (the default) returns them reversed
	const titles = ['List 01', 'List 02', 'List 03', 'List 04', 'List 05', 'List 06', 'List 07', 'Shopping'];

	before(async () => {
		server = await startServer();
		user = await createLoggedInUser(server);

		for (const title of titles) {
			const response = await postJson(server, '/todo-lists', { title, todos: [{ title: 'Item' }] }, user.cookie);
			assert.equal(response.status, 200, await response.clone().text());
			// `created` has millisecond precision; keep the default ordering deterministic
			await new Promise((resolve) => setTimeout(resolve, 5));
		}
	});

	after(async () => {
		await server?.stop();
	});

	test('the total count is only in X-TOTAL-COUNT, and the default page is the first 5, newest first', async () => {
		const response = await getJson(server, '/todo-lists', user.cookie);

		assert.equal(response.status, 200);
		assert.equal(response.headers.get('x-total-count'), String(titles.length));
		const body = (await response.json()) as Array<TodoList>;
		assert.ok(Array.isArray(body), 'body is a bare array, no count wrapper');
		assert.deepEqual(
			body.map(({ title }) => title),
			[...titles].reverse().slice(0, 5)
		);
	});

	test('pages are 1-indexed', async () => {
		const query = '?sortBy=title&sortDirection=ASC&pageSize=3';

		assert.deepEqual(await listTitles(server, user, `${query}&pageNumber=1`), ['List 01', 'List 02', 'List 03']);
		assert.deepEqual(await listTitles(server, user, `${query}&pageNumber=3`), ['List 07', 'Shopping']);
		assert.deepEqual(await listTitles(server, user, `${query}&pageNumber=4`), []);
	});

	test('sortDirection is uppercase; lowercase is a 400 validation error', async () => {
		assert.deepEqual((await listTitles(server, user, '?sortBy=title&sortDirection=DESC&pageSize=1'))[0], 'Shopping');

		const response = await getJson(server, '/todo-lists?sortDirection=asc', user.cookie);
		assert.equal(response.status, 400);
		assert.equal(((await response.json()) as { code: string }).code, 'validation_error');
	});

	test('title filters by substring and X-TOTAL-COUNT counts the filtered set', async () => {
		const response = await getJson(server, '/todo-lists?title=shop', user.cookie);

		assert.equal(response.headers.get('x-total-count'), '1');
		assert.deepEqual(
			((await response.json()) as Array<TodoList>).map(({ title }) => title),
			['Shopping']
		);
	});

	test('items are only included with relations=todos', async () => {
		const [withoutItems] = (await (
			await getJson(server, '/todo-lists?pageSize=1', user.cookie)
		).json()) as Array<TodoList>;
		assert.equal(withoutItems.todos, undefined);

		const [withItems] = (await (
			await getJson(server, '/todo-lists?pageSize=1&relations=todos', user.cookie)
		).json()) as Array<TodoList>;
		assert.deepEqual(
			withItems.todos?.map(({ title, done }) => ({ title, done })),
			[{ title: 'Item', done: false }]
		);
	});

	test('the count header is readable cross-origin from FRONTEND_URL', async () => {
		const response = await fetch(`${server.baseUrl}/todo-lists`, {
			headers: { Accept: 'application/json', Cookie: user.cookie, Origin: 'http://localhost:3000' },
		});

		assert.equal(response.headers.get('access-control-allow-origin'), 'http://localhost:3000');
		assert.equal(response.headers.get('access-control-allow-credentials'), 'true');
		assert.match(response.headers.get('access-control-expose-headers') ?? '', /X-TOTAL-COUNT/i);
	});

	test('deleting a list is a 204, even for an unknown uuid', async () => {
		const created = (await (await postJson(server, '/todo-lists', { title: 'Doomed' }, user.cookie)).json()) as TodoList;

		const deleteList = (uuid: string) =>
			fetch(`${server.baseUrl}/todo-lists/${uuid}`, { method: 'DELETE', headers: { Cookie: user.cookie } });

		assert.equal((await deleteList(created.uuid)).status, 204);
		assert.equal((await getJson(server, `/todo-lists/${created.uuid}`, user.cookie)).status, 404);
		assert.equal((await deleteList(crypto.randomUUID())).status, 204);
	});

	test('GET /auth/user returns the logged-in user', async () => {
		const response = await getJson(server, '/auth/user', user.cookie);

		assert.equal(response.status, 200);
		assert.equal(((await response.json()) as { email: string }).email, user.email);
	});
});
