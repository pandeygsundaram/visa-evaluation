# Quick Start Guide

This guide will help you get the Visa Evaluation Backend up and running in minutes.

## Prerequisites

- Node.js (v16+)
- MongoDB running locally
- npm or yarn

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Start MongoDB

If you're using Docker:

```bash
docker run -d -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=root \
  -e MONGO_INITDB_ROOT_PASSWORD=secret \
  --name mongodb \
  mongo:latest
```

Or start your local MongoDB instance:

```bash
mongod
```

## Step 3: Environment Variables

The `.env` file is already configured with:

```env
PORT=5000
MONGODB_URI=mongodb://root:secret@localhost:27017/visa-evaluation?authSource=admin
JWT_SECRET=visa-evaluation-secret-key-2025-change-this
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

## Step 4: Start the Server

For development:

```bash
npm run dev
```

For production:

```bash
npm run build
npm start
```

## Step 5: Test the API

### Health Check

```bash
curl http://localhost:5000/health
```

### Register a User

```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

Save the `token` from the response!

### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Generate API Key

Replace `YOUR_JWT_TOKEN` with the token from signup/login:

```bash
curl -X POST http://localhost:5000/api/auth/generate-api-key \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"name": "Production API"}'
```

Save the `key` from the response!

### Get Countries and Visa Types

```bash
curl http://localhost:5000/api/visa-config
```

### Get Specific Country Visa Types

```bash
curl http://localhost:5000/api/visa-config/US
```

### Get Specific Visa Details

```bash
curl http://localhost:5000/api/visa-config/US/O1A
```

### Get Your Profile (using API key)

Replace `YOUR_API_KEY` with the key from generate-api-key:

```bash
curl -H "x-api-key: YOUR_API_KEY" \
  http://localhost:5000/api/auth/me
```

## Available Countries

- 🇮🇪 **Ireland** - Critical Skills Employment Permit (CSEP)
- 🇵🇱 **Poland** - Work Permit Type C (WP_TYPE_C)
- 🇫🇷 **France** - Talent Passport, Salarié en Mission
- 🇳🇱 **Netherlands** - Knowledge Migrant Permit (KNOWLEDGE_MIGRANT)
- 🇩🇪 **Germany** - EU Blue Card, ICT Permit
- 🇺🇸 **United States** - O-1A, O-1B, H-1B

## Project Structure

```
backend/
├── src/
│   ├── models/              # MongoDB schemas
│   │   ├── User.ts          # User with API keys
│   │   └── Evaluation.ts    # Evaluation results
│   ├── controllers/         # Request handlers
│   │   ├── authController.ts
│   │   └── visaConfigController.ts
│   ├── routes/              # API routes
│   │   ├── auth.ts
│   │   └── visaConfig.ts
│   ├── middleware/          # Authentication
│   │   └── auth.ts
│   ├── config/              # Visa data configuration
│   │   └── visaData.ts
│   └── server.ts            # Main server
├── docs/
│   ├── API.md               # Full API documentation
│   └── QUICKSTART.md        # This file
└── README.md
```

## Next Steps

1. Explore the [Full API Documentation](./API.md)
2. Start building the frontend
3. Implement evaluation logic
4. Add document upload functionality
5. Set up email notifications

## Troubleshooting

### MongoDB Connection Error

Make sure MongoDB is running and the connection string is correct:

```bash
# Test MongoDB connection
mongosh "mongodb://root:secret@localhost:27017?authSource=admin"
```

### Port Already in Use

Change the `PORT` in `.env` to a different value:

```env
PORT=3000
```

### JWT Token Expired

Tokens expire after 7 days. Simply login again to get a new token.

## Support

For issues and questions, refer to the README.md or create an issue in the repository.
