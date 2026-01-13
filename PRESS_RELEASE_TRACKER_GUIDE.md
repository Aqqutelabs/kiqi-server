# Press Release Tracker Implementation Guide

## Overview

The press release tracker system now provides a complete step-by-step progress tracking mechanism for the entire lifecycle of a press release from creation to publication or rejection.

## Architecture

### Models

#### PressReleaseProgress Model (`src/models/PressReleaseProgress.ts`)
Stores all progress steps and timeline information for each press release.

**Key Fields:**
- `press_release_id` - Reference to the press release
- `user_id` - Reference to the user who created the press release
- `current_step` - Current status of the progress (one of: `initiated`, `payment_pending`, `payment_completed`, `under_review`, `approved`, `rejected`)
- `progress_history` - Array of all historical steps with timestamps
- `initiated_at` - When press release was created
- `payment_completed_at` - When payment was completed
- `under_review_at` - When review started
- `completed_at` - When approved and published
- `rejected_at` - When rejected
- `rejection_reason` - Reason if rejected

### Progress Steps

The press release progresses through the following steps:

```
initiated
    ↓
payment_pending (optional, if requires payment)
    ↓
payment_completed
    ↓
under_review (admin reviews the content)
    ↓
approved/rejected (admin decision)
```

## Implementation Details

### 1. Creating a Press Release

**Endpoint:** `POST /api/v1/press-releases/create`

When a press release is created:
- A new `PressRelease` document is created
- A new `PressReleaseProgress` record is automatically created with step: `initiated`
- The progress history records the creation timestamp and notes

**Request:**
```json
{
  "title": "Breaking News Title",
  "pr_content": "Press release content...",
  "status": "Draft",
  "campaign": "Campaign Name",
  "distribution": "National",
  "performance_views": "0"
}
```

**Progress Recorded:**
```
Step: initiated
Timestamp: [current timestamp]
Notes: Press release "[title]" initiated
Metadata: { title, status }
```

### 2. Payment Processing

**Endpoint:** `POST /api/v1/press-releases/orders/checkout`

When a user creates an order for press release distribution:
- An `Order` is created with status: `Pending`
- Paystack payment is initialized

**Webhook:** `POST /api/v1/press-releases/webhooks/paystack`

When Paystack confirms successful payment:
- `Order` status is updated to `Completed`
- `PressReleaseProgress` is updated to: `payment_completed`
- The progress history records the payment reference and order ID

**Progress Recorded:**
```
Step: payment_completed
Timestamp: [webhook timestamp]
Notes: Payment completed for press release distribution
Metadata: { payment_reference, order_id }
```

### 3. Editorial Review

**Endpoint:** `PUT /api/v1/press-releases/progress/:prId/under-review`

When admin starts reviewing a press release:
- `PressRelease` status is updated to `Pending`
- `PressReleaseProgress` is updated to: `under_review`
- Admin can add review notes

**Request:**
```json
{
  "notes": "Under editorial review"
}
```

**Progress Recorded:**
```
Step: under_review
Timestamp: [review start time]
Notes: [admin notes or default]
Metadata: {}
```

### 4. Approval

**Endpoint:** `PUT /api/v1/press-releases/progress/:prId/approve`

When admin approves a press release:
- `PressRelease` status is updated to `Published`
- `PressReleaseProgress` is updated to: `approved`
- Admin can add approval notes
- Progress percentage is set to 100%

**Request:**
```json
{
  "notes": "Approved for publication"
}
```

**Progress Recorded:**
```
Step: approved
Timestamp: [approval time]
Notes: [admin notes or default]
Metadata: { approved_at }
```

### 5. Rejection

**Endpoint:** `PUT /api/v1/press-releases/progress/:prId/reject`

When admin rejects a press release:
- `PressRelease` status is updated to `Draft`
- `PressReleaseProgress` is updated to: `rejected`
- `rejection_reason` is mandatory and stored
- Progress percentage is reset to 0%

**Request:**
```json
{
  "rejection_reason": "Content does not meet publication standards"
}
```

**Progress Recorded:**
```
Step: rejected
Timestamp: [rejection time]
Notes: [rejection reason]
Metadata: { rejection_reason, rejected_at }
```

## API Endpoints

### User Endpoints

