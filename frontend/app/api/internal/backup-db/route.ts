import { NextResponse } from 'next/server';
import { backupDbToR2 } from '@/lib/utils/r2Backup';

export const runtime = 'nodejs';

// Secured with a shared secret — set BACKUP_SECRET in env and pass it as Authorization header
export async function POST(req: Request) {
  const secret = process.env.BACKUP_SECRET;
  if (secret) {
    const provided = req.headers.get('authorization')?.replace('Bearer ', '');
    if (provided !== secret) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
  }

  await backupDbToR2();
  return NextResponse.json({ success: true, message: 'Database backed up to R2', backedUpAt: new Date() });
}
