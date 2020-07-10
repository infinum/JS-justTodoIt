import { ConnectionOptions } from 'typeorm'
import { SRC_DIR } from './constants'

export const ormConfig: Array<ConnectionOptions> = [
  {
    "name": "default",
    "type": "sqlite",
    "database": "database.sqlite",
    "synchronize": true,
    "logging": true,
    "entities": [
      `${SRC_DIR}/entities/**/*.ts`
    ],
    "migrations": [
      `${SRC_DIR}/migration/**/*.ts`
    ],
    "subscribers": [
      `${SRC_DIR}/subscriber/**/*.ts`
    ],
    "cli": {
      "entitiesDir": `${SRC_DIR}/entity`,
      "migrationsDir": `${SRC_DIR}/migration`,
      "subscribersDir": `${SRC_DIR}/subscriber`
    }
  }
]
