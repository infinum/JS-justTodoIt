import { UseAuth } from '@tsed/common';
import { applyDecorators } from '@tsed/core';
import { Responses, Security } from '@tsed/swagger';
import { ICustomAuthOptions } from '../interfaces/custom-auth-options.interface';
import { AuthMiddleware } from '../middlewares/auth.middleware';

export function Auth(options: ICustomAuthOptions = {
  passToken: true,
}): Function { // eslint-disable-line @typescript-eslint/ban-types
  return applyDecorators(
    UseAuth(AuthMiddleware, options),
    Security('cookieAuth'),
    Responses(401, {description: 'Unauthorized'}),
    Responses(403, {description: 'Forbidden'}),
  );
}
