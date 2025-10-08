import { Resend } from 'resend';
import { ApiError } from './ApiError';
import { StatusCodes } from 'http-status-codes';

interface VerifyEmailOptions {
  nickname: string;
  fromEmail: string;
  fromName: string;
  replyTo?: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export const verifyEmailSender = async (options: VerifyEmailOptions) => {
  const resend = new Resend(process.env.RESEND_API_KEY);
  
  try {
    // With Resend, email verification is simpler as it's handled through their dashboard
    // We'll just validate that we can send from this email
    const testResult = await resend.emails.send({
      from: `${options.fromName} <${options.fromEmail}>`,
      to: options.fromEmail, // Send a test email to the sender
      subject: 'Email Verification Test',
      html: `
        <h1>Email Verification Test</h1>
        <p>This is a test email to verify your sender email address.</p>
        <p>Sender Details:</p>
        <ul>
          <li>Nickname: ${options.nickname}</li>
          <li>Email: ${options.fromEmail}</li>
          <li>Name: ${options.fromName}</li>
          <li>Address: ${options.address}</li>
          <li>City: ${options.city}</li>
          <li>State: ${options.state}</li>
          <li>ZIP: ${options.zip}</li>
          <li>Country: ${options.country}</li>
        </ul>
      `,
      replyTo: options.replyTo || options.fromEmail,
    });

    if (!testResult.data) {
      throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to send verification email');
    }

    return {
      id: testResult.data.id,
      message: 'Verification email sent successfully',
    };
  } catch (error: any) {
    console.error('Error verifying email sender:', error);
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      error?.message || 'Failed to verify email sender'
    );
  }
};