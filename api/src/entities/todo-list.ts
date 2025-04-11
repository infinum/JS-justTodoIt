import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, BaseEntity, OneToMany } from 'typeorm';
import { Property } from '@tsed/schema';
import { User } from './user';
import { Todo } from './todo';

@Entity()
export class TodoList extends BaseEntity {
	@PrimaryGeneratedColumn('uuid')
	@Property()
	uuid: string;

	@Column({
		nullable: false,
		unique: true,
	})
	@Property()
	title: string;

	@Column({
		nullable: false,
	})
	@Property()
	created: Date;

	@OneToMany(() => Todo, (todoItem) => todoItem.todo, {
		cascade: true,
	})
	@Property({ use: Todo })
	todos: Array<Todo>;

	@ManyToOne(() => User, (user) => user.todoLists, {
		onDelete: 'CASCADE',
	})
	user: User;
}
