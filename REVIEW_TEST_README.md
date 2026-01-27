# Review System Test Data

## Quick Start

1. **Seed the database with test data:**
   ```bash
   node seed-reviews-simple.js
   ```

2. **Make the test script executable and run it:**
   ```bash
   chmod +x test-reviews-simple.sh
   ./test-reviews-simple.sh
   ```

## Test Data Overview

### Sample IDs
- **Press Release ID**: `507f1f77bcf86cd799439011`
- **User IDs**: `507f1f77bcf86cd799439014`, `507f1f77bcf86cd799439015`, `507f1f77bcf86cd799439016`

### Sample Reviews
The test data includes 6 reviews with different scenarios:
- ✅ **Verified reviews** (4 total)
- ⏳ **Pending review** (1 total)
- 👤 **Named reviewers** and **anonymous reviews**
- ⭐ **Ratings from 2-5 stars**

## Expected Results

### Review Summary (GET /:pressReleaseId/reviews/summary)
```json
{
  "success": true,
  "data": {
    "averageRating": 4.2,
    "totalReviews": 4,
    "ratingDistribution": {
      "5": 50,
      "4": 25,
      "3": 25,
      "2": 0,
      "1": 0
    }
  }
}
```

### Reviews List (GET /:pressReleaseId/reviews)
Returns paginated list of verified reviews with reviewer names, ratings, and text.

## Expected Results

### Reviews List Response
```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "_id": "review_id_here",
        "reviewer_name": "John Doe",
        "rating": 5,
        "review_text": "Excellent service! Highly recommend.",
        "created_at": "2024-01-20T10:30:00Z",
        "date_formatted": "Jan 20, 2024",
        "status": "verified"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalReviews": 1,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

## Manual Testing

### Get Review Summary
```bash
curl -X GET "http://localhost:8000/api/v1/press-releases/507f1f77bcf86cd799439011/reviews/summary" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Create a Review
```bash
curl -X POST "http://localhost:8000/api/v1/press-releases/507f1f77bcf86cd799439011/reviews" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 5,
    "reviewText": "Great service!",
    "reviewerName": "Test User"
  }'
```

### Get Reviews List (Full Details)
```bash
curl -X GET "http://localhost:8000/api/v1/press-releases/507f1f77bcf86cd799439011/reviews?page=1&limit=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Returns:** Individual reviews with reviewer names, ratings, and review text.

### Get Review Summary (Statistics Only)
```bash
curl -X GET "http://localhost:8000/api/v1/press-releases/507f1f77bcf86cd799439011/reviews/summary" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Returns:** Only statistics (average rating, total reviews, rating distribution).

## Files
- `sample-data/review-test-data-simple.json` - Test data definitions
- `seed-reviews-simple.js` - Database seeding script
- `test-reviews-simple.sh` - API endpoint testing script