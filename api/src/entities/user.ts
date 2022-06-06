import { Entity, PrimaryGeneratedColumn, Column, OneToMany, BaseEntity, OneToOne, JoinColumn } from 'typeorm';
import { Property } from '@tsed/schema';
import { TodoList } from './todo-list';
import { DemographicProfile } from './demographic-profile';
import { NewsletterPreferences } from './newsletter-preferences';

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

  @OneToMany(() => TodoList, todoList => todoList.user, {
    cascade: true,
  })
  @Property({ use: TodoList })
  todoLists: Array<TodoList>;

  @Property()
  @OneToOne(() => DemographicProfile)
  @JoinColumn()
  demographicProfile: DemographicProfile;

  @Property()
  @OneToOne(() => NewsletterPreferences)
  @JoinColumn()
  newsletterPreferences: NewsletterPreferences;

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
