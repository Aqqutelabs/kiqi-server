# Publisher/PR Channel Marketplace - Complete API Documentation

## Overview
This document lists all API endpoints for the Publisher/PR Channel Listing + Paid Add-ons Marketplace functionality, built as an extension to the existing PR system.

## Base URLs
- **Admin API**: `/api/v1/admin`
- **User/Buyer API**: `/api/v1/press-releases`

---

## ADMIN ENDPOINTS

### Publisher Marketplace Management

#### 1. List All Publishers
```
GET /api/v1/admin/publishers
```
**Description**: Get all publishers with marketplace features  
**Query Parameters**:
- `level` (optional): Filter by publisher level (Premium, Hot, Fresh)
- `engagement` (optional): Filter by engagement level
- `delivery` (optional): Filter by delivery time
- `isPublished` (optional): Filter by publish status (true/false)
- `isMarketplaceListing` (optional): Filter by marketplace listings (true/false)
- `searchTerm` (optional): Search in name, description, coverage
- `sortBy` (optional): Sort field (default: createdAt)
- `sortOrder` (optional): asc/desc (default: desc)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)

**Response**: Paginated list of publishers with full details

---

#### 2. Get Publisher Details
```
GET /api/v1/admin/publishers/:publisherId
```
**Description**: Get detailed publisher information by ID  
**Response**: Complete publisher data including reviews, FAQs, metrics

---

#### 3. Create Publisher Listing
```
POST /api/v1/admin/publishers
```
**Description**: Create new publisher marketplace listing  
**Body**:
```json
{
  "name": "Publisher Name",
  "price": "$500",
  "avg_publish_time": "1-2 Days",
  "industry_focus": ["Technology", "Finance"],
  "region_reach": ["North America", "Europe"],
  "audience_reach": "Tech professionals, 500K+ monthly readers",
  "key_features": ["SEO optimized", "Social media promotion"],
  "metrics": {
    "domain_authority": 75,
    "trust_score": 85,
    "avg_traffic": 500000,
    "social_signals": 1200
  },
  "logo": "https://example.com/logo.png",
  "description": "Leading technology publication",
  "level": "Premium",
  "engagement": "High CTR (5%+)",
  "delivery": "1-2 Days",
  "coverage": "In-depth technology analysis and news coverage",
  "formatDepth": ["Analysis", "News"],
  "addOns": {
    "backdating": {
      "enabled": true,
      "price": 50
    },
    "socialPosting": {
      "enabled": true,
      "price": 100
    },
    "featuredPlacement": {
      "enabled": true,
      "pricePerUnit": 200,
      "maxQuantity": 3
    }
  },
  "faqs": [
    {
      "question": "Do you write the press release?",
      "answer": "Yes, our editorial team writes professional press releases.",
      "order": 1,
      "isActive": true
    }
  ],
  "metaTitle": "Tech Publisher - Premium PR Placement",
  "metaDescription": "Get featured in leading tech publication",
  "isMarketplaceListing": true
}
```

---

#### 4. Update Publisher Listing
```
PUT /api/v1/admin/publishers/:publisherId
```
**Description**: Update any publisher fields  
**Body**: Any publisher fields to update

---

#### 5. Publish/Unpublish Publisher
```
PUT /api/v1/admin/publishers/:publisherId/publish
```
**Description**: Change publisher publish status  
**Body**:
```json
{
  "isPublished": true,
  "publishedReason": "Approved for marketplace"
}
```

---

#### 6. Delete Publisher
```
DELETE /api/v1/admin/publishers/:publisherId
```
**Description**: Delete publisher (requires super admin)  
**Access**: Super Admin only

---

#### 7. Update Publisher Add-ons
```
PUT /api/v1/admin/publishers/:publisherId/addons
```
**Description**: Configure publisher add-ons  
**Body**:
```json
{
  "addOns": {
    "backdating": {
      "enabled": true,
      "price": 75
    },
    "socialPosting": {
      "enabled": false
    },
    "paidAmplification": {
      "enabled": true,
      "minBudget": 100,
      "maxBudget": 5000
    }
  }
}
```

---

#### 8. Update Publisher Metrics
```
PUT /api/v1/admin/publishers/:publisherId/metrics
```
**Description**: Update publisher performance metrics  
**Body**:
```json
{
  "metrics": {
    "domain_authority": 80,
    "trust_score": 90
  },
  "enhancedMetrics": {
    "ctrPercentage": 5.2,
    "bounceRatePercentage": 25,
    "referralTraffic": 15000,
    "buzzIndex": 85,
    "vibeValuePercentage": 78,
    "avgBacklinks": {
      "min": 50,
      "max": 200
    }
  }
}
```

