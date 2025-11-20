import sgMail from '@sendgrid/mail';

// Use SendGrid for email delivery
interface EmailOptions {
    to: string;
    subject: string;
    text?: string;
    html?: string;
    from?: string | { email: string; name?: string };
    replyTo?: string | { email: string; name?: string };
}

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
if (!SENDGRID_API_KEY) {
    console.error('[Email] SENDGRID_API_KEY is not set. Email sending is disabled.');
}

// Initialize SendGrid with API key
if (SENDGRID_API_KEY) {
    sgMail.setApiKey(SENDGRID_API_KEY);
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
    if (!SENDGRID_API_KEY) {
        throw new Error('SendGrid client not configured. Set SENDGRID_API_KEY in environment.');
    }

    const fromAddress = options.from || process.env.EMAIL_FROM || 'no-reply@yourapp.com';

    try {
        const msg: any = {
            to: options.to,
            from: fromAddress,
            subject: options.subject,
            text: options.text || '',
            html: options.html || options.text || '',
        };

        if (options.replyTo) {
            msg.replyTo = options.replyTo;
        }

        await sgMail.send(msg);
        console.log(`[Email][SendGrid] Successfully sent to: ${options.to}`);
    } catch (err) {
        // Log detailed SendGrid response for debugging (dev only)
        try {
            const body = (err as any)?.response?.body || (err as any)?.response?.data;
            if (body) console.error('[Email][SendGrid] Error response body:', JSON.stringify(body));
        } catch (loggingErr) {
            console.error('[Email][SendGrid] Failed to extract error body:', loggingErr);
        }
        console.error('[Email][SendGrid] Error sending email:', err);
        throw err;
    }
};