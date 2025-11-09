# Visa Evaluation Platform - Frontend

A modern Next.js application for evaluating visa eligibility across multiple countries with Google OAuth and credential-based authentication.

## Features

- **Authentication**
  - Email/Password signup and login
  - Google OAuth integration
  - JWT token-based authentication
  - Protected routes with middleware

- **Dashboard**
  - User profile overview
  - Account statistics
  - Quick actions

- **Visa Explorer**
  - Browse countries and visa types
  - Detailed visa requirements
  - Document checklist

- **API Key Management**
  - Generate API keys
  - View and manage keys
  - Copy to clipboard
  - Deactivate keys

- **State Management**
  - Zustand for global state
  - Persistent auth state
  - Type-safe API client

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **Authentication:** NextAuth.js
- **HTTP Client:** Axios
- **Form Handling:** React Hook Form + Zod
- **Icons:** Lucide React
- **Notifications:** Sonner

## Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your values
```

## Environment Variables

Create a `.env.local` file with the following variables:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Google OAuth (Get from Google Cloud Console)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## Getting Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to Credentials → Create Credentials → OAuth 2.0 Client ID
5. Set authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://yourdomain.com/api/auth/callback/google` (for production)
6. Copy Client ID and Client Secret to `.env.local`

## Running the Application

```bash
# Development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

The app will be available at [http://localhost:3000](http://localhost:3000)

## Project Structure

```
frontend/
├── app/
│   ├── (auth)/              # Auth pages (login, signup)
│   │   ├── login/
│   │   └── signup/
│   ├── api/auth/[...nextauth]/  # NextAuth API route
│   ├── auth/google-callback/    # Google OAuth callback
│   ├── dashboard/           # Protected dashboard pages
│   │   ├── api-keys/
│   │   ├── profile/
│   │   ├── visa-config/
│   │   └── layout.tsx
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Home page (redirects)
├── components/
│   ├── auth/                # Auth components
│   │   └── ProtectedRoute.tsx
│   ├── dashboard/           # Dashboard components
│   │   └── Navbar.tsx
│   ├── ui/                  # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   └── Input.tsx
│   └── Providers.tsx        # App providers
├── lib/
│   ├── api/                 # API client & endpoints
│   │   ├── client.ts
│   │   └── endpoints.ts
│   ├── stores/              # Zustand stores
│   │   ├── authStore.ts
│   │   └── visaStore.ts
│   ├── auth.ts              # NextAuth configuration
│   └── utils.ts             # Utility functions
├── types/
│   └── index.ts             # TypeScript types
├── middleware.ts            # Route protection
└── .env.local              # Environment variables
```

## IMPORTANT: Backend Changes Required

### 1. Add Google OAuth Support

You need to add a new endpoint to your backend to handle Google OAuth:

**File:** `backend/src/routes/auth.ts`

Add this route:

```typescript
router.post('/google', authController.googleAuth);
```

**File:** `backend/src/controllers/authController.ts`

Add this controller method:

```typescript
import { OAuth2Client } from 'google-auth-library';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleAuth = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    // Verify the Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Google token',
      });
    }

    const { sub: googleId, email, name } = payload;

    // Find or create user
    let user = await User.findOne({ email: email?.toLowerCase() });

    if (!user) {
      // Create new user with Google OAuth
      user = await User.create({
        name,
        email: email?.toLowerCase(),
        provider: 'google',
        googleId,
        password: '', // No password for OAuth users
      });
    } else if (!user.googleId) {
      // Link Google account to existing user
      user.googleId = googleId;
      user.provider = 'google';
      await user.save();
    }

    // Generate JWT token
    const jwtToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Google login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          provider: user.provider,
          createdAt: user.createdAt,
        },
        token: jwtToken,
      },
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Google authentication failed',
    });
  }
};
```

### 2. Update User Model

**File:** `backend/src/models/User.ts`

Add these fields to the User schema:

```typescript
provider: {
  type: String,
  enum: ['credentials', 'google'],
  default: 'credentials',
},
googleId: {
  type: String,
  sparse: true,
  unique: true,
},
```

Update the password field to be optional:

```typescript
password: {
  type: String,
  required: function() {
    return this.provider === 'credentials';
  },
},
```

### 3. Install Required Package

```bash
cd backend
npm install google-auth-library
```

### 4. Update Backend Environment Variables

Add to `backend/.env`:

```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FRONTEND_URL=http://localhost:3000
```

### 5. Update CORS Configuration

Make sure your backend allows requests from the frontend:

```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
```

## API Integration

The frontend connects to the backend API at `http://localhost:5000` by default.

### Available API Endpoints Used

- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/google` - Google OAuth login (**NEW - needs to be added**)
- `GET /api/auth/me` - Get current user
- `POST /api/auth/generate-api-key` - Generate API key
- `GET /api/auth/api-keys` - Get all API keys
- `DELETE /api/auth/api-keys/:key` - Deactivate API key
- `GET /api/visa-config` - Get all countries
- `GET /api/visa-config/:countryCode` - Get country visa types
- `GET /api/visa-config/:countryCode/:visaCode` - Get visa details

## Features Walkthrough

### Authentication Flow

1. User visits homepage → redirected to login
2. User can:
   - Sign up with email/password
   - Login with email/password
   - Login with Google OAuth
3. After auth → redirected to dashboard
4. JWT token stored in localStorage and Zustand
5. Protected routes check authentication

### Dashboard Features

- **Overview:** Stats, account info, quick actions
- **Visa Explorer:** Browse countries → visa types → details
- **API Keys:** Generate, view, copy, deactivate keys
- **Profile:** View account information and stats

## Development Tips

1. **Hot Reload:** Changes auto-reload in dev mode
2. **Type Safety:** All API calls are type-safe with TypeScript
3. **State Persistence:** Auth state persists across page refreshes
4. **Error Handling:** Toast notifications for all errors
5. **Loading States:** Built-in loading indicators

## Troubleshooting

### "Unauthorized" errors
- Check if backend is running on port 5000
- Verify JWT token in localStorage
- Check CORS configuration

### Google OAuth not working
- Verify Google Client ID/Secret in `.env.local`
- Check authorized redirect URIs in Google Console
- Ensure backend has Google OAuth endpoint

### API calls failing
- Verify `NEXT_PUBLIC_API_URL` in `.env.local`
- Check backend is running
- Check network tab for actual error

## Next Steps

After setting up the frontend:

1. Implement the backend Google OAuth endpoint
2. Test authentication flow
3. Add document upload functionality
4. Implement visa evaluation logic
5. Add email notifications

## License

MIT
