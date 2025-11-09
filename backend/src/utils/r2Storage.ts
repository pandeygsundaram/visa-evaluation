import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

// Initialize R2 client (S3-compatible)
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || ''
  }
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'simple-storage';
const R2_FOLDER = 'visa-docs'; // Folder inside the bucket

export interface UploadResult {
  key: string; // No longer returning URL, will generate signed URLs on-demand
}

/**
 * Upload file to R2 storage
 */
export async function uploadToR2(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  userId: string
): Promise<UploadResult> {
  try {
    // Generate unique key for the file with visa-docs folder prefix
    const fileExtension = fileName.split('.').pop();
    const uniqueKey = `${R2_FOLDER}/${userId}/${uuidv4()}.${fileExtension}`;

    // Upload to R2
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: uniqueKey,
      Body: buffer,
      ContentType: mimeType,
      Metadata: {
        originalFileName: fileName,
        uploadedBy: userId,
        uploadedAt: new Date().toISOString()
      }
    });

    await r2Client.send(command);

    console.log(`✅ Uploaded to R2: ${BUCKET_NAME}/${uniqueKey}`);

    return {
      key: uniqueKey
    };
  } catch (error: any) {
    console.error('R2 upload error:', error);
    throw new Error(`Failed to upload file to R2: ${error.message}`);
  }
}

/**
 * Download file from R2 storage
 */
export async function downloadFromR2(key: string): Promise<Buffer> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    });

    const response = await r2Client.send(command);

    if (!response.Body) {
      throw new Error('No file content returned');
    }

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body as any) {
      chunks.push(chunk);
    }

    return Buffer.concat(chunks);
  } catch (error: any) {
    console.error('R2 download error:', error);
    throw new Error(`Failed to download file from R2: ${error.message}`);
  }
}

/**
 * Delete file from R2 storage
 */
export async function deleteFromR2(key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    });

    await r2Client.send(command);
  } catch (error: any) {
    console.error('R2 delete error:', error);
    throw new Error(`Failed to delete file from R2: ${error.message}`);
  }
}

/**
 * Generate a temporary signed URL for accessing a private R2 file
 * @param key - The R2 object key
 * @param expiresIn - Expiration time in seconds (default: 1 hour)
 */
export async function generateSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    });

    // Generate signed URL that expires in the specified time
    const signedUrl = await getSignedUrl(r2Client, command, { expiresIn });

    return signedUrl;
  } catch (error: any) {
    console.error('Error generating signed URL:', error);
    throw new Error(`Failed to generate signed URL: ${error.message}`);
  }
}

/**
 * Generate signed URLs for multiple documents
 */
export async function generateSignedUrlsForDocuments(
  documents: Array<{ r2Key: string; [key: string]: any }>,
  expiresIn: number = 3600
): Promise<Array<{ signedUrl: string; [key: string]: any }>> {
  try {
    const documentsWithUrls = await Promise.all(
      documents.map(async (doc) => ({
        ...doc,
        signedUrl: await generateSignedUrl(doc.r2Key, expiresIn)
      }))
    );

    return documentsWithUrls;
  } catch (error: any) {
    console.error('Error generating signed URLs for documents:', error);
    throw error;
  }
}

/**
 * Validate R2 configuration
 */
export function validateR2Config(): boolean {
  const required = ['R2_ENDPOINT', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME'];

  for (const key of required) {
    if (!process.env[key]) {
      console.warn(`⚠️  Missing R2 configuration: ${key}`);
      return false;
    }
  }

  return true;
}
