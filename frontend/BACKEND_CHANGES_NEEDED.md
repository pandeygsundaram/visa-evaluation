# Backend Changes Required for Google OAuth

This document outlines the changes needed in the backend to support Google OAuth authentication.

## Summary

The frontend is ready to use Google OAuth, but the backend needs a new endpoint to handle Google authentication. Here's what needs to be added:

## 1. Install Required Package

```bash
cd backend
npm install google-auth-library
```

## 2. Update Environment Variables

Add to `backend/.env`:

```env
GOOGLE_CLIENT_ID=your_google_client_id_from_google_console
GOOGLE_CLIENT_SECRET=your_google_client_secret_from_google_console
FRONTEND_URL=http://localhost:3000
```

## 3. Update User Model

**File:** `backend/src/models/User.ts`

Add these fields to your User interface and schema:

```typescript
// Add to interface
interface IUser {
  // ... existing fields
  provider?: 'credentials' | 'google';
  googleId?: string;
}

// Add to schema
const userSchema = new Schema<IUser>({
  // ... existing fields

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

  // Update password field to be conditional
  password: {
    type: String,
    required: function(this: IUser) {
      return this.provider === 'credentials';
    },
  },
});
```

## 4. Add Google Auth Controller

**File:** `backend/src/controllers/authController.ts`

Add this import at the top:

```typescript
import { OAuth2Client } from 'google-auth-library';
```

Add this constant after imports:

```typescript
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
```

Add this new controller method:

```typescript
export const googleAuth = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Google token is required',
      });
    }

    // Verify the Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Google token',
      });
    }

    const { sub: googleId, email, name } = payload;

    // Find or create user
    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Create new user with Google OAuth
      user = await User.create({
        name: name || 'Google User',
        email: email.toLowerCase(),
        provider: 'google',
        googleId,
        password: '', // Empty password for OAuth users
        apiKeys: [],
        evaluations: [],
      });
    } else {
      // Update existing user with Google ID if not already linked
      if (!user.googleId) {
        user.googleId = googleId;
        user.provider = 'google';
        await user.save();
      }
    }

    // Generate JWT token
    const jwtToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Return user data and token
    res.status(200).json({
      success: true,
      message: 'Google login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          provider: user.provider,
          apiKeys: user.apiKeys,
          evaluations: user.evaluations,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        token: jwtToken,
      },
    });
  } catch (error: any) {
    console.error('Google auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Google authentication failed',
      error: error.message,
    });
  }
};
```

## 5. Add Route

**File:** `backend/src/routes/auth.ts`

Add this route:

```typescript
// Google OAuth authentication
router.post('/google', authController.googleAuth);
```

Full route should look like:

```typescript
import express from 'express';
import * as authController from '../controllers/authController';
import { auth } from '../middleware/auth';

const router = express.Router();

// Public routes
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/google', authController.googleAuth); // NEW

// Protected routes
router.get('/me', auth, authController.getMe);
router.post('/generate-api-key', auth, authController.generateApiKey);
router.get('/api-keys', auth, authController.getApiKeys);
router.delete('/api-keys/:key', auth, authController.deactivateApiKey);

export default router;
```

## 6. Update CORS Configuration

**File:** `backend/src/server.ts` or wherever CORS is configured

Make sure CORS allows the frontend:

```typescript
import cors from 'cors';

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
```

## 7. Update Password Hashing Middleware (if using)

If you have a pre-save hook that hashes passwords, update it to skip for OAuth users:

```typescript
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  // Skip password hashing for OAuth users
  if (this.provider === 'google' || !this.password) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 12);
  next();
});
```

## Testing the Implementation

1. Start the backend server
2. Start the frontend
3. Click "Sign in with Google" on the login page
4. You should be redirected to Google login
5. After Google auth, you should be logged in and redirected to dashboard

## Troubleshooting

### Error: "Invalid Google token"
- Check that GOOGLE_CLIENT_ID in backend matches the one in Google Console
- Verify the token is being sent correctly from frontend

### Error: "User validation failed"
- Check that password field is not required for Google OAuth users
- Verify the User model changes are applied

### Error: "CORS error"
- Make sure FRONTEND_URL in backend .env matches your frontend URL
- Check CORS configuration allows credentials

## Security Notes

1. **Never expose Google Client Secret** in frontend code
2. **Always verify tokens server-side** using Google's OAuth2Client
3. **Use HTTPS in production** for OAuth callbacks
4. **Rotate secrets regularly** in production

## Production Checklist

Before deploying to production:

- [ ] Add production frontend URL to Google Console authorized origins
- [ ] Add production redirect URI to Google Console
- [ ] Update FRONTEND_URL in production environment
- [ ] Use environment-specific Google OAuth credentials
- [ ] Enable HTTPS
- [ ] Add rate limiting to auth endpoints
- [ ] Set up monitoring for auth failures

## Alternative: Skip Google OAuth Implementation

If you want to skip Google OAuth for now, the frontend will still work perfectly with email/password authentication. Simply:

1. Don't click the "Sign in with Google" button
2. Use the email/password forms instead
3. All other features will work normally

The Google OAuth button will just show an error if clicked without the backend implementation.
