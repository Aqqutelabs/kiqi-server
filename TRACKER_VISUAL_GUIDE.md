# Press Release Tracker - Visual Guide

## Progress Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                 PRESS RELEASE LIFECYCLE                         │
└─────────────────────────────────────────────────────────────────┘

USER SIDE                          SYSTEM                   DATABASE
═══════════════════════════════════════════════════════════════════

1. Create PR
   │
   ├──────────────────► POST /create ──────────────┐
                                                    │
                                                    ├──► recordProgressStep()
                                                    │    └─ "initiated"
                                                    │
                                                    └──► Save to DB
                                                         [step: initiated]


2. View Dashboard
   │
   ├──────────────────► GET /progress/all ────────┐
                                                    │
                                                    ├──► getProgressTimeline()
                                                    │    └─ Query DB
                                                    │
                                                    └──► Return all PRs with steps


3. Purchase Distribution
   │
   ├──────────────────► POST /orders/checkout ────┐
                                                    │
                                                    └──► Paystack Payment


4. Payment Webhook
   │                                              ┌─────────────────┐
   │◄───────── Paystack ──────────────────────────┤ charge.success  │
   │                                              └─────────────────┘
   │
   ├──────────────────► Webhook Handler ──────────┐
                                                    │
                                                    ├──► recordProgressStep()
                                                    │    └─ "payment_completed"
                                                    │
                                                    └──► Save to DB
                                                         [step: payment_completed]


5. Admin Reviews PR
   │
   ├──────────────────► PUT /under-review ────────┐
                                                    │
                                                    ├──► recordProgressStep()
                                                    │    └─ "under_review"
                                                    │
                                                    └──► Save to DB
                                                         [step: under_review]


6. Admin Decision
   │
   ├──► Approve: PUT /approve ──────────────────┐
   │                                             │
   │                                             ├──► recordProgressStep()
   │                                             │    └─ "approved"
   │                                             │
   │                                             └──► Save to DB
   │                                                  [step: approved]
   │
   └──► Reject: PUT /reject ───────────────────┐
                                                │
                                                ├──► recordProgressStep()
                                                │    └─ "rejected"
                                                │
                                                └──► Save to DB
                                                     [step: rejected]


7. User Views Progress
   │
   ├──────────────────► GET /progress/:prId ────┐
                                                 │
                                                 ├──► getProgressTimeline()
                                                 │    └─ Query DB
                                                 │
                                                 └──► Return complete timeline
                                                      [all steps with timestamps]
```

---

## Data Structure Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│              PressReleaseProgress Document                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  press_release_id: ObjectId ─────────────┐                      │
│  user_id: ObjectId                       │                      │
│  current_step: "approved"                │                      │
│                                          ▼                       │
│  progress_history: [                    Links to               │
│    {                                    PressRelease          │
│      step: "initiated"                  collection             │
│      timestamp: 2025-12-23T10:00:00Z                          │
│      notes: "Press release created"                            │
│      metadata: { title, status }                               │
│    },                                                          │
│    {                                                           │
│      step: "payment_completed"                                 │
│      timestamp: 2025-12-23T10:15:00Z                          │
│      notes: "Payment received"                                 │
│      metadata: { payment_reference, order_id }               │
│    },                                                          │
│    {                                                           │
│      step: "under_review"                                      │
│      timestamp: 2025-12-23T10:20:00Z                          │
│      notes: "Review started"                                   │
│    },                                                          │
│    {                                                           │
│      step: "approved"                                          │
│      timestamp: 2025-12-23T10:30:00Z                          │
│      notes: "Approved for publication"                        │
│      metadata: { approved_at }                                │
│    }                                                           │
│  ]                                                             │
│                                                                │
│  initiated_at: 2025-12-23T10:00:00Z                           │
│  payment_completed_at: 2025-12-23T10:15:00Z                   │
│  under_review_at: 2025-12-23T10:20:00Z                        │
│  completed_at: 2025-12-23T10:30:00Z                           │
│  rejected_at: null                                             │
│  rejection_reason: null                                        │
│                                                                │
│  created_at: 2025-12-23T10:00:00Z                             │
│  updated_at: 2025-12-23T10:30:00Z                             │
│                                                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## API Call Sequence Diagram

```
User App                Server              Database
   │                      │                    │
   ├─ POST /create ──────>│                    │
   │                      ├─ recordProgressStep┤
   │                      ├──────────────────>│
   │                      │                    ├─ Save: initiated
   │                      │<──────────────────┤
   │<─ PR Created ────────┤                    │
   │                      │                    │
   │                      │   (User pays...)   │
   │                      │                    │
   │                      ◄─ Webhook ─────────┤
   │                      │ (charge.success)   │
   │                      ├─ recordProgressStep┤
   │                      ├──────────────────>│
   │                      │                    ├─ Save: payment_completed
   │                      │<──────────────────┤
   │                      │                    │
   │  GET /progress/:id ─>│                    │
   │                      ├─ getProgressTimeline
   │                      ├──────────────────>│
   │                      │                    ├─ Query: all steps
   │                      │<──────────────────┤
   │<─ Timeline ─────────┤                    │
   │  [4 steps shown]    │                    │
   │                      │                    │
