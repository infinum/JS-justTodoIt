import { Err, IMiddlewareError, Middleware, Req, Res } from '@tsed/common';
import { Exception } from '@tsed/exceptions';
import { Response } from 'express';

const relationErrorRegEx = /(Relation.*was not found)|(".*" alias was not found)/i;
const uniqueConstraintRegEx = /UNIQUE constraint failed: (.*)/i;
const columnNotFoundRegEx = /(.*) column was not found in the (.*) entity/i

@Middleware()
export class ErrorHandlingMiddleware implements IMiddlewareError {
  use(
    @Err() error: Exception,
    @Req() req: Req,
    @Res() res: Res,
  ): Response {
    let status = error.status || 500;

    if (
      relationErrorRegEx.test(error.message) ||
      uniqueConstraintRegEx.test(error.message) ||
      columnNotFoundRegEx.test(error.message)
    ) {
      status = 400;
    }

    return res.status(status).json({
      requestId: req.id,
      message: error.message,
    });
  }
}
