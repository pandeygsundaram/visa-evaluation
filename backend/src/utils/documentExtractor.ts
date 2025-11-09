import mammoth from 'mammoth';
import { Buffer } from 'buffer';
// @ts-ignore - pdfjs-dist types are incomplete
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

export interface ExtractedDocument {
  text: string;
  metadata?: {
    pages?: number;
    wordCount?: number;
    fileName?: string;
  };
}

/**
 * Extract text from PDF buffer using pdfjs-dist (no native dependencies required)
 */
export async function extractPdfText(buffer: Buffer, fileName?: string): Promise<ExtractedDocument> {
  try {
    // Load PDF document from buffer
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(buffer),
      useSystemFonts: true,
      standardFontDataUrl: undefined,
    });

    const pdfDocument = await loadingTask.promise;
    const numPages = pdfDocument.numPages;
    let fullText = '';

    // Extract text from each page
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }

    // Clean up
    await pdfDocument.destroy();

    const cleanText = fullText.trim();

    return {
      text: cleanText,
      metadata: {
        pages: numPages,
        wordCount: cleanText.split(/\s+/).filter(word => word.length > 0).length,
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
