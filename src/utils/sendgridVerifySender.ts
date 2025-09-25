import axios from 'axios';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_API_URL = 'https://api.sendgrid.com/v3/verified_senders';

/**
 * Initiate sender email verification via SendGrid API.
 * @param {object} params - Sender verification parameters
 * @param {string} params.nickname - A label for the sender (e.g. user's name)
 * @param {string} params.fromEmail - The email address to verify
 * @param {string} params.fromName - The display name for the sender
 * @param {string} [params.replyTo] - (optional) Reply-to email address
 * @param {string} params.address - The street address of the sender
 * @param {string} params.city - The city of the sender
 * @param {string} params.state - The state of the sender
 * @param {string} params.zip - The ZIP code of the sender
 * @param {string} params.country - The country of the sender
 * @returns {Promise<object>} SendGrid API response
 */
export async function sendgridVerifySender({
  nickname,
  fromEmail,
  fromName,
  replyTo,
  replyToName,
  address,
  address2,
  city,
  state,
  zip,
  country
}: {
  nickname: string;
  fromEmail: string;
  fromName?: string;
  replyTo: string;
  replyToName?: string;
  address?: string;
  address2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}): Promise<object> {
  const payload = {
    nickname,
    from_email: fromEmail,
    from_name: fromName,
    reply_to: replyTo,
    reply_to_name: replyToName,
    address,
    address2,
    city,
    state,
    zip,
    country
  };
  // Remove undefined fields
  (Object.keys(payload) as (keyof typeof payload)[]).forEach(
    key => payload[key] === undefined && delete payload[key]
  );
  const response = await axios.post(
    SENDGRID_API_URL,
    payload,
    {
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data;
}
