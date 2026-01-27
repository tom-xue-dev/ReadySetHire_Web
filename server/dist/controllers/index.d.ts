import { Request, Response } from 'express';
import { CRUDController } from './base';
import { JobService } from '../services/database';
export declare class JobController extends CRUDController<any> {
    private jobService;
    constructor(jobService: JobService);
    getAll(req: Request, res: Response): Promise<void>;
    protected validateAndTransformData(data: any, req?: any): any;
    create(req: Request, res: Response): Promise<void>;
    getByUserId(req: Request, res: Response): Promise<void>;
    getPublished(req: Request, res: Response): Promise<void>;
    publish(req: Request, res: Response): Promise<void>;
    delete(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=index.d.ts.map