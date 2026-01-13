#!/bin/bash

# Press Release Tracker Test Script
# Replace YOUR_AUTH_TOKEN with your actual JWT token
# Replace PRESS_RELEASE_ID with actual ID from your database

AUTH_TOKEN="YOUR_AUTH_TOKEN"
PRESS_RELEASE_ID="69456d55d5ae44ddacf47a19"
BASE_URL="http://localhost:8000/api/v1/press-releases"

echo "=========================================="
echo "PRESS RELEASE TRACKER - TEST SCRIPT"
echo "=========================================="
echo ""

# Test 1: Get current tracker status
echo "📋 Test 1: Get Tracker Details"
echo "GET $BASE_URL/tracker/$PRESS_RELEASE_ID"
curl -X GET "$BASE_URL/tracker/$PRESS_RELEASE_ID" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n\n"

# Test 2: Update to Processing
echo "=========================================="
echo "⚙️ Test 2: Update Status to Processing"
curl -X PUT "$BASE_URL/tracker/$PRESS_RELEASE_ID/status" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "current_status": "processing",
    "notes": "Started distribution to media outlets",
    "progress_percentage": 25,
    "reviewers_count": 1
  }' \
  -w "\nStatus: %{http_code}\n\n"

# Test 3: Update to Review
echo "=========================================="
echo "👀 Test 3: Update Status to Review"
curl -X PUT "$BASE_URL/tracker/$PRESS_RELEASE_ID/status" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "current_status": "review",
    "notes": "Awaiting editorial review",
    "progress_percentage": 75,
    "reviewers_count": 2
  }' \
  -w "\nStatus: %{http_code}\n\n"

# Test 4: Update to Completed
echo "=========================================="
echo "✅ Test 4: Update Status to Completed"
curl -X PUT "$BASE_URL/tracker/$PRESS_RELEASE_ID/status" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "current_status": "completed",
    "notes": "Press release successfully published",
    "progress_percentage": 100,
    "reviewers_count": 2
  }' \
  -w "\nStatus: %{http_code}\n\n"

# Test 5: Get all trackers
echo "=========================================="
echo "📊 Test 5: Get All Trackers"
curl -X GET "$BASE_URL/tracker/all" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n\n"

echo "=========================================="
echo "✨ Tests Complete!"
echo "=========================================="
