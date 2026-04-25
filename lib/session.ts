export const SESSION_COOKIE = "ss_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

const enc = new TextEncoder();

function getSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) {
    throw new Error("SESSION_SECRET is not set or too short (need 16+ chars)");
  }
  return s;
}

async function getKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    enc.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function toHex(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, "0");
  }
  return out;
}

function fromHex(hex: string): ArrayBuffer | null {
  if (hex.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(hex)) return null;
  const buf = new ArrayBuffer(hex.length / 2);
  const view = new Uint8Array(buf);
  for (let i = 0; i < hex.length; i += 2) {
    view[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return buf;
}

export async function signSession(): Promise<string> {
  const payload = `admin.${Date.now()}`;
  const key = await getKey();
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return `${payload}.${toHex(sig)}`;
}

export async function verifyToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [role, ts, sigHex] = parts;
  if (role !== "admin") return false;
  const sig = fromHex(sigHex);
  if (!sig) return false;
  const key = await getKey();
  return crypto.subtle.verify("HMAC", key, sig, enc.encode(`${role}.${ts}`));
}

export async function isAdminFromCookieHeader(header: string | null): Promise<boolean> {
  if (!header) return false;
  const part = header.split(/;\s*/).find((p) => p.startsWith(`${SESSION_COOKIE}=`));
  if (!part) return false;
  return verifyToken(decodeURIComponent(part.slice(SESSION_COOKIE.length + 1)));
}

export function checkPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD ?? "";
  if (!expected || input.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < input.length; i++) {
    mismatch |= input.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}
