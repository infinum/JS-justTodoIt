import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import { createLoggedInUser, getJson, patchJson, postJson, startServer } from './helpers.ts';
import type { TestServer, TestUser } from './helpers.ts';

const LEAK_PATTERN = /SQLITE|SELECT|INSERT|UNIQUE|constraint|\btodo_list\b|\buser\b\./i;

interface TodoItem {
	uuid: string;
	title: string;
	done: boolean;
}

interface TodoList {
	uuid: string;
	title: string;
	todos: Array<TodoItem>;
}

function uniqueTitle(prefix = 'Groceries'): string {
	return `${prefix} ${crypto.randomUUID()}`;
}

async function createList(
	server: TestServer,
	user: TestUser,
	title: string,
	todos: Array<{ title: string }> = []
): Promise<TodoList> {
	const response = await postJson(server, '/todo-lists', { title, todos }, user.cookie);
	assert.equal(response.status, 200, `create list: ${await response.clone().text()}`);

	return (await response.json()) as TodoList;
}

async function fetchList(server: TestServer, user: TestUser, uuid: string): Promise<TodoList> {
	const response = await getJson(server, `/todo-lists/${uuid}?relations=todos`, user.cookie);
	assert.equal(response.status, 200, `fetch list: ${await response.clone().text()}`);

	return (await response.json()) as TodoList;
}

async function readErrorCode(response: Response, forbidden: Array<string> = []): Promise<string> {
	const text = await response.text();
	assert.doesNotMatch(text, LEAK_PATTERN, `error body leaks internals: ${text}`);
	for (const value of forbidden) {
		assert.ok(!text.includes(value), `error body leaks "${value}": ${text}`);
	}

	const body = JSON.parse(text) as { code?: unknown };
	assert.equal(typeof body.code, 'string', `error body has a code: ${text}`);

	return body.code as string;
}

