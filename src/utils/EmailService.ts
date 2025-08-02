
import nodemailer from 'nodemailer';

// This is a mock email service. In a real application, you would integrate a
// service like Nodemailer, SendGrid, or AWS SES.

interface EmailOptions {
    to: string;
    subject: string;
    text: string;
    html: string;
}

const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const sendEmail = async (options: EmailOptions): Promise<void> => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_FROM || 'aqqutelabs@gmail.com',
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text,
        };

        await transporter.sendMail(mailOptions);
        console.log(`[Email] Successfully sent to: ${options.to}`);
    } catch (error) {
        console.error('[Email] Error sending email:', error);
        throw error;
    }
};