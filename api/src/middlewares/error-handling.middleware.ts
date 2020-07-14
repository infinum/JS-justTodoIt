import { Err, IMiddlewareError, MiddlewareError, Next, Res } from '@tsed/common';
import { NextFunction, Response } from 'express';

const relationErrorRegEx = /(Relation.*was not found)|(".*" alias was not found)/i;
const uniqueConstraintRegEx = /UNIQUE constraint failed: (.*)/i;
const columnNotFoundRegEx = /(.*) column was not found in the (.*) entity/i

@MiddlewareError()
export class ErrorHandlingMiddleware implements IMiddlewareError {
  use(
    @Err() error: unknown,
    @Res() res: Response,
    @Next() next: NextFunction,
  ): Response | void {
    if (error instanceof Error) {
      if (
        relationErrorRegEx.test(error.message) ||
        uniqueConstraintRegEx.test(error.message) ||
        columnNotFoundRegEx.test(error.message)
      ) {
        return res.status(400).send(error.message);
      }

      console.error(error);
      return res.status(500).send(error.message);
    }

    return next(error);
  }
}
