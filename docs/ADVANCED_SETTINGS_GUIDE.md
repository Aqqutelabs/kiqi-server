# Advanced Email Campaign Settings - Feature Guide

## 📋 Table of Contents
1. [Overview](#overview)
2. [Features](#features)
3. [Getting Started](#getting-started)
4. [API Reference](#api-reference)
5. [Configuration](#configuration)
6. [Examples](#examples)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

## 🎯 Overview

Advanced Email Campaign Settings is a comprehensive feature for managing email campaigns with fine-grained control over:
- **Recipient exclusions** - Filter out unsubscribed, bounced, or inactive contacts
- **Resend rules** - Automatically retry unopened emails after a configurable delay
- **Batch sending** - Rate-limit emails to prevent overwhelming your email provider
- **Compliance** - Automatically include required compliance text and unsubscribe links
- **Fallback handling** - Gracefully handle personalization failures and duplicates

## ✨ Features

### 1. Recipient Filtering
Automatically exclude contacts based on their status:
```typescript
excludeLists: {
  unsubscribed: true,   // Exclude people who unsubscribed
  bounced: true,        // Exclude invalid email addresses
  inactive: false       // Include inactive contacts (optional)
}
```

### 2. Smart Resending
Automatically resend emails that weren't opened:
```typescript
resendSettings: {
  resendToUnopened: true,  // Resend unopened emails
  waitTimeDays: 3          // Wait 3 days before resending
}
```

### 3. Rate Limiting
Send emails in controlled batches to respect provider limits:
```typescript
batchSending: {
  emailsPerBatch: 500,     // Send 500 at a time
  intervalMinutes: 10      // Wait 10 minutes between batches
}
```

### 4. Compliance
Automatically add required compliance elements:
```typescript
emailCompliance: {
  includeUnsubscribeLink: true,
  includePermissionReminder: true,
  permissionReminderText: "You're receiving this because..."
}
```

### 5. Fallbacks
Handle edge cases gracefully:
```typescript
fallbacks: {
  alternativeText: "Fallback subject line",
  useIfPersonalizationFails: true,
  sendOncePerContact: true  // No duplicate sends
}
```

## 🚀 Getting Started

### Step 1: Create Settings Object

```typescript
const advancedSettings = {
  excludeLists: {
    unsubscribed: true,
    bounced: true,
    inactive: false
  },
  recipientEmailAddress: "Marketing Team",
  resendSettings: {
    resendToUnopened: true,
    dontResend: false,
    waitTimeDays: 3
  },
  fallbacks: {
    alternativeText: "Important Update",
    useIfPersonalizationFails: true,
    sendOncePerContact: true
  },
  dailySendLimit: 5000,
  batchSending: {
    emailsPerBatch: 500,
    intervalMinutes: 10
  },
  emailCompliance: {
    includeUnsubscribeLink: true,
    includePermissionReminder: true,
    permissionReminderText: "You receive this because you signed up for our newsletter."
  }
};
```

### Step 2: Validate Settings

```typescript
// Client-side or server-side validation
const response = await fetch(
  'http://localhost:8000/api/v1/campaigns/advanced-settings/validate',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(advancedSettings)
  }
);

const result = await response.json();
if (!result.valid) {
  console.error('Validation errors:', result.errors);
}
```

### Step 3: Save Settings

```typescript
// Save to a campaign
const response = await fetch(
  'http://localhost:8000/api/v1/campaigns/camp-123/advanced-settings',
  {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(advancedSettings)
  }
);

const result = await response.json();
console.log('Saved:', result.data);
```

### Step 4: Validate Batch Sending

```typescript
// Check if sending to all recipients is feasible
const response = await fetch(
  'http://localhost:8000/api/v1/campaigns/camp-123/validate-batch-sending',
  {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ totalRecipients: 100000 })
  }
);

const result = await response.json();
if (!result.feasible) {
  console.warn('Issues:', result.issues);
  // User might want to increase dailySendLimit or split into multiple campaigns
}
```

## 📚 API Reference

### Save Settings
**POST** `/api/v1/campaigns/:campaignId/advanced-settings`

Saves advanced settings for a campaign. Returns the saved settings.

**Status**: 200 OK

**Response**:
```json
{
  "error": false,
  "message": "Advanced settings saved successfully",
  "data": { /* settings object */ }
}
```

---

### Get Settings
**GET** `/api/v1/campaigns/:campaignId/advanced-settings`

Returns advanced settings for a campaign. If not configured, returns defaults.

**Status**: 200 OK

**Response**:
```json
{
  "error": false,
  "data": { /* settings object */ }
}
```

---

### Get Defaults
**GET** `/api/v1/campaigns/advanced-settings/defaults`

Returns the default settings template.

**Status**: 200 OK

**Response**:
```json
{
  "error": false,
  "data": {
    "excludeLists": {
      "unsubscribed": true,
      "bounced": true,
      "inactive": false
    },
    // ... rest of defaults
  }
}
```

---

### Validate Settings
**POST** `/api/v1/campaigns/advanced-settings/validate`

Validates settings without saving. Useful for real-time validation in forms.

**Status**: 200 OK

**Response (Valid)**:
```json
{
  "error": false,
  "valid": true,
  "errors": [],
  "data": { /* settings */ }
}
```

**Response (Invalid)**:
```json
{
  "error": true,
  "valid": false,
  "errors": [
    "resendToUnopened and dontResend are mutually exclusive"
  ],
  "data": { /* settings */ }
}
```

---

### Validate Batch Sending
**POST** `/api/v1/campaigns/:campaignId/validate-batch-sending`

Checks if batch sending is feasible with current settings.

**Request**:
```json
{
  "totalRecipients": 100000
}
```

**Status**: 200 OK

**Response (Feasible)**:
```json
{
  "error": false,
  "feasible": true,
  "estimatedTimeMinutes": 1000,
  "batchCount": 200,
  "schedule": [
    "2025-12-16T12:00:00Z",
    "2025-12-16T12:10:00Z",
    // ... more times
  ],
  "issues": [],
  "data": { /* batch settings */ }
}
```

**Response (Not Feasible)**:
```json
{
  "error": false,
  "feasible": false,
  "estimatedTimeMinutes": 1000,
  "batchCount": 200,
  "schedule": [ /* ... */ ],
  "issues": [
    "Total recipients (100000) exceed daily limit (5000)"
  ],
  "data": { /* batch settings */ }
}
```

---

### Get Batch Job Status
**GET** `/api/v1/campaigns/:campaignId/batch-job/:jobId`

Gets the current progress of a batch sending job.

**Status**: 200 OK

**Response**:
```json
{
  "error": false,
  "data": {
    "jobId": "batch-camp-123-1702744800000",
    "campaignId": "camp-123",
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

## ⚙️ Configuration

### Preset Configurations

#### Newsletter
Suitable for weekly/monthly newsletters:
```json
{
  "excludeLists": { "unsubscribed": true, "bounced": true, "inactive": false },
  "resendSettings": { "resendToUnopened": true, "dontResend": false, "waitTimeDays": 7 },
  "dailySendLimit": 10000,
  "batchSending": { "emailsPerBatch": 1000, "intervalMinutes": 5 }
}
```

#### Promotional
Suitable for sales campaigns:
```json
{
  "excludeLists": { "unsubscribed": true, "bounced": true, "inactive": true },
  "resendSettings": { "resendToUnopened": true, "dontResend": false, "waitTimeDays": 2 },
  "dailySendLimit": 8000,
  "batchSending": { "emailsPerBatch": 800, "intervalMinutes": 8 }
}
```

#### Transactional
Suitable for order confirmations, password resets:
```json
{
  "excludeLists": { "unsubscribed": false, "bounced": true, "inactive": false },
  "resendSettings": { "resendToUnopened": false, "dontResend": true, "waitTimeDays": null },
  "dailySendLimit": 50000,
  "batchSending": { "emailsPerBatch": 5000, "intervalMinutes": 1 }
}
```

#### Conservative
Suitable for first-time large campaigns:
```json
{
  "excludeLists": { "unsubscribed": true, "bounced": true, "inactive": true },
  "resendSettings": { "resendToUnopened": false, "dontResend": true, "waitTimeDays": null },
  "dailySendLimit": 1000,
  "batchSending": { "emailsPerBatch": 100, "intervalMinutes": 30 }
}
```

## 💡 Examples

### Example 1: Newsletter Campaign

```bash
# 1. Get defaults
curl -X GET http://localhost:8000/api/v1/campaigns/advanced-settings/defaults

# 2. Customize for newsletter
SETTINGS='{
  "excludeLists": {"unsubscribed": true, "bounced": true, "inactive": false},
  "recipientEmailAddress": "Newsletter Team",
  "resendSettings": {"resendToUnopened": true, "dontResend": false, "waitTimeDays": 5},
  "dailySendLimit": 10000,
  "batchSending": {"emailsPerBatch": 1000, "intervalMinutes": 5},
  "emailCompliance": {"includeUnsubscribeLink": true, "includePermissionReminder": true, "permissionReminderText": "Weekly newsletter subscription"}
}'

# 3. Save to campaign
curl -X POST http://localhost:8000/api/v1/campaigns/camp-123/advanced-settings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d "$SETTINGS"
```

### Example 2: Promotional Campaign

```typescript
const promotionalSettings = {
  excludeLists: {
    unsubscribed: true,
    bounced: true,
    inactive: true  // Don't include inactive users
  },
  recipientEmailAddress: "Sales Team",
  resendSettings: {
    resendToUnopened: true,
    dontResend: false,
    waitTimeDays: 2  // Resend after 2 days
  },
  dailySendLimit: 8000,
  batchSending: {
    emailsPerBatch: 800,
    intervalMinutes: 8
  },
  emailCompliance: {
    includeUnsubscribeLink: true,
    includePermissionReminder: true,
    permissionReminderText: "You receive promotional offers because you're a valued customer."
  }
};

// Validate before saving
const validation = await validateSettings(promotionalSettings);
if (!validation.valid) {
  throw new Error(validation.errors.join(", "));
}

// Save to campaign
const response = await fetch(
  `http://localhost:8000/api/v1/campaigns/camp-456/advanced-settings`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(promotionalSettings)
  }
);
```

### Example 3: Check Batch Feasibility

```typescript
async function checkBatchFeasibility(campaignId, totalRecipients) {
  const response = await fetch(
    `http://localhost:8000/api/v1/campaigns/${campaignId}/validate-batch-sending`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ totalRecipients })
    }
  );

  const result = await response.json();
  
  if (!result.feasible) {
    console.warn('Issues found:');
    result.issues.forEach(issue => console.warn(`  - ${issue}`));
    
    if (result.issues[0].includes('exceed daily limit')) {
      console.log(`Tip: Increase dailySendLimit or split into ${Math.ceil(totalRecipients / 5000)} campaigns`);
    }
    
    if (result.issues[0].includes('exceeds 24 hours')) {
      console.log(`Tip: Increase emailsPerBatch or decrease intervalMinutes`);
    }
  } else {
    console.log(`✓ Sending ${totalRecipients} emails in ${result.batchCount} batches`);
    console.log(`✓ Estimated time: ${result.estimatedTimeMinutes} minutes`);
  }
  
  return result;
}
```

## 🎯 Best Practices

### 1. Always Validate First
```typescript
// ✅ DO: Validate before saving
const validation = await validateSettings(settings);
if (!validation.valid) {
  displayErrors(validation.errors);
  return;
}

// ❌ DON'T: Save without validation
await saveSettings(settings);
```

### 2. Use Appropriate Batch Sizes
```typescript
// ✅ DO: Size based on provider limits
// SendGrid: 500-1000 per batch
// Mailgun: 1000 per batch
// Amazon SES: 50-100 per batch

// ❌ DON'T: Use max batch size for everything
batchSending: { emailsPerBatch: 10000, intervalMinutes: 1 }
```

### 3. Test with Small Campaign First
```typescript
// ✅ DO: Test settings with a small campaign
{ totalRecipients: 100, dailySendLimit: 100, ... }

// Then scale up for production
{ totalRecipients: 100000, dailySendLimit: 10000, ... }
```

### 4. Always Include Compliance Elements
```typescript
// ✅ DO: Include required compliance
emailCompliance: {
  includeUnsubscribeLink: true,
  includePermissionReminder: true,
  permissionReminderText: "..."
}

// ❌ DON'T: Skip compliance
emailCompliance: {
  includeUnsubscribeLink: false,
  includePermissionReminder: false
}
```

### 5. Use Deduplication
```typescript
// ✅ DO: Prevent duplicate sends
fallbacks: { sendOncePerContact: true }

// ❌ DON'T: Risk sending duplicates
fallbacks: { sendOncePerContact: false }
```

## 🔧 Troubleshooting

### Problem: "resendToUnopened and dontResend are mutually exclusive"

**Cause**: Both `resendToUnopened` and `dontResend` are set to `true`

**Solution**: Set only one to `true`:
```typescript
// ✅ CORRECT
resendSettings: {
  resendToUnopened: true,
  dontResend: false,  // ← Set to false
  waitTimeDays: 3
}
```

### Problem: "waitTimeDays is required when resendToUnopened is true"

**Cause**: `resendToUnopened` is true but `waitTimeDays` is null/undefined

**Solution**: Provide a positive number:
```typescript
// ✅ CORRECT
resendSettings: {
  resendToUnopened: true,
  dontResend: false,
  waitTimeDays: 2  // ← Set a value
}
```

### Problem: "Total recipients exceed daily limit"

**Cause**: Campaign recipients > dailySendLimit

**Solution**: Either increase the limit or reduce recipients:
```typescript
// Option 1: Increase daily limit
dailySendLimit: 20000  // ← Increase

// Option 2: Split into multiple campaigns
// Campaign 1: 5000 recipients, dailySendLimit: 5000
// Campaign 2: 5000 recipients, dailySendLimit: 5000
```

### Problem: "Batch sending would take more than 24 hours"

**Cause**: Very large recipient count with small batches

**Solution**: Increase batch size or decrease interval:
```typescript
// Before: 100000 recipients × 100 per batch × 30min interval = 30000 minutes
batchSending: { emailsPerBatch: 100, intervalMinutes: 30 }

// After: 100000 recipients × 1000 per batch × 5min interval = 500 minutes
batchSending: { emailsPerBatch: 1000, intervalMinutes: 5 }
```

### Problem: Campaign not sending despite correct settings

**Cause**: Email provider rate limits or compliance issues

**Solution**: 
1. Verify compliance settings are correct
2. Check batch size matches provider limits
3. Verify unsubscribe link is valid
4. Test with small batch first

```typescript
// Conservative test settings
{
  dailySendLimit: 100,
  batchSending: { emailsPerBatch: 10, intervalMinutes: 60 }
}
```

## 📞 Support

For more information, see:
- `docs/ADVANCED_CAMPAIGN_SETTINGS.md` - Complete API docs
- `docs/ADVANCED_SETTINGS_INTEGRATION_GUIDE.md` - Integration guide
- `sample-data/advanced-campaign-settings-test-data.json` - Test data

---

**Version**: 1.0.0  
**Last Updated**: December 16, 2025  
**Status**: Production Ready ✅
