// Shared helpers for turning failed API calls into localizable auth-page
// messages. The server now answers in Arabic (see api-server routes/auth.ts and
// routes/organization.ts); matching happens on short stable fragments of those
// sentences — plus the legacy English fragments still sent by the recovery and
// session endpoints — so the UI never shows the raw server sentence (or an
// "HTTP 400 …" prefix) and stays resilient to minor rewording.

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
  | 'sessionExpired'
  | 'emailExists'
  | 'emailNotFound'
  | 'invalidRegisterDetails'
  | 'confirmEmail'
  | 'onboardingFailed'
  | 'networkError';

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
  // Arabic-first: stable fragments of the exact sentences the server sends
  // today (auth.ts login/register paths). Keep fragments short so small
  // wording changes on the server still map to the right key.
  // e.g. "البريد الإلكتروني أو كلمة المرور غير صحيحة."
  [/كلمة المرور غير صحيحة|بريد إلكتروني وكلمة مرور صحيحة/i, 'invalidCredentials'],
  // e.g. "هذا الحساب غير مرتبط بعيادة نشطة. تواصل مع الدعم."
  [/غير مرتبط بعيادة نشطة/i, 'notAssigned'],
  // e.g. "تعذر إنشاء جلسة الدخول المعتمدة." / "تعذر إنشاء جلسة الدخول."
  [/تعذر إنشاء جلسة/i, 'sessionSetup'],
  // e.g. "تم تجاوز عدد محاولات الدخول، يرجى الانتظار دقيقة." (sent with 503)
  [/عدد محاولات الدخول/i, 'tooManyAttempts'],
  // e.g. "هذا البريد الإلكتروني مسجل مسبقاً في النظام. ..."
  [/مسجل مسبقاً/i, 'emailExists'],
  // e.g. "لا يوجد حساب مسجل بهذا البريد الإلكتروني. ..." (explicit forgot-password rejection)
  [/لا يوجد حساب مسجل/i, 'emailNotFound'],
  // e.g. "يرجى إدخال اسم كامل، واسم للعيادة، وبريد إلكتروني صحيح، وكلمة مرور 8 أحرف على الأقل."
  [/اسم كامل|وكلمة مرور 8 أحرف/i, 'invalidRegisterDetails'],
  // e.g. login: "البريد الإلكتروني غير مؤكد بعد في سوبابيز. ..." and register:
  // "تم إنشاء الحساب، ولكن يلزم تأكيد البريد الإلكتروني أو تسجيل الدخول يدوياً."
  // Also "تم إنشاء الحساب وإعداد العيادة، يرجى التوجه لصفحة تسجيل الدخول." —
  // that path is an account-created outcome (go sign in), not a failure.
  [/غير مؤكد|تأكيد البريد الإلكتروني|التوجه لصفحة تسجيل الدخول/i, 'confirmEmail'],
  // e.g. "تم إنشاء الحساب، ولكن تعذر إعداد منشأة العيادة تلقائياً. ..."
  [/تعذر إعداد منشأة العيادة/i, 'onboardingFailed'],
  // Legacy English fragments: the recovery, session, and realtime endpoints
  // still answer in English; keep matching them so they never fall through to
  // the generic "تعذر إتمام الطلب مؤقتاً" text.
  [/email or password is incorrect|valid email and password|invalid email or password/i, 'invalidCredentials'],
  [/not assigned to an active clinic/i, 'notAssigned'],
  [/session could not be created/i, 'sessionSetup'],
  [/configuration is unavailable|غير متاحة مؤقت/i, 'authUnavailable'],
  [/rate-?limited/i, 'rateLimited'],
  [/too many attempts/i, 'tooManyAttempts'],
  [/too many recovery requests/i, 'tooManyRecovery'],
  [/recovery email delivery|بريد الاستعادة/i, 'recoveryUnavailable'],
  [/recovery link is invalid or expired|valid recovery link and a password|رابط الاستعادة/i, 'invalidRecoveryLink'],
  [/session has expired|not authenticated|انتهت صلاحية جلستك/i, 'sessionExpired'],
  [/already registered|already exists|user already/i, 'emailExists'],
  [/full name, clinic name, valid email/i, 'invalidRegisterDetails'],
  [/check your email to confirm/i, 'confirmEmail'],
  [/owner profile could not be/i, 'onboardingFailed'],
  [/network|offline|failed to fetch/i, 'networkError'],
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
