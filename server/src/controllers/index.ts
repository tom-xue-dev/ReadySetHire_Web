import { Request, Response } from 'express';
import { CRUDController, ValidationUtils } from './base';
import { JobService } from '../services/database';

// Job Controller
export class JobController extends CRUDController<any> {
  constructor(private jobService: JobService) {
    super(jobService);
  }

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { ...filters } = req.query;
      const isTracking = req.originalUrl.includes('/tracking');

      // Build where clause from query parameters
      const where = this.buildWhereClause(filters);

      console.log(`Fetching ${this.modelName} with where:`, where);

      // For tracking endpoint, include user relation to show all fields
      let items;
      if (isTracking) {
        // Use Prisma client directly for include relation
        // Prisma model name is 'job' (lowercase) in the client
        items = await (this.service as any).prisma.job.findMany({
          where,
          include: { user: true }
        });
      } else {
        items = await this.service.findMany(where);
      }

      res.json({
        data: items
      });
    } catch (error) {
      console.error(`Error fetching ${this.modelName}:`, error);
      console.error('Error details:', error);
      res.status(500).json({ 
        error: `Failed to fetch ${this.modelName}`,
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  protected validateAndTransformData(data: any, req?: any): any {
    ValidationUtils.validateRequired(data, ['title', 'description']);
    
    return {
      title: ValidationUtils.sanitizeString(data.title),
      description: ValidationUtils.sanitizeString(data.description),
      requirements: data.requirements ? ValidationUtils.sanitizeString(data.requirements) : null,
      location: data.location ? ValidationUtils.sanitizeString(data.location) : null,
      salaryRange: data.salaryRange ? ValidationUtils.sanitizeString(data.salaryRange) : null,
      status: data.status || 'DRAFT',
      userId: req?.user?.id || data.userId || data.user_id
    };
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const data = this.validateAndTransformData(req.body, req);
      const item = await this.service.create(data);
      res.status(201).json(item);
    } catch (error) {
      console.error(`Error creating ${this.modelName}:`, error);
      res.status(500).json({ error: `Failed to create ${this.modelName}` });
    }
  }

  async getByUserId(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        res.status(400).json({ error: 'Invalid user ID format' });
        return;
      }

      const jobs = await this.jobService.findByUserId(userId);
      res.json(jobs);
    } catch (error) {
      console.error('Error fetching jobs by user:', error);
      res.status(500).json({ error: 'Failed to fetch jobs' });
    }
  }

  async getPublished(req: Request, res: Response): Promise<void> {
    try {
      const jobs = await this.jobService.findPublished();
      res.json(jobs);
    } catch (error) {
      console.error('Error fetching published jobs:', error);
      res.status(500).json({ error: 'Failed to fetch published jobs' });
    }
  }

  async publish(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid ID format' });
        return;
      }

      const job = await this.jobService.update(
        id,
        { status: 'PUBLISHED', publishedAt: new Date() }
      );
      res.json(job);
    } catch (error) {
      console.error('Error publishing job:', error);
      res.status(500).json({ error: 'Failed to publish job' });
    }
  }
}
