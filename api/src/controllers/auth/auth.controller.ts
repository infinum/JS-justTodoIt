import { BodyParams, Controller, Get, Post, Req, Res } from '@tsed/common';
import { Returns, Summary } from '@tsed/swagger';
import { Request, Response } from 'express';
import { COOKIE_HTTP_ONLY, COOKIE_SECURE } from '../../constants';
import { Auth } from '../../decorators/auth.decorator';
import { User } from '../../entities/user';
import { ResponseErrorCode } from '../../enums/response-error-code.enum';
import { AuthService } from '../../services/auth/auth.service';
import { UserService } from '../../services/user/user.service';
import { BadRequest, Forbidden } from '@tsed/exceptions';
import { RegisterData, LoginData, PasswordSettingData, RequestPasswordResetData } from './auth-models';

@Controller('/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) { }

  @Post('/register')
  @Summary('Registration')
  @Returns(User)
  async register(
    @BodyParams() { email, password }: RegisterData,
    @Res() res: Response,
  ): Promise<User | Response> {
    let user = await this.userService.fetch({ email });

    if (user) {
      throw new BadRequest(ResponseErrorCode.USER_EXISTS, { email });
    }

    user = await this.userService.create({ email, password });
    res.user = user;

    return user;
  }

  @Post('/login')
  @Summary('Login')
  @Returns(User)
  async login(
    @BodyParams() { email, password, relations }: LoginData,
    @Res() res: Response,
  ): Promise<User> {
    const user = await this.userService.fetch({
      email,
      relations,
      getPasswordHash: true,
    });

    if (!user) {
      throw new Forbidden(ResponseErrorCode.INCORRECT_EMAIL_OR_PASSWORD, { email });
    }

    if (!user.isActivated) {
      throw new Forbidden(ResponseErrorCode.USER_NOT_ACTIVATED, { email });
    }

    const passwordOk = await this.userService.compareHash(password, user.passwordHash);
    delete user.passwordHash;

    if (!passwordOk) {
      throw new Forbidden(ResponseErrorCode.INCORRECT_EMAIL_OR_PASSWORD, { email });
    }

    const token = await this.authService.createToken(user);
    res.cookie('token', token, {
      httpOnly: COOKIE_HTTP_ONLY,
      secure: COOKIE_SECURE,
    });

    res.user = user;

    return user;
  }

  @Post('/logout')
  @Auth({ passUser: true, passToken: true })
  logout(
    @Req() req: Request,
    @Res() res: Response,
  ): void {
    this.authService.revokeToken(req.token, req.tokenData);
    res.clearCookie('token').clearCookie('sessionId').status(204);
  }

  @Post('/activate')
  @Summary('Activation')
  @Returns(User)
  async activate(
    @BodyParams() { token, password }: PasswordSettingData,
    @Res() res: Response,
  ): Promise<User> {
    const activationResult = await this.userService.activate({ token, password });

    if (!activationResult) {
      throw new Forbidden(ResponseErrorCode.ACTIVATION_TOKEN_EXPIRED_OR_INVALID, { token });
    }

    res.user = activationResult;

    return activationResult;
  }

  @Post('/request-password-reset')
  @Summary('Request password reset')
  async requestPasswordReset(
    @BodyParams() { email }: RequestPasswordResetData,
    @Res() res: Response,
  ): Promise<void> {
    const user = await this.userService.fetch({ email, getPasswordHash: true });

    if (!user) {
      throw new Forbidden(ResponseErrorCode.INCORRECT_EMAIL_OR_PASSWORD, { email });
    }

    await this.userService.requestPasswordReset(user);
    res.user = user;

    res.status(204);
  }

  @Post('/reset-password')
  @Summary('Reset password')
  async resetPassword(
    @BodyParams() { token, password }: PasswordSettingData,
    @Res() res: Response,
  ): Promise<User> {
    const resetResult = await this.userService.resetPassword({ token, password });

    if (!resetResult) {
      throw new Forbidden(ResponseErrorCode.PASSWORD_RESET_TOKEN_EXPIRED_OR_INVALID, { token });
    }

    res.user = resetResult;

    return resetResult;
  }

  @Get('/user')
  @Auth({ passUser: true })
  @Summary('Get user data')
  @Returns(User)
  user(
    @Req() req: Request,
  ): User {
    return req.user;
  }
}
