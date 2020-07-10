import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, BaseEntity } from 'typeorm';
import { Property } from '@tsed/common';
import { User } from './user';

@Entity()
export class Todo extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  @Property()
  uuid: string;

  @ManyToOne(() => User, user => user.todos)
  @Property()
  user: User;

  @Column({
    nullable: false,
  })
  @Property()
  created: Date;
}
