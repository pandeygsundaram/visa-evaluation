import { NextResponse } from 'next/server';
import { VISA_CONFIG } from '@/lib/config/visaData';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ country: string }> }
) {
  const { country } = await params;
  const found = VISA_CONFIG.find((c) => c.code.toLowerCase() === country.toLowerCase());

  if (!found) {
    return NextResponse.json(
      { success: false, message: `Country ${country} not found` },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: found });
}
