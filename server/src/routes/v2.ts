import { Router } from 'express';
import jobApplicationRoutes from './jobApplication.routes';
import billingRoutes from './billing.routes';
import authRoutes from './auth.routes';
import healthRoutes from './health.routes';
import jobsRoutes from './jobs.routes';
import resumeRatingRoutes from './resumeRating.routes';
import savedJobsRoutes from './savedJobs.routes';

export function createRoutes() {
  const router = Router();

  // Modular routes
  router.use('/', authRoutes);
  router.use('/', healthRoutes);
  router.use('/', jobsRoutes);
  router.use('/', jobApplicationRoutes);
  router.use('/', resumeRatingRoutes);
  router.use('/', savedJobsRoutes);

  // Billing routes
  router.use('/billing', billingRoutes);

  return router;
}
