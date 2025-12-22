# Advanced Email Campaign Settings API

## Overview

The Advanced Email Campaign Settings feature provides comprehensive control over email campaign delivery, compliance, and recipient management. This includes recipient exclusions, resend rules, batch sending with rate limiting, and compliance requirements.

## API Endpoints

### 1. Save Advanced Settings
**POST** `/api/v1/campaigns/:campaignId/advanced-settings`

Save or update advanced email campaign settings for a specific campaign.

**Request Body:**
```json
{
  "excludeLists": {
    "unsubscribed": true,
    "bounced": true,
    "inactive": false
  },
  "recipientEmailAddress": "Innovaro Global Services",
  "resendSettings": {
    "resendToUnopened": true,
    "dontResend": false,
    "waitTimeDays": 2
  },
  "fallbacks": {
    "alternativeText": "Latest Update from Our Team",
    "useIfPersonalizationFails": true,
    "sendOncePerContact": true
  },
  "dailySendLimit": 5000,
  "batchSending": {
    "emailsPerBatch": 500,
    "intervalMinutes": 10
  },
  "emailCompliance": {
    "includeUnsubscribeLink": true,
    "includePermissionReminder": true,
    "permissionReminderText": "You are receiving this email because you signed up for our newsletter."
  }
}
```

**Response (200 OK):**
```json
{
  "error": false,
  "message": "Advanced settings saved successfully",
  "data": {
    "excludeLists": { ... },
    "recipientEmailAddress": "...",
    "resendSettings": { ... },
    "fallbacks": { ... },
    "dailySendLimit": 5000,
    "batchSending": { ... },
    "emailCompliance": { ... }
  }
}
```

---

### 2. Get Advanced Settings
**GET** `/api/v1/campaigns/:campaignId/advanced-settings`

Retrieve the advanced settings for a specific campaign. Returns default settings if none are configured.

**Response (200 OK):**
```json
{
  "error": false,
  "data": {
    "excludeLists": {
      "unsubscribed": true,
      "bounced": true,
      "inactive": false
    },
    "recipientEmailAddress": "",
    "resendSettings": {
      "resendToUnopened": false,
      "dontResend": true,
      "waitTimeDays": null
    },
    "fallbacks": {
      "alternativeText": "",
      "useIfPersonalizationFails": false,
      "sendOncePerContact": true
    },
    "dailySendLimit": 5000,
    "batchSending": {
      "emailsPerBatch": 500,
      "intervalMinutes": 10
    },
    "emailCompliance": {
      "includeUnsubscribeLink": true,
      "includePermissionReminder": true,
      "permissionReminderText": "You are receiving this email because you signed up for our newsletter."
    }
  }
}
```

---

### 3. Get Default Settings
**GET** `/api/v1/campaigns/advanced-settings/defaults`

Retrieve the default advanced settings configuration.

**Response (200 OK):**
```json
{
  "error": false,
  "data": {
    "excludeLists": {
      "unsubscribed": true,
      "bounced": true,
      "inactive": false
    },
    "recipientEmailAddress": "",
    "resendSettings": {
      "resendToUnopened": false,
      "dontResend": true,
      "waitTimeDays": null
    },
    "fallbacks": {
      "alternativeText": "",
      "useIfPersonalizationFails": false,
      "sendOncePerContact": true
    },
    "dailySendLimit": 5000,
    "batchSending": {
      "emailsPerBatch": 500,
      "intervalMinutes": 10
    },
    "emailCompliance": {
      "includeUnsubscribeLink": true,
      "includePermissionReminder": true,
      "permissionReminderText": "You are receiving this email because you signed up for our newsletter."
    }
  }
}
```

---

### 4. Validate Settings
**POST** `/api/v1/campaigns/advanced-settings/validate`

Validate advanced settings without saving them to a campaign.

**Request Body:**
```json
{
  "excludeLists": {
    "unsubscribed": true,
    "bounced": true,
    "inactive": false
  },
  "resendSettings": {
    "resendToUnopened": true,
    "dontResend": false,
    "waitTimeDays": 2
  },
  ...
}
```

