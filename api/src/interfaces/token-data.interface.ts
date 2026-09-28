export type TokenPurpose = 'session' | 'activation' | 'password_reset';

export interface ITokenData {
	email: string;
	uuid: string;
	purpose?: TokenPurpose;
	iat?: number;
	exp?: number;
}
