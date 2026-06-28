import { describe, it, expect } from 'vitest';
import { VISA_CONFIG } from '@/lib/config/visaData';

const { GET: getAllCountries } = await import('@/app/api/visa-config/route');
const { GET: getCountry } = await import('@/app/api/visa-config/[country]/route');
const { GET: getVisaType } = await import('@/app/api/visa-config/[country]/[visa]/route');

function params<T extends object>(p: T) {
  return { params: Promise.resolve(p) };
}

describe('GET /api/visa-config', () => {
  it('returns all countries', async () => {
    const res = await getAllCountries();
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data.length).toBe(VISA_CONFIG.length);
  });

  it('each country has code, name, flag, visaTypes', async () => {
    const res = await getAllCountries();
    const json = await res.json();
    for (const c of json.data) {
      expect(c).toHaveProperty('code');
      expect(c).toHaveProperty('name');
      expect(c).toHaveProperty('flag');
      expect(Array.isArray(c.visaTypes)).toBe(true);
    }
  });
});

describe('GET /api/visa-config/[country]', () => {
  const firstCountry = VISA_CONFIG[0];

  it('returns a specific country', async () => {
    const res = await getCountry(new Request('http://x'), params({ country: firstCountry.code }));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.data.code).toBe(firstCountry.code);
  });

  it('is case-insensitive', async () => {
    const res = await getCountry(new Request('http://x'), params({ country: firstCountry.code.toLowerCase() }));
    expect(res.status).toBe(200);
  });

  it('returns 404 for unknown country', async () => {
    const res = await getCountry(new Request('http://x'), params({ country: 'ZZ' }));
    expect(res.status).toBe(404);
  });
});

describe('GET /api/visa-config/[country]/[visa]', () => {
  const firstCountry = VISA_CONFIG[0];
  const firstVisa = firstCountry.visaTypes[0];

  it('returns a specific visa type', async () => {
    const res = await getVisaType(
      new Request('http://x'),
      params({ country: firstCountry.code, visa: firstVisa.code })
    );
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.data.code).toBe(firstVisa.code);
  });

  it('returns 404 for unknown visa', async () => {
    const res = await getVisaType(
      new Request('http://x'),
      params({ country: firstCountry.code, visa: 'UNKNOWN' })
    );
    expect(res.status).toBe(404);
  });

  it('returns 404 for unknown country', async () => {
    const res = await getVisaType(new Request('http://x'), params({ country: 'ZZ', visa: 'XX' }));
    expect(res.status).toBe(404);
  });
});
