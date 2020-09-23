import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, ManyToOne, Unique } from 'typeorm';
import { Property } from '@tsed/common';
import { TodoList } from './todo-list';

@Entity()
@Unique('TODO_TITLE', ['title', 'todo.uuid'])
export class Todo extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  @Property()
  uuid: string;

  @Column({
    nullable: false,
  })
  @Property()
  title: string;

  @Column()
  @Property()
  done: boolean;

  @ManyToOne(() => TodoList, todoList => todoList.todos, {
    onDelete: 'CASCADE',
  })
  todo: TodoList;
}
