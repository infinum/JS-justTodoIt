import { Property } from '@tsed/schema';
import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class NewsletterPreferences extends BaseEntity {
	@PrimaryGeneratedColumn('uuid')
	@Property()
	uuid: string;

	@Column()
	@Property()
	weeklyNewsletter: boolean;

	@Column()
	@Property()
	specialOffers: boolean;
}
