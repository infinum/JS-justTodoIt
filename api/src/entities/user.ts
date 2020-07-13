import { Entity, PrimaryGeneratedColumn, Column, OneToMany, BaseEntity } from 'typeorm';
import { Property } from '@tsed/common';
import { Todo } from './todo';

@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  @Property()
  uuid: string;

  @Column({
    unique: true,
    nullable: false,
  })
  @Property()
  email: string;

  @OneToMany(() => Todo, todo => todo.user, {
    cascade: true,
  })
  todos: Array<Todo>;

  @Column({ length: 60, select: false, nullable: true })
  passwordHash: string;

  @Column({ select: false, nullable: true })
  activationToken: string;

  @Column({ select: false, nullable: true })
  passwordResetToken: string;

  get isActivated(): boolean {
    return Boolean(!this.activationToken && this.passwordHash);
  }
}
