import { Service } from '@tsed/di';
import { compare, hash } from 'bcrypt';
import { FRONTEND_URL } from '../../constants';
import { User } from '../../entities/user';
import { ResponseErrorCode } from '../../enums/response-error-code.enum';
import { loadDeepRelation } from '../../helpers';
import { IPasswordSettingData } from '../../interfaces/password-setting-data.interface';
import { IRegistrationData } from '../../interfaces/registration-data.interface';
import { AuthService } from '../auth/auth.service';
import { EmailService } from '../email/email.service';
import { InternalServerError, BadRequest } from '@tsed/exceptions';
import { DemographicProfile } from '../../entities/demographic-profile';
import { NewsletterPreferences } from '../../entities/newsletter-preferences';

interface IUserFetchingOptions {
  email?: string;
  uuid?: string;
  getPasswordHash?: boolean;
  getActivationToken?: boolean;
  getPasswordResetToken?: boolean;
  relations?: Array<string>;
}

@Service()
export class UserService {
  private readonly SALT_ROUNDS = 10;
  private readonly userRepository = User.getRepository();

  constructor(
    private readonly authService: AuthService,
    private readonly emailService: EmailService,
  ) { }

  async create(registrationData: IRegistrationData): Promise<User> {
    let user = new User();
    user.email = registrationData.email;

    if (registrationData.password) {
      user.passwordHash = await this.generateHash(registrationData.password);
    } else {
      user = await user.save();

      const activationToken = await this.createActivationToken(user);
      await this.sendActivationEmail(user.email, activationToken);
    }

    return user.save();
  }

  async createActivationToken(user: User): Promise<string> {
    const activationToken = await this.authService.createActivationToken({
      email: user.email,
      uuid: user.uuid,
    });

    user.activationToken = activationToken;

    return activationToken;
  }

  async sendActivationEmail(email: string, activationToken: string): Promise<void> {
    const activationLink = `${FRONTEND_URL}/activate-account?token=${activationToken}`;

    return this.emailService.sendEmail({
      to: email,
      subject: 'Learn Angular: Account activation link',
      content: {
        plain: activationLink,
        html: `<a href="${activationLink}">${activationLink}</a>`,
      },
    });
  }

  async activate(activationData: IPasswordSettingData): Promise<false | User> {
    const tokenData = await this.authService.verifyToken(activationData.token);

    if (!tokenData) {
      return false;
    }

    const email = tokenData.email;

    const user = await this.fetch({ email, getActivationToken: true });

    if (user.activationToken !== activationData.token) {
      return false;
    }

    user.passwordHash = await this.generateHash(activationData.password);
    user.activationToken = null;

    return user.save();
  }

  async requestPasswordReset(user: User): Promise<void> {
    const passwordResetToken = await this.authService.createPasswordResetToken({
      email: user.email,
      uuid: user.uuid,
    });
    user.passwordResetToken = passwordResetToken;

    const passwordResetLink = `${FRONTEND_URL}/reset-password?token=${passwordResetToken}`;

    this.emailService.sendEmail({
      to: user.email,
      subject: 'Learn Angular: Password reset link',
      content: {
        plain: passwordResetLink,
        html: `<a href="${passwordResetLink}">${passwordResetLink}</a>`,
      },
    });

    await user.save().catch(() => {
      throw new InternalServerError(ResponseErrorCode.PASSWORD_RESET_REQUEST_ERROR, { email: user.email });
    });
  }

  async resetPassword(passwordResetData: IPasswordSettingData): Promise<false | User> {
    const tokenData = await this.authService.verifyToken(passwordResetData.token);

    if (!tokenData) {
      return false;
    }

    const email = tokenData.email;

    const user = await this.fetch({ email, getPasswordResetToken: true });

    if (user.passwordResetToken !== passwordResetData.token) {
      return false;
    }

    user.passwordHash = await this.generateHash(passwordResetData.password);
    user.passwordResetToken = null;

    return user.save();
  }

  async fetchDemographicProfile(userUuid: string): Promise<DemographicProfile> {
    const user = await this.fetch({
      uuid: userUuid,
      relations: ['demographicProfile'],
    })

    return user.demographicProfile;
  }

  async fetchNewsletterPreferences(userUuid: string): Promise<NewsletterPreferences> {
    const user = await this.fetch({
      uuid: userUuid,
      relations: ['newsletterPreferences'],
    })

    return user.newsletterPreferences;
  }

  fetch({
    email,
    uuid,
    getPasswordHash = false,
    getActivationToken = false,
    getPasswordResetToken = false,
    relations = [],
  }: IUserFetchingOptions = {}): Promise<User> {
    if (!uuid && !email) {
      throw new BadRequest('please provide one or more of: uuid, email');
    }

    const topLevelAlias = 'user';
    let query = this.userRepository.createQueryBuilder(`${topLevelAlias}`);

    if (getPasswordHash) {
      query = query.addSelect(`${topLevelAlias}.passwordHash`);
    }
    if (getActivationToken) {
      query = query.addSelect(`${topLevelAlias}.activationToken`);
    }
    if (getPasswordResetToken) {
      query = query.addSelect(`${topLevelAlias}.passwordResetToken`);
    }

    if (email) {
      query = query.where(`${topLevelAlias}.email = :email`, { email });
    }
    if (uuid) {
      query = query.where(`${topLevelAlias}.uuid = :uuid`, { uuid });
    }

    for (const relation of relations) {
      const { property, alias } = loadDeepRelation(topLevelAlias, relation);
      query = query.leftJoinAndSelect(property, alias);
    }

    return query.getOne();
  }

  compareHash(password: string | undefined, passwordHash: string | undefined): Promise<boolean> {
    return compare(password, passwordHash);
  }

  generateHash(password: string | undefined): Promise<string> {
    return hash(password, this.SALT_ROUNDS);
  }
}
