import { Err, IMiddlewareError, MiddlewareError, Next, Res } from '@tsed/common';
import { NextFunction, Response } from 'express';

const relationErrorRegEx = /(Relation.*was not found)|(".*" alias was not found)/i;

@MiddlewareError()
export class UnknownRelationMiddleware implements IMiddlewareError {
  use(
    @Err() error: unknown,
    @Res() res: Response,
    @Next() next: NextFunction,
  ): Response | void {
    if (error instanceof Error && relationErrorRegEx.test(error.message)) {
      return res.status(400).send(error.message);
    }

    return next(error);
  }
}
