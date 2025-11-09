import { Response } from 'express';
import { validationResult } from 'express-validator';
import jwt, { SignOptions } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User';
import Evaluation from '../models/Evaluation';
import { AuthRequest } from '../middleware/auth';
import { getGoogleOAuthClient } from '../utils/googleOAuth';



// DEBUG: Log what we're initializing with
console.log('🔧 Initializing OAuth2Client...');
console.log('  Client ID:', process.env.GOOGLE_CLIENT_ID);
console.log('  Client Secret:', process.env.GOOGLE_CLIENT_SECRET ? 'EXISTS' : 'MISSING');


// Generate JWT token
const generateToken = (userId: string, email: string): string => {
  const secret = process.env.JWT_SECRET || 'default-secret-key';
  const payload = { id: userId, email };
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  const options: SignOptions = { expiresIn: expiresIn as any };

  return jwt.sign(payload, secret, options);
};

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
export const signup = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
      return;
    }

    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
      return;
    }

    // Create new user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      apiKeys: [],
      evaluations: []
    });

    // Generate JWT token
    const token = generateToken(String(user._id), user.email);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt
        },
        token
      }
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
      return;
    }

    const { email, password } = req.body;

    // Find user (include password for comparison)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
      return;
    }

    // Check password
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
      return;
    }

    // Generate JWT token
    const token = generateToken(String(user._id), user.email);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          apiKeys: user.apiKeys.map(key => ({
            name: key.name,
            key: key.key,
            createdAt: key.createdAt,
            lastUsed: key.lastUsed,
            isActive: key.isActive
          }))
        },
        token
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message
    });
  }
};

// @desc    Initiate Google OAuth flow
// @route   GET /api/auth/google/login
// @access  Public
export const initiateGoogleAuth = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const redirectUri = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/google`;
    const googleClient = getGoogleOAuthClient();

    const authUrl = googleClient.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
      ],
      redirect_uri:redirectUri
    });

    res.redirect(authUrl);
  } catch (error: any) {
    console.error('Google auth initiation error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=auth_init_failed`);
  }
};

// @desc    Handle Google OAuth callback
// @route   GET /api/auth/google
// @access  Public
export const handleGoogleCallback = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { code } = req.query;

    if (!code) {
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=no_code`);
      return;
    }

    const googleClient = getGoogleOAuthClient();

    const redirectUri = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/google`;

    // Exchange authorization code for tokens
    const { tokens } = await googleClient.getToken({
      code: code as string,
      redirect_uri: redirectUri  // ← KEEP THIS
    });


    if (!tokens.id_token) {
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=no_token`);
      return;
    }

    // Verify the ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=invalid_token`);
      return;
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
        evaluations: []
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
    const jwtToken = generateToken(String(user._id), user.email);

    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback?token=${jwtToken}`);
  } catch (error: any) {
    console.error('Google auth callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=auth_failed`);
  }
};

// @desc    Generate new API key
// @route   POST /api/auth/generate-api-key
// @access  Private (requires JWT)
export const generateApiKey = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name } = req.body;

    if (!name || name.trim() === '') {
      res.status(400).json({
        success: false,
        message: 'API key name is required'
      });
      return;
    }

    // Find user
    const user = await User.findById(req.user!.id);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Generate unique API key
    const apiKey = `vsk_${uuidv4().replace(/-/g, '')}`;

    // Add API key to user
    user.apiKeys.push({
      key: apiKey,
      name: name.trim(),
      createdAt: new Date(),
      isActive: true
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'API key generated successfully',
      data: {
        apiKey: {
          name: name.trim(),
          key: apiKey,
          createdAt: new Date(),
          isActive: true
        }
      }
    });
  } catch (error: any) {
    console.error('Generate API key error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating API key',
      error: error.message
    });
  }
};

// @desc    Get user's API keys
// @route   GET /api/auth/api-keys
// @access  Private (requires JWT)
export const getApiKeys = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user!.id);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        apiKeys: user.apiKeys.map(key => ({
          name: key.name,
          key: key.key,
          createdAt: key.createdAt,
          lastUsed: key.lastUsed,
          isActive: key.isActive
        }))
      }
    });
  } catch (error: any) {
    console.error('Get API keys error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching API keys',
      error: error.message
    });
  }
};

// @desc    Deactivate API key
// @route   DELETE /api/auth/api-keys/:key
// @access  Private (requires JWT)
export const deactivateApiKey = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { key } = req.params;

    const user = await User.findById(req.user!.id);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    const apiKeyIndex = user.apiKeys.findIndex(k => k.key === key);
    if (apiKeyIndex === -1) {
      res.status(404).json({
        success: false,
        message: 'API key not found'
      });
      return;
    }

    user.apiKeys[apiKeyIndex].isActive = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'API key deactivated successfully'
    });
  } catch (error: any) {
    console.error('Deactivate API key error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deactivating API key',
      error: error.message
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private (requires JWT or API key)
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user!.id);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          apiKeys: user.apiKeys.map(key => ({
            name: key.name,
            key: key.key,
            createdAt: key.createdAt,
            lastUsed: key.lastUsed,
            isActive: key.isActive
          })),
          evaluations: user.evaluations,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      }
    });
  } catch (error: any) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile',
      error: error.message
    });
  }
};
