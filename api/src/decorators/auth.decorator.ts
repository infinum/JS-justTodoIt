import { UseAuth } from '@tsed/common';
import { useDecorators } from '@tsed/core';
import { Returns, Security } from '@tsed/schema';
import { ICustomAuthOptions } from '../interfaces/custom-auth-options.interface';
import { AuthMiddleware } from '../middlewares/auth.middleware';

export function Auth(
	options: ICustomAuthOptions = {
		passToken: true,
	}
): Function {
	// eslint-disable-line @typescript-eslint/ban-types
	return useDecorators(
		UseAuth(AuthMiddleware, options),
		Security('cookieAuth'),
		Returns(401).Description('Unauthorized'),
		Returns(403).Description('Forbidden')
	);
}
