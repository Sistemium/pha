import { createTransport } from 'nodemailer';

const { EMAIL_FROM = 'mailer@sistemium.net' } = process.env;

const smtp ={
  host: 'mx.sistemium.net',
  port: 465,
  secure: false,
  tls: {
    rejectUnauthorized: false,
  },
};

const transport = createTransport(smtp);

export default async function (to, code) {

  const text = `Confirmation code is ${code}`;

  const mail = {
    attachments: [],
    from: EMAIL_FROM,
    to,
    // cc,
    // bcc,
    // replyTo,
    text,
    html: `<p>${text}</p>`,
    subject: 'Login confirmation',
  };
  await transport.sendMail(mail);
}
