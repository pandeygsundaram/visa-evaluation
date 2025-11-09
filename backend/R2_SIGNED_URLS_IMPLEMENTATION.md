# R2 Private Storage with Signed URLs - Implementation Summary

## What Changed?

The implementation has been updated to work with **private R2 storage** using **temporary signed URLs** instead of public URLs.

## Key Changes

### 1. **R2 Storage Configuration**

**Before:**
- Used public bucket with public URLs
- Required `R2_PUBLIC_URL` environment variable
- Generated permanent public URLs for documents

**After:**
- Uses **private bucket** (`simple-bucket`)
- Uploads to **`visa-docs/` folder** within the bucket
- Generates **temporary signed URLs** (1-hour expiration)
- No longer requires `R2_PUBLIC_URL`

### 2. **File Upload Path**

Files are now uploaded to:
```
simple-bucket/visa-docs/{userId}/{uuid}.{extension}
```

Example:
```
simple-bucket/visa-docs/65a1b2c3d4e5f6g7h8i9j0k1/abc123-def456.pdf
```

### 3. **Signed URLs**

#### What are Signed URLs?
Signed URLs are temporary, secure URLs that grant time-limited access to private R2 objects. They include:
- Authentication signature
- Expiration timestamp
- Access permissions

#### When are Signed URLs generated?
1. **After evaluation completion** - When `POST /api/evaluations` completes successfully
2. **When fetching evaluation by ID** - When `GET /api/evaluations/:id` is called

#### Expiration Time
- Default: **1 hour (3600 seconds)**
- Can be customized by changing the `expiresIn` parameter

### 4. **Updated Environment Variables**

`.env` file now requires:
```env
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=simple-bucket
```

**Removed:** `R2_PUBLIC_URL` (no longer needed)

## Updated Files

### 1. **`src/utils/r2Storage.ts`**

**New Functions:**
- `generateSignedUrl(key, expiresIn)` - Generates a single signed URL
- `generateSignedUrlsForDocuments(documents, expiresIn)` - Generates signed URLs for multiple documents

**Updated Functions:**
- `uploadToR2()` - Now uploads to `visa-docs/{userId}/` path and returns only the key (no URL)
- `validateR2Config()` - Removed `R2_PUBLIC_URL` requirement

**Changed:**
- Bucket name: `visa-evaluation-docs` → `simple-bucket`
- Added folder prefix: `visa-docs/`
- UploadResult interface: Now returns only `key` (removed `url`)

### 2. **`src/controllers/evaluationController.ts`**

**Updated Functions:**

#### `createEvaluation()`
- Removed public URL storage in database (stores empty string as placeholder)
- Generates signed URLs before returning response
- Includes `documents` array with signed URLs in response

**Response Format:**
```json
{
  "success": true,
  "data": {
    "evaluationId": "...",
    "documents": [
      {
        "type": "passport",
        "fileName": "passport.pdf",
        "r2Key": "visa-docs/userId/abc123.pdf",
        "uploadedAt": "2025-01-09T10:00:00.000Z",
        "signedUrl": "https://...?X-Amz-Algorithm=..."
      }
    ],
    "result": { ... }
  }
}
```

#### `getEvaluationById()`
- Generates fresh signed URLs when evaluation is fetched
- Returns documents with temporary access URLs

### 3. **`src/models/Evaluation.ts`**

No changes needed - already has `url` and `r2Key` fields:
- `url`: Now stores empty string (placeholder)
- `r2Key`: Stores the actual R2 object key for generating signed URLs

## How It Works

### Flow Diagram

```
Upload Flow:
┌─────────────────────────────────────────────────────────────┐
│ 1. User uploads documents                                    │
│ 2. Extract text from documents                               │
│ 3. Upload to R2: simple-bucket/visa-docs/{userId}/{uuid}.pdf │
│ 4. Store r2Key in database (NOT the URL)                     │
│ 5. Run LLM analysis                                           │
│ 6. Generate signed URLs for response                          │
│ 7. Return evaluation with temporary URLs                      │
└─────────────────────────────────────────────────────────────┘

Fetch Flow:
┌─────────────────────────────────────────────────────────────┐
│ 1. User requests evaluation by ID                            │
│ 2. Fetch evaluation from database                            │
│ 3. Generate fresh signed URLs from r2Keys                    │
│ 4. Return evaluation with new temporary URLs                 │
└─────────────────────────────────────────────────────────────┘
```

## Security Benefits

### Why Private Storage + Signed URLs?

1. **Access Control**: Only authenticated users can access their own documents
2. **Time-Limited Access**: URLs expire after 1 hour, preventing long-term sharing
3. **No Public Exposure**: Documents are never publicly accessible
4. **On-Demand Generation**: Fresh URLs generated each time evaluation is fetched
5. **Audit Trail**: R2 logs show who accessed what and when

### Security Features

- ✅ Private bucket (no public access)
- ✅ User-scoped paths (`visa-docs/{userId}/`)
- ✅ Temporary signed URLs (1-hour expiration)
- ✅ Authentication required to get signed URLs
- ✅ URLs include cryptographic signature
- ✅ Access automatically expires

## API Response Examples

### POST /api/evaluations (Create Evaluation)

```bash
curl -X POST http://localhost:5000/api/evaluations \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "country=IE" \
  -F "visaType=CSEP" \
  -F "documents=@passport.pdf"
```

