import {Configuration, Inject} from '@tsed/di';
import {PlatformApplication, BeforeRoutesInit, AfterRoutesInit} from '@tsed/common';
import '@tsed/platform-express'; // /!\ keep this import
import {GlobalAcceptMimesMiddleware} from '@tsed/platform-express';
import * as bodyParser from 'body-parser';
import * as compress from 'compression';
import * as cookieParser from 'cookie-parser';
import * as methodOverride from 'method-override';
import * as cors from 'cors';
import * as helmet from 'helmet';
import '@tsed/ajv';
import '@tsed/typeorm';
import '@tsed/swagger'; // import swagger Ts.ED module
import { ormConfig } from './orm.config';
import { SRC_DIR, HTTP_PORT, HTTPS_PORT, CORS_ALLOWED_ORIGINS, ROOT_DIR } from './constants';
import { join } from 'path';
import { UnknownRelationMiddleware } from './middlewares/unknown-relation.middleware';
import { UniqueConstraintMiddleware } from './middlewares/unique-constraint.middleware';

@Configuration({
  rootDir: SRC_DIR,
  acceptMimes: ['application/json'],
  httpPort: HTTP_PORT,
  httpsPort: HTTPS_PORT,
  mount: {
    '/': [
      `${SRC_DIR}/controllers/**/*.controller.ts`
    ]
  },
  typeorm: ormConfig,
  exclude: [
    '**/*.spec.ts'
  ],
  swagger: [
    {
      path: '/swagger',
      outFile: join(ROOT_DIR, 'swagger.json'),
    }
  ]
})
export class Server implements BeforeRoutesInit, AfterRoutesInit {
  @Inject()
  app: PlatformApplication;

  @Configuration()
  settings: Configuration;

  $beforeRoutesInit(): void {
    this.app
      .use(cors({
        origin: CORS_ALLOWED_ORIGINS,
        credentials: true,
      }))
      .use(helmet())
      .use(GlobalAcceptMimesMiddleware)
      .use(cookieParser())
      .use(compress({}))
      .use(methodOverride())
      .use(bodyParser.json())
      .use(bodyParser.urlencoded({
        extended: true
      }));

    return null;
  }

  $afterRoutesInit(): void {
    this.app.use(UnknownRelationMiddleware);
    this.app.use(UniqueConstraintMiddleware);
  }
}
