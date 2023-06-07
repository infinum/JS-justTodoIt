import { $log } from "@tsed/common";
import { Service } from '@tsed/di';
import FormData from 'form-data';
import Mailgun from 'mailgun.js';
import { MessagesSendResult } from 'mailgun.js/interfaces/Messages';
import { MAILGUN_API_KEY, MAILGUN_DOMAIN, MAILGUN_LOGIN, MAILGUN_SMTP } from '../../constants';
import { IEmail } from '../../interfaces/email.interface';

@Service()
export class EmailService {
  private readonly mailgun = new Mailgun(FormData).client({ username: 'api', key: MAILGUN_API_KEY, url: MAILGUN_SMTP });

  sendEmail(email: IEmail): Promise<MessagesSendResult> {
    console.table(email);

    return this.mailgun.messages.create(MAILGUN_DOMAIN, {
      from: `Just TODO It <${MAILGUN_LOGIN}>`,
      to: email.to,
      subject: email.subject,
      text: email.content.plain,
      html: email.content.html
    })
    .then((msg) => {
      $log.info('SUCCESS', msg);
      return msg;
    })
    .catch((err) => {
      $log.error('FAIL', err)
      throw err;
    });
  }
}