---

#### 9. Update Publisher FAQs
```
PUT /api/v1/admin/publishers/:publisherId/faqs
```
**Description**: Manage publisher FAQ content  
**Body**:
```json
{
  "faqs": [
    {
      "question": "Do you write the press release?",
      "answer": "Yes, our editorial team provides full writing services.",
      "order": 1,
      "isActive": true
    },
    {
      "question": "What's the turnaround time?",
      "answer": "Typically 1-2 business days for publication.",
      "order": 2,
      "isActive": true
    }
  ]
}
```

---

### Review Management

#### 10. List All Publisher Reviews
```
GET /api/v1/admin/reviews
```
**Description**: Get all publisher reviews for moderation  
**Query Parameters**:
- `publisherId` (optional): Filter by specific publisher
- `isModerated` (optional): Filter by moderation status
- `isApproved` (optional): Filter by approval status  
- `rating` (optional): Filter by rating (1-5)
- `page`, `limit`: Pagination

---

#### 11. Moderate Review
```
PUT /api/v1/admin/reviews/:publisherId/:reviewId/moderate
```
**Description**: Approve or reject a review  
**Body**:
```json
{
  "isApproved": true,
  "moderationNote": "Review meets quality standards"
}
```

---

#### 12. Delete Review
```
DELETE /api/v1/admin/reviews/:publisherId/:reviewId
```
**Description**: Delete a review (requires super admin)  
**Access**: Super Admin only

---

### Analytics

#### 13. Marketplace Analytics
```
GET /api/v1/admin/marketplace/analytics
```
**Description**: Get comprehensive marketplace insights  
**Query Parameters**:
- `startDate` (optional): Analytics start date
- `endDate` (optional): Analytics end date

**Response**:
```json
{
  "publisherStats": {
    "total": 45,
    "published": 32,
    "draft": 13
  },
  "reviewStats": {
    "totalReviews": 250,
    "approvedReviews": 215,
    "pendingReviews": 35,
    "averageRating": 4.2
  },
  "topPublishers": [...],
  "addonUsage": {
    "backdating": 15,
    "socialPosting": 28,
    "featuredPlacement": 12
  }
}
```

---

## USER/BUYER ENDPOINTS

### Publisher Discovery

#### 1. Browse Publishers (Enhanced)
```
GET /api/v1/press-releases/publishers
```
**Description**: Browse marketplace publishers with advanced filtering  
**Query Parameters**:
- `level`: Publisher level filter (Premium, Hot, Fresh)
- `engagement`: Engagement level filter  
- `delivery`: Delivery time filter
- `industry`: Industry focus filter
- `region`: Regional reach filter
- `minRating`: Minimum rating filter (0-5)
- `maxPrice`: Maximum price filter
- `minPrice`: Minimum price filter
- `sortBy`: Sort field (averageRating, price, name, etc.)
- `sortOrder`: asc/desc
- `page`, `limit`: Pagination
- `searchTerm`: Search in name, description, coverage

**Response**: Paginated publishers optimized for marketplace display

---

#### 2. Publisher Details (Public)
```
GET /api/v1/press-releases/publishers/:id
```
**Description**: Get detailed publisher info for marketplace  
**Supports**: MongoDB ID or public slug  
**Response**: Complete marketplace-ready publisher data with:
- Overview page data
- Metrics page data  
- Reviews page data
- FAQ page data
- SEO data
- Available add-ons

---

#### 3. Marketplace Filters
```
GET /api/v1/press-releases/marketplace/filters
```
**Description**: Get available filter options and marketplace stats  
**Response**:
```json
{
  "filters": {
    "levels": ["Premium", "Hot", "Fresh"],
    "engagements": ["High CTR (5%+)", "Medium CTR (2-5%)"],
    "deliveries": ["Same Day", "1-2 Days"],
    "industries": ["Technology", "Finance", "Healthcare"],
    "regions": ["North America", "Europe"],
    "priceRange": {
      "min": 100,
      "max": 2000
    }
  },
  "stats": {
    "totalPublishers": 32,
    "averageRating": 4.2,
    "totalReviews": 215
  }
}
```

---

### Shopping Cart (Enhanced)

#### 4. Add to Cart with Add-ons
```
POST /api/v1/press-releases/cart/add-with-addons
```
**Description**: Add publisher to cart with selected add-ons  
**Body**:
```json
{
  "publisherId": "64a1b2c3d4e5f6789",
  "selectedAddOns": ["backdating", "socialPosting", "featuredPlacement"],
  "quantity": 1,
  "customBudgets": {
    "paidAmplification": 500
  }
}
```

