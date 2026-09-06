const SESSION_SECRET = process.env.SESSION_SECRET || 'kaivex_secret_session_key_6842_ahmad_2026';
const EXPECTED_PIN = process.env.APP_PIN || '6842';

export const SESSION_COOKIE_NAME = 'kaivex_session';
export const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

/**
 * Portable Web Crypto HMAC SHA-256 (Compatible with Node.js, Vercel, and Edge Runtime)
 */
async function hmacSha256(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sigBuffer = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generates a signed session token
 */
export async function createSessionToken(userId: string = 'ahmad'): Promise<string> {
  const timestamp = Date.now().toString();
  const payload = `${userId}:${timestamp}`;
  const sig = await hmacSha256(SESSION_SECRET, payload);
  const raw = `${payload}:${sig}`;
  return typeof Buffer !== 'undefined'
    ? Buffer.from(raw).toString('base64')
    : btoa(raw);
}

/**
 * Verifies a signed session token
 */
export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    const decoded =
      typeof Buffer !== 'undefined'
        ? Buffer.from(token, 'base64').toString('utf-8')
        : atob(token);
    const parts = decoded.split(':');
    if (parts.length !== 3) return false;

    const [userId, timestampStr, signature] = parts;
    const timestamp = parseInt(timestampStr, 10);
    const maxAgeMs = SESSION_MAX_AGE * 1000;

    if (isNaN(timestamp) || Date.now() - timestamp > maxAgeMs) {
      return false;
    }

    const payload = `${userId}:${timestampStr}`;
    const expectedSig = await hmacSha256(SESSION_SECRET, payload);
    return signature === expectedSig;
  } catch {
    return false;
  }
}

/**
 * Validates user-entered PIN
 */
export function verifyPin(inputPin: string): boolean {
  if (!inputPin) return false;
  return inputPin.trim() === EXPECTED_PIN.trim();
}