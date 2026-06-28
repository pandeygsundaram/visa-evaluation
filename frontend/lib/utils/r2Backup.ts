import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET = process.env.R2_BUCKET_NAME || 'simple-storage';
const BACKUP_KEY = 'backups/visa-eval.sqlite';

export async function backupDbToR2(): Promise<void> {
  const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'database.sqlite');

  if (!fs.existsSync(dbPath)) throw new Error('Database file not found');

  const fileBuffer = fs.readFileSync(dbPath);

  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: BACKUP_KEY,
      Body: fileBuffer,
      ContentType: 'application/octet-stream',
      Metadata: { backedUpAt: new Date().toISOString() },
    })
  );

  console.log(`✅ DB backed up to R2: ${BUCKET}/${BACKUP_KEY}`);
}

export async function restoreDbFromR2(): Promise<void> {
  const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'database.sqlite');
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const response = await r2.send(new GetObjectCommand({ Bucket: BUCKET, Key: BACKUP_KEY }));
  const chunks: Uint8Array[] = [];
  for await (const chunk of response.Body as any) chunks.push(chunk);
  fs.writeFileSync(dbPath, Buffer.concat(chunks));

  console.log(`✅ DB restored from R2: ${BUCKET}/${BACKUP_KEY}`);
}