**Response (200 OK - Valid):**
```json
{
  "error": false,
  "valid": true,
  "errors": [],
  "data": { ... }
}
```

**Response (200 OK - Invalid):**
```json
{
  "error": true,
  "valid": false,
  "errors": [
    "resendToUnopened and dontResend are mutually exclusive"
  ],
  "data": { ... }
}
```

---

### 5. Validate Batch Sending
**POST** `/api/v1/campaigns/:campaignId/validate-batch-sending`

Validate if batch sending is feasible based on total recipients and current settings.

**Request Body:**
```json
{
  "totalRecipients": 10000
}
```

**Response (200 OK - Feasible):**
```json
{
  "error": false,
  "feasible": true,
  "estimatedTimeMinutes": 190,
  "batchCount": 20,
  "schedule": [
    "2025-12-16T12:00:00Z",
    "2025-12-16T12:10:00Z",
    "2025-12-16T12:20:00Z",
    ...
  ],
  "issues": [],
  "data": {
    "dailyLimit": 5000,
    "emailsPerBatch": 500,
    "intervalMinutes": 10
  }
}
```

**Response (200 OK - Not Feasible):**
```json
{
  "error": false,
  "feasible": false,
  "estimatedTimeMinutes": 190,
  "batchCount": 20,
  "schedule": [...],
  "issues": [
    "Total recipients (10000) exceed daily limit (5000)"
  ],
  "data": { ... }
}
```

---

### 6. Get Batch Job Status
**GET** `/api/v1/campaigns/:campaignId/batch-job/:jobId`

Get the current status of a batch sending job.

**Response (200 OK):**
```json
{
  "error": false,
  "data": {
    "jobId": "batch-camp-1765886410856-1702744800000",
    "campaignId": "camp-1765886410856",
    "totalRecipients": 10000,
    "sentCount": 2500,
    "remainingCount": 7500,
    "progressPercentage": 25,
    "currentBatchIndex": 5,
    "createdAt": "2025-12-16T12:00:00Z",
    "lastExecuted": "2025-12-16T12:50:00Z"
  }
}
```

---

## Field Descriptions

### Exclude Lists
Controls which contact statuses should be excluded from the campaign.

- **unsubscribed** (boolean): Exclude unsubscribed contacts
- **bounced** (boolean): Exclude contacts with bounced emails
- **inactive** (boolean): Exclude inactive contacts

### Recipient Email Address
Optional. Name of the sender or business/organization displayed to recipients.

### Resend Settings
Controls behavior for resending emails.

**Mutually Exclusive**: Only one of `resendToUnopened` or `dontResend` can be `true`.

- **resendToUnopened** (boolean): Resend emails that were not opened
- **dontResend** (boolean): Do not resend emails
- **waitTimeDays** (number | null): Days to wait before resending (required if `resendToUnopened` is true)

### Fallbacks
Handles personalization failures and duplicate contacts.

- **alternativeText** (string): Text to use if personalization fails
- **useIfPersonalizationFails** (boolean): Use alternative text when personalization fails
- **sendOncePerContact** (boolean): Ensure each contact receives email only once if in multiple segments

### Daily Send Limit
Maximum number of emails to send per day. Default: 5000

### Batch Sending
Controls rate-limiting and batching.

- **emailsPerBatch** (number): Emails per batch. Default: 500
- **intervalMinutes** (number): Minutes between batches. Default: 10

### Email Compliance
Required compliance elements for emails.

- **includeUnsubscribeLink** (boolean): Include unsubscribe link in email
- **includePermissionReminder** (boolean): Include permission reminder text
- **permissionReminderText** (string): The reminder text to include

---

## Validation Rules

### Resend Settings Validation
- ✅ Exactly one of `resendToUnopened` or `dontResend` must be true
- ✅ If `resendToUnopened` is true, `waitTimeDays` must be a positive number
- ✅ If `dontResend` is true, `waitTimeDays` should be null

### Batch Sending Validation
- ✅ `emailsPerBatch` must be a positive number
- ✅ `intervalMinutes` must be a positive number

### Daily Limit Validation
- ✅ `dailySendLimit` must be a positive number
- ✅ Total recipients cannot exceed daily limit (warning issued)

