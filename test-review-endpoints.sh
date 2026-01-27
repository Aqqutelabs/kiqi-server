#!/bin/bash

# Press Release Reviews Test Script
# Replace YOUR_AUTH_TOKEN with your actual JWT token
# Replace PRESS_RELEASE_ID with actual ID from your database

AUTH_TOKEN="YOUR_AUTH_TOKEN"
PRESS_RELEASE_ID="507f1f77bcf86cd799439011"
BASE_URL="http://localhost:8000/api/v1/press-releases"

echo "=========================================="
echo "PRESS RELEASE REVIEWS - TEST SCRIPT"
echo "=========================================="
echo ""

# Test 1: Get review summary
echo "📊 Test 1: Get Review Summary"
echo "GET $BASE_URL/$PRESS_RELEASE_ID/reviews/summary"
curl -X GET "$BASE_URL/$PRESS_RELEASE_ID/reviews/summary" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n\n"

# Test 2: Get reviews list
echo "=========================================="
echo "📝 Test 2: Get Reviews List"
echo "GET $BASE_URL/$PRESS_RELEASE_ID/reviews"
curl -X GET "$BASE_URL/$PRESS_RELEASE_ID/reviews?page=1&limit=5" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n\n"

# Test 3: Create a new review
echo "=========================================="
echo "✍️ Test 3: Create New Review"
echo "POST $BASE_URL/$PRESS_RELEASE_ID/reviews"
curl -X POST "$BASE_URL/$PRESS_RELEASE_ID/reviews" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 5,
    "reviewText": "Excellent service! Highly recommend for press release distribution.",
    "reviewerName": "Test User"
  }' \
  -w "\nStatus: %{http_code}\n\n"

# Test 4: Get recent reviews (admin)
echo "=========================================="
echo "📈 Test 4: Get Recent Reviews (Admin)"
echo "GET $BASE_URL/admin/reviews/recent"
curl -X GET "$BASE_URL/admin/reviews/recent?page=1&limit=10" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n\n"

echo "=========================================="
echo "✅ Review Tests Completed"
echo "=========================================="