# Advanced Campaign Settings - Integration Guide

## Quick Start

### 1. Import Required Types
```typescript
import { AdvancedEmailSettingsDto, AdvancedSettingsValidator, AdvancedSettingsDefaults } from "../dtos/advancedCampaignSettings.dto";
import { AdvancedCampaignSettingsService } from "../services/advancedCampaignSettings.service";
```

### 2. Create Campaign with Advanced Settings
```typescript
// When creating a campaign, include advanced settings
const campaignData = {
  campaignName: "Summer Sale",
  subjectLine: "Exclusive Summer Offers",
  senderId: "sender-id-123",
  audience: {
    emailLists: ["list-1", "list-2"],
    excludeLists: []
  },
  advancedSettings: {
    excludeLists: {
      unsubscribed: true,
      bounced: true,
      inactive: false
    },
    recipientEmailAddress: "Sales Team",
    resendSettings: {
      resendToUnopened: true,
      dontResend: false,
      waitTimeDays: 2
    },
    fallbacks: {
      alternativeText: "Summer Deals",
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
      permissionReminderText: "You receive this because you subscribed to our newsletter."
    }
  }
};
```

### 3. Validate Settings
```typescript
// Server-side validation
const validation = AdvancedSettingsValidator.validateAdvancedSettings(settings);

if (!validation.valid) {
  console.error("Validation errors:", validation.errors);
  // Handle errors
}
```

### 4. Use Service Methods in Your Business Logic
```typescript
// Filter recipients based on exclusions
const filteredRecipients = advancedSettingsService.filterRecipientsByExclusions(
  recipients,
  settings.excludeLists
);

// Apply resend rules
const resendRecipients = advancedSettingsService.applyResendRules(
  recipients,
  settings.resendSettings,
  isRetry
);

// Create batches for rate-limited sending
const batches = advancedSettingsService.createBatches(
  recipients,
  settings.batchSending.emailsPerBatch
);

// Add compliance elements to email content
const complianceContent = advancedSettingsService.addComplianceElements(
  htmlContent,
  settings.emailCompliance.includeUnsubscribeLink,
  settings.emailCompliance.includePermissionReminder,
  settings.emailCompliance.permissionReminderText,
  unsubscribeUrl
);

// Prepare all recipients for sending
const prepared = advancedSettingsService.prepareRecipientsForSending(
  recipients,
  settings,
  false // isRetry
);

console.log(`Filtered: ${prepared.filteredCount}, Deduplicated: ${prepared.deduplicatedCount}`);
```

## API Usage Examples

### Save Settings
```bash
curl -X POST http://localhost:8000/api/v1/campaigns/camp-123/advanced-settings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d @advanced-settings.json
```

### Get Settings
```bash
curl -X GET http://localhost:8000/api/v1/campaigns/camp-123/advanced-settings \
  -H "Authorization: Bearer TOKEN"
```

### Validate Settings (before saving)
```bash
curl -X POST http://localhost:8000/api/v1/campaigns/advanced-settings/validate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d @advanced-settings.json
```

### Get Defaults
```bash
curl -X GET http://localhost:8000/api/v1/campaigns/advanced-settings/defaults \
  -H "Authorization: Bearer TOKEN"
```

### Validate Batch Sending
```bash
curl -X POST http://localhost:8000/api/v1/campaigns/camp-123/validate-batch-sending \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"totalRecipients": 50000}'
```

### Get Batch Job Status
```bash
curl -X GET http://localhost:8000/api/v1/campaigns/camp-123/batch-job/batch-camp-123-1234567890 \
  -H "Authorization: Bearer TOKEN"
```

## Implementation Checklist

- [x] Create DTO and validation classes
- [x] Create advanced settings service with business logic
- [x] Update Campaign model to include advancedSettings field
- [x] Add controller methods for CRUD operations
- [x] Add routes for all endpoints
- [x] Create validation middleware (optional but recommended)
- [ ] Integrate with actual campaign sending logic
- [ ] Add database persistence (currently uses mock storage)
- [ ] Add error tracking for batch jobs
- [ ] Add monitoring/logging for compliance
- [ ] Create frontend components for UI

