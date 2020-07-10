import { EndpointInfo, IMiddleware, Middleware, Req, Res } from '@tsed/common';
import { Request, Response } from 'express';
import { getRepository } from 'typeorm';
import { EXTEND_TOKEN_DURATION_AUTOMATICALLY, EXTEND_TOKEN_FREQUENCY_S, JWT_EXPIRATION_TIME_S } from '../constants';
import { ResponseErrorCode } from '../enums/response-error-code.enum';
import { ICustomAuthOptions } from '../interfaces/custom-auth-options.interface';
import { AuthService } from '../services/auth/auth.service';
import { UserService } from '../services/user/user.service';
import { Unauthorized, Forbidden } from '@tsed/exceptions';

@Middleware()
export class AuthMiddleware implements IMiddleware {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  async use(
    @Req() req: Request,
    @Res() res: Response,
    @EndpointInfo() endpoint: EndpointInfo,
  ): Promise<void> {
    const options: ICustomAuthOptions = endpoint.get(AuthMiddleware);

    const token = req.cookies.token;

    if (!token) {
      throw new Unauthorized(ResponseErrorCode.TOKEN_MISSING);
    }

    const tokenData = await this.authService.verifyToken(token);

    if (!tokenData) {
      throw new Forbidden(ResponseErrorCode.TOKEN_INVALID);
    } else if (EXTEND_TOKEN_DURATION_AUTOMATICALLY) {
      const tokenExpiresIn = tokenData.exp - Date.now() / 1000;
      // Do not extend token more often than every EXTEND_TOKEN_FREQUENCY_S seconds
      if (tokenExpiresIn < JWT_EXPIRATION_TIME_S - EXTEND_TOKEN_FREQUENCY_S) {
        res.cookie('token', await this.authService.extendToken(token, tokenData));
      }
    }

    if (options.passToken) {
      req.token = token;
      req.tokenData = tokenData;
    }

    let relations = [];
    let userRelations: Array<string> = [];
    if (req.query.relations) {
      relations = (req.query.relations as string)
        .split(',')
        .map((r: string) => r.trim());
      userRelations = relations
        .filter((r: string) => /^user/.test(r));
    }
    // TODO: check if I want this:
    // req.query.relations = relations.filter((r: string) => !userRelations.includes(r)).join(',');
    // if (req.query.relations === '') {
    //   delete req.query.relations;
    // }

    const user = await this.userService.fetch({ uuid: tokenData.uuid, relations: userRelations });
    if (!user) {
      throw new Forbidden(ResponseErrorCode.TOKEN_INVALID, { email: tokenData.email });
    }

    if (options.passUser || options.ownerCheck) {
      req.user = user;
    }

    if (options.ownerCheck) {
      const identifierFieldName = options.ownerCheck.identifierFieldName || 'uuid';
      const ownerFieldName = options.ownerCheck.ownerFieldName || 'user';
      const entity = await getRepository(options.ownerCheck.entityClass).findOne({
        where: {
          [identifierFieldName]: options.ownerCheck.getIdentifier(req),
          [ownerFieldName]: req.user,
        },
        relations: options.ownerCheck.relations,
      });

      if (!entity) {
        throw new Forbidden(ResponseErrorCode.ENTITY_ACCESS_FORBIDDEN, { email: user.email });
      }

      req.entity = entity;
    }
  }
}
