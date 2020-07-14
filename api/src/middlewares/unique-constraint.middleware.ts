import { Err, IMiddlewareError, MiddlewareError, Next, Res } from '@tsed/common';
import { NextFunction, Response } from 'express';

const uniqueConstraintRegEx = /UNIQUE constraint failed: (.*)/i;

@MiddlewareError()
export class UniqueConstraintMiddleware implements IMiddlewareError {
  use(
    @Err() error: unknown,
    @Res() res: Response,
    @Next() next: NextFunction,
  ): Response | void {
    if (error instanceof Error && uniqueConstraintRegEx.test(error.message)) {
      return res.status(400).send(error.message);
    }

    return next(error);
  }
}
