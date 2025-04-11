import '@tsed/platform-express'; // /!\ keep this import
import '@tsed/ajv';
import '@tsed/typeorm';
import '@tsed/swagger'; // import swagger Ts.ED module
import * as bodyParser from 'body-parser';
import * as compress from 'compression';
import * as cookieParser from 'cookie-parser';
import * as methodOverride from 'method-override';
import * as cors from 'cors';
import helmet from 'helmet';
import { Configuration, Inject } from '@tsed/di';
import { PlatformApplication, BeforeRoutesInit, AfterRoutesInit, PlatformAcceptMimesMiddleware } from '@tsed/common';
import { ormConfig } from './orm.config';
import { SRC_DIR, HTTP_PORT, CORS_ALLOWED_ORIGINS, ROOT_DIR } from './constants';
import { join } from 'path';
import { ErrorHandlingMiddleware } from './middlewares/error-handling.middleware';
import { CustomHeader } from './enums/custom-headers.enum';
import { Request, Response, NextFunction } from 'express';

@Configuration({
	rootDir: SRC_DIR,
	acceptMimes: ['application/json'],
	httpPort: HTTP_PORT,
	mount: {
		'/': [`${SRC_DIR}/controllers/**/*.controller.ts`],
	},
	typeorm: ormConfig,
	exclude: ['**/*.spec.ts'],
	swagger: [
		{
			path: '/swagger',
			outFile: join(ROOT_DIR, 'swagger.json'),
		},
	],
})
export class Server implements BeforeRoutesInit, AfterRoutesInit {
	@Inject()
	app: PlatformApplication;

	@Configuration({
		httpPort: HTTP_PORT,
	})
	settings: Configuration;

	$beforeRoutesInit(): void {
		this.app
			.use(
				cors({
					origin: CORS_ALLOWED_ORIGINS,
					credentials: true,
					exposedHeaders: Object.values(CustomHeader),
				})
			)
			.use((req: Request, res: Response, next: NextFunction) => {
				// Swagger has some inline styles that trigger helmet, so do not use helmet in swagger
				if (req.originalUrl.startsWith('/swagger')) {
					next();
				} else {
					helmet()(req, res, next);
				}
			})
			.use(PlatformAcceptMimesMiddleware)
			.use(cookieParser())
			.use(compress())
			.use(methodOverride())
			.use(bodyParser.json())
			.use(
				bodyParser.urlencoded({
					extended: true,
				})
			);

		return null;
	}

	$afterRoutesInit(): void {
		this.app.use(ErrorHandlingMiddleware);
	}
}
