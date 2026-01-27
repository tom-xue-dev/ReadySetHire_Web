import { Request, Response } from 'express';
import { BaseService } from '../services/database';
export declare class CRUDController<T> {
    service: BaseService<T>;
    constructor(service: BaseService<T>);
    get modelName(): string;
    getAll(req: Request, res: Response): Promise<void>;
    getById(req: Request, res: Response): Promise<void>;
    create(req: Request, res: Response): Promise<void>;
    update(req: Request, res: Response): Promise<void>;
    delete(req: Request, res: Response): Promise<void>;
    protected buildWhereClause(filters: any): any;
    private parseValue;
    protected validateAndTransformData(data: any, req?: any): any;
}
export declare class ValidationUtils {
    static validateRequired(data: any, requiredFields: string[]): void;
    static validateEmail(email: string): boolean;
    static validatePhone(phone: string): boolean;
    static sanitizeString(str: string): string;
    static validateEnum(value: any, allowedValues: string[]): boolean;
}
export declare class ErrorHandler {
    static handlePrismaError(error: any): {
        status: number;
        message: string;
    };
    static sendError(res: Response, status: number, message: string): void;
}
//# sourceMappingURL=base.d.ts.map