#### 1. Get All Press Releases with Progress
```
GET /api/v1/press-releases/progress/all
```

Returns all press releases for the authenticated user with their current progress status.

**Response:**
```json
{
  "success": true,
  "status": 200,
  "data": {
    "total": 5,
    "press_releases": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "title": "Breaking News",
        "status": "Published",
        "date_created": "2025-12-23T10:00:00Z",
        "current_step": "approved",
        "initiated_at": "2025-12-23T10:00:00Z",
        "payment_completed_at": "2025-12-23T10:15:00Z",
        "under_review_at": "2025-12-23T10:20:00Z",
        "completed_at": "2025-12-23T10:30:00Z",
        "rejected_at": null,
        "rejection_reason": null,
        "total_steps_completed": 4
      }
    ]
  }
}
```

#### 2. Get Detailed Progress Timeline
```
GET /api/v1/press-releases/progress/:prId
```

Returns the complete progress timeline for a specific press release.

**Response:**
```json
{
  "success": true,
  "status": 200,
  "data": {
    "press_release": {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Breaking News",
      "status": "Published"
    },
    "progress": {
      "current_step": "approved",
      "initiated_at": "2025-12-23T10:00:00Z",
      "payment_completed_at": "2025-12-23T10:15:00Z",
      "under_review_at": "2025-12-23T10:20:00Z",
      "completed_at": "2025-12-23T10:30:00Z",
      "rejected_at": null,
      "rejection_reason": null
    },
    "timeline": [
      {
        "step": "initiated",
        "timestamp": "2025-12-23T10:00:00Z",
        "notes": "Press release 'Breaking News' initiated",
        "metadata": { "title": "Breaking News", "status": "Draft" }
      },
      {
        "step": "payment_completed",
        "timestamp": "2025-12-23T10:15:00Z",
        "notes": "Payment completed for press release distribution",
        "metadata": { "payment_reference": "ORDER-...", "order_id": "..." }
      },
      {
        "step": "under_review",
        "timestamp": "2025-12-23T10:20:00Z",
        "notes": "Press release submitted for editorial review",
        "metadata": {}
      },
      {
        "step": "approved",
        "timestamp": "2025-12-23T10:30:00Z",
        "notes": "Press release approved and published",
        "metadata": { "approved_at": "2025-12-23T10:30:00Z" }
      }
    ],
    "step_descriptions": {
      "initiated": "Press release created and initiated",
      "payment_pending": "Awaiting payment for distribution",
      "payment_completed": "Payment received successfully",
      "under_review": "Press release under editorial review",
      "approved": "Press release approved and published",
      "rejected": "Press release rejected"
    }
  }
}
```

### Admin Endpoints

#### 1. Update to Under Review
```
PUT /api/v1/press-releases/progress/:prId/under-review
```

**Request Body:**
```json
{
  "notes": "Starting editorial review"
}
```

#### 2. Approve Press Release
```
PUT /api/v1/press-releases/progress/:prId/approve
```

**Request Body:**
```json
{
  "notes": "Content meets all publication standards"
}
```

#### 3. Reject Press Release
```
PUT /api/v1/press-releases/progress/:prId/reject
```

**Request Body:**
```json
{
  "rejection_reason": "Content needs revision before publication"
}
```

## Database Schema

### PressReleaseProgress Collection

```typescript
{
  _id: ObjectId,
  press_release_id: ObjectId (indexed),
  user_id: ObjectId (indexed),
  current_step: String, // enum: initiated, payment_pending, payment_completed, under_review, approved, rejected
  progress_history: [
    {
      step: String,
      timestamp: Date,
      notes: String,
      metadata: {
        payment_reference?: String,
        order_id?: String,
        reviewer_name?: String,
        rejection_reason?: String
      }
    }
  ],
  initiated_at: Date,
  payment_completed_at: Date,
  under_review_at: Date,
  completed_at: Date,
  rejected_at: Date,
  rejection_reason: String,
  created_at: Date,
  updated_at: Date
}
```

## Frontend Integration Example

### Display Progress Timeline

