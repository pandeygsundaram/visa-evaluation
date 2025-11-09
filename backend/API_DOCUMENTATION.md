# Visa Evaluation API - Complete Documentation

## Table of Contents
1. [Authentication](#authentication)
2. [Subscription Management](#subscription-management)
3. [Analytics](#analytics)
4. [Public API (API Key)](#public-api-api-key)
5. [Webhooks](#webhooks)
6. [Rate Limits](#rate-limits)

---

## Authentication

All authenticated endpoints require a JWT token in the Authorization header:
```bash
Authorization: Bearer <your-jwt-token>
```

Public API endpoints require an API key in the x-api-key header:
```bash
x-api-key: <your-api-key>
```

---

## Subscription Management

### 1. Get All Available Plans

**Endpoint:** `GET /api/subscription/plans`
**Auth:** Public (no authentication required)

**cURL:**
```bash
curl -X GET http://localhost:5000/api/subscription/plans \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "676abc123def456",
      "name": "Free Plan",
      "tier": "free",
      "price": 0,
      "billingPeriod": "monthly",
      "callLimit": 5,
      "modelAccess": ["gpt-4o-mini"],
      "features": [
        "5 API calls per month",
        "GPT-4o-mini model",
        "Basic features",
        "Community support"
      ],
      "isActive": true,
      "stripePriceId": null,
      "createdAt": "2025-01-09T10:00:00.000Z",
      "updatedAt": "2025-01-09T10:00:00.000Z"
    },
    {
      "_id": "676abc789def123",
      "name": "Pro Plan",
      "tier": "pro",
      "price": 2900,
      "billingPeriod": "monthly",
      "callLimit": 5000,
      "modelAccess": ["gpt-4o-mini", "gpt-4o"],
      "features": [
        "5,000 API calls per month",
        "GPT-4o-mini + limited GPT-4o access",
        "All features unlocked",
        "Email support",
        "API access"
      ],
      "isActive": true,
      "stripePriceId": "price_1234567890",
      "createdAt": "2025-01-09T10:00:00.000Z",
      "updatedAt": "2025-01-09T10:00:00.000Z"
    },
    {
      "_id": "676abc456def789",
      "name": "Pro Plan (Yearly)",
      "tier": "pro",
      "price": 29000,
      "billingPeriod": "yearly",
      "callLimit": 5000,
      "modelAccess": ["gpt-4o-mini", "gpt-4o"],
      "features": [
        "5,000 API calls per month",
        "GPT-4o-mini + limited GPT-4o access",
        "All features unlocked",
        "Email support",
        "API access",
        "Save 17% with yearly billing"
      ],
      "isActive": true,
      "stripePriceId": "price_0987654321",
      "createdAt": "2025-01-09T10:00:00.000Z",
      "updatedAt": "2025-01-09T10:00:00.000Z"
    }
  ]
}
```

---

### 2. Create Checkout Session

**Endpoint:** `POST /api/subscription/create-checkout`
**Auth:** Required (JWT)

**cURL:**
```bash
curl -X POST http://localhost:5000/api/subscription/create-checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "planId": "676abc789def123",
    "successUrl": "http://localhost:3000/dashboard?payment=success",
    "cancelUrl": "http://localhost:3000/dashboard?payment=canceled"
  }'
```

**Request Body:**
```json
{
  "planId": "676abc789def123",  // Required: MongoDB ObjectId of the plan
  "successUrl": "http://localhost:3000/dashboard?payment=success",  // Optional
  "cancelUrl": "http://localhost:3000/dashboard?payment=canceled"   // Optional
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "cs_test_a1B2c3D4e5F6g7H8i9J0k1L2m3N4o5P6q7R8s9T0",
    "url": "https://checkout.stripe.com/c/pay/cs_test_a1B2c3D4e5F6g7H8i9J0k1L2m3N4o5P6q7R8s9T0#fidkdWxOYHwnPyd1blpxYHZxWjA0T2htZjFVcmZJPGhNNTRnVTNNfGphSmJqQnN8NzI8S2BxPX1rbDJgfGN0NEhMa0xyT15mVklDQmRfXzVrTGxHXGh0dkdGbX1LcGtEYzVUQUlUNkxJYmxfV0pOTWFTTycpJ2N3amhWYHdzYHcnP3F3cGApJ2lkfGpwcVF8dWAnPyd2bGtiaWBabHFgaCcpJ2BrZGdpYFVpZGZgbWppYWB3dic%2FcXdwYCkndXdgaWpkYUNqa2RnaXBxKSd3d2BxJ3gl"
  }
}
```

**Error Responses:**

*Unauthorized:*
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

*Plan not found:*
```json
{
  "success": false,
  "message": "Plan not found"
}
```

*Free plan selected:*
```json
{
  "success": false,
  "message": "Cannot create checkout for free plan"
}
```

*User not found:*
```json
{
  "success": false,
  "message": "User not found"
}
```

---

### 3. Get Subscription Status

**Endpoint:** `GET /api/subscription/status`
**Auth:** Required (JWT)

**cURL:**
```bash
curl -X GET http://localhost:5000/api/subscription/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response (Active Subscription):**
```json
{
  "success": true,
  "data": {
    "hasSubscription": true,
    "subscription": {
      "_id": "676def123abc456",
      "userId": "676abc123def456",
      "planId": {
        "_id": "676abc789def123",
        "name": "Pro Plan",
        "tier": "pro",
        "price": 2900,
        "billingPeriod": "monthly",
        "callLimit": 5000,
        "modelAccess": ["gpt-4o-mini", "gpt-4o"],
        "features": [
          "5,000 API calls per month",
          "GPT-4o-mini + limited GPT-4o access",
          "All features unlocked",
          "Email support",
          "API access"
        ]
      },
      "status": "active",
      "currentPeriodStart": "2025-01-09T10:00:00.000Z",
      "currentPeriodEnd": "2025-02-09T10:00:00.000Z",
      "cancelAtPeriodEnd": false,
      "callsUsed": 247,
      "callsRemaining": 4753,
      "createdAt": "2025-01-09T10:00:00.000Z"
    }
  }
}
```

**Expected Response (No Subscription - Free Plan):**
```json
{
  "success": true,
  "data": {
    "hasSubscription": false,
    "plan": "free",
    "message": "User is on the free plan"
  }
}
```

---

### 4. Get Subscription Usage

**Endpoint:** `GET /api/subscription/usage`
**Auth:** Required (JWT)

**cURL:**
```bash
curl -X GET http://localhost:5000/api/subscription/usage \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response (With Subscription):**
```json
{
  "success": true,
  "data": {
    "plan": {
      "name": "Pro Plan",
      "tier": "pro",
      "billingPeriod": "monthly"
    },
    "usage": {
      "callsUsed": 247,
      "callsRemaining": 4753,
      "callLimit": 5000,
      "usagePercentage": 4.94
    },
    "period": {
      "start": "2025-01-09T10:00:00.000Z",
      "end": "2025-02-09T10:00:00.000Z",
      "daysRemaining": 31
    }
  }
}
```

**Expected Response (Free Plan):**
```json
{
  "success": true,
  "data": {
    "plan": {
      "name": "Free",
      "tier": "free",
      "billingPeriod": "monthly"
    },
    "usage": {
      "callsUsed": 3,
      "callsRemaining": 2,
      "callLimit": 5,
      "usagePercentage": 60.0
    },
    "period": {
      "start": "2025-01-01T00:00:00.000Z",
      "end": "2025-02-01T00:00:00.000Z",
      "daysRemaining": 23
    }
  }
}
```

---

### 5. Cancel Subscription

**Endpoint:** `POST /api/subscription/cancel`
**Auth:** Required (JWT)

**cURL:**
```bash
curl -X POST http://localhost:5000/api/subscription/cancel \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Subscription will be canceled at the end of the current billing period",
  "data": {
    "subscription": {
      "_id": "676def123abc456",
      "status": "active",
      "cancelAtPeriodEnd": true,
      "currentPeriodEnd": "2025-02-09T10:00:00.000Z"
    }
  }
}
```

**Error Responses:**

*No active subscription:*
```json
{
  "success": false,
  "message": "No active subscription found"
}
```

---

## Analytics

### 1. Get Usage Analytics

**Endpoint:** `GET /api/analytics/usage`
**Auth:** Required (JWT)

**Query Parameters:**
- `startDate` (optional): ISO date string (e.g., "2025-01-01T00:00:00.000Z")
- `endDate` (optional): ISO date string (e.g., "2025-01-31T23:59:59.999Z")
- `apiKey` (optional): Filter by specific API key

**cURL:**
```bash
# Get all usage analytics
curl -X GET http://localhost:5000/api/analytics/usage \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get usage for specific date range
curl -X GET "http://localhost:5000/api/analytics/usage?startDate=2025-01-01T00:00:00.000Z&endDate=2025-01-31T23:59:59.999Z" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get usage for specific API key
curl -X GET "http://localhost:5000/api/analytics/usage?apiKey=vsk_test_abc123def456" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalCalls": 247,
      "successfulCalls": 235,
      "failedCalls": 12,
      "successRate": "95.14%",
      "averageResponseTime": "1247ms"
    },
    "charts": {
      "callsByDate": {
        "2025-01-09": 45,
        "2025-01-10": 67,
        "2025-01-11": 52,
        "2025-01-12": 83
      },
      "callsByEndpoint": {
        "/api/evaluations/public": 247
      },
      "callsByStatus": {
        "200": 235,
        "400": 8,
        "429": 4
      }
    },
    "recentCalls": [
      {
        "timestamp": "2025-01-12T15:30:45.123Z",
        "endpoint": "/api/evaluations/public",
        "method": "POST",
        "statusCode": 200,
        "success": true,
        "responseTime": 1234,
        "ipAddress": "192.168.1.100"
      },
      {
        "timestamp": "2025-01-12T15:25:30.456Z",
        "endpoint": "/api/evaluations/public",
        "method": "POST",
        "statusCode": 429,
        "success": false,
        "responseTime": 45,
        "ipAddress": "192.168.1.100"
      }
    ]
  }
}
```

---

### 2. Get Usage Summary

**Endpoint:** `GET /api/analytics/summary`
**Auth:** Required (JWT)

**cURL:**
```bash
curl -X GET http://localhost:5000/api/analytics/summary \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response (With Subscription):**
```json
{
  "success": true,
  "data": {
    "plan": {
      "name": "Pro Plan",
      "tier": "pro",
      "billingPeriod": "monthly"
    },
    "quota": {
      "limit": 5000,
      "used": 247,
      "remaining": 4753,
      "percentage": 4.9
    },
    "billingPeriod": {
      "start": "2025-01-09T10:00:00.000Z",
      "end": "2025-02-09T10:00:00.000Z",
      "daysRemaining": 31
    },
    "status": "active"
  }
}
```

**Expected Response (Free Plan):**
```json
{
  "success": true,
  "data": {
    "plan": {
      "name": "Free",
      "tier": "free",
      "billingPeriod": "monthly"
    },
    "quota": {
      "limit": 5,
      "used": 3,
      "remaining": 2,
      "percentage": 60.0
    },
    "billingPeriod": {
      "start": "2025-01-01T00:00:00.000Z",
      "end": "2025-02-01T00:00:00.000Z",
      "daysRemaining": 23
    },
    "status": "free"
  }
}
```

---

### 3. Get API Key Usage

**Endpoint:** `GET /api/analytics/api-keys/:apiKey`
**Auth:** Required (JWT)

**cURL:**
```bash
curl -X GET http://localhost:5000/api/analytics/api-keys/vsk_test_abc123def456 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "apiKey": {
      "key": "vsk_test_abc123def456",
      "name": "Production API Key",
      "createdAt": "2025-01-05T10:00:00.000Z",
      "lastUsed": "2025-01-12T15:30:45.123Z"
    },
    "usage": {
      "totalCalls": 247,
      "successfulCalls": 235,
      "failedCalls": 12
    },
    "recentCalls": [
      {
        "timestamp": "2025-01-12T15:30:45.123Z",
        "endpoint": "/api/evaluations/public",
        "statusCode": 200,
        "success": true,
        "responseTime": 1234
      },
      {
        "timestamp": "2025-01-12T15:25:30.456Z",
        "endpoint": "/api/evaluations/public",
        "statusCode": 200,
        "success": true,
        "responseTime": 1567
      }
    ]
  }
}
```

**Error Responses:**

*API key not found:*
```json
{
  "success": false,
  "message": "API key not found or does not belong to you"
}
```

---

## Public API (API Key)

### Evaluate Visa Documents (Public)

**Endpoint:** `POST /api/evaluations/public`
**Auth:** API Key (x-api-key header)

**cURL:**
```bash
curl -X POST http://localhost:5000/api/evaluations/public \
  -H "x-api-key: vsk_test_abc123def456" \
  -F "country=US" \
  -F "visaType=h1b" \
  -F "documents=@/path/to/passport.pdf" \
  -F "documents=@/path/to/resume.pdf"
```

**Request:**
- **Headers:**
  - `x-api-key`: Your API key (required)
- **Body (multipart/form-data):**
  - `country`: Country code (required, e.g., "US", "CA", "UK")
  - `visaType`: Visa type code (required, e.g., "h1b", "f1", "b1")
  - `documents`: File upload (required, at least 1, max 10 files)
    - Allowed formats: PDF, DOC, DOCX
    - Max file size: 10MB per file

**Expected Response (Success):**
```json
{
  "success": true,
  "message": "Evaluation created successfully",
  "data": {
    "_id": "676xyz123abc789",
    "userId": "676abc123def456",
    "country": "US",
    "visaType": "h1b",
    "status": "completed",
    "documents": [
      {
        "_id": "676doc1",
        "filename": "passport.pdf",
        "originalName": "passport.pdf",
        "mimeType": "application/pdf",
        "size": 524288,
        "url": "https://r2.cloudflarestorage.com/...",
        "uploadedAt": "2025-01-12T15:30:45.123Z"
      },
      {
        "_id": "676doc2",
        "filename": "resume.pdf",
        "originalName": "resume.pdf",
        "mimeType": "application/pdf",
        "size": 245760,
        "url": "https://r2.cloudflarestorage.com/...",
        "uploadedAt": "2025-01-12T15:30:45.456Z"
      }
    ],
    "evaluation": {
      "overallScore": 85,
      "eligibility": "eligible",
      "summary": "You have a strong application for H-1B visa...",
      "documentAnalysis": [
        {
          "documentName": "passport.pdf",
          "score": 95,
          "issues": [],
          "recommendations": ["Passport is valid and in good condition"]
        },
        {
          "documentName": "resume.pdf",
          "score": 75,
          "issues": ["Employment gap between 2020-2021"],
          "recommendations": ["Provide explanation for employment gap"]
        }
      ],
      "recommendations": [
        "Ensure all employment dates are documented",
        "Obtain reference letters from previous employers"
      ]
    },
    "createdAt": "2025-01-12T15:30:45.123Z",
    "updatedAt": "2025-01-12T15:30:50.789Z"
  },
  "quota": {
    "limit": 5000,
    "used": 248,
    "remaining": 4752,
    "plan": "pro"
  }
}
```

**Error Responses:**

*Missing API key:*
```json
{
  "success": false,
  "message": "API key is required",
  "error": "Missing x-api-key header"
}
```

*Invalid API key:*
```json
{
  "success": false,
  "message": "Invalid or inactive API key"
}
```

*Rate limit exceeded:*
```json
{
  "success": false,
  "message": "API rate limit exceeded",
  "error": "You have reached your pro plan limit for this billing period.",
  "quota": {
    "limit": 5000,
    "used": 5000,
    "remaining": 0,
    "plan": "pro",
    "periodEnd": "2025-02-09T10:00:00.000Z"
  }
}
```

*Missing required fields:*
```json
{
  "success": false,
  "message": "Country and visa type are required"
}
```

*No documents uploaded:*
```json
{
  "success": false,
  "message": "At least one document is required"
}
```

*Invalid visa type:*
```json
{
  "success": false,
  "message": "Visa type h9z not found for country US"
}
```

---

## Webhooks

### Stripe Webhook

**Endpoint:** `POST /api/webhook/stripe`
**Auth:** Stripe Signature Verification

**Note:** This endpoint is called by Stripe, not by your application.

**Webhook Events Handled:**
- `checkout.session.completed` - Payment successful
- `customer.subscription.created` - Subscription created
- `customer.subscription.updated` - Subscription updated
- `customer.subscription.deleted` - Subscription canceled

**Stripe Configuration:**
1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://your-domain.com/api/webhook/stripe`
3. Select events to listen to
4. Copy webhook signing secret to `.env` as `STRIPE_WEBHOOK_SECRET`

**Expected Response:**
```json
{
  "received": true
}
```

---

## Rate Limits

### Plan-Based Limits

| Plan | Monthly Calls | Price | Models |
|------|---------------|-------|--------|
| Free | 5 | $0 | GPT-4o-mini |
| Pro (Monthly) | 5,000 | $29 | GPT-4o-mini, GPT-4o |
| Pro (Yearly) | 5,000 | $290 | GPT-4o-mini, GPT-4o |
| Business (Monthly) | 25,000 | $99 | GPT-4o-mini, GPT-4o |
| Business (Yearly) | 25,000 | $990 | GPT-4o-mini, GPT-4o |

### Rate Limit Headers

All API key authenticated requests include quota information in the response:

```json
{
  "quota": {
    "limit": 5000,
    "used": 247,
    "remaining": 4753,
    "plan": "pro",
    "periodEnd": "2025-02-09T10:00:00.000Z"
  }
}
```

### Free Plan Reset

Free plan quota resets on the 1st of each month at 00:00:00 UTC.

### Paid Plan Reset

Paid plan quota resets at the end of each billing period (based on subscription start date).

---

## Setup Instructions

### 1. Environment Variables

Add to `.env`:
```env
STRIPE_PUBLISHABLE_KEY=pk_test_51SRMfF...
STRIPE_SECRET_KEY=sk_test_51SRMfF...
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### 2. Seed Plans

Run the seeding script to create plans in Stripe and database:
```bash
npm run seed:plans
```

### 3. Generate API Key

Use the authenticated dashboard endpoint:
```bash
curl -X POST http://localhost:5000/api/auth/generate-api-key \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My API Key"
  }'
```

### 4. Test API Key

```bash
curl -X POST http://localhost:5000/api/evaluations/public \
  -H "x-api-key: YOUR_API_KEY" \
  -F "country=US" \
  -F "visaType=h1b" \
  -F "documents=@/path/to/document.pdf"
```

---

## Error Codes

| Status Code | Meaning |
|-------------|---------|
| 200 | Success |
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Missing or invalid authentication |
| 403 | Forbidden - Valid auth but insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

---

## Support

For issues or questions:
- Check the console logs for detailed error messages
- Verify your API key is active
- Ensure you haven't exceeded your rate limit
- Contact support if the issue persists

---

**Last Updated:** January 2025
**API Version:** 1.0.0
