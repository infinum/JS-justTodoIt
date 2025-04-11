import { IAuthOptions } from '@tsed/common';

export interface ICustomAuthOptions extends IAuthOptions {
	passToken?: boolean;
	passUser?: boolean;
}
