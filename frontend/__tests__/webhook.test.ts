import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createTestDb } from './helpers/db';

let testDb: ReturnType<typeof createTestDb>;
vi.mock('@/lib/db', () => ({ getDb: () => testDb }));

vi.mock('@/lib/services/stripeService', () => ({
  stripe: {
    webhooks: {
      constructEvent: vi.fn(),
    },
    subscriptions: {
      retrieve: vi.fn(),
    },
  },
  STRIPE_CONFIG: { webhookSecret: 'test_secret' },
  handleSubscriptionCreated: vi.fn(),
  handleSubscriptionUpdated: vi.fn(),
  handleSubscriptionDeleted: vi.fn(),
  handleInvoicePaymentSucceeded: vi.fn(),
  handleInvoicePaymentFailed: vi.fn(),
}));

import * as stripeService from '@/lib/services/stripeService';
const { POST: webhook } = await import('@/app/api/webhook/route');

beforeEach(() => {
  testDb = createTestDb();
  vi.clearAllMocks();
});

function makeWebhookRequest(body: string, sig: string) {
  return new Request('http://localhost/api/webhook', {
    method: 'POST',
    headers: { 'stripe-signature': sig, 'Content-Type': 'application/json' },
    body,
  });
}

describe('POST /api/webhook', () => {
  it('returns 400 when no stripe-signature header', async () => {
    const res = await webhook(
      new Request('http://localhost', { method: 'POST', body: '{}' })
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 when signature verification fails', async () => {
    vi.mocked(stripeService.stripe.webhooks.constructEvent).mockImplementation(() => {
      throw new Error('Invalid signature');
    });
    const res = await webhook(makeWebhookRequest('{}', 'bad_sig'));
    expect(res.status).toBe(400);
  });

  it('handles customer.subscription.created event', async () => {
    const mockEvent = { type: 'customer.subscription.created', data: { object: { id: 'sub_123' } } };
    vi.mocked(stripeService.stripe.webhooks.constructEvent).mockReturnValue(mockEvent as any);

    const res = await webhook(makeWebhookRequest(JSON.stringify(mockEvent), 'valid_sig'));
    expect(res.status).toBe(200);
    expect(stripeService.handleSubscriptionCreated).toHaveBeenCalledWith({ id: 'sub_123' });
  });

  it('handles customer.subscription.updated event', async () => {
    const mockEvent = { type: 'customer.subscription.updated', data: { object: { id: 'sub_123' } } };
    vi.mocked(stripeService.stripe.webhooks.constructEvent).mockReturnValue(mockEvent as any);

    const res = await webhook(makeWebhookRequest(JSON.stringify(mockEvent), 'valid_sig'));
    expect(res.status).toBe(200);
    expect(stripeService.handleSubscriptionUpdated).toHaveBeenCalled();
  });

  it('handles customer.subscription.deleted event', async () => {
    const mockEvent = { type: 'customer.subscription.deleted', data: { object: { id: 'sub_123' } } };
    vi.mocked(stripeService.stripe.webhooks.constructEvent).mockReturnValue(mockEvent as any);

    await webhook(makeWebhookRequest(JSON.stringify(mockEvent), 'valid_sig'));
    expect(stripeService.handleSubscriptionDeleted).toHaveBeenCalled();
  });

  it('handles unknown event types gracefully', async () => {
    const mockEvent = { type: 'some.unknown.event', data: { object: {} } };
    vi.mocked(stripeService.stripe.webhooks.constructEvent).mockReturnValue(mockEvent as any);

    const res = await webhook(makeWebhookRequest(JSON.stringify(mockEvent), 'valid_sig'));
    expect(res.status).toBe(200);
  });
});
