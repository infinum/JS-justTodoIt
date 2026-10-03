import type { User } from '../../entities/user';

/**
 * Strips credentials and one-time tokens from a user before it goes into a response.
 * Mutates and returns the same instance.
 */
export function sanitizeUser<T extends User>(user: T): T {
	delete user.passwordHash;
	delete user.activationToken;
	delete user.passwordResetToken;

	return user;
}
