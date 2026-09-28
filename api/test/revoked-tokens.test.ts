import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { dropExpiredTokens } from '../src/helpers/revoked-tokens/index.ts';

// JWT `iat`/`exp` are in seconds, so the cleanup must compare against seconds too
describe('revoked token cleanup', () => {
	const nowS = 1_800_000_000;

	test('keeps revoked tokens that have not expired yet', () => {
		const revoked = { live: { issuedAt: nowS - 60, expiresAt: nowS + 60 } };

		assert.deepEqual(dropExpiredTokens(revoked, nowS * 1000), revoked);
	});

	test('drops revoked tokens that have expired', () => {
		const revoked = {
			expired: { issuedAt: nowS - 120, expiresAt: nowS - 60 },
			live: { issuedAt: nowS - 60, expiresAt: nowS + 60 },
		};

		assert.deepEqual(Object.keys(dropExpiredTokens(revoked, nowS * 1000)), ['live']);
	});
});