```typescript
// Get progress data
const response = await fetch('/api/v1/press-releases/progress/:prId', {
  headers: { 'Authorization': 'Bearer token' }
});

const { data } = await response.json();

// Display timeline steps
data.timeline.forEach((record) => {
  console.log(`${record.step}: ${new Date(record.timestamp).toLocaleString()}`);
  if (record.notes) console.log(`  Notes: ${record.notes}`);
});

// Display current status
console.log(`Current Status: ${data.progress.current_step}`);
if (data.progress.rejection_reason) {
  console.log(`Rejection Reason: ${data.progress.rejection_reason}`);
}
```

### Calculate Progress Percentage

```typescript
const stepOrder = ['initiated', 'payment_completed', 'under_review', 'approved'];
const currentIndex = stepOrder.indexOf(data.progress.current_step);
const progressPercentage = ((currentIndex + 1) / stepOrder.length) * 100;
console.log(`Progress: ${progressPercentage}%`);
```

## Database Queries

### Get all press releases in review
```typescript
const inReview = await PressReleaseProgress.find({ 
  current_step: 'under_review' 
}).populate('press_release_id');
```

### Get user's rejected press releases
```typescript
const rejected = await PressReleaseProgress.find({ 
  user_id: userId, 
  current_step: 'rejected' 
});
```

### Get press releases approved today
```typescript
const today = new Date();
today.setHours(0, 0, 0, 0);

const approvedToday = await PressReleaseProgress.find({ 
  current_step: 'approved',
  completed_at: { 
    $gte: today 
  }
});
```

### Get timeline for a press release
```typescript
const progress = await PressReleaseProgress.findOne({ 
  press_release_id: prId,
  user_id: userId 
});

progress.progress_history.forEach((record) => {
  console.log(record);
});
```

## Error Handling

### Common Error Scenarios

1. **Press Release Not Found**
   - Status: 404
   - Message: "Press release not found"

2. **Invalid Press Release ID**
   - Status: 400
   - Message: "Invalid press release ID"

3. **Rejection Reason Missing**
   - Status: 400
   - Message: "Rejection reason is required"

4. **Unauthorized Access**
   - Status: 401
   - Message: "Unauthorized"

## File Changes Summary

### New Files Created
- `src/models/PressReleaseProgress.ts` - Progress tracking model

### Modified Files
- `src/controllers/pressRelease.controller.ts`
  - Added `recordProgressStep()` helper function
  - Added `getProgressTimeline()` helper function
  - Updated `createPressRelease()` to record initial step
  - Updated `paystackWebhook()` to record payment step
  - Added `getPressReleaseProgress()` endpoint
  - Added `updatePressReleaseToUnderReview()` endpoint
  - Added `approvePressRelease()` endpoint
  - Added `rejectPressRelease()` endpoint
  - Added `getAllPressReleasesWithProgress()` endpoint

- `src/routes/pressRelease.routes.ts`
  - Added imports for new controller functions
  - Added new progress tracking routes

## Testing Workflow

1. **Create Press Release**
   ```
   POST /api/v1/press-releases/create
   → Progress: initiated
   ```

2. **Create Order and Process Payment**
   ```
   POST /api/v1/press-releases/orders/checkout
   Webhook: POST /api/v1/press-releases/webhooks/paystack
   → Progress: payment_completed
   ```

3. **Admin Review**
   ```
   PUT /api/v1/press-releases/progress/:prId/under-review
   → Progress: under_review
   ```

4. **Admin Approve or Reject**
   ```
   PUT /api/v1/press-releases/progress/:prId/approve
   → Progress: approved
   
   OR
   
   PUT /api/v1/press-releases/progress/:prId/reject
   → Progress: rejected
   ```

5. **View Complete Timeline**
   ```
   GET /api/v1/press-releases/progress/:prId
   → Returns full timeline with all steps and timestamps
   ```

## Best Practices

1. **Always Record Steps** - Every state change should be recorded via the helper function
2. **Add Metadata** - Include relevant information (payment ref, order ID, reviewer names, rejection reasons)
3. **Timestamps** - Automatic timestamps are added for each step
4. **User Context** - Always include user_id for multi-tenant queries
5. **Idempotency** - Check if step already exists before recording duplicate

## Future Enhancements

1. Add notifications at each step
2. Add estimated time calculations based on historical data
3. Add analytics dashboard for tracking metrics
4. Add automatic reminder notifications
5. Add bulk operations for admin review
