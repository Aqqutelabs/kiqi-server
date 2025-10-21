import axios from 'axios';
import fs from 'fs';

// Usage: set BASE_URL and AUTH_TOKEN in environment, e.g.
// BASE_URL=http://localhost:3000/api/sms AUTH_TOKEN=Bearer\ <token> node -r ts-node/register scripts/seed-sms-templates.ts

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000/api/sms';
const AUTH = process.env.AUTH_TOKEN || '';

async function main() {
  const data = JSON.parse(fs.readFileSync('sample-data/sms-templates.json', 'utf8'));
  for (const tpl of data) {
    try {
      const res = await axios.post(`${BASE_URL}/templates`, tpl, {
        headers: {
          Authorization: AUTH,
          'Content-Type': 'application/json'
        }
      });
      console.log('Created:', res.data.data._id, res.data.data.title);
    } catch (err: any) {
      console.error('Failed to create', tpl.title, err.response?.data || err.message);
    }
  }
}

main().catch(console.error);
