import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

// Extend Express Request type to include user
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

// Middleware to verify JWT token
export const verifyToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'No token provided. Authorization header must be in format: Bearer <token>'
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
      email: string;
    };

    // Check if user still exists
    const user = await User.findById(decoded.id);
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User no longer exists'
      });
      return;
    }

    // Add user to request
    req.user = {
      id: decoded.id,
      email: decoded.email
    };

    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
      return;
    }

    if (error.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        message: 'Token expired'
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: error.message
    });
  }
};

// Middleware to verify API key
export const verifyApiKey = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      res.status(401).json({
        success: false,
        message: 'API key required. Please provide x-api-key header'
      });
      return;
    }

    // Find user with this API key
    const user = await User.findOne({
      'apiKeys.key': apiKey,
      'apiKeys.isActive': true
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid or inactive API key'
      });
      return;
    }

    // Update last used timestamp
    const apiKeyIndex = user.apiKeys.findIndex(k => k.key === apiKey && k.isActive);
    if (apiKeyIndex !== -1) {
      user.apiKeys[apiKeyIndex].lastUsed = new Date();
      await user.save();
    }

    // Add user to request
    req.user = {
      id: String(user._id),
      email: user.email
    };

    next();
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'API key verification error',
      error: error.message
    });
  }
};

// Middleware that accepts either JWT token or API key
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const apiKey = req.headers['x-api-key'] as string;
  const authHeader = req.headers.authorization;

  if (apiKey) {
    return verifyApiKey(req, res, next);
  } else if (authHeader) {
    return verifyToken(req, res, next);
  } else {
    res.status(401).json({
      success: false,
      message: 'Authentication required. Provide either Authorization header (Bearer token) or x-api-key header'
    });
  }
};
