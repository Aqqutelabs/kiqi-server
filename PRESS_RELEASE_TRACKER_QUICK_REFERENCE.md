# Press Release Tracker - Quick Reference

## Progress Steps Flow

```
User Creates PR
    ↓
INITIATED ✓ (automatic)
    ↓
User Pays for Distribution
    ↓
PAYMENT_COMPLETED ✓ (via Paystack webhook)
    ↓
Admin Reviews Content
    ↓
UNDER_REVIEW ✓ (admin puts in review)
    ↓
Admin Decision
    ├─ APPROVED ✓ (PR published)
    └─ REJECTED ✓ (with reason)
```

## API Endpoints

### User Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/press-releases/progress/all` | Get all PRs with progress status |
| GET | `/api/v1/press-releases/progress/:prId` | Get detailed timeline for PR |

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| PUT | `/api/v1/press-releases/progress/:prId/under-review` | Move PR to review |
| PUT | `/api/v1/press-releases/progress/:prId/approve` | Approve PR |
| PUT | `/api/v1/press-releases/progress/:prId/reject` | Reject PR |

## Response Examples

### Get All Press Releases with Progress
```json
{
  "success": true,
  "data": {
    "total": 2,
    "press_releases": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "title": "Breaking News",
        "status": "Published",
        "current_step": "approved",
        "initiated_at": "2025-12-23T10:00:00Z",
        "payment_completed_at": "2025-12-23T10:15:00Z",
        "under_review_at": "2025-12-23T10:20:00Z",
        "completed_at": "2025-12-23T10:30:00Z",
        "total_steps_completed": 4
      }
    ]
  }
}
```

### Get Detailed Timeline
```json
{
  "success": true,
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
      "completed_at": "2025-12-23T10:30:00Z"
    },
    "timeline": [
      {
        "step": "initiated",
        "timestamp": "2025-12-23T10:00:00Z",
        "notes": "Press release initiated"
      },
      {
        "step": "payment_completed",
        "timestamp": "2025-12-23T10:15:00Z",
        "notes": "Payment completed"
      }
    ]
  }
}
```

## Request Examples

### Approve PR
```bash
curl -X PUT \
  http://localhost:3000/api/v1/press-releases/progress/507f1f77bcf86cd799439011/approve \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"notes": "Approved for publication"}'
```

### Reject PR
```bash
curl -X PUT \
  http://localhost:3000/api/v1/press-releases/progress/507f1f77bcf86cd799439011/reject \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rejection_reason": "Content needs revision"}'
```

### Move to Review
```bash
curl -X PUT \
  http://localhost:3000/api/v1/press-releases/progress/507f1f77bcf86cd799439011/under-review \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"notes": "Starting editorial review"}'
```

## Frontend Usage

### Display Current Step
```typescript
const response = await fetch('/api/v1/press-releases/progress/:prId');
const { data } = await response.json();

const currentStep = data.progress.current_step;
// Display: initiated, payment_completed, under_review, approved, or rejected
```

### Show Timeline
```typescript
data.timeline.forEach((record) => {
  console.log(`${record.step} - ${record.timestamp}`);
  if (record.notes) console.log(`  ${record.notes}`);
});
```

### Calculate Progress %
```typescript
const steps = ['initiated', 'payment_completed', 'under_review', 'approved'];
const index = steps.indexOf(data.progress.current_step);
const percentage = ((index + 1) / steps.length) * 100;
```

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Invalid input or missing required fields |
| 401 | Unauthorized (missing or invalid token) |
| 404 | Press release not found |
| 500 | Server error |

## Error Handling

```json
{
  "success": false,
  "status": 400,
  "message": "Rejection reason is required"
}
```

## Key Features

✅ **Automatic Recording** - Steps recorded automatically  
✅ **Complete History** - Every step stored with timestamp  
✅ **Metadata** - Payment refs, order IDs, rejection reasons  
✅ **Timeline View** - Users see full journey  
✅ **Admin Control** - Easy approval/rejection  
✅ **Database Indexed** - Fast queries  

## File Locations

- Model: `src/models/PressReleaseProgress.ts`
- Controller: `src/controllers/pressRelease.controller.ts`
- Routes: `src/routes/pressRelease.routes.ts`
- Complete Guide: `PRESS_RELEASE_TRACKER_GUIDE.md`
- Implementation Summary: `PRESS_RELEASE_TRACKER_IMPLEMENTATION.md`

## Support

