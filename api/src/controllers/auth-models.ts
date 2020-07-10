import { Required, Email, Property, PropertyType } from '@tsed/common';

export class RegisterData {
  @Required()
  @Email()
  email: string;

  @Property()
  password: string;
}

export class LoginData {
  @Required()
  @Email()
  email: string;

  @Required()
  password: string;

  @PropertyType(String)
  relations: Array<string>;
}

export class PasswordSettingData {
  @Required()
  token: string;

  @Required()
  password: string;
}

export class RequestPasswordResetData {
  @Required()
  @Email()
  email: string;
}
