import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
import authRoutes from './routes/auth';
import visaConfigRoutes from './routes/visaConfig';
import evaluationRoutes from './routes/evaluation';
import subscriptionRoutes from './routes/subscription';
import webhookRoutes from './routes/webhook';
import analyticsRoutes from './routes/analytics';

// Load environment variables

// DEBUG: Check if env vars are loaded
console.log('=== ENVIRONMENT VARIABLES CHECK ===');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID);
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '✓ EXISTS' : '✗ MISSING');
console.log('BACKEND_URL:', process.env.BACKEND_URL);
console.log('===================================');

// Initialize Express app
const app = express();

// Middleware
app.use(cors({
  origin:  [    'http://localhost:3000',
    'http://localhost:5500',
    'http://127.0.0.1:5500'] ,
  credentials: true
}));

// IMPORTANT: Webhook route MUST come before express.json() middleware
// Stripe webhooks require raw body for signature verification
app.use('/api/webhook', webhookRoutes);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});


// API routes
app.use('/api/auth', authRoutes);
app.use('/api/visa-config', visaConfigRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/analytics', analyticsRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// MongoDB connection
const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      console.warn('⚠️  MONGODB_URI not found in environment variables');
      console.warn('⚠️  Application will run without database connection');
      console.warn('⚠️  Add MONGODB_URI to .env file to enable database features');
      return;
    }

    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB connected successfully');
    if (mongoose.connection.db) {
      console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
    }
  } catch (error: any) {
    console.error('❌ MongoDB connection error:', error.message);
    console.warn('⚠️  Application will continue without database connection');
    console.warn('⚠️  Please check your MongoDB connection string and ensure MongoDB is running');
  }
};

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Connect to database
  await connectDB();

  // Start listening
  app.listen(PORT, () => {
    console.log('');
    console.log('🚀 Visa Evaluation API Server');
    console.log('================================');
    console.log(`🌐 Server running on port ${PORT}`);
    console.log(`📍 Base URL: http://localhost:${PORT}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    console.log('');
    console.log('Available endpoints:');
    console.log('  POST   /api/auth/signup');
    console.log('  POST   /api/auth/login');
    console.log('  GET    /api/auth/google/login (Initiate Google OAuth)');
    console.log('  GET    /api/auth/google (Google OAuth callback)');
    console.log('  POST   /api/auth/generate-api-key');
    console.log('  GET    /api/auth/api-keys');
    console.log('  GET    /api/auth/me');
    console.log('  DELETE /api/auth/api-keys/:key');
    console.log('  GET    /api/visa-config');
    console.log('  GET    /api/visa-config/:countryCode');
    console.log('  GET    /api/visa-config/:countryCode/:visaCode');
    console.log('  POST   /api/evaluations (Upload documents for evaluation)');
    console.log('  GET    /api/evaluations (Get user evaluations)');
    console.log('  GET    /api/evaluations/:id (Get evaluation by ID)');
    console.log('  DELETE /api/evaluations/:id (Delete evaluation)');
    console.log('================================');
    console.log('');
  });
};

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();

export default app;
