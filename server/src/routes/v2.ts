import { Router } from 'express';
import jobApplicationRoutes from './jobApplication.routes';
import billingRoutes from './billing.routes';
import authRoutes from './auth.routes';
import healthRoutes from './health.routes';
import jobsRoutes from './jobs.routes';
import interviewsRoutes from './interviews.routes';
import questionsRoutes from './questions.routes';
import applicantsRoutes from './applicants.routes';
import applicantAnswersRoutes from './applicantAnswers.routes';
import audioRoutes from './audio.routes';
export function createRoutes() {
  const router = Router();

  // Modular routes
  router.use('/', authRoutes);
  router.use('/', healthRoutes);
  router.use('/', jobsRoutes);
  router.use('/', interviewsRoutes);
  router.use('/', questionsRoutes);
  router.use('/', applicantsRoutes);
  router.use('/', applicantAnswersRoutes);
  router.use('/', audioRoutes);
  // Job Application routes (includes public endpoints)
  router.use('/', jobApplicationRoutes);

  // Billing routes
  router.use('/billing', billingRoutes);

  return router;
}
