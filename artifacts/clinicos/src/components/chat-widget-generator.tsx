import { useState } from 'react';
import { Code, Sparkles, MessageCircle, Copy, Check, ExternalLink, QrCode, Globe, Smartphone, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { usePreferences } from '@/lib/preferences';

export function ChatWidgetGenerator() {
  const { language } = usePreferences();
  const isArabic = language === 'ar';

  const [clinicName, setClinicName] = useState(isArabic ? 'عيادتك' : 'Your Clinic');
  const [welcomeMessage, setWelcomeMessage] = useState(
    isArabic
      ? 'مرحباً بك في عيادتنا! كيف أستطيع مساعدتك اليوم في حجز كشف أو استفسار طبي؟'
      : 'Hello! Welcome to our clinic. How may I assist you with appointment bookings or inquiries today?'
  );
  const [accentColor, setAccentColor] = useState('#22617d');
  const [position, setPosition] = useState<'right' | 'left'>('right');
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  const embedScript = `<script 
  src="https://cdn.meruna.app/widget.v2.js" 
  data-clinic-id="cln_live_849204" 
  data-color="${accentColor}"
  data-position="${position}"
  data-lang="${isArabic ? 'ar' : 'en'}"
  async>
</script>`;

  const handleCopy = () => {
    navigator.clipboard?.writeText(embedScript);
    setCopiedScript(true);
    toast.success(isArabic ? 'تم نسخ كود الودجت بنجاح إلى الحافظة' : 'Widget embed code copied to clipboard');
    setTimeout(() => setCopiedScript(false), 2500);
  };

  return (
    <div className="surface rounded-3xl p-6 md:p-8 space-y-8 animate-rise" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Section Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-border/70 pb-6 md:flex-row md:items-center">
        <div className="flex items-center gap-3.5">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-white shadow-md">
            <Code className="size-6" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-foreground">
              {isArabic ? 'مولّد ودجت الشات وقنوات الربط' : 'Embeddable Web Chat Widget & QR Hub'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isArabic ? 'أضف شات الذكاء الاصطناعي إلى موقع عيادتك الخارجي أو اربط الواتساب مباشرة' : 'Add 24/7 AI chat widget to your clinic website or link WhatsApp'}
            </p>
          </div>
        </div>

        {/* Action badge */}
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          {isArabic ? 'جاهز للتضمين الفوري' : 'Ready to Embed'}
        </span>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Column: Configuration Form (7 cols) */}
        <div className="space-y-5 lg:col-span-7">
          {/* Welcome Greeting */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1.5">
              {isArabic ? 'رسالة الترحيب الافتتاحية للمريض' : 'Welcome Greeting Message'}
            </label>
            <textarea
              rows={2}
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              className="w-full rounded-2xl border border-border bg-background p-3 text-xs text-foreground focus:border-primary outline-hidden"
            />
          </div>

          {/* Color & Position Controls */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                {isArabic ? 'لون الودجت الرئيسي' : 'Primary Color'}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="size-9 rounded-xl border border-border cursor-pointer bg-transparent"
                />
                <span className="font-mono text-xs text-muted-foreground">{accentColor}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                {isArabic ? 'موضع الودجت في الشاشة' : 'Position'}
              </label>
              <div className="flex rounded-xl border border-border bg-muted/30 p-1 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setPosition('right')}
                  className={`flex-1 rounded-lg py-1.5 transition ${
                    position === 'right' ? 'bg-card text-primary shadow-xs' : 'text-muted-foreground'
                  }`}
                >
                  {isArabic ? 'يمين الشاشة' : 'Right'}
                </button>
                <button
                  type="button"
                  onClick={() => setPosition('left')}
                  className={`flex-1 rounded-lg py-1.5 transition ${
                    position === 'left' ? 'bg-card text-primary shadow-xs' : 'text-muted-foreground'
                  }`}
                >
                  {isArabic ? 'يسار الشاشة' : 'Left'}
                </button>
              </div>
            </div>
          </div>

          {/* WhatsApp Direct Option Toggle */}
          <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-card p-4">
            <div className="space-y-0.5">
              <strong className="text-xs font-bold text-foreground">
                {isArabic ? 'إظهار زر التحويل السريع للواتساب' : 'Show Direct WhatsApp Quick Switch'}
              </strong>
              <p className="text-[11px] text-muted-foreground">
                {isArabic ? 'يتيح للمريض إكمال الحجز في الواتساب بضغطة واحدة' : 'Allows patients to switch chat to WhatsApp anytime'}
              </p>
            </div>
            <input
              type="checkbox"
              checked={whatsappEnabled}
              onChange={(e) => setWhatsappEnabled(e.target.checked)}
              className="size-4.5 accent-primary rounded-md cursor-pointer"
            />
          </div>

          {/* Embed Script Box */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-muted-foreground">
              {isArabic ? 'كود التضمين في الموقع (ضع هذا الكود قبل إغلاق </body>)' : 'Embed Code (Paste before </body> tag)'}
            </label>
            <div className="relative rounded-2xl border border-border bg-muted/40 p-4 font-mono text-[11px] text-foreground">
              <pre className="overflow-x-auto whitespace-pre-wrap">{embedScript}</pre>
              <button
                type="button"
                onClick={handleCopy}
                className="absolute top-3 end-3 flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:opacity-90 active:scale-95"
              >
                {copiedScript ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                <span>{copiedScript ? (isArabic ? 'تم النسخ!' : 'Copied!') : (isArabic ? 'نسخ الكود' : 'Copy Code')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Interactive Mockup (5 cols) */}
        <div className="space-y-4 lg:col-span-5">
          <label className="block text-xs font-bold text-muted-foreground">
            {isArabic ? 'معاينة حية لشكل الودجت على موقع العيادة' : 'Live Website Preview'}
          </label>

          {/* Browser Mockup Window */}
          <div className="relative h-96 overflow-hidden rounded-3xl border border-border bg-muted/30 shadow-inner flex flex-col">
            {/* Browser Top Bar */}
            <div className="flex items-center gap-2 border-b border-border/70 bg-card px-4 py-2 text-xs">
              <div className="flex gap-1.5">
                <span className="size-2.5 rounded-full bg-red-400" />
                <span className="size-2.5 rounded-full bg-amber-400" />
                <span className="size-2.5 rounded-full bg-emerald-400" />
              </div>
              <span className="font-mono text-[10px] text-muted-foreground truncate" dir="ltr">
                https://your-clinic.com
              </span>
            </div>

            {/* Mockup Page Content */}
            <div className="flex-1 p-5 space-y-3 opacity-60">
              <div className="h-4 w-32 rounded bg-muted-foreground/30" />
              <div className="h-8 w-48 rounded-lg bg-muted-foreground/40" />
              <div className="h-20 w-full rounded-2xl bg-muted-foreground/20" />
            </div>

            {/* Chat Widget Popover (if open) */}
            {previewOpen && (
              <div
                className={`absolute bottom-16 ${position === 'right' ? 'end-4' : 'start-4'} w-64 rounded-2xl border border-border bg-card p-4 shadow-2xl space-y-3 animate-scale-up z-20`}
              >
                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="flex size-6 items-center justify-center rounded-lg bg-primary text-white text-[10px]">
                      🤖
                    </span>
                    <strong className="text-xs font-bold text-foreground">{clinicName}</strong>
                  </div>
                  <button onClick={() => setPreviewOpen(false)} className="text-muted-foreground text-xs">✕</button>
                </div>
                <p className="text-[11px] leading-relaxed text-muted-foreground">{welcomeMessage}</p>
                <button
                  type="button"
                  style={{ backgroundColor: accentColor }}
                  className="w-full rounded-xl py-2 text-[11px] font-bold text-white shadow-xs"
                >
                  {isArabic ? 'بدء حجز موعد كشف' : 'Book Appointment'}
                </button>
              </div>
            )}

            {/* Floating Launcher Button */}
            <button
              type="button"
              onClick={() => setPreviewOpen(!previewOpen)}
              style={{ backgroundColor: accentColor }}
              className={`absolute bottom-4 ${position === 'right' ? 'end-4' : 'start-4'} flex size-11 items-center justify-center rounded-full text-white shadow-xl transition hover:scale-110`}
              aria-label="Open chat"
            >
              <MessageCircle className="size-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
