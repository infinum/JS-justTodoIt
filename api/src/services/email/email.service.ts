import { Service } from '@tsed/di';
import { Resend } from 'resend';
import { RESEND_API_KEY } from '../../constants';
import { IEmail } from '../../interfaces/email.interface';

@Service()
export class EmailService {
	private readonly resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

	sendEmail(email: IEmail): Promise<unknown> {
		if (!this.resend) {
			console.table(email);
			return;
		}

		return this.resend.emails.send({
			from: 'no-reply@js-api-onboarding.byinfinum.co',
			to: email.to,
			subject: email.subject,
			html: email.content.html,
			text: email.content.plain,
		});
	}
}
