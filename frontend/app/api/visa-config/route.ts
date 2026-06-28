import { NextResponse } from 'next/server';
import { VISA_CONFIG } from '@/lib/config/visaData';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: VISA_CONFIG.map((c) => ({
      code: c.code,
      name: c.name,
      flag: c.flag,
      visaTypes: c.visaTypes.map((v) => ({
        code: v.code,
        name: v.name,
        description: v.description,
      })),
    })),
  });
}