describe('todo list rules', () => {
	let server: TestServer;
	let alice: TestUser;
	let bob: TestUser;

	before(async () => {
		server = await startServer();
		alice = await createLoggedInUser(server);
		bob = await createLoggedInUser(server);
	});

	after(async () => {
		await server?.stop();
	});

	test('two users can each own a list with the same title', async () => {
		const title = uniqueTitle();

		await createList(server, alice, title);
		const bobsList = await createList(server, bob, title);

		assert.equal(bobsList.title, title);
	});

	test('the same user creating a title twice is a 409 that says nothing about other users', async () => {
		const title = uniqueTitle();
		await createList(server, bob, title);
		await createList(server, alice, title);

		const response = await postJson(server, '/todo-lists', { title }, alice.cookie);

		assert.equal(response.status, 409);
		assert.equal(await readErrorCode(response, [bob.email]), 'todo_list_with_same_title_exists');
	});

	test('renaming a list to a title the same user already has is a 409', async () => {
		const title = uniqueTitle();
		await createList(server, alice, title);
		const other = await createList(server, alice, uniqueTitle());

		const response = await patchJson(server, `/todo-lists/${other.uuid}`, { title }, alice.cookie);

		assert.equal(response.status, 409);
		assert.equal(await readErrorCode(response), 'todo_list_with_same_title_exists');
	});

	test('patching an unknown list is a 404 with a code', async () => {
		const response = await patchJson(server, `/todo-lists/${crypto.randomUUID()}`, { title: 'x' }, alice.cookie);

		assert.equal(response.status, 404);
		assert.equal(await readErrorCode(response), 'not_found');
	});

	test("patching someone else's list is a 404 and leaves it unchanged", async () => {
		const title = uniqueTitle();
		const bobsList = await createList(server, bob, title, [{ title: 'Milk' }]);

		const response = await patchJson(
			server,
			`/todo-lists/${bobsList.uuid}`,
			{ title: 'Hijacked', todos: [] },
			alice.cookie
		);

		assert.equal(response.status, 404);
		assert.equal(await readErrorCode(response), 'not_found');

		const after = await fetchList(server, bob, bobsList.uuid);
		assert.equal(after.title, title);
		assert.deepEqual(
			after.todos.map(({ title }) => title),
			['Milk']
		);
	});

	test('patching with an item uuid from another list is a 400 and leaves the other list unchanged', async () => {
		const bobsList = await createList(server, bob, uniqueTitle(), [{ title: 'Milk' }]);
		const [bobsItem] = bobsList.todos;
		const alicesList = await createList(server, alice, uniqueTitle(), [{ title: 'Eggs' }]);

		const response = await patchJson(
			server,
			`/todo-lists/${alicesList.uuid}`,
			{ todos: [{ uuid: bobsItem.uuid, title: 'Stolen', done: true }] },
			alice.cookie
		);

		assert.equal(response.status, 400);
		assert.equal(await readErrorCode(response), 'todo_item_not_in_list');

		const bobsAfter = await fetchList(server, bob, bobsList.uuid);
		assert.deepEqual(
			bobsAfter.todos.map(({ uuid, title, done }) => ({ uuid, title, done })),
			[{ uuid: bobsItem.uuid, title: bobsItem.title, done: bobsItem.done }]
		);

		const alicesAfter = await fetchList(server, alice, alicesList.uuid);
		assert.deepEqual(
			alicesAfter.todos.map(({ title }) => title),
			['Eggs'],
			'a rejected PATCH changes nothing'
		);
	});

	test('a new item patched in without `done` is saved as not done', async () => {
		const list = await createList(server, alice, uniqueTitle());

		const response = await patchJson(server, `/todo-lists/${list.uuid}`, { todos: [{ title: 'Bread' }] }, alice.cookie);

		assert.equal(response.status, 200, await response.clone().text());
		const body = (await response.json()) as TodoList;
		assert.equal(body.todos.length, 1);
		assert.equal(body.todos[0].done, false);
	});

	test('an existing item patched without `done` becomes not done (replace-all)', async () => {
		const list = await createList(server, alice, uniqueTitle(), [{ title: 'Bread' }]);
		const [item] = list.todos;

		const doneResponse = await patchJson(
			server,
			`/todo-lists/${list.uuid}`,
			{ todos: [{ uuid: item.uuid, title: 'Bread', done: true }] },
			alice.cookie
		);
		assert.equal(doneResponse.status, 200, await doneResponse.clone().text());

		const response = await patchJson(
			server,
			`/todo-lists/${list.uuid}`,
			{ todos: [{ uuid: item.uuid, title: 'Bread' }] },
			alice.cookie
		);

		assert.equal(response.status, 200, await response.clone().text());
		const after = await fetchList(server, alice, list.uuid);
		assert.deepEqual(
			after.todos.map(({ uuid, done }) => ({ uuid, done })),
			[{ uuid: item.uuid, done: false }]
		);
	});

	test('re-sending an existing item title without its uuid replaces the item', async () => {
		const list = await createList(server, alice, uniqueTitle(), [{ title: 'Milk' }]);

		const response = await patchJson(server, `/todo-lists/${list.uuid}`, { todos: [{ title: 'Milk' }] }, alice.cookie);

		assert.equal(response.status, 200, await response.clone().text());
		const after = await fetchList(server, alice, list.uuid);
		assert.deepEqual(
			after.todos.map(({ title }) => title),
			['Milk']
		);
		assert.notEqual(after.todos[0].uuid, list.todos[0].uuid);
	});

	test('a PATCH rejected for a title conflict keeps the existing items', async () => {
		const title = uniqueTitle();
		await createList(server, alice, title);
		const list = await createList(server, alice, uniqueTitle(), [{ title: 'Milk' }]);

		const response = await patchJson(server, `/todo-lists/${list.uuid}`, { title, todos: [] }, alice.cookie);

		assert.equal(response.status, 409);
		const after = await fetchList(server, alice, list.uuid);
		assert.equal(after.title, list.title);
		assert.deepEqual(
			after.todos.map(({ uuid }) => uuid),
			[list.todos[0].uuid]
		);
	});

	test('PATCH todos replaces the whole item list', async () => {
		const list = await createList(server, alice, uniqueTitle(), [{ title: 'Keep' }, { title: 'Drop' }]);
		const keep = list.todos.find(({ title }) => title === 'Keep');
		assert.ok(keep);

		const response = await patchJson(
			server,
			`/todo-lists/${list.uuid}`,
			{ todos: [{ uuid: keep.uuid, title: 'Keep', done: true }, { title: 'New', done: false }] },
			alice.cookie
		);

		assert.equal(response.status, 200, await response.clone().text());
		const after = await fetchList(server, alice, list.uuid);
		const items = after.todos
			.map(({ title, done }) => ({ title, done }))
			.sort((a, b) => a.title.localeCompare(b.title));
		assert.deepEqual(items, [
			{ title: 'Keep', done: true },
			{ title: 'New', done: false },
		]);
	});

	test('a rename-only PATCH keeps the items', async () => {
		const list = await createList(server, alice, uniqueTitle(), [{ title: 'Milk' }]);
		const title = uniqueTitle('Renamed');

		const response = await patchJson(server, `/todo-lists/${list.uuid}`, { title }, alice.cookie);

		assert.equal(response.status, 200, await response.clone().text());
		const after = await fetchList(server, alice, list.uuid);
		assert.equal(after.title, title);
		assert.deepEqual(
			after.todos.map(({ uuid }) => uuid),
			[list.todos[0].uuid]
		);
	});

	test('a PATCH item without a title is a 400 validation error and leaves the list unchanged', async () => {
		const list = await createList(server, alice, uniqueTitle(), [{ title: 'Milk' }]);

		const response = await patchJson(server, `/todo-lists/${list.uuid}`, { todos: [{ done: true }] }, alice.cookie);

		assert.equal(response.status, 400);
		assert.equal(await readErrorCode(response), 'validation_error');
		const after = await fetchList(server, alice, list.uuid);
		assert.deepEqual(
			after.todos.map(({ title, done }) => ({ title, done })),
			[{ title: 'Milk', done: false }]
		);
	});
});
