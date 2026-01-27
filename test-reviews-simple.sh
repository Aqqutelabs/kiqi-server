#!/bin/bash

# Simple Review Endpoints Test Script
# Replace YOUR_AUTH_TOKEN with your actual JWT token
# Use the IDs from the seeded data

AUTH_TOKEN="YOUR_AUTH_TOKEN"
PRESS_RELEASE_ID="507f1f77bcf86cd799439011"
REVIEW_ID="REPLACE_WITH_ACTUAL_REVIEW_ID"
BASE_URL="http://localhost:8000/api/v1/press-releases"

echo "=========================================="
echo "REVIEW ENDPOINTS - SIMPLE TEST"
echo "=========================================="
echo "Using Press Release ID: $PRESS_RELEASE_ID"
echo ""

# Test 1: Get Review Summary (just stats)
echo "📊 Test 1: Get Review Summary (Statistics Only)"
echo "GET $BASE_URL/$PRESS_RELEASE_ID/reviews/summary"
curl -X GET "$BASE_URL/$PRESS_RELEASE_ID/reviews/summary" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n\n"

# Test 2: Get Reviews List (actual reviews with text)
echo "=========================================="
echo "📝 Test 2: Get Reviews List (Full Review Details)"
echo "GET $BASE_URL/$PRESS_RELEASE_ID/reviews"
curl -X GET "$BASE_URL/$PRESS_RELEASE_ID/reviews?page=1&limit=5" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n\n"

# Test 3: Create a New Review
echo "=========================================="
echo "✍️ Test 3: Create New Review"
echo "POST $BASE_URL/$PRESS_RELEASE_ID/reviews"
curl -X POST "$BASE_URL/$PRESS_RELEASE_ID/reviews" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 5,
    "reviewText": "This is a test review. Great service!",
    "reviewerName": "Test User"
  }' \
  -w "\nStatus: %{http_code}\n\n"

# Test 4: Update a Review (replace REVIEW_ID with actual ID from response above)
echo "=========================================="
echo "🔄 Test 4: Update Review"
echo "PUT $BASE_URL/reviews/$REVIEW_ID"
echo "⚠️  Replace REVIEW_ID with actual review ID from Test 3 response"
curl -X PUT "$BASE_URL/reviews/$REVIEW_ID" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 4,
    "reviewText": "Updated test review text"
  }' \
  -w "\nStatus: %{http_code}\n\n"

# Test 5: Delete a Review (replace REVIEW_ID with actual ID)
echo "=========================================="
echo "🗑️ Test 5: Delete Review"
echo "DELETE $BASE_URL/reviews/$REVIEW_ID"
echo "⚠️  Replace REVIEW_ID with actual review ID"
curl -X DELETE "$BASE_URL/reviews/$REVIEW_ID" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n\n"

echo "=========================================="
echo "✅ Tests Completed"
echo "=========================================="
echo ""
echo "📝 Notes:"
echo "1. Replace YOUR_AUTH_TOKEN with your actual JWT token"
echo "2. Update REVIEW_ID with actual review IDs from responses"
echo "3. Run 'node seed-reviews-simple.js' first to seed test data"