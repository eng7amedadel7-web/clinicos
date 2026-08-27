import { useState } from 'react';
import { Bot, Sparkles, Volume2, Mic, Play, Pause, X, Check, Settings2, Globe, MessageSquareText, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { usePreferences } from '@/lib/preferences';

export function VoiceStudioModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { language } = usePreferences();
  const isArabic = language === 'ar';

  const [dialect, setDialect] = useState<'sa' | 'eg' | 'gulf' | 'fusha'>('sa');
  const [tone, setTone] = useState<'friendly' | 'formal' | 'concise'>('friendly');
  const [voiceGender, setVoiceGender] = useState<'female' | 'male'>('female');
  const [speed, setSpeed] = useState(1);
  const [greeting, setGreeting] = useState(
    isArabic
      ? 'أهلاً بك في عياداتنا، معك سارة المساعد الذكي. كيف أقدر أساعدك اليوم في حجز موعدك؟'
      : 'Welcome to our clinic, this is Sarah your AI assistant. How may I help you book your appointment today?'
  );
  const [emergencyKeywords, setEmergencyKeywords] = useState('نزيف حاد، ألم غير محتمل، صعوبة تنفس');
  const [isPlaying, setIsPlaying] = useState(false);

  // Knowledge Base Overrides
  const [faqs, setFaqs] = useState([
    { qAr: 'سعر كشف الأسنان', qEn: 'Dental consultation price', aAr: 'الكشف 150 ريال شامل الفحص المبدئي وخطة العلاج', aEn: '150 SAR including initial exam and treatment plan' },
    { qAr: 'مواقف السيارات', qEn: 'Parking availability', aAr: 'تتوفر مواقف مجانية خاصة للمراجعين في الطابق السفلي', aEn: 'Free underground parking available for patients' },
    { qAr: 'التأمين الطبي', qEn: 'Insurance coverage', aAr: 'نقبل بوبا والتعاونية وميدغلف مع خصم فوري على التحمل', aEn: 'We accept Bupa, Tawuniya, and Medgulf' },
  ]);

  const [newQ, setNewQ] = useState('');
  const [newA, setNewA] = useState('');

  const handleAddFaq = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQ.trim() || !newA.trim()) return;
    setFaqs(prev => [...prev, { qAr: newQ.trim(), qEn: newQ.trim(), aAr: newA.trim(), aEn: newA.trim() }]);
    setNewQ('');
    setNewA('');
    toast.success(isArabic ? 'تمت إضافة المعلومة إلى ذاكرة الوكيل الصوتي' : 'Knowledge item added to voice agent memory');
  };

  const handleTestVoice = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      toast.info(isArabic ? 'محاكاة نطق الصوت' : 'Voice synthesis simulation');
      return;
    }

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(greeting);
    utterance.lang = dialect === 'eg' ? 'ar-EG' : 'ar-SA';
    utterance.rate = speed;
    utterance.pitch = voiceGender === 'female' ? 1.1 : 0.9;

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleSave = () => {
    toast.success(isArabic ? 'تم تحديث إعدادات ونبرة الوكيل الصوتي بنجاح' : 'Voice Agent persona and settings saved');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-primary text-white shadow-md">
              <Bot className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-foreground">
                {isArabic ? 'استوديو تخصيص الوكيل الصوتي' : 'Voice Agent Persona Studio'}
              </h3>
              <p className="text-xs text-muted-foreground">
                {isArabic ? 'تحديد نبرة الصوت، اللهجة، وقاعدة معرفة العيادة' : 'Configure voice tone, dialect, and live knowledge base'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Dialect & Gender */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-2">
                {isArabic ? 'اللهجة المفضلة للعيادة' : 'Clinic Dialect / Accent'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'sa', labelAr: 'سعودية 🇸🇦', labelEn: 'Saudi 🇸🇦' },
                  { id: 'eg', labelAr: 'مصرية 🇪🇬', labelEn: 'Egyptian 🇪🇬' },
                  { id: 'gulf', labelAr: 'خليجية 🇦🇪', labelEn: 'Gulf 🇦🇪' },
                  { id: 'fusha', labelAr: 'فصحى مبسطة 🌍', labelEn: 'Modern Standard 🌍' },
                ].map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDialect(d.id as any)}
                    className={`rounded-xl border p-2.5 text-xs font-bold transition text-center ${
                      dialect === d.id
                        ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/20'
                        : 'border-border bg-background text-muted-foreground hover:border-primary/40'
                    }`}
                  >
                    {isArabic ? d.labelAr : d.labelEn}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-2">
                {isArabic ? 'شخصية ونبرة الرد' : 'Persona & Tone'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'friendly', labelAr: 'ودودة وطمأنينة', labelEn: 'Empathetic' },
                  { id: 'formal', labelAr: 'رسمية واحترافية', labelEn: 'Formal' },
                  { id: 'concise', labelAr: 'سريعة ومختصرة', labelEn: 'Concise' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTone(t.id as any)}
                    className={`rounded-xl border p-2 text-center text-xs font-bold transition ${
                      tone === t.id
                        ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/20'
                        : 'border-border bg-background text-muted-foreground hover:border-primary/40'
                    }`}
                  >
                    {isArabic ? t.labelAr : t.labelEn}
                  </button>
                ))}
              </div>

              {/* Voice Gender */}
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setVoiceGender('female')}
                  className={`flex-1 rounded-xl border py-2 text-xs font-bold transition ${
                    voiceGender === 'female' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'
                  }`}
                >
                  👩 {isArabic ? 'صوت أنثوي (سارة)' : 'Female (Sarah)'}
                </button>
                <button
                  type="button"
                  onClick={() => setVoiceGender('male')}
                  className={`flex-1 rounded-xl border py-2 text-xs font-bold transition ${
                    voiceGender === 'male' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'
                  }`}
                >
                  👨 {isArabic ? 'صوت ذكوري (عمر)' : 'Male (Omar)'}
                </button>
              </div>
            </div>
          </div>

          {/* Opening Greeting */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-muted-foreground">
                {isArabic ? 'رسالة الترحيب الافتتاحية عند بدء المكالمة' : 'Opening Call Greeting'}
              </label>
              <button
                type="button"
                onClick={handleTestVoice}
                className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
              >
                {isPlaying ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
                <span>{isPlaying ? (isArabic ? 'إيقاف النطق' : 'Stop') : (isArabic ? 'استماع تجريبي 🎙️' : 'Test Speech 🎙️')}</span>
              </button>
            </div>
            <textarea
              rows={2}
              value={greeting}
              onChange={(e) => setGreeting(e.target.value)}
              className="w-full rounded-2xl border border-border bg-background p-3 text-xs text-foreground focus:border-primary outline-hidden"
            />
          </div>

          {/* Clinic Knowledge Base Override */}
          <div className="rounded-2xl border border-border/80 bg-muted/20 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                <Sparkles className="size-4 text-primary" />
                <span>{isArabic ? 'قاعدة معرفة العيادة (إجابات الوكيل التلقائية)' : 'Live Knowledge Base'}</span>
              </div>
              <span className="text-[10px] text-muted-foreground">
                {faqs.length} {isArabic ? 'معلومات مدربة' : 'trained facts'}
              </span>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto">
              {faqs.map((item, idx) => (
                <div key={idx} className="flex items-start justify-between rounded-xl bg-card border border-border/60 p-2.5 text-xs">
                  <div className="space-y-0.5">
                    <strong className="block text-foreground font-semibold">❓ {isArabic ? item.qAr : item.qEn}</strong>
                    <p className="text-muted-foreground text-[11px]">💬 {isArabic ? item.aAr : item.aEn}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFaqs(prev => prev.filter((_, i) => i !== idx))}
                    className="text-muted-foreground hover:text-red-500 text-xs px-1"
                    title={isArabic ? 'حذف' : 'Delete'}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {/* Quick Add FAQ */}
            <form onSubmit={handleAddFaq} className="flex gap-2 pt-2 border-t border-border/60">
              <input
                value={newQ}
                onChange={(e) => setNewQ(e.target.value)}
                placeholder={isArabic ? 'السؤال (مثلاً: أوقات دوام الجمعة)' : 'Question (e.g. Friday hours)'}
                className="flex-1 rounded-xl border border-border bg-background px-3 py-1.5 text-xs outline-hidden focus:border-primary"
              />
              <input
                value={newA}
                onChange={(e) => setNewA(e.target.value)}
                placeholder={isArabic ? 'الإجابة الدقيقة' : 'Exact answer'}
                className="flex-1 rounded-xl border border-border bg-background px-3 py-1.5 text-xs outline-hidden focus:border-primary"
              />
              <button
                type="submit"
                className="rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:opacity-90 shrink-0"
              >
                + {isArabic ? 'إضافة' : 'Add'}
              </button>
            </form>
          </div>

          {/* Emergency Escalation Trigger */}
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
              <ShieldAlert className="size-4" />
              <span>{isArabic ? 'كلمات التحويل الفوري للطوارئ أو الموظف البشري' : 'Emergency & Handoff Trigger Keywords'}</span>
            </div>
            <input
              value={emergencyKeywords}
              onChange={(e) => setEmergencyKeywords(e.target.value)}
              className="w-full rounded-xl border border-amber-500/30 bg-background px-3 py-2 text-xs text-foreground outline-hidden focus:border-amber-500"
            />
            <p className="text-[10px] text-muted-foreground">
              {isArabic ? 'عند نطق المريض لأي من هذه العبارات، يتم تحويل المكالمة فوراً لمكتب الاستقبال مع تنبيه عاجل.' : 'When patient mentions these terms, the call is immediately transferred to front desk with urgent priority.'}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-border p-5 bg-card">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border px-4 py-2.5 text-xs font-bold text-muted-foreground hover:bg-muted"
          >
            {isArabic ? 'إلغاء' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-md hover:opacity-90"
          >
            <Check className="size-4" />
            <span>{isArabic ? 'حفظ وتطبيق على الوكيل الصوتي' : 'Save Voice Persona'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
