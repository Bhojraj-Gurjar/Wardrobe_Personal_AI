/**
 * End-to-end Virtual Try-On generate smoke test (local dev).
 * Usage: node scripts/test-vto-generate.js [userId] [productId]
 */
const jwt = require('jsonwebtoken');

const API_BASE = process.env.API_BASE || 'http://localhost:3000/api/v1';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const USER_ID = process.argv[2] || '862a1443-211f-4c81-855e-1fe21035234a';
const PRODUCT_ID = process.argv[3] || '273bc6d4-9800-4cbd-a248-3ca982dedcfb';

function signToken(userId, email) {
  return jwt.sign({ sub: userId, email }, JWT_SECRET, { expiresIn: '1h' });
}

async function request(path, { method = 'GET', body } = {}, token) {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let payload;

  try {
    payload = JSON.parse(text);
  } catch {
    payload = text;
  }

  return { status: response.status, payload };
}

async function main() {
  const token = signToken(USER_ID, 'raj@gmail.com');

  const setup = await request('/virtual-try-on/setup', {}, token);
  console.log('SETUP', setup.status, JSON.stringify(setup.payload?.data ?? setup.payload, null, 2));

  if (setup.status >= 400) {
    process.exit(1);
  }

  const generate = await request(
    `/virtual-try-on/generate/${PRODUCT_ID}`,
    { method: 'POST', body: {} },
    token,
  );

  console.log('GENERATE', generate.status, JSON.stringify(generate.payload, null, 2));

  if (generate.status >= 400) {
    process.exit(1);
  }

  console.log('Virtual Try-On generate OK');
}

main().catch((error) => {
  console.error('Virtual Try-On test failed:', error?.message || error);
  process.exit(1);
});
