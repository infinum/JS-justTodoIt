import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from 'typeorm';
import { Property } from '@tsed/common';

@Entity()
export class TodoItem extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  @Property()
  uuid: string;

  @Column({
    unique: true,
    nullable: false,
  })
  @Property()
  title: string;

  @Column()
  @Property()
  done: boolean;
}
