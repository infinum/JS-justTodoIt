import { $log } from "@tsed/common";
import { Service } from '@tsed/di';
import * as FormData from 'form-data';
import Mailgun from 'mailgun.js';
import { MessagesSendResult } from 'mailgun.js/interfaces/Messages';
import { MAILGUN_API_KEY, MAILGUN_DOMAIN } from '../../constants';
import { IEmail } from '../../interfaces/email.interface';

@Service()
export class EmailService {
  private readonly mailgun = new Mailgun(FormData).client({
    username: 'api',
    key: MAILGUN_API_KEY,
  });

  async sendEmail(email: IEmail): Promise<MessagesSendResult> {
    try {
      const msg = await this.mailgun.messages.create(MAILGUN_DOMAIN, {
        from: `Just TODO It <justTodoIt@${MAILGUN_DOMAIN}>`,
        to: [email.to],
        subject: email.subject,
        text: email.content.plain,
        html: email.content.html,
      });
      console.log('SUCCESS', msg);
      $log.info('SUCCESS', msg);
      return msg;
    } catch (err) {
      console.log('FAIL', err);
      $log.error('FAIL', err);
      throw err;
    }
  }
}
