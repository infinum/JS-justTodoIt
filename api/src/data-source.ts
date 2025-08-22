import { DataSourceOptions, DataSource } from 'typeorm';
import { User } from './entities/user';
import { TodoList } from './entities/todo-list';
import { Todo } from './entities/todo';
import { DemographicProfile } from './entities/demographic-profile';
import { NewsletterPreferences } from './entities/newsletter-preferences';

export const dataSourceOptions: DataSourceOptions = {
	type: 'sqlite',
	database: 'database.sqlite',
	synchronize: true,
	logging: true,
	entities: [User, TodoList, Todo, DemographicProfile, NewsletterPreferences],
	migrations: [],
	subscribers: [],
};

export const AppDataSource = new DataSource(dataSourceOptions);
