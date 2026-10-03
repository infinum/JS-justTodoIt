import { Service } from '@tsed/di';
import jwt, { type Secret, type SignOptions } from 'jsonwebtoken';
import { promisify } from 'util';
import {
	EXTEND_TOKEN_REVOCATION_DELAY_S,
	JWT_ACTIVATION_EXPIRATION_TIME_S,
	JWT_EXPIRATION_TIME_S,
	JWT_PASSWORD_RESET_EXPIRATION_TIME_S,
	JWT_SECRET,
} from '../../constants';
import { User } from '../../entities/user';
import { dropExpiredTokens, type ITokenExpirationInfo } from '../../helpers';
import { ITokenData, TokenPurpose } from '../../interfaces/token-data.interface';

const { verify } = jwt;

const signAsync: (
	payload: string | Buffer | object,
	secretOrPrivateKey: Secret,
	options?: SignOptions
) => Promise<string> = promisify(jwt.sign);

@Service()
export class AuthService {
	private revokedTokens: Record<string, ITokenExpirationInfo> = {};

	constructor() {
		this.startExpiredRevokedTokensCleanup();
	}

	createToken(user: User): Promise<string> {
		return this.signToken({
			uuid: user.uuid,
			email: user.email,
			purpose: 'session',
		});
	}

	createActivationToken({ email, uuid }: ITokenData): Promise<string> {
		return this.signToken(
			{
				uuid,
				email,
				purpose: 'activation',
			},
			JWT_ACTIVATION_EXPIRATION_TIME_S
		);
	}

	createPasswordResetToken({ email, uuid }: ITokenData): Promise<string> {
		return this.signToken(
			{
				uuid,
				email,
				purpose: 'password_reset',
			},
			JWT_PASSWORD_RESET_EXPIRATION_TIME_S
		);
	}

	// All tokens share one secret, so the purpose claim is what stops e.g. an activation token working as a session
	async verifyToken(token: string, purpose: TokenPurpose): Promise<false | ITokenData> {
		if (this.isTokenRevoked(token)) {
			return false;
		}

		return new Promise((resolve) => {
			verify(token, JWT_SECRET, (err: Error | null, decoded?: ITokenData) => {
				if (err || !decoded || decoded.purpose !== purpose) {
					resolve(false);
				}

				resolve(decoded);
			});
		});
	}

	revokeToken(token: string, tokenData: ITokenData): void {
		this.revokedTokens[token] = {
			issuedAt: tokenData.iat,
			expiresAt: tokenData.exp,
		};
	}

	extendToken(token: string, tokenData: ITokenData): Promise<string> {
		setTimeout(() => {
			// Make old token valid for a bit longer (in case there are multiple request in progress at the time of token extension)
			this.revokeToken(token, tokenData);
		}, EXTEND_TOKEN_REVOCATION_DELAY_S * 1000);

		delete tokenData.iat;
		delete tokenData.exp;
		return this.signToken({ ...tokenData, purpose: 'session' });
	}

	private signToken(tokenData: ITokenData & { purpose: TokenPurpose }, expiresIn = JWT_EXPIRATION_TIME_S): Promise<string> {
		return signAsync(tokenData, JWT_SECRET, { expiresIn });
	}

	private isTokenRevoked(token: string): boolean {
		return Boolean(this.revokedTokens[token]);
	}

	private startExpiredRevokedTokensCleanup() {
		setInterval(() => {
			this.cleanExpiredRevokedTokens();
		}, (JWT_EXPIRATION_TIME_S / 2) * 1000);
	}

	private cleanExpiredRevokedTokens() {
		this.revokedTokens = dropExpiredTokens(this.revokedTokens);
	}
}
