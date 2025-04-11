import { Service } from '@tsed/di';
import { Secret, sign, SignOptions, verify } from 'jsonwebtoken';
import { promisify } from 'util';
import {
	EXTEND_TOKEN_REVOCATION_DELAY_S,
	JWT_ACTIVATION_EXPIRATION_TIME_S,
	JWT_EXPIRATION_TIME_S,
	JWT_PASSWORD_RESET_EXPIRATION_TIME_S,
	JWT_SECRET,
} from '../../constants';
import { User } from '../../entities/user';
import { ITokenData } from '../../interfaces/token-data.interface';

const signAsync: (
	payload: string | Buffer | object, // eslint-disable-line @typescript-eslint/ban-types
	secretOrPrivateKey: Secret,
	options?: SignOptions
) => Promise<string> = promisify(sign);

interface ITokenExpirationInfo {
	issuedAt: number;
	expiresAt: number;
}

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
		});
	}

	createActivationToken({ email, uuid }: ITokenData): Promise<string> {
		return this.signToken(
			{
				uuid,
				email,
			},
			JWT_ACTIVATION_EXPIRATION_TIME_S
		);
	}

	createPasswordResetToken({ email, uuid }: ITokenData): Promise<string> {
		return this.signToken(
			{
				uuid,
				email,
			},
			JWT_PASSWORD_RESET_EXPIRATION_TIME_S
		);
	}

	async verifyToken(token: string): Promise<false | ITokenData> {
		if (this.isTokenRevoked(token)) {
			return false;
		}

		return new Promise((resolve) => {
			verify(token, JWT_SECRET, (err, decoded: ITokenData) => {
				if (err || !decoded) {
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
		return this.signToken(tokenData);
	}

	private signToken(tokenData: ITokenData, expiresIn = JWT_EXPIRATION_TIME_S): Promise<string> {
		return signAsync(tokenData, JWT_SECRET, { expiresIn });
	}

	private isTokenRevoked(token: string): boolean {
		return Boolean(this.revokedTokens[token]);
	}

	private startExpiredRevokedTokensCleanup() {
		setInterval(
			() => {
				this.cleanExpiredRevokedTokens();
			},
			(JWT_EXPIRATION_TIME_S / 2) * 1000
		);
	}

	private cleanExpiredRevokedTokens() {
		this.revokedTokens = Object.keys(this.revokedTokens).reduce(
			(acc: Record<string, ITokenExpirationInfo>, cur: string) => {
				const tokenExpirationInfo = this.revokedTokens[cur];
				if (tokenExpirationInfo.expiresAt >= Date.now()) {
					acc[cur] = tokenExpirationInfo;
				}

				return acc;
			},
			{}
		);
	}
}
