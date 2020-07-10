import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, BaseEntity, OneToMany } from 'typeorm';
import { Property } from '@tsed/common';
import { User } from './user';
import { TodoItem } from './todo-item';

@Entity()
export class Todo extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  @Property()
  uuid: string;

  @ManyToOne(() => User, user => user.todos)
  user: User;

  @OneToMany(() => TodoItem, todoItem => todoItem.todo, {
    cascade: true,
  })
  @Property()
  items: Array<TodoItem>;

  @Column({
    nullable: false,
  })
  @Property()
  created: Date;
}
