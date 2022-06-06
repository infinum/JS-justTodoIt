import { Property } from '@tsed/schema';
import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Gender } from '../enums/gender.enum';

@Entity()
export class DemographicProfile extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column()
  @Property()
  gender: Gender;

  @Column()
  @Property()
  age: number;
}
