import axios from 'axios';

// Simple E2E script that:
// 1. Requests SendGrid verification for a sender
// 2. Polls the confirm endpoint until the local sender is marked verified (or timeout)
// 3. Creates an email list
// 4. Creates and auto-starts a campaign using the verified sender and the list

// Usage: set environment variables and run with ts-node
//  SENDGRID_API_KEY (for SendGrid operations) - must be configured in server env
//  AUTH_TOKEN - Bearer token for your API auth
//  BASE_URL - API base (default http://localhost:5000)

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const AUTH_TOKEN = process.env.AUTH_TOKEN || '';
if (!AUTH_TOKEN) {
  console.error('Please set AUTH_TOKEN environment variable');
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${AUTH_TOKEN}`,
  'Content-Type': 'application/json'
};

async function requestSendGridVerification(email: string, senderName: string) {
  const payload = {
    nickname: `${senderName} (test)`,
    senderName,
    email,
    address: '1 Test Lane',
    city: 'Testville',
    state: 'TS',
    zip: '12345',
    country: 'US'
  };
  const resp = await axios.post(`${BASE_URL}/api/v1/sender-emails/sendgrid/request-verification`, payload, { headers });
  return resp.data.data; // local sender record
}

async function confirmSendGridVerification(localSenderId: string) {
  const resp = await axios.post(`${BASE_URL}/api/v1/sender-emails/sendgrid/confirm-verification`, { senderId: localSenderId }, { headers });
  return resp.data.data;
}

async function createEmailList(name: string, emails: string[]) {
  const resp = await axios.post(`${BASE_URL}/api/v1/email-lists`, { email_listName: name, emails }, { headers });
  return resp.data.data;
}

async function createCampaign(campaignPayload: any) {
  const resp = await axios.post(`${BASE_URL}/api/v1/campaigns`, campaignPayload, { headers });
  return resp.data;
}

async function pollConfirm(localSenderId: string, timeoutMs = 5 * 60 * 1000, intervalMs = 10 * 1000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const result = await confirmSendGridVerification(localSenderId);
      if (result && result.verified) return result;
      console.log('Not verified yet, retrying...');
    } catch (err: any) {
      // If not verified, the endpoint may return 400. Continue polling.
      console.log('Confirm check returned:', err?.response?.data || err?.message);
    }
    await new Promise(r => setTimeout(r, intervalMs));
  }
  throw new Error('Timeout waiting for sender verification');
}

async function run() {
  try {
    const testSenderEmail = `e2e+${Date.now()}@example.com`;
    console.log('1) Requesting SendGrid verification for', testSenderEmail);
    const localSender = await requestSendGridVerification(testSenderEmail, 'E2E Test Sender');
    console.log('Local sender created:', localSender);

    console.log('2) Polling for SendGrid verification (check your inbox and click SendGrid link)');
    const verified = await pollConfirm(localSender._id, 10 * 60 * 1000, 15 * 1000);
    console.log('Sender verified:', verified);

    console.log('3) Creating email list');
    const list = await createEmailList('E2E List', [testSenderEmail]);
    console.log('Email list created:', list);

    console.log('4) Creating and auto-starting campaign');
    const campaignPayload = {
      campaignName: 'E2E Test Campaign',
      subjectLine: 'E2E test subject',
      senderId: localSender._id,
      autoStart: true,
      audience: {
        emailLists: [list._id]
      }
    };
    const campaignResp = await createCampaign(campaignPayload);
    console.log('Campaign response:', campaignResp);
  } catch (err) {
    console.error('E2E script failed:', err?.response?.data || err?.message || err);
    process.exit(1);
  }
}

run();
