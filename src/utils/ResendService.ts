import { Resend } from 'resend';
import { ApiError } from './ApiError';
import { StatusCodes } from 'http-status-codes';

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not defined in environment variables');
}

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailOptions {
  to: string;
  from: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export const sendEmail = async (options: EmailOptions) => {
  try {
    const data = await resend.emails.send({
      from: options.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      replyTo: options.replyTo,
    });
    console.log('Email sent successfully via Resend:', data);
    return data;
  } catch (error) {
    console.error('Error sending email via Resend:', error);
    throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to send email via Resend');
  }
};
