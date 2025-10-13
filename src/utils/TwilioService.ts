import Twilio from 'twilio';
import { ApiError } from './ApiError';
import { StatusCodes } from 'http-status-codes';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioFrom = process.env.TWILIO_FROM_NUMBER; // E.g. +1234567890

if (!accountSid || !authToken) {
  console.warn('Twilio credentials are not set. SMS sending will fail if attempted.');
}

const client = accountSid && authToken ? Twilio(accountSid, authToken) : null;

export const sendSms = async (to: string, body: string, from?: string) => {
  if (!client) {
    throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Twilio client not configured');
  }
  try {
    const msg = await client.messages.create({
      body,
      to,
      from: from || twilioFrom,
    });
    return msg;
  } catch (err: any) {
    console.error('Twilio send error', err);
    throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, err?.message || 'Failed to send SMS');
  }
};
