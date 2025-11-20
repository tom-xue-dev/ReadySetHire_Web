import { Router } from 'express';
import { createRoutes as createV2Routes } from './v2';

export function createRoutes() {
  const router = Router();

  // Use the new v2 routes
  router.use('/', createV2Routes());

  return router;
}
