import { NextResponse } from 'next/server';
import { VISA_CONFIG } from '@/lib/config/visaData';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ country: string; visa: string }> }
) {
  const { country, visa } = await params;
  const countryData = VISA_CONFIG.find((c) => c.code.toLowerCase() === country.toLowerCase());

  if (!countryData) {
    return NextResponse.json(
      { success: false, message: `Country ${country} not found` },
      { status: 404 }
    );
  }

  const visaType = countryData.visaTypes.find(
    (v) => v.code.toLowerCase() === visa.toLowerCase()
  );

  if (!visaType) {
    return NextResponse.json(
      { success: false, message: `Visa type ${visa} not found for ${country}` },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: visaType });
}
