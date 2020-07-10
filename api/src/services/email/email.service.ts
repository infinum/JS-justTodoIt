import { Service } from '@tsed/di';
import { IEmail } from '../../interfaces/email.interface';

@Service()
export class EmailService {
  sendEmail(email: IEmail): void {
    console.table(email);
  }
}
