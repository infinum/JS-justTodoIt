import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, BaseEntity, OneToMany } from 'typeorm';
import { Property } from '@tsed/common';
import { User } from './user';
import { TodoItem } from './todo-item';

@Entity()
export class Todo extends BaseEntity {
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

  @OneToMany(() => TodoItem, todoItem => todoItem.todo, {
    cascade: true,
  })
  @Property()
  items: Array<TodoItem>;

  @ManyToOne(() => User, user => user.todos, {
    onDelete: 'CASCADE',
  })
  user: User;
}
