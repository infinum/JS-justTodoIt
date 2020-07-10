declare namespace Express {
  export interface Request {
    token?: string;
    tokenData?: import('../../interfaces/token-data.interface').ITokenData;
    user?: import('../../entities/user').User;
    entity?: import('typeorm').BaseEntity;
    sessionId?: string;
  }

  export interface Response {
    user?: import('../../entities/user').User;
  }
}