**Features**:
- Automatic base placement addition
- Add-on pricing calculation
- Featured placement quantity handling
- Custom budget validation for paid amplification

---

#### 5. Get Cart (Existing)
```
GET /api/v1/press-releases/cart
```
**Description**: Get current user's cart with total calculations

---

#### 6. Update Cart Item (Existing)
```
PUT /api/v1/press-releases/cart/:publisherId
```
**Description**: Update cart item quantities or add-ons

---

#### 7. Remove from Cart (Existing)
```
DELETE /api/v1/press-releases/cart/:publisherId
```
**Description**: Remove item from cart

---

### Bookmarks

#### 8. Add Bookmark
```
POST /api/v1/press-releases/bookmarks
```
**Description**: Bookmark a publisher for later  
**Body**:
```json
{
  "publisherId": "64a1b2c3d4e5f6789"
}
```

---

#### 9. Remove Bookmark
```
DELETE /api/v1/press-releases/bookmarks/:publisherId
```
**Description**: Remove publisher bookmark

---

#### 10. Get User Bookmarks
```
GET /api/v1/press-releases/bookmarks
```
**Description**: Get user's bookmarked publishers  
**Query Parameters**: `page`, `limit`

---

### Social Features

#### 11. Share Publisher
```
POST /api/v1/press-releases/publishers/:publisherId/share
```
**Description**: Generate share URLs and track shares  
**Body**:
```json
{
  "platform": "linkedin"
}
```
**Platforms**: linkedin, twitter, whatsapp, copy

---

#### 12. Submit Review
```
POST /api/v1/press-releases/publishers/:publisherId/review
```
**Description**: Submit a review for a publisher  
**Body**:
```json
{
  "rating": 5,
  "reviewText": "Excellent service and fast delivery. Highly recommended!"
}
```
**Validation**:
- Rating: 1-5
- Review text: 10-1000 characters
- One review per user per publisher

---

### Orders (Existing Enhanced)

#### 13. Create Order (Existing)
```
POST /api/v1/press-releases/orders/checkout
```
**Description**: Process cart checkout with add-ons

#### 14. Verify Payment (Existing)
```
GET /api/v1/press-releases/orders/verify-payment
```
**Description**: Verify payment and clear cart

#### 15. Get Order Details (Existing)
```
GET /api/v1/press-releases/orders/:id
```
**Description**: Get order details

---

## KEY FEATURES IMPLEMENTED

### 🎯 **Core Marketplace Features**
- ✅ Publisher listings with all PRD fields
- ✅ Level-based categorization (Premium/Hot/Fresh)
- ✅ Engagement and delivery time filtering
- ✅ Advanced search and filtering
- ✅ Public indexable profile pages

### 🛒 **Shopping Experience**
- ✅ Enhanced cart with add-ons support
- ✅ Automatic base placement addition
- ✅ Add-on pricing calculation
- ✅ Bookmark functionality
- ✅ Share functionality with tracking

### 💰 **Add-ons System**
- ✅ 7 configurable add-on types
- ✅ Dynamic pricing and availability
- ✅ Quantity-based add-ons (Featured Placement)
- ✅ Budget-based add-ons (Paid Amplification)
- ✅ Conditional display (only show if enabled/priced)

### 📊 **Metrics & Analytics**
- ✅ Comprehensive publisher metrics
- ✅ Enhanced marketplace analytics
- ✅ Review system with moderation
- ✅ Performance tracking (views, cart adds, shares)

### ⭐ **Review System**
- ✅ User review submission
- ✅ Admin moderation workflow
- ✅ Rating aggregation
- ✅ Star distribution display

### 🔧 **Admin Management**
- ✅ Full publisher CRUD operations
- ✅ Add-on configuration
- ✅ Review moderation
- ✅ FAQ management
- ✅ Metrics management
- ✅ Publishing controls

### 🚀 **SEO & Social**
- ✅ Meta tags and OpenGraph support
- ✅ Public slug-based URLs
- ✅ Social sharing integration
- ✅ Indexable publisher pages

---

## Authentication & Security
- All user endpoints require JWT authentication
- Admin endpoints require admin role verification
- Super admin required for deletions
- Review moderation prevents spam
- Input validation on all endpoints

## Performance Optimizations
- Database indexes on key fields
- Pagination on all list endpoints
- Async analytics updates
- Lean queries for performance
- Conditional field population

This comprehensive marketplace system extends your existing PR functionality to create a full-featured publisher marketplace with all the requirements from your PRD.