### Compliance Validation
- ✅ All boolean fields must be boolean
- ✅ All string fields must be strings
- ✅ `permissionReminderText` max length: 1000 characters

---

## Integration with Campaign Creation

The advanced settings are automatically merged with campaign data during creation:

```typescript
const campaignData = {
  campaignName: "Black Friday Sales",
  subjectLine: "Work Hard",
  senderId: "691ee30fc7d234f644b94593",
  audience: {
    emailLists: ["6915f7d396931636c516020f"],
    excludeLists: []
  },
  advancedSettings: {
    excludeLists: { unsubscribed: true, bounced: true, inactive: false },
    recipientEmailAddress: "Marketing Team",
    resendSettings: { resendToUnopened: false, dontResend: true, waitTimeDays: null },
    fallbacks: { alternativeText: "", useIfPersonalizationFails: false, sendOncePerContact: true },
    dailySendLimit: 5000,
    batchSending: { emailsPerBatch: 500, intervalMinutes: 10 },
    emailCompliance: {
      includeUnsubscribeLink: true,
      includePermissionReminder: true,
      permissionReminderText: "You are receiving this email..."
    }
  }
};
```

---

## Error Handling

### 400 Bad Request
```json
{
  "error": true,
  "message": "Validation failed: resendToUnopened and dontResend are mutually exclusive"
}
```

### 401 Unauthorized
```json
{
  "error": true,
  "message": "User not authenticated"
}
```

### 404 Not Found
```json
{
  "error": true,
  "message": "Campaign not found"
}
```

---

## Usage Examples

### Example 1: Save Settings for a Campaign

```bash
curl -X POST http://localhost:8000/api/v1/campaigns/camp-123/advanced-settings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "excludeLists": {
      "unsubscribed": true,
      "bounced": true,
      "inactive": false
    },
    "recipientEmailAddress": "Support Team",
    "resendSettings": {
      "resendToUnopened": true,
      "dontResend": false,
      "waitTimeDays": 3
    },
    "fallbacks": {
      "alternativeText": "Important Update",
      "useIfPersonalizationFails": true,
      "sendOncePerContact": true
    },
    "dailySendLimit": 3000,
    "batchSending": {
      "emailsPerBatch": 300,
      "intervalMinutes": 15
    },
    "emailCompliance": {
      "includeUnsubscribeLink": true,
      "includePermissionReminder": true,
      "permissionReminderText": "You receive this email as a member of our community."
    }
  }'
```

### Example 2: Validate Batch Sending Feasibility

```bash
curl -X POST http://localhost:8000/api/v1/campaigns/camp-123/validate-batch-sending \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "totalRecipients": 50000
  }'
```

### Example 3: Get Batch Job Status

```bash
curl -X GET http://localhost:8000/api/v1/campaigns/camp-123/batch-job/batch-camp-123-1702744800000 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Service Functions

### AdvancedCampaignSettingsService

Public methods available:

- `filterRecipientsByExclusions()`: Filter recipients based on exclude lists
- `applyResendRules()`: Determine which recipients should receive resend
- `createBatches()`: Split recipients into batches
- `calculateNextBatchTime()`: Calculate execution time for next batch
- `validateDailyLimit()`: Check if batch exceeds daily limit
- `deduplicateRecipients()`: Remove duplicate recipients
- `applyFallbackText()`: Apply fallback text for personalization
- `addComplianceElements()`: Add compliance HTML to content
- `createBatchJob()`: Create a new batch job
- `getBatchJobStatus()`: Get batch job progress
- `updateBatchJobProgress()`: Update batch job progress
- `completeBatchJob()`: Mark batch job as complete
- `calculateBatchSchedule()`: Calculate sending schedule
- `validateBatchSendingFeasibility()`: Validate if batch sending is possible
- `prepareRecipientsForSending()`: Apply all filters and rules to recipients

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- Email addresses are case-insensitive internally but stored in lowercase
- Batch jobs are tracked in memory; in production, implement database persistence
- Compliance fields are automatically appended to email HTML content during sending
- Default settings are used if campaign-specific settings are not configured
