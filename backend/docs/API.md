# Visa Evaluation API Documentation

Base URL: `http://localhost:5000`

## Table of Contents
1. [Authentication Endpoints](#authentication-endpoints)
2. [Visa Configuration Endpoints](#visa-configuration-endpoints)
3. [Error Responses](#error-responses)

---

## Authentication Endpoints

### 1. User Signup

Register a new user account.

**Endpoint:** `POST /api/auth/signup`

**Access:** Public

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securePassword123"
  }'
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "6581234567890abcdef12345",
      "name": "John Doe",
      "email": "john@example.com",
      "createdAt": "2025-01-15T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response (409 Conflict):**
```json
{
  "success": false,
  "message": "User with this email already exists"
}
```

---

### 2. User Login

Authenticate an existing user.

**Endpoint:** `POST /api/auth/login`

**Access:** Public

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securePassword123"
  }'
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "6581234567890abcdef12345",
      "name": "John Doe",
      "email": "john@example.com",
      "apiKeys": [
        {
          "name": "Production API",
          "key": "vsk_1234567890abcdef",
          "createdAt": "2025-01-15T10:35:00.000Z",
          "lastUsed": "2025-01-15T11:20:00.000Z",
          "isActive": true
        }
      ]
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

---

### 3. Generate API Key

Generate a new API key for programmatic access.

**Endpoint:** `POST /api/auth/generate-api-key`

**Access:** Private (requires JWT token)

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Request Body:**
```json
{
  "name": "Production API"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:5000/api/auth/generate-api-key \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "name": "Production API"
  }'
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "API key generated successfully",
  "data": {
    "apiKey": {
      "name": "Production API",
      "key": "vsk_1234567890abcdef1234567890abcdef",
      "createdAt": "2025-01-15T10:35:00.000Z",
      "isActive": true
    }
  }
}
```

---

### 4. Get All API Keys

Retrieve all API keys for the authenticated user.

**Endpoint:** `GET /api/auth/api-keys`

**Access:** Private (requires JWT token)

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**cURL Example:**
```bash
curl -X GET http://localhost:5000/api/auth/api-keys \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "apiKeys": [
      {
        "name": "Production API",
        "key": "vsk_1234567890abcdef1234567890abcdef",
        "createdAt": "2025-01-15T10:35:00.000Z",
        "lastUsed": "2025-01-15T11:20:00.000Z",
        "isActive": true
      },
      {
        "name": "Development API",
        "key": "vsk_abcdef1234567890abcdef1234567890",
        "createdAt": "2025-01-14T09:20:00.000Z",
        "lastUsed": null,
        "isActive": false
      }
    ]
  }
}
```

---

### 5. Deactivate API Key

Deactivate a specific API key.

**Endpoint:** `DELETE /api/auth/api-keys/:key`

**Access:** Private (requires JWT token)

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**cURL Example:**
```bash
curl -X DELETE http://localhost:5000/api/auth/api-keys/vsk_1234567890abcdef \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "API key deactivated successfully"
}
```

---

### 6. Get Current User Profile

Get the authenticated user's profile information.

**Endpoint:** `GET /api/auth/me`

**Access:** Private (requires JWT token OR API key)

**Headers (Option 1 - JWT):**
```
Authorization: Bearer <JWT_TOKEN>
```

**Headers (Option 2 - API Key):**
```
x-api-key: vsk_1234567890abcdef
```

**cURL Example (with JWT):**
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**cURL Example (with API Key):**
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "x-api-key: vsk_1234567890abcdef1234567890abcdef"
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "6581234567890abcdef12345",
      "name": "John Doe",
      "email": "john@example.com",
      "apiKeys": [
        {
          "name": "Production API",
          "key": "vsk_1234567890abcdef",
          "createdAt": "2025-01-15T10:35:00.000Z",
          "lastUsed": "2025-01-15T11:20:00.000Z",
          "isActive": true
        }
      ],
      "evaluations": [],
      "createdAt": "2025-01-15T10:30:00.000Z",
      "updatedAt": "2025-01-15T11:20:00.000Z"
    }
  }
}
```

---

## Visa Configuration Endpoints

### 7. Get All Countries and Visa Types

Retrieve all available countries with their visa types.

**Endpoint:** `GET /api/visa-config`

**Access:** Public

**cURL Example:**
```bash
curl -X GET http://localhost:5000/api/visa-config
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "countries": [
      {
        "code": "IE",
        "name": "Ireland",
        "flag": "🇮🇪",
        "visaTypes": [
          {
            "code": "CSEP",
            "name": "Critical Skills Employment Permit",
            "description": "For highly skilled workers in occupations on the Critical Skills Occupation List",
            "minSalary": 38000,
            "currency": "EUR",
            "processingTime": "12 weeks",
            "validityPeriod": "2 years",
            "requiredDocumentTypes": [
              "passport",
              "resume",
              "academic_certificates",
              "professional_qualifications",
              "work_experience",
              "job_offer",
              "employment_contract",
              "photograph"
            ],
            "requiredDocuments": [
              {
                "type": "passport",
                "displayName": "Valid Passport",
                "required": true,
                "description": "Passport showing picture, signature, and personal details"
              }
            ]
          }
        ]
      },
      {
        "code": "US",
        "name": "United States",
        "flag": "🇺🇸",
        "visaTypes": [
          {
            "code": "O1A",
            "name": "O-1A Visa",
            "description": "For individuals with extraordinary ability in sciences, education, business, or athletics",
            "processingTime": "2-3 months (15 days with premium)",
            "validityPeriod": "Up to 3 years",
            "requiredDocumentTypes": [
              "passport",
              "resume",
              "personal_statement",
              "recommendation_letters",
              "awards_recognition",
              "media_coverage",
              "membership_proof"
            ],
            "requiredDocuments": [
              {
                "type": "passport",
                "displayName": "Valid Passport",
                "required": true,
                "description": "Valid for at least 6 months"
              }
            ]
          }
        ]
      }
    ],
    "totalCountries": 6,
    "totalVisaTypes": 10
  }
}
```

---

### 8. Get Visa Types for Specific Country

Retrieve all visa types available for a specific country.

**Endpoint:** `GET /api/visa-config/:countryCode`

**Access:** Public

**Path Parameters:**
- `countryCode` - Two-letter country code (e.g., US, IE, DE, FR, NL, PL)

**cURL Example:**
```bash
curl -X GET http://localhost:5000/api/visa-config/US
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "country": {
      "code": "US",
      "name": "United States",
      "flag": "🇺🇸",
      "visaTypes": [
        {
          "code": "O1A",
          "name": "O-1A Visa",
          "description": "For individuals with extraordinary ability in sciences, education, business, or athletics",
          "processingTime": "2-3 months (15 days with premium)",
          "validityPeriod": "Up to 3 years",
          "requiredDocuments": [
            {
              "type": "passport",
              "displayName": "Valid Passport",
              "required": true,
              "description": "Valid for at least 6 months"
            },
            {
              "type": "resume",
              "displayName": "Detailed CV",
              "required": true,
              "description": "Comprehensive curriculum vitae"
            }
          ]
        },
        {
          "code": "O1B",
          "name": "O-1B Visa",
          "description": "For individuals with extraordinary ability in arts, motion picture, or television",
          "processingTime": "2-3 months (15 days with premium)",
          "validityPeriod": "Up to 3 years",
          "requiredDocuments": []
        },
        {
          "code": "H1B",
          "name": "H-1B Visa",
          "description": "For workers in specialty occupations requiring theoretical or technical expertise",
          "minSalary": null,
          "processingTime": "3-6 months",
          "validityPeriod": "3 years (extendable to 6)",
          "requiredDocuments": []
        }
      ]
    }
  }
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "message": "Country with code 'XX' not found"
}
```

---

### 9. Get Specific Visa Type Details

Retrieve detailed information about a specific visa type.

**Endpoint:** `GET /api/visa-config/:countryCode/:visaCode`

**Access:** Public

**Path Parameters:**
- `countryCode` - Two-letter country code (e.g., US, IE, DE)
- `visaCode` - Visa type code (e.g., O1A, H1B, CSEP)

**cURL Example:**
```bash
curl -X GET http://localhost:5000/api/visa-config/US/O1A
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "country": {
      "code": "US",
      "name": "United States",
      "flag": "🇺🇸"
    },
    "visaType": {
      "code": "O1A",
      "name": "O-1A Visa",
      "description": "For individuals with extraordinary ability in sciences, education, business, or athletics",
      "processingTime": "2-3 months (15 days with premium)",
      "validityPeriod": "Up to 3 years",
      "requiredDocuments": [
        {
          "type": "passport",
          "displayName": "Valid Passport",
          "required": true,
          "description": "Valid for at least 6 months"
        },
        {
          "type": "resume",
          "displayName": "Detailed CV",
          "required": true,
          "description": "Comprehensive curriculum vitae"
        },
        {
          "type": "personal_statement",
          "displayName": "Personal Statement",
          "required": true,
          "description": "Statement of achievements and contributions"
        },
        {
          "type": "recommendation_letters",
          "displayName": "Recommendation Letters",
          "required": true,
          "description": "From recognized experts in the field"
        },
        {
          "type": "awards_recognition",
          "displayName": "Awards and Recognition",
          "required": true,
          "description": "Evidence of nationally or internationally recognized prizes"
        },
        {
          "type": "media_coverage",
          "displayName": "Media Coverage",
          "required": false,
          "description": "Published material about you"
        },
        {
          "type": "membership_proof",
          "displayName": "Membership Proof",
          "required": false,
          "description": "Membership in associations requiring outstanding achievements"
        }
      ]
    }
  }
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "message": "Visa type 'XXX' not found for country 'YY'"
}
```

---

## Error Responses

### Common Error Response Format

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [] // Only present for validation errors
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing or invalid authentication)
- `404` - Not Found
- `409` - Conflict (e.g., duplicate email)
- `500` - Internal Server Error

---

## Available Countries and Visa Types

### Ireland (IE)
- **CSEP** - Critical Skills Employment Permit

### Poland (PL)
- **WP_TYPE_C** - Work Permit Type C

### France (FR)
- **TALENT_PASSPORT** - Talent Passport
- **SALARIE_MISSION** - Salarié en Mission

### Netherlands (NL)
- **KNOWLEDGE_MIGRANT** - Knowledge Migrant Permit

### Germany (DE)
- **EU_BLUE_CARD** - EU Blue Card
- **ICT_PERMIT** - ICT Permit

### United States (US)
- **O1A** - O-1A Visa
- **O1B** - O-1B Visa
- **H1B** - H-1B Visa

---

## Notes

1. **JWT Tokens** expire after 7 days by default (configurable via `JWT_EXPIRES_IN` env variable)
2. **API Keys** do not expire but can be deactivated
3. API Keys are prefixed with `vsk_` (Visa Skill Key)
4. All timestamps are in ISO 8601 format (UTC)
5. Email addresses are automatically converted to lowercase
6. Passwords must be at least 6 characters long
