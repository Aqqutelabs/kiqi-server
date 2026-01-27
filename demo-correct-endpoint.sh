#!/bin/bash

# Quick demo of the correct endpoint usage
# This shows the difference between summary and full reviews

PRESS_RELEASE_ID="507f1f77bcf86cd799439011"
BASE_URL="http://localhost:8000/api/v1/press-releases"

echo "=========================================="
echo "DEMO: Correct Endpoint Usage"
echo "=========================================="
echo ""

echo "❌ WRONG: Getting summary (only statistics)"
echo "GET $BASE_URL/$PRESS_RELEASE_ID/reviews/summary"
echo "Response: Only shows average rating, total reviews, distribution"
echo ""

echo "✅ CORRECT: Getting full reviews"
echo "GET $BASE_URL/$PRESS_RELEASE_ID/reviews"
echo "Response: Shows individual reviews with names, ratings, and text"
echo ""

echo "📝 Sample Response Structure:"
echo '{
  "success": true,
  "data": {
    "reviews": [
      {
        "_id": "review_id",
        "reviewer_name": "John Doe",
        "rating": 5,
        "review_text": "Excellent service! Highly recommend.",
        "created_at": "2024-01-20T10:30:00Z",
        "date_formatted": "Jan 20, 2024",
        "status": "verified"
      }
    ],
    "pagination": {...}
  }
}'
echo ""

echo "🔧 To test with real data:"
echo "1. Start your server: npm run dev"
echo "2. Get a JWT token from login/registration"
echo "3. Replace YOUR_AUTH_TOKEN in test-reviews-simple.sh"
echo "4. Run: ./test-reviews-simple.sh"
echo ""

echo "🎯 Key Point: Use /reviews for full review details, /reviews/summary for statistics only"