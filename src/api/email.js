import { createTransport } from 'nodemailer';

const {
  EMAIL_FROM = 'mailer@sistemium.net',
  EMAIL_SUBJECT = '',
  EMAIL_PREFIX = '',
} = process.env;

const smtp = {
  host: 'mx.sistemium.net',
  port: 465,
  secure: false,
  tls: {
    rejectUnauthorized: false,
  },
};

const transport = createTransport(smtp);

export default async function (to, code) {

  const text = `${EMAIL_PREFIX} ${code}`;

  const mail = {
    attachments: [],
    from: EMAIL_FROM,
    to,
    // cc,
    // bcc,
    // replyTo,
    text,
    html: `<p>${text}</p>`,
    subject: EMAIL_SUBJECT,
  };
  await transport.sendMail(mail);
}
