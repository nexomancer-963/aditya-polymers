import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';

export const runtime = 'nodejs';

type Enquiry = {
  name: string; company: string; email: string; phone: string;
  product: string; application: string; message: string;
};

const limits: Record<keyof Enquiry, number> = {
  name: 100, company: 120, email: 180, phone: 30,
  product: 100, application: 180, message: 2000
};
const products = new Set([
  'Synthetic adhesives', 'Starch based adhesives', 'Wood working adhesives',
  'Packaging / paper conversion', 'Lamination / labeling', 'Not sure yet'
]);
const attempts = new Map<string, { count: number; reset: number }>();

function validate(input: unknown): Enquiry | null {
  if (!input || typeof input !== 'object') return null;
  const object = input as Record<string, unknown>;
  const output = {} as Enquiry;
  for (const key of Object.keys(limits) as (keyof Enquiry)[]) {
    const value = object[key];
    if (typeof value !== 'string' || value.length > limits[key]) return null;
    output[key] = value.trim();
  }
  if (!output.name || !output.application || output.message.length < 15) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(output.email)) return null;
  if (!products.has(output.product)) return null;
  return output;
}

export async function POST(request: NextRequest) {
  if (!request.headers.get('content-type')?.includes('application/json')) {
    return NextResponse.json({ message: 'Invalid request format.' }, { status: 415 });
  }
  const size = Number(request.headers.get('content-length') || 0);
  if (size > 8192) return NextResponse.json({ message: 'Enquiry is too long.' }, { status: 413 });
  const raw = await request.text();
  if (raw.length > 8192) return NextResponse.json({ message: 'Enquiry is too long.' }, { status: 413 });
  let input: unknown;
  try { input = JSON.parse(raw); }
  catch { return NextResponse.json({ message: 'Invalid request format.' }, { status: 400 }); }
  if ((input as Record<string, unknown>)?.website) {
    return NextResponse.json({ message: 'Invalid request.' }, { status: 400 });
  }
  const enquiry = validate(input);
  if (!enquiry) return NextResponse.json({ message: 'Please check the required details and try again.' }, { status: 400 });

  const target = process.env.ENQUIRY_WEBHOOK_URL;
  if (!target || !/^https:\/\//.test(target)) {
    return NextResponse.json({ message: 'Enquiry delivery is temporarily unavailable. Please try again later.' }, { status: 503 });
  }

  const identifier = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const now = Date.now();
  const bucket = attempts.get(identifier);
  if (bucket && bucket.reset > now && bucket.count >= 5) {
    return NextResponse.json({ message: 'Please wait a few minutes before sending another enquiry.' }, { status: 429 });
  }
  attempts.set(identifier, { count: bucket && bucket.reset > now ? bucket.count + 1 : 1, reset: now + 15 * 60_000 });
  if (attempts.size > 5000) for (const [key, value] of attempts) if (value.reset < now) attempts.delete(key);

  const id = randomUUID();
  try {
    const response = await fetch(target, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.ENQUIRY_WEBHOOK_SECRET ? { Authorization: `Bearer ${process.env.ENQUIRY_WEBHOOK_SECRET}` } : {})
      },
      body: JSON.stringify({ id, receivedAt: new Date(now).toISOString(), enquiry }),
      cache: 'no-store', signal: AbortSignal.timeout(10_000)
    });
    if (!response.ok) throw new Error(`Webhook rejected enquiry (${response.status})`);
    return NextResponse.json({ id, message: 'Enquiry received.' }, { status: 201 });
  } catch (error) {
    console.error('Enquiry delivery failed', error instanceof Error ? error.message : 'unknown error');
    return NextResponse.json({ message: 'We could not send the enquiry. Please try again.' }, { status: 502 });
  }
}
