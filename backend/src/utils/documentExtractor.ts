import mammoth from 'mammoth';
import { Buffer } from 'buffer';

export interface ExtractedDocument {
  text: string;
  metadata?: {
    pages?: number;
    wordCount?: number;
    fileName?: string;
  };
}

/**
 * Extract text from PDF buffer
 */
export async function extractPdfText(buffer: Buffer, fileName?: string): Promise<ExtractedDocument> {
  try {
    // Use PDFParse class from pdf-parse module
    const { PDFParse } = require('pdf-parse');
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();

    // Clean up after parsing
    await parser.destroy();

    return {
      text: result.text,
      metadata: {
        pages: result.pages?.length || 0,
        wordCount: result.text.split(/\s+/).length,
        fileName
      }
    };
  } catch (error: any) {
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

/**
 * Extract text from DOCX buffer
 */
export async function extractDocxText(buffer: Buffer, fileName?: string): Promise<ExtractedDocument> {
  try {
    const result = await mammoth.extractRawText({ buffer });

    return {
      text: result.value,
      metadata: {
        wordCount: result.value.split(/\s+/).length,
        fileName
      }
    };
  } catch (error: any) {
    throw new Error(`Failed to extract text from DOCX: ${error.message}`);
  }
}

/**
 * Extract text from DOC buffer (older Word format)
 * Note: mammoth also supports older .doc files to some extent
 */
export async function extractDocText(buffer: Buffer, fileName?: string): Promise<ExtractedDocument> {
  try {
    const result = await mammoth.extractRawText({ buffer });

    return {
      text: result.value,
      metadata: {
        wordCount: result.value.split(/\s+/).length,
        fileName
      }
    };
  } catch (error: any) {
    throw new Error(`Failed to extract text from DOC: ${error.message}`);
  }
}

/**
 * Main function to extract text from various document types
 */
export async function extractDocumentText(
  buffer: Buffer,
  fileType: string,
  fileName?: string
): Promise<ExtractedDocument> {
  const normalizedType = fileType.toLowerCase().replace('.', '');

  switch (normalizedType) {
    case 'pdf':
      return extractPdfText(buffer, fileName);

    case 'docx':
      return extractDocxText(buffer, fileName);

    case 'doc':
      return extractDocText(buffer, fileName);

    default:
      throw new Error(`Unsupported file type: ${fileType}. Supported types: PDF, DOC, DOCX`);
  }
}

/**
 * Validate if file type is supported
 */
export function isSupportedFileType(mimeType: string): boolean {
  const supportedTypes = [
    'application/pdf',
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx
  ];

  return supportedTypes.includes(mimeType);
}

/**
 * Get file extension from mimetype
 */
export function getFileExtension(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx'
  };

  return mimeToExt[mimeType] || 'unknown';
}
