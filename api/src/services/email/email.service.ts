import { Service } from '@tsed/di';
import { IEmail } from '../../interfaces/email.interface';
import * as FormData from 'form-data';
import * as Mailgun from 'mailgun.js';
import { MAILGUN_API_KEY } from '../../constants';

@Service()
export class EmailService {
  sendEmail(email: IEmail): void {
    console.table(email);
     // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const mailgun = new Mailgun(FormData);
    const mg = mailgun.client({ username: 'postmaster@js-api-onboarding.byinfinum.co', key: MAILGUN_API_KEY});
    mg.messages.create('js-api-onboarding.byinfinum.co', {
      from: "Just TODO It <postmaster@js-api-onboarding.byinfinum.co>",
      to: email.to,
      subject: email.subject,
      text: email.content.plain,
      html: email.content.html
    })
    .then((msg: string) => console.log('SUCCESS', msg))
    .catch((err: Error) => console.error('FAIL', err));
  }
}
