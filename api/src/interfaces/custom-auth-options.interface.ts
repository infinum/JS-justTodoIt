import { IAuthOptions } from '@tsed/common';
import { Type } from '@tsed/core';
import { Request } from 'express';
import { BaseEntity } from 'typeorm';

export interface IOwnerCheck {
  identifierFieldName?: string;
  ownerFieldName?: string;
  getIdentifier: (req: Request) => string;
  entityClass: Type<BaseEntity>;
  relations: Array<string>;
}

export interface ICustomAuthOptions extends IAuthOptions {
  passToken?: boolean;
  passUser?: boolean;
  ownerCheck?: IOwnerCheck;
}
