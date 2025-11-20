# SendGrid Verified Sender Flow

This project supports SendGrid "single sender" verification and enforces that a campaign's `senderId` is verified before sending.

Endpoints

- POST `/api/v1/sender-emails/sendgrid/request-verification`
  - Body: `{ nickname?, senderName, email, address, city, state, zip, country }`
  - Behavior: creates a local `SenderEmail` record and creates a SendGrid verified sender object. SendGrid will email a verification link to the address.
  - Response: returns the local sender record (includes `sendgridId`).

- POST `/api/v1/sender-emails/sendgrid/confirm-verification`
  - Body: `{ senderId }` (local sender record `_id`)
  - Behavior: queries SendGrid for the `verified` status; if verified, marks local sender `verified=true` and updates the owning user's `senderEmail` field.
  - Response: returns the updated sender record.

How to test

1. Use the `scripts/test-sendgrid-e2e.ts` script (requires `AUTH_TOKEN` and `BASE_URL` in environment) to run an automated E2E test. The script will request verification, poll until the sender is verified, create an email list and send a campaign.

2. Alternatively, request verification via the API, click the SendGrid verification email, then call the confirm endpoint.

Notes & Troubleshooting

- Make sure `SENDGRID_API_KEY` is set in the server environment.
- Ensure the API key has appropriate permissions to create verified senders.
- If you see 403 / Forbidden from SendGrid, check the SendGrid API key permissions, account state, and suppression lists. Server logs include SendGrid response bodies to help diagnose.

Security

- The server stores the SendGrid `sendgridId` on the local `SenderEmail` model.
- The actual verification is performed by SendGrid; the confirm endpoint only marks the local record after SendGrid reports verified.
