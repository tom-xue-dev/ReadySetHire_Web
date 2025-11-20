import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import prisma from './services/database';
import { createRoutes } from './routes';
import { createDocsRouter } from './routes/docs';

// Load environment variables
dotenv.config();

// Set default DATABASE_URL if not provided
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://readysethire_user:readysethire_password@localhost:5432/readysethire';
  console.log('⚠️  Using default DATABASE_URL. Please set DATABASE_URL environment variable for production.');
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: 'Connected',
  });
});

// API routes
app.use('/api', createRoutes());
// Swagger docs
app.use('/api', createDocsRouter());

// Error handling middleware
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error('Error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message:
        process.env.NODE_ENV === 'development'
          ? err.message
          : 'Something went wrong',
    });
  }
);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API base URL: http://localhost:${PORT}/api`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️  Database: PostgreSQL with Prisma ORM`);
});

export default app;