```

---

## State Machine Diagram

```
                    START
                      │
                      ▼
            ┌─────────────────┐
            │   INITIATED     │
            │ (PR Created)    │
            └─────────────────┘
                      │
                      ▼
            ┌─────────────────────────┐
            │ PAYMENT_COMPLETED       │
            │ (User Paid)             │
            └─────────────────────────┘
                      │
                      ▼
            ┌─────────────────────────┐
            │ UNDER_REVIEW            │
            │ (Admin Reviewing)       │
            └─────────────────────────┘
                      │
          ┌───────────┴───────────┐
          │                       │
          ▼                       ▼
    ┌──────────────┐       ┌──────────────┐
    │   APPROVED   │       │   REJECTED   │
    │ (Published)  │       │ (Needs Edit) │
    └──────────────┘       └──────────────┘
          │                       │
          ▼                       ▼
        END                   Can Resubmit
                               (back to
                             INITIATED)
```

---

## Database Indexes

```
PressReleaseProgress Collection Indexes:

Index 1: { press_release_id: 1, user_id: 1 }
         Purpose: Fast lookup of progress for a PR
         Usage: getProgressTimeline()

Index 2: { user_id: 1, current_step: 1 }
         Purpose: Find all user's PRs in specific step
         Usage: Filter user's rejected/approved PRs

Index 3: { current_step: 1 }
         Purpose: Find all PRs in a step (for admin)
         Usage: Admin dashboard - PRs under review

Index 4: { 'progress_history.step': 1 }
         Purpose: Search by historical step
         Usage: Analytics queries
```

---

## Response Timeline Example

```
GET /api/v1/press-releases/progress/507f1f77bcf86cd799439011

{
  "success": true,
  "data": {
    "timeline": [
      
      ┌─── Step 1: INITIATED
      ├─ 2025-12-23T10:00:00Z ✓
      ├─ "Press release created"
      │ 
      ├─── Step 2: PAYMENT_COMPLETED
      ├─ 2025-12-23T10:15:00Z ✓
      ├─ "Payment received"
      │  metadata: { payment_reference: "ORDER-123" }
      │
      ├─── Step 3: UNDER_REVIEW
      ├─ 2025-12-23T10:20:00Z ✓
      ├─ "Editorial review started"
      │
      └─── Step 4: APPROVED
         2025-12-23T10:30:00Z ✓
         "Approved for publication"
    ],
    
    "progress": {
      current_step: "approved",
      
      Timeline visual:
      
      Timeline: ▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░
      Progress: 100%
      
      Time elapsed: 30 minutes
    }
  }
}
```

---

## Frontend Timeline Component

```
┌─────────────────────────────────────────────────┐
│  Press Release: "Breaking News"                 │
├─────────────────────────────────────────────────┤
│                                                  │
│  Progress: ████████████████████████░░░░  100%   │
│                                                  │
│  Timeline:                                       │
│  ─────────                                       │
│                                                  │
│  ✓ Initiated                                     │
│    Dec 23, 10:00 AM                             │
│    "Press release created"                      │
│    └─ by: System                                │
│                                                  │
│  ✓ Payment Completed                            │
│    Dec 23, 10:15 AM (+15 min)                   │
│    "Payment received successfully"              │
│    └─ Amount: ₦50,000 | Ref: ORDER-123         │
│                                                  │
│  ✓ Under Review                                 │
│    Dec 23, 10:20 AM (+5 min)                    │
│    "Editorial review started"                   │
│    └─ Reviewer: Admin Team                      │
│                                                  │
│  ✓ Approved                                     │
│    Dec 23, 10:30 AM (+10 min)                   │
│    "Approved for publication"                   │
│    └─ Status: Published                         │
│                                                  │
│  Current Status: PUBLISHED                      │
│  Total Time: 30 minutes                         │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

## Error Flow Diagram

```
User Action → Validation → Database → Response

PR Creation:
  Invalid Title ──► 400: Title is required
  Unauthorized ──► 401: Unauthorized
  Save Error ────► 500: Server error

Payment Webhook:
  Invalid Signature ──► 401: Invalid signature
  Order Not Found ───► 200: Order not found (silent)
  Already Processed ─► 200: Already completed (idempotent)
  Save Error ────────► 500: Webhook processing failed

Admin Rejection:
  No Reason Provided ─► 400: Rejection reason required
  PR Not Found ──────► 404: Press release not found
  Unauthorized ──────► 401: Unauthorized
```

---

## Performance Characteristics

```
Operation            Query Time    Database Hits    Example
─────────────────────────────────────────────────────────────
Get PR Progress      O(1)          1                getProgressTimeline()
Get All PRs          O(n)          1                getAllPressReleasesWithProgress()
Get PRs by Status    O(n)          1                Find all under_review
Record Step          O(1)          1                recordProgressStep()
Update Status        O(1)          1                approvePressRelease()
Query History        O(1)          1                progress_history array
```

Where n = number of user's PRs (typically < 100)
