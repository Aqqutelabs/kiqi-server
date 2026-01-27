# Press Release Reviews System

## Overview

The Press Release Reviews system allows users to submit, view, and manage reviews for press releases. Reviews include ratings (1-5 stars) and text feedback, with moderation capabilities for administrators.

## Features

- ⭐ **Star Ratings**: 1-5 star rating system
- 📝 **Review Text**: Detailed feedback up to 1000 characters
- 👤 **Anonymous Reviews**: Optional reviewer names
- ✅ **Moderation**: Admin approval system (pending/verified/rejected)
- 📊 **Analytics**: Rating distribution and summary statistics
- 🔒 **Permissions**: Users can only edit/delete their own reviews

## API Endpoints

### Get Review Summary
```
GET /api/v1/press-releases/:pressReleaseId/reviews/summary
```
Returns overall rating, total reviews, and rating distribution percentages.

**Response:**
```json
{
  "success": true,
  "data": {
    "averageRating": 4.2,
    "totalReviews": 15,
    "ratingDistribution": {
      "5": 60,
      "4": 20,
      "3": 13,
      "2": 7,
      "1": 0
    }
  }
}
```

### Get Reviews List
```
GET /api/v1/press-releases/:pressReleaseId/reviews?page=1&limit=10&status=verified
```
Returns paginated list of reviews for a press release.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Reviews per page (default: 10)
- `status` (optional): Filter by status (pending/verified/rejected, default: verified)

**Response:**
```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "_id": "review_id",
        "reviewer_name": "John Doe",
        "rating": 5,
        "review_text": "Excellent service!",
        "created_at": "2024-01-15T10:30:00Z",
        "status": "verified"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalReviews": 15,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### Create Review
```
POST /api/v1/press-releases/:pressReleaseId/reviews
```
Submit a new review for a press release.

**Request Body:**
```json
{
  "rating": 5,
  "reviewText": "Great service and fast delivery!",
  "reviewerName": "Optional Name"
}
```

**Validation:**
- `rating`: Required, 1-5
- `reviewText`: Required, 10-1000 characters
- `reviewerName`: Optional, max 100 characters

### Update Review
```
PUT /api/v1/press-releases/reviews/:reviewId
```
Update an existing review (owner or admin only).

**Request Body:**
```json
{
  "rating": 4,
  "reviewText": "Updated review text",
  "reviewerName": "Updated Name",
  "status": "verified" // Admin only
}
```

### Delete Review
```
DELETE /api/v1/press-releases/reviews/:reviewId
```
Delete a review (owner or admin only).

### Get Recent Reviews (Admin)
```
GET /api/v1/press-releases/admin/reviews/recent?page=1&limit=10&status=pending
```
Admin endpoint to view recent reviews across all press releases.

## Database Schema

### Review Model
```typescript
{
  press_release_id: ObjectId (required, ref: PressRelease),
  user_id?: ObjectId (ref: User),
  reviewer_name?: string,
  rating: number (1-5, required),
  review_text: string (required),
  status: 'pending' | 'verified' | 'rejected' (default: 'pending'),
  created_at: Date,
  updated_at: Date
}
```

## Frontend Implementation

### Reviews Summary Section
```jsx
const ReviewsSummary = ({ pressReleaseId }) => {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    fetch(`/api/v1/press-releases/${pressReleaseId}/reviews/summary`)
      .then(res => res.json())
      .then(data => setSummary(data.data));
  }, [pressReleaseId]);

  if (!summary) return <div>Loading...</div>;

  return (
    <div className="reviews-summary">
      <h3>Reviews Summary</h3>
      <div className="overall-rating">
        <span className="average">{summary.averageRating}</span>
        <span className="stars">{'⭐'.repeat(Math.round(summary.averageRating))}</span>
        <span className="total">({summary.totalReviews} reviews)</span>
      </div>

      <div className="rating-distribution">
        {[5,4,3,2,1].map(stars => (
          <div key={stars} className="rating-bar">
            <span>{stars}★</span>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${summary.ratingDistribution[stars]}%` }}
              />
            </div>
            <span>{summary.ratingDistribution[stars]}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### Recent Reviews Section
```jsx
const RecentReviews = ({ pressReleaseId }) => {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    fetch(`/api/v1/press-releases/${pressReleaseId}/reviews?page=1&limit=5`)
      .then(res => res.json())
      .then(data => setReviews(data.data.reviews));
  }, [pressReleaseId]);

  return (
    <div className="recent-reviews">
      <h3>Recent Reviews</h3>
      {reviews.map(review => (
        <div key={review._id} className="review-card">
          <div className="review-header">
            <div className={`status-indicator ${review.status}`} />
            <span className="reviewer-name">{review.reviewer_name}</span>
            <span className="rating">{'⭐'.repeat(review.rating)}</span>
            <span className="date">
              {new Date(review.created_at).toLocaleDateString()}
            </span>
          </div>
          <p className="review-text">{review.review_text}</p>
        </div>
      ))}
    </div>
  );
};
```

## Testing

### Seed Test Data
```bash
node seed-reviews.js
```

### Run API Tests
```bash
chmod +x test-review-endpoints.sh
./test-review-endpoints.sh
```

## Security Considerations

1. **Rate Limiting**: Implement rate limiting for review submissions
2. **Spam Prevention**: Consider CAPTCHA for anonymous reviews
3. **Content Moderation**: Regular review of pending reviews
4. **User Verification**: Optional user verification for trusted reviews
5. **Data Sanitization**: Sanitize review text to prevent XSS

## Future Enhancements

- [ ] Review replies/comments system
- [ ] Review helpfulness voting
- [ ] Review images/attachments
- [ ] Review analytics dashboard
- [ ] Email notifications for new reviews
- [ ] Review export functionality