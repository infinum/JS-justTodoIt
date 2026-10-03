import {
	Entity,
	PrimaryGeneratedColumn,
	ManyToOne,
	Column,
	BaseEntity,
	OneToMany,
	Unique,
	type Relation,
} from 'typeorm';
import { Property } from '@tsed/schema';
import { User } from './user';
import { Todo } from './todo';

@Entity()
// Titles are unique per owner, not globally
@Unique('TODO_LIST_USER_TITLE', ['user', 'title'])
export class TodoList extends BaseEntity {
	@PrimaryGeneratedColumn('uuid')
	@Property()
	uuid: string;

	@Column({
		nullable: false,
	})
	@Property()
	title: string;

	@Column({
		nullable: false,
	})
	@Property()
	created: Date;

	@OneToMany(() => Todo, (todoItem: Todo) => todoItem.todo, {
		cascade: true,
	})
	@Property({ use: Todo })
	todos: Array<Todo>;

	@ManyToOne(() => User, (user: User) => user.todoLists, {
		onDelete: 'CASCADE',
	})
	user: Relation<User>;
}
