import type { Request, Response } from "express";

export const SESSION_COOKIE = "clinicos_session";

export type SessionPayload = {
  accessToken: string;
  refreshToken?: string;
  userId: string;
  email: string;
  clinicId: string;
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

export function writeSession(res: Response, session: SessionPayload) {
  res.cookie(SESSION_COOKIE, JSON.stringify(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    signed: true,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });
}

export function clearSession(res: Response) {
  res.clearCookie(SESSION_COOKIE);
}
