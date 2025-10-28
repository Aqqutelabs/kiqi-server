# AI Email Generation Test Requests

Use these cURL commands to test the email generation endpoints.
Make sure to replace `[YOUR_AUTH_TOKEN]` with a valid authentication token.

## 1. Generate New Email

```bash
curl -X POST http://localhost:3000/api/ai-email/generate-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [YOUR_AUTH_TOKEN]" \
  -d '{
    "recipient": "partner@business.com",
    "context": "Partnership proposal",
    "tone": "Professional"
  }'
```

### Sample Request Body Variations:

```json
// Business Meeting Request
{
  "recipient": "director@company.com",
  "context": "Request for business meeting",
  "tone": "Professional"
}

// Project Update
{
  "recipient": "team@startup.com",
  "context": "Monthly project status update",
  "tone": "Professional"
}

// Client Welcome
{
  "recipient": "newclient@example.com",
  "context": "Welcome new client",
  "tone": "Friendly"
}
```

## 2. Regenerate Email

```bash
curl -X POST http://localhost:3000/api/ai-email/regenerate-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [YOUR_AUTH_TOKEN]" \
  -d '{
    "emailId": "[EMAIL_ID]",
    "instructions": "Make it more concise and add a meeting time proposal"
  }'
```

### Sample Regeneration Instructions:

```json
{
  "emailId": "[EMAIL_ID]",
  "instructions": "Make the tone more formal"
}

{
  "emailId": "[EMAIL_ID]",
  "instructions": "Add more specific details about the project timeline"
}

{
  "emailId": "[EMAIL_ID]",
  "instructions": "Shorten the email and make it more direct"
}
```

## Running the Seed Script

To populate the database with sample data:

1. Make sure MongoDB is running
2. Run the seed script:
   ```bash
   npm run ts-node scripts/seed-ai-emails.ts
   ```

The script will:
- Clear existing email data
- Insert sample emails
- Print the IDs of the inserted emails (use these for regeneration tests)
- Display example API requests