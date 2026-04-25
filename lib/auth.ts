import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  signSession,
  verifyToken,
} from "./session";

export async function setSessionCookie(): Promise<void> {
  const token = await signSession();
  const c = await cookies();
  c.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const c = await cookies();
  c.delete(SESSION_COOKIE);
}

export async function isAdmin(): Promise<boolean> {
  const c = await cookies();
  return verifyToken(c.get(SESSION_COOKIE)?.value);
}
