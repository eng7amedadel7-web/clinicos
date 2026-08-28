import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Key,
  Webhook,
  BarChart3,
  Code2,
  Copy,
  Check,
  RefreshCw,
  Send,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Globe,
  Layers,
  HelpCircle,
  Zap,
} from 'lucide-react';
import { usePreferences } from '@/lib/preferences';
import { ChatWidgetGenerator } from '@/components/chat-widget-generator';

export function IntegrationsHub() {
  const { language } = usePreferences();
  const isArabic = language === 'ar';

  const [activeSubTab, setActiveSubTab] = useState<'api' | 'webhooks' | 'marketing' | 'widgets'>('api');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [testingWebhook, setTestingWebhook] = useState<boolean>(false);

  // Configuration State
  const [apiKey, setApiKey] = useState<string>('');
  const [externalWebhookUrl, setExternalWebhookUrl] = useState<string>('');
  const [webhookEvents, setWebhookEvents] = useState<string[]>(['appointment.booked', 'patient.created', 'call.completed']);
  const [metaPixelId, setMetaPixelId] = useState<string>('');
  const [gtmId, setGtmId] = useState<string>('');
  const [tiktokPixelId, setTiktokPixelId] = useState<string>('');

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    toast.success(isArabic ? `تم نسخ ${label} بنجاح` : `${label} copied to clipboard`);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const loadConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/integrations/config', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setApiKey(data.apiKey || '');
      setExternalWebhookUrl(data.externalWebhookUrl || '');
      setWebhookEvents(data.webhookEvents || ['appointment.booked', 'patient.created']);
      setMetaPixelId(data.metaPixelId || '');
      setGtmId(data.gtmId || '');
      setTiktokPixelId(data.tiktokPixelId || '');
    } catch (err) {
      toast.error(isArabic ? 'تعذر تحميل إعدادات التكامل' : 'Could not load integrations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleSaveConfig = async (regenerate = false) => {
    setSaving(true);
    try {
      const res = await fetch('/api/integrations/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          externalWebhookUrl,
          webhookEvents,
          metaPixelId,
          gtmId,
          tiktokPixelId,
          regenerateKey: regenerate,
        }),
      });

      if (!res.ok) throw new Error('Save failed');
      const data = await res.json();
      if (data.integrations?.apiKey) {
        setApiKey(data.integrations.apiKey);
      }
      toast.success(isArabic ? 'تم حفظ إعدادات التكامل والربط بنجاح! 🚀' : 'Integrations saved successfully!');
    } catch (err) {
      toast.error(isArabic ? 'فشل حفظ الإعدادات' : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestWebhook = async () => {
    if (!externalWebhookUrl) {
      toast.error(isArabic ? 'يرجى إدخال رابط الويب هوك أولاً' : 'Please enter a webhook URL first');
      return;
    }
    setTestingWebhook(true);
    try {
      const res = await fetch('/api/integrations/test-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ webhookUrl: externalWebhookUrl }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(isArabic ? 'تم إرسال إشعار الاختبار واستجاب سيرفرك بنجاح! ✅' : 'Test webhook delivered successfully!');
      } else {
        toast.error(data.error || (isArabic ? 'فشل الاتصال برابط الويب هوك' : 'Webhook test failed'));
      }
    } catch (err) {
      toast.error(isArabic ? 'تعذر الاتصال بالرابط المحدد' : 'Could not reach webhook URL');
    } finally {
      setTestingWebhook(false);
    }
  };

  const origin = window.location.origin;

  const curlPatientExample = `curl -X POST "${origin}/api/v1/external/patients" \\
  -H "Content-Type: application/json" \\
  -H "x-clinic-api-key: ${apiKey || 'YOUR_API_KEY'}" \\
  -d '{
    "name": "مريض جديد",
    "phone": "+966501234567",
    "email": "patient@example.com",
    "source": "Landing Page / CRM"
  }'`;

  return (
    <div className="space-y-6" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Sub-Tabs Selector */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-[#081624] border border-[#1e3a4d] rounded-2xl">
        <button
          type="button"
          onClick={() => setActiveSubTab('api')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'api'
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Key className="size-4 text-sky-400" />
          <span>{isArabic ? 'مفاتيح الربط (Open REST API)' : 'Open REST API & Keys'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('webhooks')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'webhooks'
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Webhook className="size-4 text-indigo-400" />
          <span>{isArabic ? 'إرسال الأحداث (Zapier / Make Webhooks)' : 'Outbound Webhooks'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('marketing')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'marketing'
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="size-4 text-emerald-400" />
          <span>{isArabic ? 'بكسلات التسويق (Meta & Google Pixels)' : 'Marketing Pixels'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('widgets')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'widgets'
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Code2 className="size-4 text-pink-400" />
          <span>{isArabic ? 'تضمين الشات في موقعك (Embeddable Widgets)' : 'Web Chat & Widgets'}</span>
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <RefreshCw className="size-4 animate-spin" />
          <span>{isArabic ? 'جارٍ تحميل أدوات التكامل...' : 'Loading integrations...'}</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* TAB 1: Open REST API */}
          {activeSubTab === 'api' && (
            <div className="bg-[#0d2134] border border-[#1e3a4d] rounded-2xl p-6 space-y-6 text-xs animate-in fade-in duration-200">
              <div>
                <h4 className="text-sm font-bold text-white mb-1">
                  {isArabic ? 'مفتاح الـ API الخاص بعيادتك (Clinic Secret Key)' : 'Clinic API Key'}
                </h4>
                <p className="text-slate-400 text-[11px]">
                  {isArabic
                    ? 'استخدم هذا المفتاح لربط نظام العيادة القديم أو صفحات الهبوط لإرسال المرضى والمواعيد إلى MERUNA آلياً.'
                    : 'Authenticate your CRM, landing pages, or legacy EHR to sync patients and appointments.'}
                </p>
              </div>

              {/* API Key Box */}
              <div className="bg-[#081624] border border-[#1e3a4d] rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3 w-full overflow-hidden">
                  <Key className="size-5 text-sky-400 shrink-0" />
                  <code className="text-slate-200 font-mono text-xs truncate select-all">{apiKey}</code>
                </div>
                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(apiKey, 'مفتاح API')}
                    className="px-3 py-1.5 bg-[#0f2a3f] hover:bg-[#183e5c] border border-sky-500/30 text-sky-300 rounded-lg font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    {copiedKey === 'مفتاح API' ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                    <span>{copiedKey === 'مفتاح API' ? 'تم النسخ!' : 'نسخ المفتاح'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(isArabic ? 'هل تريد إعادة توليد المفتاح؟ المفتاح القديم سيتوقف.' : 'Regenerate API key?')) {
                        handleSaveConfig(true);
                      }
                    }}
                    className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
                    title="إعادة توليد المفتاح"
                  >
                    <RefreshCw className="size-4" />
                  </button>
                </div>
              </div>

              {/* Endpoints Documentation */}
              <div className="space-y-4 pt-2">
                <div className="font-bold text-slate-300 text-xs">
                  {isArabic ? 'نقاط النهاية المتاحة (REST API Endpoints):' : 'Available Endpoints:'}
                </div>

                {/* Patient Ingest */}
                <div className="bg-[#081624] border border-[#1e3a4d] rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-emerald-400">POST /api/v1/external/patients</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(curlPatientExample, 'مثال cURL')}
                      className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1"
                    >
                      <Copy className="size-3" />
                      <span>{copiedKey === 'مثال cURL' ? 'تم النسخ!' : 'نسخ مثال cURL'}</span>
                    </button>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    {isArabic
                      ? 'إرسال ليد أو مريض جديد من أي موقع خارجي أو نظام تسويق ليظهر في جدول المرضى فوراً.'
                      : 'Create a new patient or lead from external landing pages or CRM.'}
                  </p>
                </div>

                {/* Appointment Ingest */}
                <div className="bg-[#081624] border border-[#1e3a4d] rounded-xl p-4 space-y-2">
                  <span className="font-mono font-bold text-sky-400">POST /api/v1/external/appointments</span>
                  <p className="text-slate-400 text-[11px]">
                    {isArabic
                      ? 'حجز موعد من نظام العيادة القديم وتوجيهه مباشرة لتقويم MERUNA وسوبابيز.'
                      : 'Push appointment bookings directly into MERUNA calendar from legacy systems.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Outbound Webhooks (Zapier & Make) */}
          {activeSubTab === 'webhooks' && (
            <div className="bg-[#0d2134] border border-[#1e3a4d] rounded-2xl p-6 space-y-5 text-xs animate-in fade-in duration-200">
              <div>
                <h4 className="text-sm font-bold text-white mb-1">
                  {isArabic ? 'إرسال الأحداث إلى نظامك القديم (Outbound Webhooks)' : 'Outbound Event Webhooks'}
                </h4>
                <p className="text-slate-400 text-[11px]">
                  {isArabic
                    ? 'ضع رابط الـ Webhook الخاص بنظامك (مثل Zapier أو Make.com أو سيرفر العيادة الخاص) لاستقبال الإشعارات فوراً عند أي حجز أو مكالمة.'
                    : 'Stream live events from MERUNA to your existing CRM, Zapier, or Make.com scenario.'}
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  {isArabic ? 'رابط الويب هوك الخاص بنظامك (Webhook Endpoint URL):' : 'Webhook URL:'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={externalWebhookUrl}
                    onChange={(e) => setExternalWebhookUrl(e.target.value)}
                    placeholder="https://hooks.zapier.com/hooks/catch/..."
                    className="w-full bg-[#081624] border border-[#1e3a4d] rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleTestWebhook}
                    disabled={testingWebhook || !externalWebhookUrl}
                    className="px-4 py-2.5 bg-[#0f2a3f] hover:bg-[#183e5c] border border-sky-500/30 text-sky-300 rounded-xl font-bold flex items-center gap-1.5 transition-colors shrink-0 disabled:opacity-40"
                  >
                    {testingWebhook ? <RefreshCw className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                    <span>{isArabic ? 'إرسال اختبار' : 'Test Ping'}</span>
                  </button>
                </div>
              </div>

              {/* Events checkboxes */}
              <div>
                <label className="block font-semibold text-slate-300 mb-2">
                  {isArabic ? 'الأحداث المراد إرسالها لنظامك:' : 'Events to forward:'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'appointment.booked', labelAr: 'حجز موعد جديد', labelEn: 'New Appointment Booked' },
                    { id: 'patient.created', labelAr: 'تسجيل مريض جديد', labelEn: 'New Patient Registered' },
                    { id: 'call.completed', labelAr: 'اكتمال مكالمة الوكيل الصوتي', labelEn: 'Voice Call Completed' },
                  ].map((evt) => (
                    <label
                      key={evt.id}
                      className="flex items-center gap-2.5 p-3 bg-[#081624] border border-[#1e3a4d] rounded-xl cursor-pointer select-none"
                    >
                      <input
                        type="checkbox"
                        checked={webhookEvents.includes(evt.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setWebhookEvents([...webhookEvents, evt.id]);
                          } else {
                            setWebhookEvents(webhookEvents.filter((x) => x !== evt.id));
                          }
                        }}
                        className="rounded border-slate-700 text-sky-500 focus:ring-sky-500"
                      />
                      <span className="text-slate-300 text-xs">{isArabic ? evt.labelAr : evt.labelEn}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleSaveConfig(false)}
                  disabled={saving}
                  className="px-5 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white rounded-xl font-bold transition-all shadow-md shadow-sky-500/20 disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? <RefreshCw className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                  <span>{isArabic ? 'حفظ إعدادات الويب هوك' : 'Save Webhook Settings'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Marketing Pixels */}
          {activeSubTab === 'marketing' && (
            <div className="bg-[#0d2134] border border-[#1e3a4d] rounded-2xl p-6 space-y-5 text-xs animate-in fade-in duration-200">
              <div>
                <h4 className="text-sm font-bold text-white mb-1">
                  {isArabic ? 'تتبع الحملات الإعلانية (Marketing Pixels & Analytics)' : 'Marketing Pixels & Conversion Tracking'}
                </h4>
                <p className="text-slate-400 text-[11px]">
                  {isArabic
                    ? 'أدخل معرّفات البكسل الخاصة بحملاتك الإعلانية لإطلاق أحداث التحويل وحجز المواعيد تلقائياً لقياس العائد على الإنفاق الإعلاني (ROAS).'
                    : 'Track leads and booked appointments directly in your Meta Ads, Google Analytics, or TikTok campaigns.'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">Meta Pixel ID (Facebook / Instagram)</label>
                  <input
                    type="text"
                    value={metaPixelId}
                    onChange={(e) => setMetaPixelId(e.target.value)}
                    placeholder="مثال: 123456789012345"
                    className="w-full bg-[#081624] border border-[#1e3a4d] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">Google Tag Manager / GA4 ID</label>
                  <input
                    type="text"
                    value={gtmId}
                    onChange={(e) => setGtmId(e.target.value)}
                    placeholder="مثال: GTM-XXXXXXX أو G-XXXXXXX"
                    className="w-full bg-[#081624] border border-[#1e3a4d] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">TikTok Pixel ID</label>
                  <input
                    type="text"
                    value={tiktokPixelId}
                    onChange={(e) => setTiktokPixelId(e.target.value)}
                    placeholder="مثال: C1234567890"
                    className="w-full bg-[#081624] border border-[#1e3a4d] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 text-[11px] flex items-center gap-2">
                <ShieldCheck className="size-4 shrink-0" />
                <span>
                  {isArabic
                    ? 'يتم إطلاق أحداث Lead و Schedule تلقائياً بمجرد حجز المريض أو تواصله مع العيادة.'
                    : 'Standard events (Lead & Schedule) trigger automatically across all widgets.'}
                </span>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleSaveConfig(false)}
                  disabled={saving}
                  className="px-5 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white rounded-xl font-bold transition-all shadow-md shadow-sky-500/20 disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? <RefreshCw className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                  <span>{isArabic ? 'حفظ بكسلات التتبع' : 'Save Marketing Pixels'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: Embeddable Widgets */}
          {activeSubTab === 'widgets' && (
            <div className="animate-in fade-in duration-200">
              <ChatWidgetGenerator />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
