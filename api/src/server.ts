import '@tsed/ajv';
import { AfterRoutesInit, BeforeRoutesInit, PlatformAcceptMimesMiddleware, PlatformApplication } from '@tsed/common';
import { Configuration, Inject } from '@tsed/di';
import '@tsed/platform-express'; // /!\ keep this import
import '@tsed/swagger'; // import swagger Ts.ED module
import * as bodyParser from 'body-parser';
import * as compress from 'compression';
import * as cookieParser from 'cookie-parser';
import * as cors from 'cors';
import { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import * as methodOverride from 'method-override';
import { join } from 'path';
import { CORS_ALLOWED_ORIGINS, HTTP_PORT, ROOT_DIR } from './constants';
import { CustomHeader } from './enums/custom-headers.enum';
import { ErrorHandlingMiddleware } from './middlewares/error-handling.middleware';
import { AuthController } from './controllers/auth/auth.controller';
import { TodosController } from './controllers/todos/todos.controller';
import './services/connections/DefaultConnection'; // Import database connection

const rootDir = __dirname;

@Configuration({
	rootDir: rootDir,
	acceptMimes: ['application/json'],
	httpPort: HTTP_PORT,
	mount: {
		'/': [AuthController, TodosController],
	},
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
