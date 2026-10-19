import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { POST } from '../src/app/api/enquiry/route.ts';

const originalFetch = globalThis.fetch;
const originalUrl = process.env.ENQUIRY_WEBHOOK_URL;
const originalSecret = process.env.ENQUIRY_WEBHOOK_SECRET;
let addressId = 0;

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalUrl === undefined) delete process.env.ENQUIRY_WEBHOOK_URL;
  else process.env.ENQUIRY_WEBHOOK_URL = originalUrl;
  if (originalSecret === undefined) delete process.env.ENQUIRY_WEBHOOK_SECRET;
  else process.env.ENQUIRY_WEBHOOK_SECRET = originalSecret;
});

function validEnquiry(overrides = {}) {
  return {
    name: '  Asha Rao  ', company: '  Mill & Co  ', email: 'asha@example.com', phone: '+91 98765 43210',
    product: 'Synthetic adhesives', application: 'Carton sealing on coated board',
    message: 'Please advise on a suitable grade for our line.', ...overrides
  };
}

function request(body, { contentType = 'application/json', headers = {}, raw = false } = {}) {
  const address = `198.51.100.${(++addressId % 240) + 1}`;
  return new Request('https://site.example/api/enquiry', {
    method: 'POST',
    headers: { 'content-type': contentType, 'x-real-ip': address, ...headers },
    body: raw ? body : JSON.stringify(body)
  });
}

async function responseFor(req) {
  const response = await POST(req);
  return { response, payload: await response.json() };
}

test('rejects wrong media types and malformed JSON before delivery', async () => {
  process.env.ENQUIRY_WEBHOOK_URL = 'https://delivery.example/hook';
  globalThis.fetch = async () => { throw new Error('fetch must not run'); };
  const wrongType = await responseFor(request(validEnquiry(), { contentType: 'text/plain' }));
  assert.equal(wrongType.response.status, 415);
  const malformed = await responseFor(request('{broken', { raw: true }));
  assert.equal(malformed.response.status, 400);
});

test('rejects oversized streamed bodies and invalid field shapes', async () => {
  process.env.ENQUIRY_WEBHOOK_URL = 'https://delivery.example/hook';
  globalThis.fetch = async () => { throw new Error('fetch must not run'); };
  const oversized = await responseFor(request(' '.repeat(8193), { raw: true }));
  assert.equal(oversized.response.status, 413);
  const extraField = await responseFor(request({ ...validEnquiry(), privateNote: 'unexpected' }));
  assert.equal(extraField.response.status, 400);
  const nonString = await responseFor(request(validEnquiry({ name: ['Asha'] })));
  assert.equal(nonString.response.status, 400);
  const invalidContext = await responseFor(request(validEnquiry({ context: ['Paper conversion'] })));
  assert.equal(invalidContext.response.status, 400);
});

test('keeps valid enquiries unavailable when no approved HTTPS webhook is configured', async () => {
  delete process.env.ENQUIRY_WEBHOOK_URL;
  let called = false;
  globalThis.fetch = async () => { called = true; throw new Error('unexpected'); };
  const { response, payload } = await responseFor(request(validEnquiry()));
  assert.equal(response.status, 503);
  assert.match(payload.message, /temporarily unavailable/);
  assert.equal(called, false);
});

test('normalizes fields, forwards only validated content and reports success after provider acceptance', async () => {
  process.env.ENQUIRY_WEBHOOK_URL = 'https://delivery.example/hook';
  process.env.ENQUIRY_WEBHOOK_SECRET = 'test-only-secret';
  let sent;
  globalThis.fetch = async (url, options) => {
    sent = { url, options, body: JSON.parse(options.body) };
    return new Response(null, { status: 202 });
  };
  const { response, payload } = await responseFor(request(validEnquiry({ context: 'Paper conversion' }), {
    headers: { 'x-forwarded-for': '203.0.113.99, 198.51.100.77' }
  }));
  assert.equal(response.status, 201);
  assert.match(payload.id, /^[0-9a-f-]{36}$/i);
  assert.equal(sent.url, 'https://delivery.example/hook');
  assert.equal(sent.options.headers.Authorization, 'Bearer test-only-secret');
  assert.equal(sent.options.redirect, 'error');
  assert.equal(sent.body.enquiry.name, 'Asha Rao');
  assert.equal(sent.body.enquiry.company, 'Mill & Co');
  assert.equal(sent.body.enquiry.message, validEnquiry().message);
  assert.equal(sent.body.enquiry.context, 'Paper conversion');
  assert.equal(Object.hasOwn(sent.body.enquiry, 'privateNote'), false);
  assert.equal(response.headers.get('cache-control'), 'no-store');
});

test('rate limits repeated accepted submissions for the same client address', async () => {
  process.env.ENQUIRY_WEBHOOK_URL = 'https://delivery.example/hook';
  let calls = 0;
  globalThis.fetch = async () => { calls += 1; return new Response(null, { status: 204 }); };
  const client = `203.0.113.${(++addressId % 240) + 1}`;
  for (let i = 0; i < 5; i += 1) {
    const { response } = await responseFor(request(validEnquiry(), {
      headers: { 'x-real-ip': '', 'x-forwarded-for': `192.0.2.${i + 1}, ${client}` }
    }));
    assert.equal(response.status, 201);
  }
  const limited = await responseFor(request(validEnquiry(), {
    headers: { 'x-real-ip': '', 'x-forwarded-for': `192.0.2.200, ${client}` }
  }));
  assert.equal(limited.response.status, 429);
  assert.equal(calls, 5);
});

test('sanitizes provider failures and never logs enquiry content', async () => {
  process.env.ENQUIRY_WEBHOOK_URL = 'https://delivery.example/hook?token=sensitive-provider-data';
  const logs = [];
  const originalError = console.error;
  console.error = (...values) => logs.push(values.join(' '));
  globalThis.fetch = async () => { throw new Error('secret-provider-error with customer@example.com'); };
  try {
    const { response, payload } = await responseFor(request(validEnquiry()));
    assert.equal(response.status, 502);
    assert.match(payload.message, /could not send/);
    assert.doesNotMatch(JSON.stringify(payload), /customer@example\.com|sensitive-provider-data/);
    assert.deepEqual(logs, ['Enquiry delivery failed']);
  } finally {
    console.error = originalError;
  }
});
