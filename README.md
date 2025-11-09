# Visa Evaluation Platform

A comprehensive multi-country visa evaluation platform that helps users assess their eligibility for various work visas across different countries. The platform leverages AI to analyze user documents and provide intelligent visa recommendations.

## Features

### Authentication & Authorization
- **Email/Password Authentication** - Secure user registration and login with JWT tokens
- **Google OAuth 2.0** - Social login integration for seamless authentication
- **API Key Management** - Generate and manage API keys for programmatic access
- **Subscription Management** - Stripe-based subscription plans with API usage tracking

### Visa Evaluation
- **Multi-Country Support** - Support for 6 countries including US, Ireland, Germany, France, Netherlands, and Poland
- **Multiple Visa Types** - 10+ different visa types (H1B, O1-A, O1-B, EU Blue Card, etc.)
- **Document Analysis** - AI-powered document review using OpenAI GPT
- **Smart Recommendations** - Intelligent visa type recommendations based on user profile
- **Document Upload** - Support for PDF, DOCX, and image formats via Cloudflare R2
- **Real-time Evaluation** - Instant feedback on visa eligibility

### User Dashboard
- **Evaluation History** - Track all your visa evaluations
- **API Usage Monitoring** - View API consumption and subscription details
- **Document Management** - Secure document storage with signed URLs
- **Subscription Management** - Upgrade/downgrade plans and manage billing

## Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling
- **Zustand** - State management
- **React Hook Form + Zod** - Form handling and validation
- **Axios** - HTTP client

### Backend
- **Node.js + Express** - REST API server
- **TypeScript** - Type-safe backend development
- **MongoDB + Mongoose** - Database and ODM
- **JWT** - Secure token-based authentication
- **Google OAuth Library** - OAuth 2.0 integration
- **OpenAI API** - AI-powered document analysis
- **Stripe** - Payment processing and subscriptions
- **Cloudflare R2** - Document storage with signed URLs
- **Multer** - File upload handling
- **Bcrypt** - Password hashing

## Project Structure

```
visa-evaluation/
├── backend/                 # Backend API server
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── middleware/     # Auth, validation, error handling
│   │   ├── models/         # Mongoose models
│   │   ├── routes/         # API routes
│   │   ├── scripts/        # Utility scripts (seed data)
│   │   ├── utils/          # Helper functions
│   │   └── server.ts       # Entry point
│   ├── docs/               # API documentation
│   ├── .env.example        # Environment variables template
│   └── package.json
├── frontend/               # Next.js frontend
│   ├── app/               # Next.js App Router pages
│   │   ├── (auth)/       # Authentication pages
│   │   ├── dashboard/    # Protected dashboard pages
│   │   └── ...
│   ├── components/        # React components
│   │   ├── auth/         # Auth-related components
│   │   ├── dashboard/    # Dashboard components
│   │   ├── evaluation/   # Evaluation components
│   │   └── ui/           # Reusable UI components
│   ├── lib/              # Utilities and stores
│   │   ├── api/          # API client configuration
│   │   └── stores/       # Zustand stores
│   └── package.json
└── README.md             # This file
```

## Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **MongoDB** >= 6.x
- **npm** or **yarn**

### Environment Variables

#### Backend (.env)

Create a `.env` file in the `backend/` directory:

```bash
# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000

# Database
MONGODB_URI=mongodb://localhost:27017/visa-evaluation

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# Cloudflare R2 Storage
R2_ACCOUNT_ID=your-r2-account-id
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET_NAME=your-r2-bucket-name
R2_PUBLIC_URL=https://your-bucket.r2.dev

# Stripe
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
```

#### Frontend (.env.local)

Create a `.env.local` file in the `frontend/` directory:

```bash
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
```

### Installation

#### 1. Clone the repository

```bash
git clone <repository-url>
cd visa-evaluation
```

#### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

#### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

#### 4. Seed Database (Optional)

Seed the database with visa configuration data:

```bash
cd backend
npm run seed:plans
```

### Running the Application

#### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Backend will run on `http://localhost:5000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Frontend will run on `http://localhost:3000`

#### Production Build

**Backend:**
```bash
cd backend
npm run build
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
npm start
```

## API Documentation

Comprehensive API documentation is available at:
- [`backend/docs/API.md`](backend/docs/API.md) - Complete API reference
- [`backend/docs/QUICKSTART.md`](backend/docs/QUICKSTART.md) - Quick start guide

### Quick API Overview

#### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/google/login` - Initiate Google OAuth
- `GET /api/auth/google` - Google OAuth callback
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/generate-api-key` - Generate API key
- `GET /api/auth/api-keys` - Get all API keys
- `DELETE /api/auth/api-keys/:key` - Deactivate API key

#### Visa Configuration
- `GET /api/visa-config` - Get all countries and visa types
- `GET /api/visa-config/:countryCode` - Get visa types for country
- `GET /api/visa-config/:countryCode/:visaCode` - Get specific visa details

#### Evaluation
- `POST /api/evaluation` - Create new visa evaluation
- `GET /api/evaluation` - Get all user evaluations
- `GET /api/evaluation/:id` - Get specific evaluation
- `POST /api/evaluation/:id/upload` - Upload document for evaluation
- `GET /api/evaluation/:id/download/:documentId` - Download document

#### Subscriptions
- `GET /api/subscription/plans` - Get available plans
- `POST /api/subscription/create-checkout-session` - Create Stripe checkout
- `GET /api/subscription/my-subscription` - Get current subscription
- `POST /api/subscription/cancel` - Cancel subscription
- `POST /api/subscription/webhook` - Stripe webhook handler

## Supported Countries & Visa Types

### United States (US)
- **O-1A Visa** - Extraordinary ability in sciences, education, business, or athletics
- **O-1B Visa** - Extraordinary ability in arts, motion picture, or television
- **H-1B Visa** - Specialty occupations requiring theoretical or technical expertise

### Ireland (IE)
- **Critical Skills Employment Permit (CSEP)** - For highly skilled workers

### Germany (DE)
- **EU Blue Card** - For highly qualified non-EU workers
- **ICT Permit** - Intra-corporate transfers

### France (FR)
- **Talent Passport** - For highly skilled professionals
- **Salarié en Mission** - For employees on temporary assignment

### Netherlands (NL)
- **Knowledge Migrant Permit** - For skilled workers

### Poland (PL)
- **Work Permit Type C** - For specific work arrangements

## Subscription Plans

### Free Plan
- 5 evaluations per month
- Basic document analysis
- Email support

### Basic Plan ($9.99/month)
- 20 evaluations per month
- Advanced document analysis
- Priority email support

### Pro Plan ($29.99/month)
- 100 evaluations per month
- Premium document analysis
- Priority support + phone

### Enterprise Plan ($99.99/month)
- Unlimited evaluations
- White-label options
- Dedicated account manager

## Security Features

- **Password Hashing** - Bcrypt with salt rounds
- **JWT Authentication** - Secure token-based auth
- **API Key Authentication** - For programmatic access
- **Rate Limiting** - Protection against abuse
- **CORS Configuration** - Controlled cross-origin access
- **Input Validation** - Express-validator middleware
- **Secure Document Storage** - Signed URLs with expiration
- **Environment Variables** - Sensitive data protection

## Development

### Code Style
- TypeScript for type safety
- ESLint for code linting
- Consistent naming conventions

### Testing
```bash
# Backend
cd backend
npm run lint

# Frontend
cd frontend
npm run lint
```

### Database Schema

**User Model:**
- Authentication (email/password or Google OAuth)
- API key management
- Subscription tracking
- Evaluation history

**Evaluation Model:**
- User profile data
- Selected country and visa type
- Document uploads
- AI evaluation results
- Status tracking

**Subscription Model:**
- Plan details
- Stripe integration
- Usage tracking
- Billing cycle management

## Deployment

### Backend Deployment
1. Set production environment variables
2. Build the application: `npm run build`
3. Start the server: `npm start`
4. Configure MongoDB connection
5. Set up Stripe webhooks
6. Configure Cloudflare R2 CORS

### Frontend Deployment
1. Set production environment variables
2. Build the application: `npm run build`
3. Start the server: `npm start`
4. Configure domain and SSL
5. Set up CDN (optional)

### Recommended Platforms
- **Backend:** Railway, Render, AWS, DigitalOcean
- **Frontend:** Vercel, Netlify, AWS Amplify
- **Database:** MongoDB Atlas
- **Storage:** Cloudflare R2
- **Payments:** Stripe

## Troubleshooting

### Common Issues

**MongoDB Connection Error:**
- Ensure MongoDB is running
- Check MONGODB_URI in .env
- Verify network connectivity

**Google OAuth Not Working:**
- Verify Google OAuth credentials
- Check authorized redirect URIs in Google Console
- Ensure FRONTEND_URL and BACKEND_URL are correct

**Stripe Webhook Failures:**
- Use Stripe CLI for local testing: `stripe listen --forward-to localhost:5000/api/subscription/webhook`
- Verify webhook secret in .env
- Check webhook signing

**File Upload Issues:**
- Verify R2 credentials
- Check CORS configuration on R2 bucket
- Ensure proper file size limits

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, email support@visaevaluation.com or open an issue in the repository.

## Acknowledgments

- OpenAI for GPT API
- Stripe for payment processing
- Cloudflare for R2 storage
- Google for OAuth services
- MongoDB for database solutions

---

**Built with passion for simplifying visa applications worldwide.**