## Integration with Campaign Sending

When sending a campaign, use the service to prepare recipients:

```typescript
// In your campaign sending logic
async sendCampaign(campaignId: string) {
  const campaign = await getCampaign(campaignId);
  const settings = campaign.advancedSettings || AdvancedSettingsDefaults.getDefaults();
  
  // Get all recipients
  let recipients = await getRecipientsForCampaign(campaignId);
  
  // Prepare recipients (apply all filters and rules)
  const { finalRecipients, filteredCount, deduplicatedCount } = 
    this.advancedSettingsService.prepareRecipientsForSending(recipients, settings, false);
  
  // Create batch job for tracking
  const batchJob = this.advancedSettingsService.createBatchJob(
    campaignId,
    finalRecipients.length,
    settings.batchSending.emailsPerBatch
  );
  
  // Create batches
  const batches = this.advancedSettingsService.createBatches(
    finalRecipients,
    settings.batchSending.emailsPerBatch
  );
  
  // Send batches with rate limiting
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const nextBatchTime = this.advancedSettingsService.calculateNextBatchTime(
      i,
      settings.batchSending.intervalMinutes
    );
    
    // Schedule batch sending
    await scheduleEmailSending(batch, nextBatchTime);
    
    // Update batch job progress
    this.advancedSettingsService.updateBatchJobProgress(
      batchJob.jobId,
      (i + 1) * settings.batchSending.emailsPerBatch,
      i + 1
    );
  }
  
  // Mark job as complete
  this.advancedSettingsService.completeBatchJob(batchJob.jobId);
}
```

## Database Persistence

Current implementation uses in-memory storage. To add database persistence:

```typescript
// Update the service to save to MongoDB Campaign model
public async updateAdvancedSettings(
  campaignId: string,
  userId: string,
  settings: AdvancedEmailSettingsDto
): Promise<CampaignDoc> {
  const campaign = await CampaignModel.findOneAndUpdate(
    { _id: campaignId, user_id: userId },
    { advancedSettings: settings },
    { new: true }
  );
  
  if (!campaign) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Campaign not found');
  }
  
  return campaign;
}
```

## Troubleshooting

### Issue: "resendToUnopened and dontResend are mutually exclusive"
**Solution**: Set either `resendToUnopened` OR `dontResend` to true, not both.

### Issue: "waitTimeDays is required when resendToUnopened is true"
**Solution**: If `resendToUnopened` is true, provide a positive `waitTimeDays` value.

### Issue: "Total recipients exceed daily limit"
**Solution**: Either increase `dailySendLimit` or reduce recipients, or split into multiple campaigns.

### Issue: "Batch sending would take more than 24 hours"
**Solution**: Increase `emailsPerBatch` or decrease `intervalMinutes`.

## Performance Considerations

1. **Batch Size**: Larger batches reduce sending time but may impact server load
   - Typical: 500-1000 per batch
   - Max: 5000 per batch

2. **Interval**: Smaller intervals send faster but may exceed rate limits
   - Typical: 10-30 minutes
   - Min: 1 minute (be careful with email provider limits)

3. **Daily Limit**: Set based on email provider quotas
   - SendGrid: up to 100K/day
   - Typical: 5000-20000/day

4. **Deduplication**: Always use `sendOncePerContact: true` for safety
   - Improves deliverability
   - Prevents duplicate sends to same contact

## Security Notes

- Always validate settings on server-side (not just client)
- Never trust client-provided settings directly
- Merge with defaults to prevent undefined behavior
- Log all setting changes for audit trails
- Implement rate limiting on validation endpoints

## Future Enhancements

- A/B testing settings
- Send time optimization per contact
- Advanced segmentation rules
- Delivery status tracking
- Complaint rate monitoring
- Automated resend recommendations
