import type { Request, Response } from "express";

export const SESSION_COOKIE = "clinicos_session";

export type SessionPayload = {
  accessToken: string;
  refreshToken?: string;
  userId: string;
  email: string;
  clinicId: string;
  // Persisted in the cookie so the transparent token refresh below can rewrite
  // it without silently turning a browser-session cookie into a 7-day one.
  remember?: boolean;
};

export function readSession(req: Request): SessionPayload | null {
  const value = req.signedCookies?.[SESSION_COOKIE];
  if (!value || typeof value !== "string") return null;
  try {
    const parsed = JSON.parse(value) as Partial<SessionPayload>;
    if (
      typeof parsed.accessToken !== "string" ||
      typeof parsed.userId !== "string" ||
      typeof parsed.email !== "string" ||
      typeof parsed.clinicId !== "string"
    ) {
      return null;
    }
    return parsed as SessionPayload;
  } catch {
    return null;
  }
}

// Remembered devices get a 7-day cookie; otherwise the cookie is a browser-
// session cookie that disappears when the last tab closes.
export function writeSession(res: Response, session: SessionPayload) {
  res.cookie(SESSION_COOKIE, JSON.stringify(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    signed: true,
    ...(session.remember === false ? {} : { maxAge: 1000 * 60 * 60 * 24 * 7 }),
  });
}

export function clearSession(res: Response) {
  res.clearCookie(SESSION_COOKIE);
}

function decodeJwtExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1] ?? "", "base64url").toString("utf8"),
    ) as { exp?: unknown };
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

// Supabase access tokens expire long before the session cookie does; without a
// refresh every clinic user would be signed out roughly an hour after login.
export function sessionNeedsRefresh(session: SessionPayload): boolean {
  if (!session.refreshToken) return false;
  const expiresAt = decodeJwtExpiry(session.accessToken);
  if (!expiresAt) return false;
  return expiresAt * 1000 - Date.now() < 5 * 60_000;
}

const recentRefreshes = new Map<string, number>();

// Refresh token rotation makes parallel refreshes with the same token risky,
// so throttle per user; the window is short enough for serverless instances.
export function shouldThrottleRefresh(userId: string): boolean {
  const now = Date.now();
  if (recentRefreshes.size > 512) {
    for (const [key, last] of recentRefreshes) {
      if (now - last > 60_000) recentRefreshes.delete(key);
    }
  }
  const last = recentRefreshes.get(userId) ?? 0;
  if (now - last < 30_000) return true;
  recentRefreshes.set(userId, now);
  return false;
}
