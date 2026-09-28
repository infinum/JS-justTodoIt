export interface ITokenExpirationInfo {
	issuedAt: number;
	expiresAt: number;
}

/**
 * Keeps only revoked tokens that could still verify. `expiresAt` is a JWT `exp`, in seconds.
 */
export function dropExpiredTokens(
	revokedTokens: Record<string, ITokenExpirationInfo>,
	nowMs = Date.now()
): Record<string, ITokenExpirationInfo> {
	return Object.fromEntries(Object.entries(revokedTokens).filter(([, { expiresAt }]) => expiresAt * 1000 >= nowMs));
}
