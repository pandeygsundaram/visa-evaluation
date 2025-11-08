import { Response } from 'express';
import { validationResult } from 'express-validator';
import jwt, { SignOptions } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import User from '../models/User';
import Evaluation from '../models/Evaluation';
import { AuthRequest } from '../middleware/auth';

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
