import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, ManyToOne, Unique } from 'typeorm';
import { Property } from '@tsed/common';
import { Todo } from './todo';

@Entity()
@Unique('TODO_TITLE', ['title', 'todo.uuid'])
export class TodoItem extends BaseEntity {
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

  @ManyToOne(() => Todo, todo => todo.items, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  todo: Todo;
}
