# Visa Evaluation Backend

Backend API for the multi-country visa evaluation tool.

## Features

- ✅ User authentication (signup/login) with JWT
- ✅ API key generation for programmatic access
- ✅ Multi-country visa configuration
- ✅ Support for 6 countries and 10 visa types
- ✅ MongoDB integration
- ✅ TypeScript for type safety
- ✅ RESTful API design

## Tech Stack

- **Runtime:** Node.js
- **Language:** TypeScript
- **Framework:** Express.js
- **Database:** MongoDB
- **Authentication:** JWT & API Keys

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (running locally or remote)
- npm or yarn

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

Default configuration:
```env
PORT=5000
MONGODB_URI=mongodb://root:secret@localhost:27017/visa-evaluation?authSource=admin
JWT_SECRET=visa-evaluation-secret-key-2025-change-this
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

### 3. Start MongoDB

Make sure MongoDB is running on your system:

```bash
# Using Docker
docker run -d -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=root \
  -e MONGO_INITDB_ROOT_PASSWORD=secret \
  mongo:latest

# Or start local MongoDB
mongod
```

### 4. Run Development Server

```bash
npm run dev
```

The server will start on `http://localhost:5000`

### 5. Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
backend/
├── src/
│   ├── models/              # MongoDB schemas
│   │   ├── User.ts          # User model with API keys
│   │   └── Evaluation.ts    # Evaluation model
│   ├── controllers/         # Request handlers
│   │   ├── authController.ts
│   │   └── visaConfigController.ts
│   ├── routes/              # API routes
│   │   ├── auth.ts
│   │   └── visaConfig.ts
│   ├── middleware/          # Express middleware
│   │   └── auth.ts          # JWT & API key authentication
│   ├── config/              # Configuration files
│   │   └── visaData.ts      # Countries and visa types
│   └── server.ts            # Main server file
├── docs/
│   └── API.md               # API documentation
├── .env                     # Environment variables
├── tsconfig.json            # TypeScript configuration
└── package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/generate-api-key` - Generate API key (protected)
- `GET /api/auth/api-keys` - Get all API keys (protected)
- `DELETE /api/auth/api-keys/:key` - Deactivate API key (protected)
- `GET /api/auth/me` - Get current user profile (protected)

### Visa Configuration
- `GET /api/visa-config` - Get all countries and visa types
- `GET /api/visa-config/:countryCode` - Get visa types for a country
- `GET /api/visa-config/:countryCode/:visaCode` - Get specific visa type details

See [API Documentation](./docs/API.md) for detailed examples.

## Supported Countries & Visa Types

### 🇮🇪 Ireland
- Critical Skills Employment Permit (CSEP)

### 🇵🇱 Poland
- Work Permit Type C (WP_TYPE_C)

### 🇫🇷 France
- Talent Passport (TALENT_PASSPORT)
- Salarié en Mission (SALARIE_MISSION)

### 🇳🇱 Netherlands
- Knowledge Migrant Permit (KNOWLEDGE_MIGRANT)

### 🇩🇪 Germany
- EU Blue Card (EU_BLUE_CARD)
- ICT Permit (ICT_PERMIT)

### 🇺🇸 United States
- O-1A Visa (O1A)
- O-1B Visa (O1B)
- H-1B Visa (H1B)

## Testing the API

### 1. Health Check
```bash
curl http://localhost:5000/health
```

### 2. Register a User
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

### 3. Get All Countries
```bash
curl http://localhost:5000/api/visa-config
```

### 4. Get Specific Visa Details
```bash
curl http://localhost:5000/api/visa-config/US/O1A
```

## Authentication Methods

### JWT Token (for user sessions)
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:5000/api/auth/me
```

### API Key (for programmatic access)
```bash
curl -H "x-api-key: vsk_YOUR_API_KEY" \
  http://localhost:5000/api/auth/me
```

## Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### TypeScript Configuration

The project uses strict TypeScript settings for better type safety. See `tsconfig.json` for details.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5000 |
| `MONGODB_URI` | MongoDB connection string | mongodb://root:secret@localhost:27017/visa-evaluation?authSource=admin |
| `JWT_SECRET` | Secret key for JWT signing | (required) |
| `JWT_EXPIRES_IN` | JWT token expiration | 7d |
| `NODE_ENV` | Environment | development |

## Error Handling

All API responses follow a consistent format:

**Success:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Error description",
  "errors": []
}
```

## Security Features

- Password hashing with bcrypt
- JWT-based authentication
- API key support for external integrations
- CORS enabled
- Input validation with express-validator
- MongoDB injection protection

## Next Steps

- [ ] Implement evaluation service with AI integration
- [ ] Add file upload functionality for documents
- [ ] Create partner dashboard endpoints
- [ ] Add email notifications
- [ ] Implement rate limiting
- [ ] Add comprehensive logging
- [ ] Write unit and integration tests

## License

MIT

## Support

For issues and questions, please create an issue in the repository.
