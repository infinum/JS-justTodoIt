import { BodyParams, Controller, Get, Post, Req, Res, QueryParams } from '@tsed/common';
import { Required, Email, Property, Enum, Returns, Summary, Description } from '@tsed/schema';
import { COOKIE_HTTP_ONLY, COOKIE_SECURE } from '../../constants';
import { Auth } from '../../decorators/auth.decorator';
import { User } from '../../entities/user';
import { ResponseErrorCode } from '../../enums/response-error-code.enum';
import { AuthService } from '../../services/auth/auth.service';
import { UserService } from '../../services/user/user.service';
import { BadRequest, Forbidden, NotFound, PreconditionFailed } from '@tsed/exceptions';
import { DemographicProfile } from '../../entities/demographic-profile';
import { Gender } from '../../enums/gender.enum';
import { NewsletterPreferences } from '../../entities/newsletter-preferences';

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

class DemographicProfileSettingData {
  @Required()
  @Enum(Gender)
  gender: Gender;

  @Required()
  age: number;
}

class NewsletterPreferencesSettingData {
  @Required()
  weeklyNewsletter: boolean;

  @Required()
  specialOffers: boolean;
}

@Controller('/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) { }

  @Post('/register')
  @Summary('Registration')
  @Returns(200, User)
  async register(
    @BodyParams() { email, password }: RegisterData,
    @Res() res: Res,
  ): Promise<User> {
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
  @Returns(200, User)
  async login(
    @BodyParams() { email, password }: LoginData,
    @Res() res: Res,
  ): Promise<User> {
    const user = await this.userService.fetch({
      email,
      getPasswordHash: true,
    });

    if (!user) {
      throw new BadRequest(ResponseErrorCode.INCORRECT_EMAIL_OR_PASSWORD);
    }

    if (!user.isActivated) {
      throw new PreconditionFailed(ResponseErrorCode.USER_NOT_ACTIVATED);
    }

    const passwordOk = await this.userService.compareHash(password, user.passwordHash);
    delete user.passwordHash;

    if (!passwordOk) {
      throw new BadRequest(ResponseErrorCode.INCORRECT_EMAIL_OR_PASSWORD);
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
  @Returns(200, User)
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
      res.sendStatus(204);
      return;
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
      throw new BadRequest(ResponseErrorCode.PASSWORD_RESET_TOKEN_EXPIRED_OR_INVALID);
    }

    res.user = resetResult;

    return resetResult;
  }

  @Get('/user')
  @Auth({ passUser: true })
  @Summary('Get user data')
  @Returns(200, User)
  async user(
    @Description('Relationships to load. Possible values: `todoLists`, `todoLists.todos`, `demographicProfile`, `newsletterPreferences`') @QueryParams('relations', String) relations: Array<string>,
    @Req() req: Req,
  ): Promise<User> {
    if (!relations?.length) {
      return req.user;
    }

    return this.userService.fetch({
      uuid: req.user.uuid,
      relations,
    });
  }

  @Get('/demographic-profile')
  @Summary('Get demographic profile')
  @Auth({ passUser: true })
  async getDemographicProfile(
    @Req() req: Req,
  ): Promise<DemographicProfile> {
    const demographicProfile = await this.userService.fetchDemographicProfile(req.user.uuid);

    if (!demographicProfile) {
      throw new NotFound('User has no demographic profile set');
    }

    return demographicProfile;
  }

  @Post('/demographic-profile')
  @Summary('Set demographic profile')
  @Auth({ passUser: true })
  async setDemographicProfile(
    @Req() req: Req,
    @BodyParams() { gender, age }: DemographicProfileSettingData,
  ): Promise<DemographicProfile> {
    const demographicProfile = await this.userService.fetchDemographicProfile(req.user.uuid) ?? new DemographicProfile();

    demographicProfile.gender = gender;
    demographicProfile.age = age;
    await demographicProfile.save();

    req.user.demographicProfile = demographicProfile;
    await req.user.save();

    return req.user.demographicProfile;
  }

  @Get('/newsletter-preferences')
  @Summary('Get newsletter preferences')
  @Auth({ passUser: true })
  async getNewsletterPreferences(
    @Req() req: Req,
  ): Promise<NewsletterPreferences> {
    const newsletterPreferences = await this.userService.fetchNewsletterPreferences(req.user.uuid);

    if (!newsletterPreferences) {
      throw new NotFound('User has no newsletter preferences set');
    }

    return newsletterPreferences;
  }

  @Post('/newsletter-preferences')
  @Summary('Set newsletter preferences')
  @Auth({ passUser: true })
  async setNewsletterPreferences(
    @Req() req: Req,
    @BodyParams() { weeklyNewsletter, specialOffers }: NewsletterPreferencesSettingData,
  ): Promise<NewsletterPreferences> {
    const newsletterPreferences = await this.userService.fetchNewsletterPreferences(req.user.uuid) ?? new NewsletterPreferences();

    newsletterPreferences.weeklyNewsletter = weeklyNewsletter;
    newsletterPreferences.specialOffers = specialOffers;
    await newsletterPreferences.save();

    req.user.newsletterPreferences = newsletterPreferences;
    await req.user.save();

    return req.user.newsletterPreferences;
  }
}
