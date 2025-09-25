import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
  from?: string;
  replyTo?: string;
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  const msg = {
    to: options.to,
    from: options.from || process.env.EMAIL_FROM || 'no-reply@yourapp.com',
    subject: options.subject,
    text: options.text,
    html: options.html,
    replyTo: options.replyTo,
  };
  await sgMail.send(msg);
  console.log(`[SendGrid] Email sent to: ${options.to}`);
};
