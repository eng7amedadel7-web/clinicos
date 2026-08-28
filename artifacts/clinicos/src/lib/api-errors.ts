// Shared helpers for turning failed API calls into localizable auth-page
// messages. The server answers in English; matching happens on stable message
// fragments so the UI never shows raw English (or "HTTP 400 …") prefixes.

export type AuthErrorKey =
  | 'invalidCredentials'
  | 'notAssigned'
  | 'sessionSetup'
  | 'authUnavailable'
  | 'rateLimited'
  | 'tooManyAttempts'
  | 'tooManyRecovery'
  | 'recoveryUnavailable'
  | 'invalidRecoveryLink'
  | 'sessionExpired';

export type ApiErrorParts = {
  status?: number;
  serverMessage?: string;
};

export function getApiErrorParts(error: unknown): ApiErrorParts {
  if (!error || typeof error !== 'object') return {};
  const candidate = error as { status?: unknown; data?: unknown; error?: unknown; message?: unknown };
  const status = typeof candidate.status === 'number' ? candidate.status : undefined;

  let serverMessage: string | undefined;
  if (candidate.data && typeof candidate.data === 'object') {
    const nested = (candidate.data as { error?: unknown }).error;
    if (typeof nested === 'string' && nested.trim()) serverMessage = nested.trim();
  }
  if (!serverMessage && typeof candidate.error === 'string' && candidate.error.trim()) {
    serverMessage = candidate.error.trim();
  }
  if (!serverMessage && typeof candidate.message === 'string') {
    // customFetch's ApiError prefixes bodies with "HTTP 400 Bad Request: …";
    // strip it so fragment matching works on the server sentence alone.
    const stripped = candidate.message.trim().replace(/^HTTP\s+\d+\s+[^:]*:\s*/, '');
    if (stripped && !/<(!doctype|html)|internal server error/i.test(stripped)) serverMessage = stripped;
  }

  return { status, serverMessage };
}

const MESSAGE_MATCHERS: Array<[RegExp, AuthErrorKey]> = [
  [/email or password is incorrect|valid email and password|invalid email or password/i, 'invalidCredentials'],
  [/not assigned to an active clinic/i, 'notAssigned'],
  [/session could not be created/i, 'sessionSetup'],
  [/configuration is unavailable/i, 'authUnavailable'],
  [/rate-?limited/i, 'rateLimited'],
  [/too many attempts/i, 'tooManyAttempts'],
  [/too many recovery requests/i, 'tooManyRecovery'],
  [/recovery email delivery/i, 'recoveryUnavailable'],
  [/recovery link is invalid or expired|valid recovery link and a password/i, 'invalidRecoveryLink'],
  [/session has expired|not authenticated/i, 'sessionExpired'],
];

// Maps a failed auth call to a message key. `status === 401` maps to invalid
// credentials because these auth pages only see 401 from the login endpoint.
export function matchAuthErrorKey(error: unknown): AuthErrorKey | null {
  const { status, serverMessage } = getApiErrorParts(error);
  if (serverMessage) {
    for (const [pattern, key] of MESSAGE_MATCHERS) {
      if (pattern.test(serverMessage)) return key;
    }
  }
  if (status === 429) return 'tooManyAttempts';
  if (status !== undefined && status >= 500) return 'authUnavailable';
  if (status === 401) return 'invalidCredentials';
  return null;
}
