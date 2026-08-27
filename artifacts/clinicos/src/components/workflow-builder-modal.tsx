import { useState } from 'react';
import { Workflow, Sparkles, Clock, Check, X, Send, Bell, Star, AlertCircle, ArrowRight, MessageSquare, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast } from 'sonner';
import { usePreferences } from '@/lib/preferences';

interface WorkflowRule {
  id: string;
  titleAr: string;
  titleEn: string;
  triggerAr: string;
  triggerEn: string;
  timingAr: string;
  timingEn: string;
  enabled: boolean;
  channel: 'whatsapp' | 'sms';
  templateAr: string;
  templateEn: string;
  icon: typeof Clock;
  badgeColor: string;
}

const defaultWorkflows: WorkflowRule[] = [
  {
    id: 'reminder-24h',
    titleAr: 'تذكير ذكي قبل الموعد بـ 24 ساعة',
    titleEn: '24h Pre-Appointment Interactive Reminder',
    triggerAr: 'عند اقتراب موعد المريض بـ 24 ساعة',
    triggerEn: '24 hours before scheduled appointment',
    timingAr: 'قبل 24 ساعة',
    timingEn: '24h before',
    enabled: true,
    channel: 'whatsapp',
    templateAr: 'مرحباً {{patient_name}}، نود تذكيرك بموعد كشفك غداً الساعة {{appointment_time}} لدى {{doctor_name}}. للتأكيد أرسل "1" أو لتعديل الموعد أرسل "2".',
    templateEn: 'Hello {{patient_name}}, reminder of your visit tomorrow at {{appointment_time}} with {{doctor_name}}. Reply "1" to confirm or "2" to reschedule.',
    icon: Clock,
    badgeColor: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30'
  },
  {
    id: 'no-show-recovery',
    titleAr: 'استعادة الغائبين التلقائية بعد فوات الموعد',
    titleEn: 'Instant No-Show Auto-Recovery',
    triggerAr: 'إذا لم يحضر المريض بعد 30 دقيقة من موعده',
    triggerEn: '30 mins after missed appointment slot',
    timingAr: 'بعد 30 دقيقة',
    timingEn: '30m post',
    enabled: true,
    channel: 'whatsapp',
    templateAr: 'مرحباً {{patient_name}}، افتقدناك اليوم في العيادة! نتمنى أن تكون بخير. هل ترغب في اختيار موعد بديل غداً؟ اضغط هنا لحجز موعدك البديل بنقرة واحدة.',
    templateEn: 'Hi {{patient_name}}, we missed you today! Hope all is well. Would you like to pick an alternate slot tomorrow with 1-click?',
    icon: AlertCircle,
    badgeColor: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30'
  },
  {
    id: 'post-visit-review',
    titleAr: 'متابعة ما بعد الزيارة وطلب تقييم Google',
    titleEn: 'Post-Visit Care & Google Review Request',
    triggerAr: 'بعد ساعتين من اكتمال الكشف بنجاح',
    triggerEn: '2 hours after marked as Completed',
    timingAr: 'بعد ساعتين',
    timingEn: '2h post',
    enabled: true,
    channel: 'whatsapp',
    templateAr: 'سعدنا بخدمتك اليوم د. {{patient_name}}! نتمنى لك دوام الصحة. إذا نالت زيارتك رضاك، يسعدنا مشاركة تقييمك للعيادة على Google عبر الرابط التالي: {{review_link}}',
    templateEn: 'It was a pleasure caring for you today {{patient_name}}! If you enjoyed your visit, please leave us a brief Google review: {{review_link}}',
    icon: Star,
    badgeColor: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
  },
  {
    id: 'post-procedure-instructions',
    titleAr: 'إرسال تعليمات ما بعد الجراحة أو التبييض',
    titleEn: 'Post-Procedure Care Instructions',
    triggerAr: 'عند تحديد نوع الخدمة (جراحة / تبييض / حشو عصب)',
    triggerEn: 'Upon completing specialized clinical procedure',
    timingAr: 'فوري',
    timingEn: 'Instant',
    enabled: false,
    channel: 'whatsapp',
    templateAr: 'تعليمات ما بعد العلاج: 1) تجنب المشروبات الساخنة لمدة ساعتين. 2) الالتزام بالأدوية الموصوفة. في حال وجود أي استفسار فريقنا في خدمتك 24/7.',
    templateEn: 'Post-procedure instructions: 1) Avoid hot drinks for 2 hours. 2) Take prescribed medications on time. We are here 24/7 for questions.',
    icon: MessageSquare,
    badgeColor: 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/30'
  }
];