**Response:**
```json
{
  "success": true,
  "message": "Evaluation created successfully",
  "data": {
    "evaluationId": "65a1b2c3d4e5f6g7h8i9j0k1",
    "status": "completed",
    "country": "IE",
    "visaType": "CSEP",
    "documentsUploaded": 1,
    "documents": [
      {
        "type": "general",
        "fileName": "passport.pdf",
        "r2Key": "visa-docs/65a1b2c3d4e5f6g7h8i9j0k1/abc-123-def.pdf",
        "uploadedAt": "2025-01-09T10:00:00.000Z",
        "signedUrl": "https://account-id.r2.cloudflarestorage.com/simple-bucket/visa-docs/...?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=...&X-Amz-Date=20250109T100000Z&X-Amz-Expires=3600&X-Amz-SignedHeaders=host&X-Amz-Signature=..."
      }
    ],
    "result": {
      "isMalicious": false,
      "score": 85,
      "summary": "...",
      "checkpoints": [...]
    }
  }
}
```

### GET /api/evaluations/:id (Get Evaluation)

```bash
curl -X GET http://localhost:5000/api/evaluations/65a1b2c3d4e5f6g7h8i9j0k1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "userId": "user123",
    "country": "IE",
    "visaType": "CSEP",
    "documents": [
      {
        "type": "general",
        "fileName": "passport.pdf",
        "r2Key": "visa-docs/65a1b2c3d4e5f6g7h8i9j0k1/abc-123-def.pdf",
        "uploadedAt": "2025-01-09T10:00:00.000Z",
        "signedUrl": "https://...?X-Amz-Algorithm=...&X-Amz-Expires=3600..."
      }
    ],
    "evaluationResult": {
      "isMalicious": false,
      "score": 85,
      "summary": "...",
      "checkpoints": [...]
    },
    "status": "completed",
    "createdAt": "2025-01-09T10:00:00.000Z",
    "processedAt": "2025-01-09T10:00:15.000Z"
  }
}
```

## Configuration Guide

### Step 1: Get R2 Credentials

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **R2 → Overview**
3. Your bucket `simple-bucket` should already exist
4. Go to **Settings → Manage R2 API Tokens**
5. Click **Create API Token**
6. Set permissions: **Object Read & Write**
7. Copy the credentials:
   - Access Key ID
   - Secret Access Key
   - Endpoint URL (format: `https://<account-id>.r2.cloudflarestorage.com`)

### Step 2: Update .env File

```env
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your_actual_access_key_id
R2_SECRET_ACCESS_KEY=your_actual_secret_access_key
R2_BUCKET_NAME=simple-bucket
```

### Step 3: Verify Configuration

The `visa-docs` folder will be created automatically when you upload the first document.

## Testing

### Test Upload

```bash
# 1. Login to get JWT token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# 2. Create evaluation with document
curl -X POST http://localhost:5000/api/evaluations \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "country=IE" \
  -F "visaType=CSEP" \
  -F "documents=@test.pdf"

# 3. Verify signed URL in response works
# Copy the signedUrl from response and paste in browser - it should download the file
```

### Test Signed URL Expiration

1. Create an evaluation and save the `signedUrl`
2. Try accessing it immediately (should work)
3. Wait 1 hour and try again (should fail with 403 Forbidden)
4. Fetch the evaluation again - get a new signed URL (should work)

### Verify R2 Storage

1. Go to Cloudflare Dashboard → R2 → simple-bucket
2. Navigate to `visa-docs/` folder
3. You should see folders named with user IDs
4. Inside each user folder, you'll see the uploaded files

## Customizing Expiration Time

To change the signed URL expiration time, modify the `expiresIn` parameter:

```typescript
// In evaluationController.ts

// Change from 1 hour (3600 seconds) to 24 hours
const documentsWithSignedUrls = await generateSignedUrlsForDocuments(
  evaluation.documents.map(doc => ({ ... })),
  86400 // 24 hours = 86400 seconds
);
```

**Common Expiration Times:**
- 15 minutes: `900`
- 30 minutes: `1800`
- 1 hour: `3600`
- 6 hours: `21600`
- 24 hours: `86400`
- 7 days: `604800` (max recommended)

## Troubleshooting

### Issue: "Failed to generate signed URL"

**Cause:** Invalid R2 credentials or permissions

**Solution:**
1. Verify R2_ENDPOINT format is correct
2. Check R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY are valid
3. Ensure API token has "Object Read & Write" permissions
4. Restart the server after updating .env

### Issue: "Access Denied" when accessing signed URL

**Cause:** URL expired or invalid signature

**Solution:**
1. Fetch the evaluation again to get a fresh signed URL
2. Verify bucket name is correct (simple-bucket)
3. Check file actually exists in R2

### Issue: Files not appearing in visa-docs folder

**Cause:** Incorrect bucket name or upload path

**Solution:**
1. Verify `R2_BUCKET_NAME=simple-bucket` in .env
2. Check server logs for upload confirmation
3. Look in R2 dashboard for the files

## Dependencies

**New Dependency:**
```json
{
  "@aws-sdk/s3-request-presigner": "^3.x.x"
}
```

Already installed via:
```bash
npm install @aws-sdk/s3-request-presigner
```

## Summary

✅ **Private Storage**: R2 bucket is private, no public access
✅ **Signed URLs**: Temporary 1-hour URLs generated on-demand
✅ **User Isolation**: Files organized by userId in visa-docs folder
✅ **Secure**: URLs expire automatically, cryptographically signed
✅ **Compliant**: Meets your requirements for private storage with signed URLs

The implementation is complete and ready to use once you configure your R2 credentials!
