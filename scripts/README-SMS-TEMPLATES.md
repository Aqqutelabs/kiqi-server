SMS Templates Seed and Test

Quick steps to seed and test the SMS Templates endpoints you just added.

Prerequisites
- The server running locally (e.g. `npm run dev`)
- A valid auth token for your API (the `isAuthenticated` middleware)
- Node.js installed

Files
- `scripts/seed-sms-templates.ts` - small script to POST sample templates to your running API
- `sample-data/sms-templates.json` - sample templates

Usage - seed via Node

1) Install deps (if not already available):

```bash
npm install axios
# or: npm i axios
```

2) Run the script (replace token and base URL as needed):

```powershell
$env:BASE_URL = 'http://localhost:3000/api/sms'
$env:AUTH_TOKEN = 'Bearer <YOUR_TOKEN>'
node -r ts-node/register scripts/seed-sms-templates.ts
```

Curl examples

Create template:

```bash
curl -X POST 'http://localhost:3000/api/sms/templates' \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","message":"Hello world"}'
```

List templates:

```bash
curl -X GET 'http://localhost:3000/api/sms/templates' -H "Authorization: Bearer <YOUR_TOKEN>"
```

Send template to explicit recipients:

```bash
curl -X POST 'http://localhost:3000/api/sms/templates/<TEMPLATE_ID>/send' \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"recipients":["+18777804236","+1XXXXXXXXXX"]}'
```

Send template to a group:

```bash
curl -X POST 'http://localhost:3000/api/sms/templates/<TEMPLATE_ID>/send' \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"groupId":"<GROUP_ID>"}'
```

Notes
- The send endpoints will call Twilio via your configured `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` in the server environment.
- Template messages contain simple placeholders like `{{name}}` which are NOT auto-resolved by the server — they're stored as raw text. You can pre-process them client-side or extend the server to do templating before sending.
