import { Router } from 'express';
import { body } from 'express-validator';
import {
  signup,
  login,
  generateApiKey,
  getApiKeys,
  deactivateApiKey,
  getMe
} from '../controllers/authController';
import { verifyToken, authenticate } from '../middleware/auth';

const router = Router();

// Validation middleware
const signupValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
];

const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Public routes
router.post('/signup', signupValidation, signup);
router.post('/login', loginValidation, login);

// Protected routes (require JWT token)
router.post('/generate-api-key', verifyToken, generateApiKey);
router.get('/api-keys', verifyToken, getApiKeys);
router.delete('/api-keys/:key', verifyToken, deactivateApiKey);

// Route that accepts both JWT and API key
router.get('/me', authenticate, getMe);

export default router;
