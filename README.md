# ClinicOS — MERUNA

منصة SaaS عربية-أولاً لإدارة وتشغيل العيادات: مواعيد، مرضى، صندوق وارد موحّد للقنوات (واتساب / تليجرام / إنستاجرام / مسنجر)، استقبال ذكي بالذكاء الاصطناعي، وكيل صوتي، قوائم انتظار، متابعة عدم الحضور، فوترة، وتعدد فروع — كل ذلك من لوحة واحدة.

An Arabic-first clinic operations SaaS: appointments, patients, a unified multi-channel inbox (WhatsApp / Telegram / Instagram / Messenger), AI reception, voice agent, waitlists, no-show recovery, billing, and multi-branch support — from a single workspace.

---

## المزايا الرئيسية

- **لوحة تحكم حية** بمؤشرات اليوم: المواعيد، المحادثات، المتابعات، وعدم الحضور.
- **Inbox موحّد** لأربع قنوات مع تبديل AI/Human يدوي، ملاحظات داخلية، وتأجيل محادثات.
- **استقبال ذكي (AI Reception)** ووكيل صوتي مع سجل مكالمات.
- **Patient 360**: ملف المريض، مواعيده، محادثاته، وحالات المتابعة في شاشة واحدة.
- **قوائم انتظار وروابط طابور عامة** للمرضى (`/queue/:token`).
- **تعدد فروع** مع إدارة كاملة من الإعدادات وصلاحيات على مستوى العيادة.
- **فوترة Paddle** بخطط (Starter / Growth / Pro) ودورة تجريبية.
- **لوحة Super-Admin** لتجهيز العيادات الجديدة بنقرة واحدة (webhooks + بريد ترحيبي).
- **استيراد ذكي** للبيانات (Excel/CSV) مباشرة إلى Supabase.
- **تكاملات**: REST API عام بمفاتيح، Webhooks صادرة (Zapier/Make)، وMarketing Pixels.

## البنية التقنية

| الطبقة | التقنية |
|---|---|
| الواجهة | React 19، Vite 7، Tailwind CSS 4، wouter، TanStack Query، Radix UI — RTL عربي/إنجليزي |
| الخادم | Express 5، TypeScript، Zod، helmet، express-rate-limit، pino |
| قاعدة البيانات | Supabase (Postgres) — RLS + دوال RPC للصلاحيات، Drizzle ORM |
| عقود API | OpenAPI (`lib/api-spec`) → Orval → React hooks (`lib/api-client-react`) + مخططات Zod (`lib/api-zod`) |
| النشر | Vercel (واجهة ثابتة + دالة Serverless واحدة للـ API) |

## بنية المستودع

```
clinicos/
├── artifacts/
│   ├── clinicos/        # واجهة React (التطبيق الرئيسي)
│   ├── api-server/      # خادم Express 5
│   └── mockup-sandbox/  # بيئة تجربة تصاميم (تطوير فقط)
├── lib/
│   ├── api-spec/        # مواصفة OpenAPI + إعداد Orval
│   ├── api-client-react/# Hooks مولّدة من العقد
│   ├── api-zod/         # مخططات Zod مولّدة من العقد
│   └── db/              # Drizzle ORM + اتصال Postgres
├── supabase/migrations/ # هجرات SQL (RLS، دوال، جداول)
├── api/index.mjs        # نقطة دخول Vercel Serverless للـ API
└── scripts/             # سكربتات مساعدة
```

## البدء محليًا

**المتطلبات:** Node.js 24+ و pnpm 11+

```bash
pnpm install
cp .env.example .env   # املأ القيم المطلوبة (DATABASE_URL و Supabase على الأقل)
```

تشغيل الخادم (منفذ 5000):

```bash
pnpm --filter @workspace/api-server run dev
```

تشغيل الواجهة (منفذ 5173، مع proxy إلى الخادم):

```bash
pnpm --filter @workspace/clinicos run dev
```

## الأوامر

| الأمر | الوصف |
|---|---|
| `pnpm run typecheck` | فحص الأنواع لكل الحزم |
| `pnpm run build` | فحص الأنواع + بناء كل الحزم |
| `pnpm run build:vercel` | بناء الخادم والواجهة لهدف Vercel |
| `pnpm --filter @workspace/api-server run test` | تشغيل اختبارات الخادم (Vitest) |
| `pnpm --filter @workspace/api-spec run codegen` | توليد hooks و Zod من مواصفة OpenAPI |
| `pnpm --filter @workspace/db run push` | دفع تغييرات مخطط Drizzle (تطوير فقط) |

## عقود API

مصدر الحقيقة للعقود هو مواصفة OpenAPI في `lib/api-spec`. بعد أي تعديل على المواصفة شغّل:

```bash
pnpm --filter @workspace/api-spec run codegen
```

سيولّد ذلك مخططات Zod (`lib/api-zod`) وخطافات React Query (`lib/api-client-react`) تلقائيًا — لا تعدّل الملفات المولّدة يدويًا.

## قاعدة البيانات والهجرات

- الهجرات في `supabase/migrations/` وترتّب زمنيًا بالاسم؛ طبّقها عبر Supabase CLI أو SQL Editor.
- الصلاحيات تُفرض على مستويين: RLS داخل Postgres + فحص `fn_has_clinic_permission` في مسارات الخادم.
- Realtime مفعّل على جداول التشغيل الأساسية (انظر هجرة `enable_system_wide_realtime`).

## النشر

- **Vercel**: الأمر `pnpm run build:vercel` يبني الواجهة إلى `artifacts/clinicos/dist/public` والخادم إلى دالة واحدة عبر `api/index.mjs` (انظر `vercel.json`). حدّد متغيرات البيئة من `.env.example` في إعدادات المشروع.
- **Supabase**: طبّق الهجرات، وفعّل مزوّد البريد/الجلسات، واضبط أسرار القنوات.

## الأمان

- لا تُخزَّن أي أسرار في الكود؛ كل الأسرار عبر متغيرات بيئة (راجع `.env.example`).
- الخادم يستخدم helmet و rate-limiting وتحقق Zod على الحدود، وجلسات موقّعة عبر `SESSION_SECRET`.
- ويبهوكات القنوات الخارجية تُتحقق بتوقيع HMAC (WasapFlow) أو سر مشترك (`INBOX_INBOUND_SECRET`).
- لاحظت ثغرة أو سرًا مسربًا؟ دوّر المفتاح فورًا ثم افتح Issue.

## المساهمة

1. أنشئ فرعًا من `main` بصيغة `feat/...` أو `fix/...`.
2. تأكد محليًا من: `pnpm run typecheck` ثم `pnpm --filter @workspace/api-server run test` ثم `pnpm run build:vercel`.
3. افتح PR — سيفحص CI نفس الخطوات تلقائيًا (انظر `.github/workflows/ci.yml`).

## الترخيص

MIT — انظر [LICENSE](LICENSE).
