import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  MessageSquare,
  Bot,
  Send,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Smartphone,
  PhoneCall,
  Lock,
  ArrowRight,
  KeyRound,
  Unlink,
  CheckCheck,
} from 'lucide-react';
import { usePreferences } from '@/lib/preferences';

interface ChannelStatus {
  connected: boolean;
  phoneNumber?: string;
  phoneNumberId?: string;
  wabaId?: string;
  accessToken?: string;
  verifyToken?: string;
  webhookUrl: string;
  botUsername?: string;
  botToken?: string;
  autoLinked?: boolean;
  pageId?: string;
  pageName?: string;
  accountName?: string;
  verifiedAt?: string | null;
}

interface ChannelsConfig {
  whatsapp: ChannelStatus;
  telegram: ChannelStatus;
  instagram: ChannelStatus;
  messenger: ChannelStatus;
}

export function ChannelConnectionsManager() {
  const { language } = usePreferences();
  const isArabic = language === 'ar';

  const [loading, setLoading] = useState(true);
  const [savingChannel, setSavingChannel] = useState<string | null>(null);
  const [autoLinkingTelegram, setAutoLinkingTelegram] = useState(false);
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);

  // WhatsApp OTP Verification States
  const [waPhone, setWaPhone] = useState('');
  const [waOtp, setWaOtp] = useState('');
  const [waStep, setWaStep] = useState<'phone' | 'otp'>('phone');
  const [sendingWaOtp, setSendingWaOtp] = useState(false);
  const [verifyingWaOtp, setVerifyingWaOtp] = useState(false);
  const [disconnectingWa, setDisconnectingWa] = useState(false);
  const [waDevOtp, setWaDevOtp] = useState<string | null>(null);
  const [showAdvancedWa, setShowAdvancedWa] = useState(false);

  // Manual WhatsApp inputs
  const [waPhoneId, setWaPhoneId] = useState('');
  const [waWabaId, setWaWabaId] = useState('');
  const [waToken, setWaToken] = useState('');

  // Telegram inputs
  const [tgToken, setTgToken] = useState('');
  const [tgUsername, setTgUsername] = useState('');

  // Instagram inputs
  const [igPageId, setIgPageId] = useState('');
  const [igToken, setIgToken] = useState('');

  // Facebook Messenger inputs
  const [fbPageId, setFbPageId] = useState('');
  const [fbToken, setFbToken] = useState('');

  const [config, setConfig] = useState<ChannelsConfig | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLabel(label);
    toast.success(isArabic ? `تم نسخ ${label} بنجاح` : `${label} copied to clipboard`);
    setTimeout(() => setCopiedLabel(null), 2500);
  };

  const loadChannels = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings/channels', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load');
      const data: ChannelsConfig = await res.json();
      setConfig(data);

      setWaPhone(data.whatsapp.phoneNumber || '');
      setWaPhoneId(data.whatsapp.phoneNumberId || '');
      setWaWabaId(data.whatsapp.wabaId || '');
      setWaToken(data.whatsapp.accessToken || '');

      setTgToken(data.telegram.botToken || '');
      setTgUsername(data.telegram.botUsername || '');

      setIgPageId(data.instagram.pageId || '');
      setIgToken(data.instagram.accessToken || '');

      setFbPageId(data.messenger.pageId || '');
      setFbToken(data.messenger.accessToken || '');
    } catch (err) {
      toast.error(isArabic ? 'تعذر تحميل بيانات قنوات التواصل' : 'Could not load channels');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChannels();
  }, []);

  // 1. Request WhatsApp OTP
  const handleRequestWaOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!waPhone.trim() || waPhone.trim().length < 8) {
      toast.error(isArabic ? 'يرجى إدخال رقم هاتف صحيح مع كود الدولة (مثال: +966501234567)' : 'Enter a valid phone number');
      return;
    }

    setSendingWaOtp(true);
    try {
      const res = await fetch('/api/settings/channels/whatsapp/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phoneNumber: waPhone.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send code');

      setWaDevOtp(data.devOtp || null);
      setWaStep('otp');
      toast.success(isArabic ? `تم إرسال كود التحقق إلى ${waPhone} 📲` : 'Verification code sent!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error sending verification code');
    } finally {
      setSendingWaOtp(false);
    }
  };

  // 2. Verify WhatsApp OTP & Auto-Link
  const handleVerifyWaOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waOtp.trim() || waOtp.trim().length !== 6) {
      toast.error(isArabic ? 'يرجى إدخال رمز التحقق المكون من 6 أرقام' : 'Enter 6-digit verification code');
      return;
    }

    setVerifyingWaOtp(true);
    try {
      const res = await fetch('/api/settings/channels/whatsapp/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phoneNumber: waPhone.trim(), code: waOtp.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed');

      toast.success(isArabic ? 'تم التحقق وربط رقم الواتساب بالعيادة تلقائياً بنجاح! 🚀' : 'WhatsApp number linked successfully!');
      setWaOtp('');
      setWaStep('phone');
      setWaDevOtp(null);
      await loadChannels();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Invalid verification code');
    } finally {
      setVerifyingWaOtp(false);
    }
  };

  // 3. Disconnect WhatsApp
  const handleDisconnectWa = async () => {
    if (!confirm(isArabic ? 'هل أنت متأكد من إلغاء ربط رقم الواتساب من العيادة؟' : 'Disconnect WhatsApp number?')) return;
    setDisconnectingWa(true);
    try {
      const res = await fetch('/api/settings/channels/whatsapp/disconnect', {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to disconnect');
      toast.success(isArabic ? 'تم إلغاء ربط الواتساب بنجاح' : 'WhatsApp disconnected');
      setWaStep('phone');
      setWaPhone('');
      await loadChannels();
    } catch (err) {
      toast.error(isArabic ? 'تعذر إلغاء الربط' : 'Failed to disconnect');
    } finally {
      setDisconnectingWa(false);
    }
  };

  const saveChannel = async (channelName: 'whatsapp' | 'telegram' | 'instagram' | 'messenger', payload: Record<string, unknown>) => {
    setSavingChannel(channelName);
    try {
      const res = await fetch(`/api/settings/channels/${channelName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Save failed');
      toast.success(isArabic ? `تم حفظ وربط بيانات ${channelName} بنجاح! 🚀` : `${channelName} credentials saved!`);
      await loadChannels();
    } catch (err) {
      toast.error(isArabic ? 'فشل حفظ بيانات القناة' : 'Failed to save channel credentials');
    } finally {
      setSavingChannel(null);
    }
  };

  const handleAutoLinkTelegram = async () => {
    if (!tgToken.trim()) {
      toast.error(isArabic ? 'يرجى إدخال Bot Token أولاً' : 'Please enter Bot Token first');
      return;
    }
    setAutoLinkingTelegram(true);
    try {
      const res = await fetch('/api/settings/channels/telegram/auto-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ botToken: tgToken, botUsername: tgUsername }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to link');
      toast.success(isArabic ? 'تم ربط بوت التليجرام بالعيادة تلقائياً بنجاح! 🤖' : 'Telegram bot linked successfully!');
      await loadChannels();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to link Telegram');
    } finally {
      setAutoLinkingTelegram(false);
    }
  };

  return (
    <div className="space-y-6" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="border-b border-[#1e3a4d] pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-sky-500/10 border border-sky-500/20 rounded-2xl text-sky-400">
            <MessageSquare className="size-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              {isArabic ? 'ربط قنوات الشات والتواصل المباشر (WhatsApp, Telegram, IG, Messenger)' : 'Live Chat & Messaging Channels'}
            </h3>
            <p className="text-xs text-slate-400">
              {isArabic
                ? 'اربط حسابات عيادتك على وسائل التواصل ليقوم الذكاء الاصطناعي بالرد على المرضى وحجز المواعيد آلياً.'
                : 'Connect your clinic messaging channels for 24/7 AI reception & booking.'}
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <RefreshCw className="size-4 animate-spin text-sky-400" />
          <span>{isArabic ? 'جارٍ تحميل إعدادات القنوات...' : 'Loading channels...'}</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 1. WhatsApp Business API (With Automated OTP Onboarding) */}
          <div className="bg-[#0d2134] border border-[#1e3a4d] rounded-2xl p-6 space-y-5 text-xs relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-xl bg-emerald-500/15 text-emerald-400 font-bold">
                  <Smartphone className="size-5" />
                </span>
                <div>
                  <h4 className="font-bold text-white text-sm">WhatsApp Business</h4>
                  <p className="text-[11px] text-slate-400">{isArabic ? 'واتساب العيادة الرسمي' : 'Official WhatsApp'}</p>
                </div>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                  config?.whatsapp.connected
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {config?.whatsapp.connected ? (isArabic ? 'مربوط ومفعل بالعيادة ✅' : 'Connected') : (isArabic ? 'غير مربوط' : 'Not Connected')}
              </span>
            </div>

            {/* If Already Connected */}
            {config?.whatsapp.connected ? (
              <div className="space-y-4 pt-1">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/25 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 font-semibold">{isArabic ? 'الرقم المربوط حياً:' : 'Active Number:'}</span>
                    <span className="font-mono font-bold text-emerald-300 text-sm" dir="ltr">
                      {config.whatsapp.phoneNumber || waPhone || (isArabic ? 'رقم الواتساب المسجل' : 'Registered Number')}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {isArabic
                      ? 'الرقم متصل بنظام الذكاء الاصطناعي لـ MERUNA ويستقبل رسائل المرضى ويحجز المواعيد آلياً.'
                      : 'Active and connected to Meruna AI reception.'}
                  </p>
                </div>

                {config.whatsapp.webhookUrl && (
                  <div className="bg-[#081624] p-3 rounded-xl border border-[#1e3a4d] space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Webhook URL:</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(config.whatsapp.webhookUrl, 'رابط ويب هوك واتساب')}
                        className="text-sky-400 hover:text-sky-300 flex items-center gap-1 font-semibold"
                      >
                        {copiedLabel === 'رابط ويب هوك واتساب' ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                        <span>{copiedLabel === 'رابط ويب هوك واتساب' ? 'تم النسخ!' : 'نسخ الرابط'}</span>
                      </button>
                    </div>
                    <div className="text-[10px] font-mono text-slate-300 break-all select-all">
                      {config.whatsapp.webhookUrl}
                    </div>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleDisconnectWa}
                    disabled={disconnectingWa}
                    className="px-3.5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 rounded-xl font-semibold transition-colors flex items-center gap-1.5"
                  >
                    {disconnectingWa ? <RefreshCw className="size-3.5 animate-spin" /> : <Unlink className="size-3.5" />}
                    <span>{isArabic ? 'إلغاء ربط الرقم' : 'Disconnect Number'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setWaStep('phone');
                      setShowAdvancedWa(false);
                      toast.info(isArabic ? 'أدخل الرقم الجديد لإرسال كود التحقق' : 'Enter new number');
                    }}
                    className="px-4 py-2 bg-[#0f2a3f] hover:bg-[#183e5c] text-sky-300 rounded-xl font-semibold border border-sky-500/30 transition-all"
                  >
                    {isArabic ? 'تغيير الرقم' : 'Change Number'}
                  </button>
                </div>
              </div>
            ) : (
              /* Automated OTP Verification Wizard */
              <div className="space-y-4">
                {waStep === 'phone' ? (
                  <form onSubmit={handleRequestWaOtp} className="space-y-3.5">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1.5">
                        {isArabic ? 'رقم هاتف واتساب العيادة (مع كود الدولة):' : 'Clinic WhatsApp Phone (with country code):'}
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={waPhone}
                          onChange={(e) => setWaPhone(e.target.value)}
                          placeholder="+966501234567 أو +201012345678"
                          dir="ltr"
                          className="w-full bg-[#081624] border border-[#1e3a4d] rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono text-left"
                        />
                        <Smartphone className="absolute left-3.5 top-3 size-4 text-slate-500" />
                      </div>
                    </div>

                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 text-[11px] leading-5">
                      📲 <strong>الربط الآلي بالتحقق الفوري:</strong> اكتب رقم واتساب العيادة، واضغط "إرسال كود التحقق"، وسيصلك رمز من 6 أرقام لتأكيد وربط الرقم مباشرة بالعيادة!
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setShowAdvancedWa(!showAdvancedWa)}
                        className="text-slate-400 hover:text-sky-300 text-[11px] underline"
                      >
                        {showAdvancedWa
                          ? isArabic ? 'إخفاء الإعدادات اليدوية' : 'Hide manual setup'
                          : isArabic ? 'إعداد يدوي متقدم (Meta Token)' : 'Manual Meta Token Setup'}
                      </button>

                      <button
                        type="submit"
                        disabled={sendingWaOtp || !waPhone.trim()}
                        className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
                      >
                        {sendingWaOtp ? <RefreshCw className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                        <span>{isArabic ? 'إرسال كود التحقق 📲' : 'Send Verification Code'}</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Step 2: Enter 6-digit OTP */
                  <form onSubmit={handleVerifyWaOtp} className="space-y-4">
                    <div className="flex items-center justify-between p-2.5 bg-[#081624] border border-[#1e3a4d] rounded-xl text-xs">
                      <span className="text-slate-400">{isArabic ? 'الرقم المستلم:' : 'Target Phone:'}</span>
                      <span className="font-mono text-emerald-300 font-bold" dir="ltr">{waPhone}</span>
                      <button
                        type="button"
                        onClick={() => setWaStep('phone')}
                        className="text-[11px] text-sky-400 hover:text-sky-300 underline"
                      >
                        {isArabic ? 'تعديل الرقم' : 'Edit'}
                      </button>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1.5">
                        {isArabic ? 'أدخل رمز التحقق (6 أرقام):' : 'Enter 6-Digit Verification Code:'}
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          maxLength={6}
                          value={waOtp}
                          onChange={(e) => setWaOtp(e.target.value.replace(/\D/g, ''))}
                          placeholder="••••••"
                          dir="ltr"
                          autoFocus
                          className="w-full bg-[#081624] border border-[#1e3a4d] rounded-xl px-4 py-3 text-center text-lg font-mono font-bold tracking-[0.5em] text-white focus:outline-none focus:border-emerald-500"
                        />
                        <KeyRound className="absolute left-3.5 top-3.5 size-4 text-slate-500" />
                      </div>
                    </div>

                    {/* Test Code Helper Box */}
                    {waDevOtp && (
                      <div className="p-3 bg-sky-500/10 border border-sky-500/30 rounded-xl text-sky-300 text-[11px] flex items-center justify-between">
                        <span>💡 كود التحقق التجريبي الفوري: <strong className="font-mono font-bold text-white tracking-widest">{waDevOtp}</strong></span>
                        <button
                          type="button"
                          onClick={() => setWaOtp(waDevOtp)}
                          className="px-2 py-1 bg-sky-500/20 hover:bg-sky-500/30 rounded text-[10px] font-bold text-white"
                        >
                          تعبئة تلقائية
                        </button>
                      </div>
                    )}

                    <div className="pt-2 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => handleRequestWaOtp()}
                        disabled={sendingWaOtp}
                        className="text-slate-400 hover:text-sky-300 text-[11px]"
                      >
                        {isArabic ? 'إعادة إرسال الرمز' : 'Resend code'}
                      </button>

                      <button
                        type="submit"
                        disabled={verifyingWaOtp || waOtp.length !== 6}
                        className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
                      >
                        {verifyingWaOtp ? <RefreshCw className="size-3.5 animate-spin" /> : <CheckCheck className="size-3.5" />}
                        <span>{isArabic ? 'تأكيد وربط الرقم بالعيادة 🚀' : 'Verify & Link'}</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* Advanced Manual Meta Form (Collapsible) */}
                {showAdvancedWa && (
                  <div className="mt-4 pt-4 border-t border-[#1e3a4d] space-y-3">
                    <h5 className="font-bold text-slate-300 text-xs">إعداد Meta Cloud API اليدوي:</h5>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-400 text-[11px] mb-1">Phone Number ID:</label>
                        <input
                          type="text"
                          value={waPhoneId}
                          onChange={(e) => setWaPhoneId(e.target.value)}
                          placeholder="102938..."
                          dir="ltr"
                          className="w-full bg-[#081624] border border-[#1e3a4d] rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 text-[11px] mb-1">WABA ID:</label>
                        <input
                          type="text"
                          value={waWabaId}
                          onChange={(e) => setWaWabaId(e.target.value)}
                          placeholder="987654..."
                          dir="ltr"
                          className="w-full bg-[#081624] border border-[#1e3a4d] rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1">System Access Token:</label>
                      <input
                        type="password"
                        value={waToken}
                        onChange={(e) => setWaToken(e.target.value)}
                        placeholder="EAAG..."
                        dir="ltr"
                        className="w-full bg-[#081624] border border-[#1e3a4d] rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() =>
                          saveChannel('whatsapp', {
                            phoneNumber: waPhone,
                            phoneNumberId: waPhoneId,
                            wabaId: waWabaId,
                            accessToken: waToken,
                          })
                        }
                        disabled={savingChannel === 'whatsapp'}
                        className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold"
                      >
                        حفظ البيانات اليدوية
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. Telegram Bot (1-Click Auto Link) */}
          <div className="bg-[#0d2134] border border-[#1e3a4d] rounded-2xl p-6 space-y-5 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-xl bg-sky-500/15 text-sky-400 font-bold">
                  <Send className="size-5" />
                </span>
                <div>
                  <h4 className="font-bold text-white text-sm">Telegram Bot</h4>
                  <p className="text-[11px] text-slate-400">{isArabic ? 'بوت تليجرام المباشر' : 'Telegram Bot API'}</p>
                </div>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                  config?.telegram.connected
                    ? 'bg-sky-500/10 text-sky-300 border-sky-500/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {config?.telegram.connected ? (isArabic ? 'مربوط بنجاح 🤖' : 'Connected') : (isArabic ? 'غير مربوط' : 'Not Connected')}
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Bot Token (من @BotFather):</label>
                <input
                  type="password"
                  value={tgToken}
                  onChange={(e) => setTgToken(e.target.value)}
                  placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ..."
                  dir="ltr"
                  className="w-full bg-[#081624] border border-[#1e3a4d] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">معرف البوت (Username):</label>
                <input
                  type="text"
                  value={tgUsername}
                  onChange={(e) => setTgUsername(e.target.value)}
                  placeholder="@MyClinicDoctorBot"
                  dir="ltr"
                  className="w-full bg-[#081624] border border-[#1e3a4d] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-xl text-sky-300 text-[11px] leading-5">
                💡 <strong>الربط بضغطة زر:</strong> أدخل الـ Token واضغط "ربط تلقائي"، وسيقوم النظام ببرمجة تليجرام وربط البوت بعيادتك آلياً بدون أي إعدادات يدوية!
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() =>
                  saveChannel('telegram', {
                    botToken: tgToken,
                    botUsername: tgUsername,
                  })
                }
                disabled={savingChannel === 'telegram'}
                className="px-3.5 py-2 bg-[#0f2a3f] hover:bg-[#183e5c] text-sky-300 rounded-xl font-semibold transition-all border border-sky-500/30"
              >
                {isArabic ? 'حفظ فقط' : 'Save Only'}
              </button>

              <button
                type="button"
                onClick={handleAutoLinkTelegram}
                disabled={autoLinkingTelegram || !tgToken}
                className="px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-md shadow-sky-500/20"
              >
                {autoLinkingTelegram ? <RefreshCw className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
                <span>{isArabic ? 'ربط تلقائي بالـ Webhook 🚀' : '1-Click Auto Link'}</span>
              </button>
            </div>
          </div>

          {/* 3. Instagram Direct */}
          <div className="bg-[#0d2134] border border-[#1e3a4d] rounded-2xl p-6 space-y-5 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-xl bg-pink-500/15 text-pink-400 font-bold">
                  <Bot className="size-5" />
                </span>
                <div>
                  <h4 className="font-bold text-white text-sm">Instagram Direct</h4>
                  <p className="text-[11px] text-slate-400">{isArabic ? 'رسائل إنستقرام دايركت' : 'Instagram Messenger API'}</p>
                </div>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                  config?.instagram.connected
                    ? 'bg-pink-500/10 text-pink-300 border-pink-500/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {config?.instagram.connected ? (isArabic ? 'مربوط وجاهز 📸' : 'Connected') : (isArabic ? 'غير مربوط' : 'Not Connected')}
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Instagram Business Account ID:</label>
                <input
                  type="text"
                  value={igPageId}
                  onChange={(e) => setIgPageId(e.target.value)}
                  placeholder="17841400000000000"
                  dir="ltr"
                  className="w-full bg-[#081624] border border-[#1e3a4d] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Page Access Token:</label>
                <input
                  type="password"
                  value={igToken}
                  onChange={(e) => setIgToken(e.target.value)}
                  placeholder="EAAG..."
                  dir="ltr"
                  className="w-full bg-[#081624] border border-[#1e3a4d] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              {config?.instagram.webhookUrl && (
                <div className="bg-[#081624] p-3 rounded-xl border border-[#1e3a4d] space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Webhook URL:</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(config.instagram.webhookUrl, 'رابط انستقرام')}
                      className="text-sky-400 hover:text-sky-300 flex items-center gap-1 font-semibold"
                    >
                      {copiedLabel === 'رابط انستقرام' ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                      <span>{copiedLabel === 'رابط انستقرام' ? 'تم النسخ!' : 'نسخ الرابط'}</span>
                    </button>
                  </div>
                  <div className="text-[10px] font-mono text-slate-300 break-all select-all">
                    {config.instagram.webhookUrl}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() =>
                  saveChannel('instagram', {
                    pageId: igPageId,
                    accessToken: igToken,
                  })
                }
                disabled={savingChannel === 'instagram'}
                className="px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                {savingChannel === 'instagram' ? <RefreshCw className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                <span>{isArabic ? 'حفظ وربط إنستقرام' : 'Save Instagram'}</span>
              </button>
            </div>
          </div>

          {/* 4. Facebook Messenger */}
          <div className="bg-[#0d2134] border border-[#1e3a4d] rounded-2xl p-6 space-y-5 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-xl bg-indigo-500/15 text-indigo-400 font-bold">
                  <MessageSquare className="size-5" />
                </span>
                <div>
                  <h4 className="font-bold text-white text-sm">Facebook Messenger</h4>
                  <p className="text-[11px] text-slate-400">{isArabic ? 'صفحة فيسبوك ماسنجر' : 'Facebook Page Messenger'}</p>
                </div>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                  config?.messenger.connected
                    ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {config?.messenger.connected ? (isArabic ? 'مربوط وجاهز 💬' : 'Connected') : (isArabic ? 'غير مربوط' : 'Not Connected')}
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Facebook Page ID:</label>
                <input
                  type="text"
                  value={fbPageId}
                  onChange={(e) => setFbPageId(e.target.value)}
                  placeholder="10001234567890"
                  dir="ltr"
                  className="w-full bg-[#081624] border border-[#1e3a4d] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Page Access Token:</label>
                <input
                  type="password"
                  value={fbToken}
                  onChange={(e) => setFbToken(e.target.value)}
                  placeholder="EAAG..."
                  dir="ltr"
                  className="w-full bg-[#081624] border border-[#1e3a4d] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              {config?.messenger.webhookUrl && (
                <div className="bg-[#081624] p-3 rounded-xl border border-[#1e3a4d] space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Webhook URL:</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(config.messenger.webhookUrl, 'رابط ماسنجر')}
                      className="text-sky-400 hover:text-sky-300 flex items-center gap-1 font-semibold"
                    >
                      {copiedLabel === 'رابط ماسنجر' ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                      <span>{copiedLabel === 'رابط ماسنجر' ? 'تم النسخ!' : 'نسخ الرابط'}</span>
                    </button>
                  </div>
                  <div className="text-[10px] font-mono text-slate-300 break-all select-all">
                    {config.messenger.webhookUrl}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() =>
                  saveChannel('messenger', {
                    pageId: fbPageId,
                    accessToken: fbToken,
                  })
                }
                disabled={savingChannel === 'messenger'}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                {savingChannel === 'messenger' ? <RefreshCw className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                <span>{isArabic ? 'حفظ وربط ماسنجر' : 'Save Messenger'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
