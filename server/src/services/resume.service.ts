import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import prisma from './database';


export interface ResumeUpload {
  originalName: string;
  buffer: Buffer;
  mimeType: string;
  size: number;
}

export interface ParsedResumeData {
  skills?: string[];
  experience?: Array<{
    company: string;
    position: string;
    duration?: string;
  }>;
  education?: Array<{
    institution: string;
    degree?: string;
    year?: string;
  }>;
  summary?: string;
}

export class ResumeService {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'uploads', 'resumes');
    this.ensureUploadDirectory();
  }

  private async ensureUploadDirectory(): Promise<void> {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
      console.log('✅ Created resume upload directory:', this.uploadDir);
    }
  }

  /**
   * Save resume file to disk and create database record
   */
  async uploadResume(file: ResumeUpload): Promise<any> {
    try {
      // Generate unique filename
      const fileExt = path.extname(file.originalName);
      const fileName = `${uuidv4()}${fileExt}`;
      const filePath = path.join(this.uploadDir, fileName);

      // Save file to disk
      await fs.writeFile(filePath, file.buffer);
      console.log('📁 Resume saved to:', filePath);

      // Extract text if PDF
      let extractedText: string | null = null;
      if (file.mimeType === 'application/pdf') {
        extractedText = await this.extractTextFromPDF(filePath);
      }

      // Create database record
      const resume = await prisma.resume.create({
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

    } catch (error: any) {
      console.error('❌ Failed to upload resume:', error);
      throw new Error(`Resume upload failed: ${error.message}`);
    }
  }

  /**
   * Extract text from PDF file
   */
  private async extractTextFromPDF(filePath: string): Promise<string | null> {
    try {
      // Try to use pdf-parse if available
      const pdfParse = require('pdf-parse');
      const dataBuffer = await fs.readFile(filePath);
      const data = await pdfParse(dataBuffer);
      return data.text;
    } catch (error) {
      console.warn('⚠️ PDF parsing not available, skipping text extraction');
      return null;
    }
  }

  /**
   * Parse resume data using LLM
   */
  async parseResumeWithLLM(resumeId: number): Promise<ParsedResumeData | null> {
    try {
      const resume = await prisma.resume.findUnique({
        where: { id: resumeId },
      });

      if (!resume || !resume.extractedText) {
        return null;
      }

      // TODO: Implement LLM-based parsing
      // For now, return basic structure
      const parsedData: ParsedResumeData = {
        summary: resume.extractedText.substring(0, 500),
        skills: [],
        experience: [],
        education: [],
      };

      // Update resume with parsed data
      await prisma.resume.update({
        where: { id: resumeId },
        data: { parsedData: parsedData as any },
      });

      return parsedData;
    } catch (error) {
      console.error('❌ Failed to parse resume:', error);
      return null;
    }
  }

  /**
   * Get resume by ID
   */
  async getResume(id: number) {
    return await prisma.resume.findUnique({
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
  async deleteResume(id: number): Promise<void> {
    try {
      const resume = await prisma.resume.findUnique({
        where: { id },
      });

      if (!resume) {
        throw new Error('Resume not found');
      }

      // Delete file from disk
      try {
        await fs.unlink(resume.filePath);
        console.log('🗑️ Resume file deleted:', resume.filePath);
      } catch (error) {
        console.warn('⚠️ Could not delete resume file:', error);
      }

      // Delete database record
      await prisma.resume.delete({
        where: { id },
      });

      console.log('✅ Resume record deleted:', id);
    } catch (error: any) {
      console.error('❌ Failed to delete resume:', error);
      throw new Error(`Resume deletion failed: ${error.message}`);
    }
  }

  /**
   * Get resume file content
   */
  async getResumeFile(id: number): Promise<{ buffer: Buffer; mimeType: string; originalName: string }> {
    const resume = await prisma.resume.findUnique({
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

export const resumeService = new ResumeService();

