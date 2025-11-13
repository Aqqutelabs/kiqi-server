import { Resend } from 'resend';

// Use Resend exclusively. Fail fast if API key missing.
interface EmailOptions {
    to: string;
    subject: string;
    text?: string;
    html?: string;
    from?: string;
    replyTo?: string;
}

const RESEND_API_KEY = process.env.RESEND_API_KEY;
if (!RESEND_API_KEY) {
    console.error('[Email] RESEND_API_KEY is not set. Email sending is disabled.');
}

const resendClient = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : undefined;

export const sendEmail = async (options: EmailOptions): Promise<void> => {
    if (!resendClient) {
        throw new Error('Resend client not configured. Set RESEND_API_KEY in environment.');
    }

    const fromAddress = options.from || process.env.EMAIL_FROM || 'no-reply@yourapp.com';

    try {
        await resendClient.emails.send({
            from: fromAddress,
            to: options.to,
            subject: options.subject,
            html: options.html ?? options.text ?? '',
            text: options.text,
            replyTo: options.replyTo,
        });
        console.log(`[Email][Resend] Successfully sent to: ${options.to}`);
    } catch (err) {
        console.error('[Email][Resend] Error sending email:', err);
        throw err;
    }
};