export function WorkflowBuilderModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { language } = usePreferences();
  const isArabic = language === 'ar';

  const [workflows, setWorkflows] = useState<WorkflowRule[]>(defaultWorkflows);
  const [selectedId, setSelectedId] = useState<string>('reminder-24h');

  const selectedRule = workflows.find(w => w.id === selectedId) || workflows[0];

  const handleToggle = (id: string) => {
    setWorkflows(prev =>
      prev.map(w => {
        if (w.id === id) {
          const next = !w.enabled;
          toast.success(next ? (isArabic ? 'تم تفعيل مسار الأتمتة' : 'Workflow activated') : (isArabic ? 'تم إيقاف مسار الأتمتة' : 'Workflow paused'));
          return { ...w, enabled: next };
        }
        return w;
      })
    );
  };

  const handleUpdateTemplate = (text: string) => {
    setWorkflows(prev =>
      prev.map(w => (w.id === selectedId ? { ...w, [isArabic ? 'templateAr' : 'templateEn']: text } : w))
    );
  };

  const handleSave = () => {
    toast.success(isArabic ? 'تم حفظ كافة تدفقات الأتمتة وتحديث جداول الرسائل' : 'Automated workflow triggers saved');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in" dir="rtl">
      <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-primary text-white shadow-md">
              <Workflow className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-foreground">
                {isArabic ? 'أتمتة تدفقات المتابعة والواتساب (Clinic Automation Triggers)' : 'Automated Follow-Up Workflows'}
              </h3>
              <p className="text-xs text-muted-foreground">
                {isArabic ? 'إرسال رسائل التذكير، استعادة الغائبين، وطلب التقييمات تلقائياً' : 'Configure automated reminders, no-show recovery, and reviews'}
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

        {/* Content Body: Sidebar + Editor */}
        <div className="grid flex-1 overflow-hidden md:grid-cols-[.45fr_.55fr]">
          {/* Rules List */}
          <div className="overflow-y-auto border-b md:border-b-0 md:border-e border-border/80 p-4 space-y-2.5 bg-muted/20">
            {workflows.map((rule) => {
              const Icon = rule.icon;
              const isSelected = rule.id === selectedId;
              return (
                <div
                  key={rule.id}
                  onClick={() => setSelectedId(rule.id)}
                  className={`cursor-pointer rounded-2xl border p-3.5 transition ${
                    isSelected
                      ? 'border-primary bg-card shadow-md ring-2 ring-primary/20'
                      : 'border-border/60 bg-card/60 hover:bg-card'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className={`flex size-8 shrink-0 items-center justify-center rounded-xl border ${rule.badgeColor}`}>
                        <Icon className="size-4" />
                      </span>
                      <strong className="text-xs font-bold text-foreground">
                        {isArabic ? rule.titleAr : rule.titleEn}
                      </strong>
                    </div>
                    {/* Toggle Switch */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggle(rule.id);
                      }}
                      className="text-primary hover:opacity-80"
                      title={rule.enabled ? (isArabic ? 'إيقاف' : 'Disable') : (isArabic ? 'تفعيل' : 'Enable')}
                    >
                      {rule.enabled ? (
                        <ToggleRight className="size-6 text-primary" />
                      ) : (
                        <ToggleLeft className="size-6 text-muted-foreground" />
                      )}
                    </button>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>⏱️ {isArabic ? rule.timingAr : rule.timingEn}</span>
                    <span className={`font-bold ${rule.enabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                      {rule.enabled ? (isArabic ? '● نشط تلقائياً' : '● Active') : (isArabic ? '○ متوقف' : '○ Paused')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Rule Detail & Template Editor */}
          <div className="flex flex-col justify-between overflow-y-auto p-5 space-y-4">
            <div className="space-y-4">
              <div>
                <span className="inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary mb-1">
                  {isArabic ? 'شرط الإطلاق (Trigger)' : 'Trigger Condition'}
                </span>
                <h4 className="text-sm font-extrabold text-foreground">
                  {isArabic ? selectedRule.triggerAr : selectedRule.triggerEn}
                </h4>
              </div>

              {/* Template Editor */}
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                  {isArabic ? 'قالب رسالة الواتساب الآلية' : 'Automated WhatsApp Template'}
                </label>
                <textarea
                  rows={4}
                  value={isArabic ? selectedRule.templateAr : selectedRule.templateEn}
                  onChange={(e) => handleUpdateTemplate(e.target.value)}
                  className="w-full rounded-2xl border border-border bg-background p-3 text-xs leading-relaxed text-foreground focus:border-primary outline-hidden"
                />
                <div className="mt-1.5 flex flex-wrap gap-1 text-[10px] text-muted-foreground">
                  <span className="font-bold">{isArabic ? 'المتغيرات المتاحة: ' : 'Variables: '}</span>
                  <code className="rounded bg-muted px-1">{'{{patient_name}}'}</code>
                  <code className="rounded bg-muted px-1">{'{{appointment_time}}'}</code>
                  <code className="rounded bg-muted px-1">{'{{doctor_name}}'}</code>
                </div>
              </div>

              {/* WhatsApp Live Simulator Bubble */}
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/10 p-4 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                  <span>📱 {isArabic ? 'معاينة الرسالة على هاتف المريض' : 'Patient WhatsApp Preview'}</span>
                  <span className="font-mono text-[9px] opacity-80">WhatsApp Business Verified</span>
                </div>
                <div className="rounded-xl bg-card border border-border/60 p-3 text-xs shadow-xs">
                  <p className="leading-relaxed text-foreground">
                    {(isArabic ? selectedRule.templateAr : selectedRule.templateEn)
                      .replace('{{patient_name}}', isArabic ? 'المريض' : 'Patient')
                      .replace('{{appointment_time}}', isArabic ? '5:30 م' : '5:30 PM')
                      .replace('{{doctor_name}}', isArabic ? 'الطبيب المعالج' : 'Attending Doctor')
                      .replace('{{review_link}}', 'g.page/clinic/review')}
                  </p>
                  <span className="mt-2 block text-end font-mono text-[9px] text-muted-foreground">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓✓
                  </span>
                </div>
              </div>
            </div>

            {/* Test Send Trigger */}
            <button
              type="button"
              onClick={() => toast.success(isArabic ? 'تم إرسال رسالة تجريبية إلى رقمك للمعاينة' : 'Test message sent to your test phone')}
              className="flex items-center justify-center gap-2 rounded-xl border border-border bg-muted/40 py-2.5 text-xs font-bold text-foreground transition hover:bg-muted"
            >
              <Send className="size-3.5" />
              <span>{isArabic ? 'إرسال رسالة تجريبية لرقمي 📲' : 'Send Test WhatsApp Message'}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-border p-5 bg-card">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border px-4 py-2.5 text-xs font-bold text-muted-foreground hover:bg-muted"
          >
            {isArabic ? 'إغلاق' : 'Close'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-md hover:opacity-90"
          >
            <Check className="size-4" />
            <span>{isArabic ? 'حفظ وتفعيل المسارات' : 'Save & Activate Workflows'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
