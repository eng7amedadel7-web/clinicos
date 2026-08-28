import { logger } from "./logger";

export type WelcomeKitOptions = {
  clinicName: string;
  ownerEmail: string;
  webhooks: {
    whatsapp: string;
    telegram: string;
    instagram: string;
    messenger: string;
    voice: string;
    voiceAgentPage: string;
  };
  dashboardUrl: string;
};

function buildHtml(opts: WelcomeKitOptions): string {
  const { clinicName, webhooks, dashboardUrl } = opts;

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>مرحباً بك في MERUNA SYSTEM</title>
  <style>
    body { margin: 0; padding: 0; background: #0b1824; font-family: 'Segoe UI', Arial, sans-serif; color: #e2ecf1; direction: rtl; }
    .wrapper { max-width: 640px; margin: 0 auto; padding: 32px 16px; }
    .card { background: #132434; border-radius: 20px; overflow: hidden; border: 1px solid #1e3a4d; }
    .header { background: linear-gradient(135deg, #0f3456 0%, #1a4a6e 100%); padding: 40px 36px; text-align: center; }
    .logo { font-size: 28px; font-weight: 900; color: #fff; letter-spacing: 3px; }
    .logo-sub { font-size: 11px; color: #7dd3fc; font-weight: 600; letter-spacing: 4px; text-transform: uppercase; margin-top: 4px; }
    .body { padding: 36px; }
    h1 { font-size: 22px; font-weight: 800; color: #e2ecf1; margin: 0 0 8px; }
    p { font-size: 15px; color: #8cc3dd; line-height: 1.7; margin: 0 0 20px; }
    .section-title { font-size: 13px; font-weight: 700; color: #7dd3fc; letter-spacing: 1px; text-transform: uppercase; margin: 28px 0 12px; border-bottom: 1px solid #1e3a4d; padding-bottom: 8px; }
    .webhook-item { background: #0d1f2e; border: 1px solid #1e3a4d; border-radius: 10px; padding: 14px 16px; margin-bottom: 10px; }
    .webhook-label { font-size: 12px; font-weight: 700; color: #7dd3fc; margin-bottom: 6px; }
    .webhook-url { font-size: 11px; color: #94a3b8; word-break: break-all; font-family: monospace; background: #081624; padding: 8px 10px; border-radius: 6px; }
    .btn { display: inline-block; background: linear-gradient(135deg, #0369a1, #0284c7); color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 700; font-size: 15px; margin: 20px 0; }
    .footer { padding: 24px 36px; border-top: 1px solid #1e3a4d; text-align: center; }
    .footer p { font-size: 12px; color: #4a6a7e; margin: 0; }
    .badge { display: inline-block; background: #0f3456; color: #7dd3fc; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 20px; margin-bottom: 16px; }
    .channel-icon { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #22c55e; margin-left: 8px; vertical-align: middle; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <div class="logo">MERUNA</div>
        <div class="logo-sub">Clinic System</div>
      </div>
      <div class="body">
        <span class="badge">🎉 تم تفعيل حسابك</span>
        <h1>مرحباً بـ ${clinicName}!</h1>
        <p>تم إعداد عيادتك بالكامل على منصة MERUNA SYSTEM. فيما يلي كل ما تحتاجه لربط قنوات التواصل وبدء العمل فوراً.</p>

        <p style="text-align:center;">
          <a href="${dashboardUrl}" class="btn">→ ادخل إلى لوحة التحكم</a>
        </p>

        <div class="section-title">🔗 Webhook URLs — اربط قنواتك</div>
        <p style="font-size:13px; margin-bottom: 16px;">انسخ الـ URL الخاص بكل قناة وضعه في إعدادات الـ API الخاصة بها.</p>

        <div class="webhook-item">
          <div class="webhook-label"><span class="channel-icon"></span>WhatsApp Business API</div>
          <div class="webhook-url">${webhooks.whatsapp}</div>
        </div>
        <div class="webhook-item">
          <div class="webhook-label"><span class="channel-icon"></span>Telegram Bot Webhook</div>
          <div class="webhook-url">${webhooks.telegram}</div>
        </div>
        <div class="webhook-item">
          <div class="webhook-label"><span class="channel-icon"></span>Instagram DM Webhook</div>
          <div class="webhook-url">${webhooks.instagram}</div>
        </div>
        <div class="webhook-item">
          <div class="webhook-label"><span class="channel-icon"></span>Facebook Messenger Webhook</div>
          <div class="webhook-url">${webhooks.messenger}</div>
        </div>

        <div class="section-title">📞 Voice Agent</div>
        <div class="webhook-item">
          <div class="webhook-label"><span class="channel-icon"></span>صفحة الوكيل الصوتي (للمرضى)</div>
          <div class="webhook-url">${webhooks.voiceAgentPage}</div>
        </div>
        <div class="webhook-item">
          <div class="webhook-label"><span class="channel-icon"></span>Voice Webhook (Twilio Missed Call)</div>
          <div class="webhook-url">${webhooks.voice}</div>
        </div>

        <div class="section-title">✅ الخطوات التالية</div>
        <p style="font-size:14px;">
          1. سجّل الدخول إلى لوحة التحكم واستكمل بيانات العيادة.<br/>
          2. اربط WhatsApp Business عبر Meta Developer Console باستخدام الـ URL أعلاه.<br/>
          3. اربط Telegram عبر BotFather → setWebhook.<br/>
          4. للإنستا والماسنجر: اربط Meta App وأضف الـ webhook URL.<br/>
          5. للـ Voice Agent: ضع الـ URL في إعدادات Twilio (المكالمات الفائتة).
        </p>
      </div>
      <div class="footer">
        <p>MERUNA SYSTEM — منصة إدارة العيادات الذكية</p>
        <p style="margin-top: 6px;">إذا احتجت أي مساعدة، تواصل مع الدعم مباشرةً.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export async function sendWelcomeKit(opts: WelcomeKitOptions): Promise<void> {
  const html = buildHtml(opts);
  const resendKey = process.env.RESEND_API_KEY?.trim();

  if (!resendKey) {
    logger.info({ to: opts.ownerEmail, clinic: opts.clinicName }, "[WelcomeKit] RESEND_API_KEY not set — logging email instead");
    return;
  }

  const fromAddress = process.env.RESEND_FROM_EMAIL?.trim() ?? "onboarding@meruna.com";
  const subject = `🎉 عيادتك جاهزة — MERUNA SYSTEM (${opts.clinicName})`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromAddress,
      to: [opts.ownerEmail],
      subject,
      html,
    }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Resend API error ${response.status}: ${text}`);
  }

  logger.info({ to: opts.ownerEmail, clinic: opts.clinicName }, "[WelcomeKit] Email sent");
}