For detailed information, see: `PRESS_RELEASE_TRACKER_GUIDE.md`
- `current_status` (required): 'pending' | 'processing' | 'review' | 'completed' | 'rejected'
- `progress_percentage` (optional): 0-100
- `notes` (optional): Status update notes
- `reviewers_count` (optional): Number of reviewers

---

### 3. GET /api/pressRelease/tracker/all
Get all press releases with tracker information.

```bash
curl -X GET http://localhost:3000/api/pressRelease/tracker/all \
  -H "Authorization: Bearer {token}"
```

**Returns:** List of all trackers with status config

---

## Frontend Usage

### Fix TypeScript "Index Signature" Error

**Problem:**
```typescript
// ❌ This causes TypeScript error:
// "Element implicitly has an 'any' type because expression of type 'string' 
// can't be used to index type..."
const config = statusConfigMap[status];
```

**Solution:**
```typescript
import { getStatusConfig, statusConfigMap } from '@/utils/pressReleaseTrackerConfig';

// ✅ Use the helper function
const config = getStatusConfig(status);
if (config) {
  console.log(config.color);
  console.log(config.icon);
}

// ✅ Use Record type for iteration
Object.entries(statusConfigMap).map(([status, config]) => {
  // status is now properly typed
  return <div key={status}>{config.color}</div>
})
```

### Component Integration

```typescript
import PressReleaseProgressTracker from '@/components/PressReleaseProgressTracker';

export function Dashboard() {
  const handleStatusChange = async (newStatus) => {
    const response = await fetch(`/api/pressRelease/tracker/${prId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        current_status: newStatus,
        progress_percentage: 50,
        notes: 'Status updated from dashboard'
      })
    });
    
    const { data } = await response.json();
    console.log('Updated tracker:', data.tracker);
  };

  return (
    <PressReleaseProgressTracker 
      prId="507f1f77bcf86cd799439011"
      onStatusChange={handleStatusChange}
    />
  );
}
```

## Database Schema

### Tracker Subdocument in PressRelease

```typescript
{
  current_status: 'pending' | 'processing' | 'review' | 'completed' | 'rejected',
  status_history: [
    {
      status: string,
      timestamp: Date,
      notes: string (optional)
    }
  ],
  progress_percentage: 0-100,
  estimated_completion: Date,
  actual_completion: Date (optional),
  reviewers_count: number
}
```

## Status Transitions

```
START
  ↓
PENDING (0%) → PROCESSING (25-75%) → REVIEW (75-99%) → COMPLETED (100%)
  ↓                ↓                     ↓
  └────────────────┴─────────────────→ REJECTED (any %)
```

## Best Practices

1. **Always use helper functions** to access status configuration
2. **Validate status values** before making API calls
3. **Include notes** when updating status for audit trail
4. **Update progress percentage** when status changes
5. **Use `as const`** assertion for type-safe status literals

## File Locations

- **Types**: `src/types/pressRelease.types.ts`
- **Controller**: `src/controllers/pressRelease.controller.ts`
- **Routes**: `src/routes/pressRelease.routes.ts`
- **Model**: `src/models/PressRelease.ts`
- **Utilities**: `src/utils/pressReleaseTrackerConfig.ts`
- **Component**: `src/components/PressReleaseProgressTracker.tsx`

## Example Complete Workflow

```typescript
// 1. Fetch tracker
const response = await fetch(`/api/pressRelease/tracker/${prId}`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { data } = await response.json();

// 2. Display current status
const config = getStatusConfig(data.tracker.current_status);
console.log(`Current: ${config?.color}`);

// 3. Update to next stage
await fetch(`/api/pressRelease/tracker/${prId}/status`, {
  method: 'PUT',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    current_status: 'processing',
    progress_percentage: 25,
    notes: 'Distribution started'
  })
});

// 4. Final completion
await fetch(`/api/pressRelease/tracker/${prId}/status`, {
  method: 'PUT',
  body: JSON.stringify({
    current_status: 'completed',
    progress_percentage: 100,
    notes: 'All outlets published'
  })
});
```

## Troubleshooting

### TypeScript Error: Can't index type
**Solution**: Use `getStatusConfig()` helper function instead of direct indexing

### Status not updating
**Check**: 
- Press release exists for the user
- Status value is one of the 5 valid options
- Authorization token is valid

### Progress not advancing
**Check**:
- `progress_percentage` is between 0-100
- When status is 'completed', progress auto-sets to 100%

## Support

For issues or questions, refer to:
- Backend Implementation: `PRESS_RELEASE_TRACKER_IMPLEMENTATION.md`
- Type Definitions: `src/types/pressRelease.types.ts`
- Component Example: `src/components/PressReleaseProgressTracker.tsx`
