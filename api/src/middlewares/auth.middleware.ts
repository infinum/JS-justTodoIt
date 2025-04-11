import { EndpointInfo, IMiddleware, Middleware, Req, Res } from '@tsed/common';
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
		private readonly userService: UserService
	) {}

	async use(@Req() req: Req, @Res() res: Res, @EndpointInfo() endpoint: EndpointInfo): Promise<void> {
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

		const user = await this.userService.fetch({ uuid: tokenData.uuid });
		if (!user) {
			throw new Forbidden(ResponseErrorCode.TOKEN_INVALID, { email: tokenData.email });
		}

		if (options.passUser) {
			req.user = user;
		}
	}
}
