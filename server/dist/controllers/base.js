"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorHandler = exports.ValidationUtils = exports.CRUDController = void 0;
// Generic CRUD controller
class CRUDController {
    service;
    constructor(service) {
        this.service = service;
    }
    // Get the model name from the service
    get modelName() {
        return this.service.model;
    }
    // GET /resource
    async getAll(req, res) {
        try {
            const { ...filters } = req.query;
            // Build where clause from query parameters
            const where = this.buildWhereClause(filters);
            console.log(`Fetching ${this.modelName} with where:`, where);
            const items = await this.service.findMany(where);
            res.json({
                data: items
            });
        }
        catch (error) {
            console.error(`Error fetching ${this.modelName}:`, error);
            console.error('Error details:', error);
            res.status(500).json({
                error: `Failed to fetch ${this.modelName}`,
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    // GET /resource/:id
    async getById(req, res) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                res.status(400).json({ error: 'Invalid ID format' });
                return;
            }
            const item = await this.service.findUnique({ id });
            if (!item) {
                res.status(404).json({ error: `${this.modelName} not found` });
                return;
            }
            res.json(item);
        }
        catch (error) {
            console.error(`Error fetching ${this.modelName}:`, error);
            res.status(500).json({ error: `Failed to fetch ${this.modelName}` });
        }
    }
    // POST /resource
    async create(req, res) {
        try {
            const data = this.validateAndTransformData(req.body, req);
            const item = await this.service.create(data);
            res.status(201).json(item);
        }
        catch (error) {
            console.error(`Error creating ${this.modelName}:`, error);
            res.status(500).json({ error: `Failed to create ${this.modelName}` });
        }
    }
    // PATCH /resource/:id
    async update(req, res) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                res.status(400).json({ error: 'Invalid ID format' });
                return;
            }
            const data = this.validateAndTransformData(req.body, req);
            const item = await this.service.update(id, data);
            res.json(item);
        }
        catch (error) {
            console.error(`Error updating ${this.modelName}:`, error);
            res.status(500).json({ error: `Failed to update ${this.modelName}` });
        }
    }
    // DELETE /resource/:id
    async delete(req, res) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                res.status(400).json({ error: 'Invalid ID format' });
                return;
            }
            await this.service.delete({ id });
            res.status(204).send();
        }
        catch (error) {
            console.error(`Error deleting ${this.modelName}:`, error);
            res.status(500).json({ error: `Failed to delete ${this.modelName}` });
        }
    }
    // Helper method to build where clause from query parameters
    buildWhereClause(filters) {
        const where = {};
        // Reserved query parameters that should not be included in where clause
        const reservedParams = ['include', 'select', 'orderBy', 'skip', 'take', 'cursor'];
        Object.keys(filters).forEach(key => {
            const value = filters[key];
            // Skip reserved parameters
            if (reservedParams.includes(key)) {
                return;
            }
            if (value !== undefined && value !== null && value !== '') {
                // Handle special operators
                if (key.includes('_gte')) {
                    const field = key.replace('_gte', '');
                    where[field] = { gte: this.parseValue(value) };
                }
                else if (key.includes('_lte')) {
                    const field = key.replace('_lte', '');
                    where[field] = { lte: this.parseValue(value) };
                }
                else if (key.includes('_gt')) {
                    const field = key.replace('_gt', '');
                    where[field] = { gt: this.parseValue(value) };
                }
                else if (key.includes('_lt')) {
                    const field = key.replace('_lt', '');
                    where[field] = { lt: this.parseValue(value) };
                }
                else if (key.includes('_in')) {
                    const field = key.replace('_in', '');
                    where[field] = { in: value.split(',') };
                }
                else if (key.includes('_contains')) {
                    const field = key.replace('_contains', '');
                    where[field] = { contains: value, mode: 'insensitive' };
                }
                else if (key.includes('_startsWith')) {
                    const field = key.replace('_startsWith', '');
                    where[field] = { startsWith: value };
                }
                else if (key.includes('_endsWith')) {
                    const field = key.replace('_endsWith', '');
                    where[field] = { endsWith: value };
                }
                else {
                    // Direct field matching
                    where[key] = this.parseValue(value);
                }
            }
        });
        return where;
    }
    // Helper method to parse values based on type
    parseValue(value) {
        // Don't parse strings that look like numbers if they're for text fields
        // Only parse if it's clearly a number (no leading zeros, etc.)
        const numValue = Number(value);
        if (!isNaN(numValue) && value !== '' && String(numValue) === String(value) && !value.includes('.')) {
            return numValue;
        }
        // Try to parse as boolean
        if (value === 'true')
            return true;
        if (value === 'false')
            return false;
        // Return as string
        return value;
    }
    // Override this method in subclasses for custom validation
    validateAndTransformData(data, req) {
        return data;
    }
}
exports.CRUDController = CRUDController;
// Validation utilities
class ValidationUtils {
    static validateRequired(data, requiredFields) {
        const missing = requiredFields.filter(field => !data[field]);
        if (missing.length > 0) {
            throw new Error(`Missing required fields: ${missing.join(', ')}`);
        }
    }
    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    static validatePhone(phone) {
        // Accept optional leading + and 8-16 digits total
        const phoneRegex = /^\+?[0-9]\d{7,15}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    }
    static sanitizeString(str) {
        return str.trim().replace(/[<>]/g, '');
    }
    static validateEnum(value, allowedValues) {
        return allowedValues.includes(value);
    }
}
exports.ValidationUtils = ValidationUtils;
// Error handling utilities
class ErrorHandler {
    static handlePrismaError(error) {
        if (error.code === 'P2002') {
            return { status: 409, message: 'Duplicate entry - resource already exists' };
        }
        if (error.code === 'P2025') {
            return { status: 404, message: 'Resource not found' };
        }
        if (error.code === 'P2003') {
            return { status: 400, message: 'Foreign key constraint failed' };
        }
        if (error.code === 'P2014') {
            return { status: 400, message: 'Invalid relation operation' };
        }
        console.error('Unhandled Prisma error:', error);
        return { status: 500, message: 'Internal server error' };
    }
    static sendError(res, status, message) {
        res.status(status).json({ error: message });
    }
}
exports.ErrorHandler = ErrorHandler;
//# sourceMappingURL=base.js.map