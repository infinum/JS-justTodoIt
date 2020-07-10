export interface IEmail {
  to: string;
  subject: string;
  content: {
    plain: string;
    html?: string;
  };
}
