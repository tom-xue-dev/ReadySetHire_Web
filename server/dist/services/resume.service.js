"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resumeService = exports.ResumeService = void 0;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const uuid_1 = require("uuid");
const database_1 = __importDefault(require("./database"));
class ResumeService {
    uploadDir;
    constructor() {
        this.uploadDir = path.join(process.cwd(), 'uploads', 'resumes');
        this.ensureUploadDirectory();
    }
    async ensureUploadDirectory() {
        try {
            await fs.access(this.uploadDir);
        }
        catch {
            await fs.mkdir(this.uploadDir, { recursive: true });
            console.log('✅ Created resume upload directory:', this.uploadDir);
        }
    }
    /**
     * Save resume file to disk and create database record
     */
    async uploadResume(file) {
        try {
            // Generate unique filename
            const fileExt = path.extname(file.originalName);
            const fileName = `${(0, uuid_1.v4)()}${fileExt}`;
            const filePath = path.join(this.uploadDir, fileName);
            // Save file to disk
            await fs.writeFile(filePath, file.buffer);
            console.log('📁 Resume saved to:', filePath);
            // Extract text if PDF
            let extractedText = null;
            if (file.mimeType === 'application/pdf') {
                extractedText = await this.extractTextFromPDF(filePath);
            }
            // Create database record
            const resume = await database_1.default.resume.create({
                data: {
                    originalName: file.originalName,
                    fileName: fileName,
                    filePath: filePath,
                    fileSize: file.size,
                    mimeType: file.mimeType,
                    extractedText: extractedText,
                },
            });
            console.log('✅ Resume record created:', resume.id);
            return resume;
        }
        catch (error) {
            console.error('❌ Failed to upload resume:', error);
            throw new Error(`Resume upload failed: ${error.message}`);
        }
    }
    /**
     * Extract text from PDF file
     */
    async extractTextFromPDF(filePath) {
        try {
            // Try to use pdf-parse if available
            const pdfParse = require('pdf-parse');
            const dataBuffer = await fs.readFile(filePath);
            const data = await pdfParse(dataBuffer);
            return data.text;
        }
        catch (error) {
            console.warn('⚠️ PDF parsing not available, skipping text extraction');
            return null;
        }
    }
    /**
     * Parse resume data using LLM
     */
    async parseResumeWithLLM(resumeId) {
        try {
            const resume = await database_1.default.resume.findUnique({
                where: { id: resumeId },
            });
            if (!resume || !resume.extractedText) {
                return null;
            }
            // TODO: Implement LLM-based parsing
            // For now, return basic structure
            const parsedData = {
                summary: resume.extractedText.substring(0, 500),
                skills: [],
                experience: [],
                education: [],
            };
            // Update resume with parsed data
            await database_1.default.resume.update({
                where: { id: resumeId },
                data: { parsedData: parsedData },
            });
            return parsedData;
        }
        catch (error) {
            console.error('❌ Failed to parse resume:', error);
            return null;
        }
    }
    /**
     * Get resume by ID
     */
    async getResume(id) {
        return await database_1.default.resume.findUnique({
            where: { id },
            include: {
                applications: {
                    include: {
                        job: true,
                    },
                },
            },
        });
    }
    /**
     * Delete resume file and record
     */
    async deleteResume(id) {
        try {
            const resume = await database_1.default.resume.findUnique({
                where: { id },
            });
            if (!resume) {
                throw new Error('Resume not found');
            }
            // Delete file from disk
            try {
                await fs.unlink(resume.filePath);
                console.log('🗑️ Resume file deleted:', resume.filePath);
            }
            catch (error) {
                console.warn('⚠️ Could not delete resume file:', error);
            }
            // Delete database record
            await database_1.default.resume.delete({
                where: { id },
            });
            console.log('✅ Resume record deleted:', id);
        }
        catch (error) {
            console.error('❌ Failed to delete resume:', error);
            throw new Error(`Resume deletion failed: ${error.message}`);
        }
    }
    /**
     * Get resume file content
     */
    async getResumeFile(id) {
        const resume = await database_1.default.resume.findUnique({
            where: { id },
        });
        if (!resume) {
            throw new Error('Resume not found');
        }
        const buffer = await fs.readFile(resume.filePath);
        return {
            buffer,
            mimeType: resume.mimeType,
            originalName: resume.originalName,
        };
    }
}
exports.ResumeService = ResumeService;
exports.resumeService = new ResumeService();
//# sourceMappingURL=resume.service.js.map