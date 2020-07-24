import { BodyParams, Controller, Get, Post, Req, Res, Required, Email, Property } from '@tsed/common';
import { Returns, Summary, Description } from '@tsed/swagger';
import { COOKIE_HTTP_ONLY, COOKIE_SECURE } from '../../constants';
import { Auth } from '../../decorators/auth.decorator';
import { User } from '../../entities/user';
import { ResponseErrorCode } from '../../enums/response-error-code.enum';
import { AuthService } from '../../services/auth/auth.service';
import { UserService } from '../../services/user/user.service';
import { BadRequest, Forbidden } from '@tsed/exceptions';

class RegisterData {
  @Required()
  @Email()
  email: string;

  @Property()
  @Description('User will automatically be activated if password is set during registration')
  password: string;
}

class LoginData {
  @Required()
  @Email()
  email: string;

  @Required()
  password: string;
}

class PasswordSettingData {
  @Required()
  token: string;

  @Required()
  password: string;
}

class RequestPasswordResetData {
  @Required()
  @Email()
  email: string;
}


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
    @Res() res: Res,
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
    @BodyParams() { email, password }: LoginData,
    @Res() res: Res,
  ): Promise<User> {
    const user = await this.userService.fetch({
      email,
      getPasswordHash: true,
    });

    if (!user) {
      throw new Forbidden(ResponseErrorCode.INCORRECT_EMAIL_OR_PASSWORD);
    }

    if (!user.isActivated) {
      throw new Forbidden(ResponseErrorCode.USER_NOT_ACTIVATED);
    }

    const passwordOk = await this.userService.compareHash(password, user.passwordHash);
    delete user.passwordHash;

    if (!passwordOk) {
      throw new Forbidden(ResponseErrorCode.INCORRECT_EMAIL_OR_PASSWORD);
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
  @Summary('Logout')
  @Auth({ passUser: true, passToken: true })
  logout(
    @Req() req: Req,
    @Res() res: Res,
  ): void {
    this.authService.revokeToken(req.token, req.tokenData);
    res.clearCookie('token').clearCookie('sessionId').status(204);
  }

  @Post('/activate')
  @Summary('Activation')
  @Returns(User)
  async activate(
    @BodyParams() { token, password }: PasswordSettingData,
    @Res() res: Res,
  ): Promise<User> {
    const activationResult = await this.userService.activate({ token, password });

    if (!activationResult) {
      throw new Forbidden(ResponseErrorCode.ACTIVATION_TOKEN_EXPIRED_OR_INVALID);
    }

    res.user = activationResult;

    return activationResult;
  }

  @Post('/request-password-reset')
  @Summary('Request password reset')
  async requestPasswordReset(
    @BodyParams() { email }: RequestPasswordResetData,
    @Res() res: Res,
  ): Promise<void> {
    const user = await this.userService.fetch({ email, getPasswordHash: true });

    if (!user) {
      throw new Forbidden(ResponseErrorCode.INCORRECT_EMAIL_OR_PASSWORD);
    }

    await this.userService.requestPasswordReset(user);
    res.user = user;

    res.status(204);
  }

  @Post('/reset-password')
  @Summary('Reset password')
  async resetPassword(
    @BodyParams() { token, password }: PasswordSettingData,
    @Res() res: Res,
  ): Promise<User> {
    const resetResult = await this.userService.resetPassword({ token, password });

    if (!resetResult) {
      throw new Forbidden(ResponseErrorCode.PASSWORD_RESET_TOKEN_EXPIRED_OR_INVALID);
    }

    res.user = resetResult;

    return resetResult;
  }

  @Get('/user')
  @Auth({ passUser: true })
  @Summary('Get user data')
  @Returns(User)
  user(
    @Req() req: Req,
  ): User {
    return req.user;
  }
}
