import { isIP } from 'node:net';
import { randomUUID } from 'node:crypto';

export const runtime = 'nodejs';

type Enquiry = {
  name: string; company: string; email: string; phone: string;
  product: string; application: string; message: string; context?: string;
};

const MAX_BODY_BYTES = 8 * 1024;
const limits: Record<Exclude<keyof Enquiry, 'context'>, number> = {
  name: 100, company: 120, email: 180, phone: 30,
  product: 100, application: 180, message: 2000
};
const fields = Object.keys(limits) as (Exclude<keyof Enquiry, 'context'>)[];
const products = new Set([
  'Synthetic adhesives', 'Starch based adhesives', 'Wood working adhesives',
  'Packaging / paper conversion', 'Lamination / labeling', 'Not sure yet'
]);
const attempts = new Map<string, { count: number; reset: number }>();

function json(message: string, status: number, extra: Record<string, unknown> = {}) {
  return Response.json({ message, ...extra }, {
    status,
    headers: { 'Cache-Control': 'no-store' }
  });
}

async function readBoundedBody(request: Request): Promise<string | null> {
  const contentLength = request.headers.get('content-length');
  if (contentLength !== null) {
    if (!/^\d+$/.test(contentLength)) return null;
    if (Number(contentLength) > MAX_BODY_BYTES) return null;
  }

  if (!request.body) return '';
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } catch {
    return null;
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try { return new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
  catch { return null; }
}

function validate(input: unknown): Enquiry | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const object = input as Record<string, unknown>;
  if (Object.keys(object).some(key => ![...fields, 'context', 'website'].includes(key))) return null;
  const output = {} as Enquiry;
  for (const key of fields) {
    const value = object[key];
    if (typeof value !== 'string' || value.length > limits[key]) return null;
    output[key] = value.trim();
  }
  if (object.context !== undefined) {
    if (typeof object.context !== 'string' || object.context.length > 180) return null;
    output.context = object.context.trim();
  }
  if (!output.name || !output.application || output.message.length < 15) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(output.email)) return null;
  if (!products.has(output.product)) return null;
  return output;
}

function clientAddress(headers: Headers): string {
  const realIp = headers.get('x-real-ip')?.trim();
  if (realIp && isIP(realIp)) return realIp;

  // Proxies append their observed client address to X-Forwarded-For. Taking
  // the last valid entry avoids trusting a caller-supplied leading value.
  const forwarded = headers.get('x-forwarded-for')?.split(',').map(value => value.trim()) ?? [];
  for (let index = forwarded.length - 1; index >= 0; index -= 1) {
    if (isIP(forwarded[index])) return forwarded[index];
  }
  return 'unknown';
}

function isAllowedWebhook(target: string): boolean {
  try {
    const url = new URL(target);
    return url.protocol === 'https:' && Boolean(url.hostname) && !url.username && !url.password;
  } catch { return false; }
}

export async function POST(request: Request) {
  const contentType = request.headers.get('content-type') ?? '';
  if (!/^application\/json(?:\s*;|\s*$)/i.test(contentType)) {
    return json('Invalid request format.', 415);
  }

  const raw = await readBoundedBody(request);
  if (raw === null) return json('Enquiry is too long or malformed.', 413);

  let input: unknown;
  try { input = JSON.parse(raw); }
  catch { return json('Invalid request format.', 400); }
  if (input && typeof input === 'object' && !Array.isArray(input) && 'website' in input && (input as Record<string, unknown>).website) {
    return json('Invalid request.', 400);
  }
  const enquiry = validate(input);
  if (!enquiry) return json('Please check the required details and try again.', 400);

  const target = process.env.ENQUIRY_WEBHOOK_URL?.trim() ?? '';
  if (!target || !isAllowedWebhook(target)) {
    return json('Enquiry delivery is temporarily unavailable. Please try again later.', 503);
  }

  const now = Date.now();
  const identifier = clientAddress(request.headers);
  const bucket = attempts.get(identifier);
  if (bucket && bucket.reset > now && bucket.count >= 5) {
    return json('Please wait a few minutes before sending another enquiry.', 429);
  }
  attempts.set(identifier, { count: bucket && bucket.reset > now ? bucket.count + 1 : 1, reset: now + 15 * 60_000 });
  if (attempts.size > 5000) {
    for (const [key, value] of attempts) if (value.reset < now) attempts.delete(key);
  }

  const id = randomUUID();
  try {
    const response = await fetch(target, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.ENQUIRY_WEBHOOK_SECRET ? { Authorization: `Bearer ${process.env.ENQUIRY_WEBHOOK_SECRET}` } : {})
      },
      body: JSON.stringify({ id, receivedAt: new Date(now).toISOString(), enquiry }),
      cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(10_000)
    });
    if (!response.ok) throw new Error('Webhook rejected enquiry');
    return json('Enquiry received.', 201, { id });
  } catch {
    // Provider errors can contain the URL or other configuration details.
    console.error('Enquiry delivery failed');
    return json('We could not send the enquiry. Please try again.', 502);
  }
}
