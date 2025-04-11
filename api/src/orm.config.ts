import { ConnectionOptions } from 'typeorm';
import { SRC_DIR } from './constants';

export const ormConfig: Array<ConnectionOptions> = [
	{
		name: 'default',
		type: 'sqlite',
		database: 'database.sqlite',
		synchronize: true,
		logging: true,
		entities: [`${SRC_DIR}/entities/**/*.ts`, `${SRC_DIR}/entities/**/*.js`],
		migrations: [`${SRC_DIR}/migration/**/*.ts`, `${SRC_DIR}/migration/**/*.js`],
		subscribers: [`${SRC_DIR}/subscriber/**/*.ts`, `${SRC_DIR}/subscriber/**/*.js`],
		cli: {
			entitiesDir: `${SRC_DIR}/entity`,
			migrationsDir: `${SRC_DIR}/migration`,
			subscribersDir: `${SRC_DIR}/subscriber`,
		},
	},
];
