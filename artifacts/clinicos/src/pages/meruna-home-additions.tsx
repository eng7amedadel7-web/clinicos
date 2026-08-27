import { useState } from 'react';
import { ArrowUpRight, CalendarDays, Check, ChevronRight, Inbox, ShieldCheck, UsersRound, Workflow } from 'lucide-react';

type Lang = 'en' | 'ar';

type Copy = { en: string; ar: string };

function text(locale: Lang, value: Copy) {
  return locale === 'ar' ? value.ar : value.en;
}

const roles = [
  {
    id: 'reception',
    icon: Inbox,
    label: { en: 'Reception', ar: 'الاستقبال' },
    detail: { en: 'Keep the front desk calm and the next action visible.', ar: 'حافظ على هدوء الاستقبال ووضوح الخطوة التالية.' },
    metrics: [
      { value: { en: '3 to triage', ar: '3 للتصنيف' }, label: { en: 'New conversations', ar: 'محادثات جديدة' } },
      { value: { en: '2 today', ar: '2 اليوم' }, label: { en: 'Visits to confirm', ar: 'زيارات للتأكيد' } },
      { value: { en: '4 queued', ar: '4 مجدولة' }, label: { en: 'Follow-ups due', ar: 'متابعات مستحقة' } },
    ],
  },
  {
    id: 'owner',
    icon: UsersRound,
    label: { en: 'Clinic owner', ar: 'مدير العيادة' },
    detail: { en: 'See demand, team flow and exceptions across the clinic.', ar: 'شاهد الطلب وسير الفريق والاستثناءات عبر العيادة.' },
    metrics: [
      { value: { en: '4 live', ar: '4 مباشرة' }, label: { en: 'Connected channels', ar: 'القنوات المتصلة' } },
      { value: { en: '2 branches', ar: 'فرعان' }, label: { en: 'Branches in view', ar: 'الفروع الظاهرة' } },
      { value: { en: '1 review', ar: '1 للمراجعة' }, label: { en: 'Exceptions', ar: 'استثناءات' } },
    ],
  },
  {
    id: 'doctor',
    icon: CalendarDays,
    label: { en: 'Doctor', ar: 'الطبيب' },
    detail: { en: 'Arrive with context and a clear view of what comes next.', ar: 'ابدأ يومك بالسياق ورؤية واضحة لما يأتي بعد ذلك.' },
    metrics: [
      { value: { en: '6 scheduled', ar: '6 مجدولة' }, label: { en: 'Visits today', ar: 'زيارات اليوم' } },
      { value: { en: '4 prepared', ar: '4 جاهزة' }, label: { en: 'Patient context', ar: 'سياق المرضى' } },
      { value: { en: '2 to review', ar: '2 للمراجعة' }, label: { en: 'Next conversations', ar: 'المحادثات التالية' } },
    ],
  },
] as const;

const workflows = [
  { id: 'capture', label: { en: 'Capture', ar: 'التقاط' }, detail: { en: 'Bring the conversation in.', ar: 'أدخل المحادثة.' } },
  { id: 'book', label: { en: 'Book', ar: 'حجز' }, detail: { en: 'Turn intent into a visit.', ar: 'حوّل الاهتمام إلى زيارة.' } },
  { id: 'follow', label: { en: 'Follow up', ar: 'متابعة' }, detail: { en: 'Keep the next action moving.', ar: 'حافظ على الخطوة التالية.' } },
  { id: 'recover', label: { en: 'Recover', ar: 'استعادة' }, detail: { en: 'Bring missed visits back.', ar: 'استعد المواعيد الفائتة.' } },
] as const;

export function TrialBar({ locale, onStart }: { locale: Lang; onStart: () => void }) {
  return (
    <section className="mt-[76px] border-b border-[hsl(var(--border))] bg-[hsl(var(--navy))] px-4 py-3 text-white">
      <div className="cf-container flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-center text-[11px] font-bold sm:justify-between sm:text-start">
        <span className="inline-flex items-center gap-2"><ShieldCheck className="size-3.5 text-[hsl(var(--accent))]" />{locale === 'ar' ? 'جرّب مساحة عمل MERUNA الكاملة مجانًا لمدة 10 أيام' : 'Try the full MERUNA workspace free for 10 days'}</span>
        <span className="text-[hsl(214_25%_78%)]">{locale === 'ar' ? 'بدون بطاقة ائتمان' : 'No credit card required'}</span>
        <button type="button" onClick={onStart} className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 underline decoration-white/40 underline-offset-2 transition hover:bg-white/20" data-testid="button-trial-bar">{locale === 'ar' ? 'ابدأ الآن' : 'Start now'}<ArrowUpRight className="size-3" /></button>
      </div>
    </section>
  );
}

export function FeatureStrip({ locale }: { locale: Lang }) {
  const items = locale === 'ar'
    ? ['المواعيد', 'Inbox موحد', 'استقبال ذكي', 'أتمتة المتابعات']
    : ['Appointments', 'Unified inbox', 'AI receptionist', 'Automations'];
  return (
    <section className="border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] py-7">
      <div className="cf-container flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-start">
        <p className="cf-mono text-[9px] font-bold uppercase tracking-[.14em] text-[hsl(var(--muted-foreground))]">{locale === 'ar' ? 'كل ما يحتاجه فريقك للعمل بوضوح' : 'Everything your team needs to move with clarity'}</p>
        <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
          {items.map((item, index) => <span key={item} className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-1.5 text-[10px] font-bold text-[hsl(var(--muted-foreground))]"><Check className={`size-3.5 ${index === 1 ? 'text-[hsl(var(--accent))]' : 'text-[hsl(var(--primary))]'}`} />{item}</span>)}
        </div>
      </div>
    </section>
  );
}

export function ClinicDayDemo({ locale, onExplore }: { locale: Lang; onExplore?: () => void }) {
  const [activeRole, setActiveRole] = useState(0);
  const [activeWorkflow, setActiveWorkflow] = useState(0);
  const role = roles[activeRole];
  const RoleIcon = role.icon;
  const workflow = workflows[activeWorkflow];

  return (
    <section id="clinic-day" className="cf-section border-y border-[hsl(var(--border))] py-24 md:py-32">
      <div className="cf-container grid gap-12 lg:grid-cols-[.78fr_1.22fr] lg:items-start">
        <div>
          <div className="cf-mono mb-5 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[.1em] text-[hsl(var(--primary))]"><span className="h-px w-8 bg-[hsl(var(--accent))]" />{locale === 'ar' ? 'شاهد يوم عيادتك يتحرك' : 'See your clinic day in motion'}</div>
          <h2 className="cf-display max-w-xl text-[38px] font-extrabold leading-[1.12] tracking-[-.06em] md:text-[53px]">{locale === 'ar' ? 'اختر دورك، وشاهد' : 'Choose a role.'}<br /><span className="text-[hsl(var(--primary))]">{locale === 'ar' ? 'الخطوة التالية.' : 'See the next action.'}</span></h2>
          <p className="cf-body-muted mt-6 max-w-lg text-[15px] leading-[1.9]">{locale === 'ar' ? 'تمنح MERUNA كل عضو في فريق العيادة رؤية أوضح ليوم التشغيل نفسه. استكشف مساحة العمل التوضيحية.' : 'MERUNA gives every member of the clinic team a clearer view of the same operating day. Explore the example workspace.'}</p>
          <div className="mt-8 space-y-2" role="tablist" aria-label={locale === 'ar' ? 'أدوار العيادة' : 'Clinic roles'}>
            {roles.map((item, index) => { const Icon = item.icon; const selected = index === activeRole; return <button key={item.id} type="button" role="tab" aria-selected={selected} onClick={() => setActiveRole(index)} className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-start transition ${selected ? 'border-[hsl(var(--primary))] bg-[hsl(var(--tint))] shadow-sm' : 'border-transparent hover:border-[hsl(var(--border))] hover:bg-[hsl(var(--card))]'}`}><span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--tint))] text-[hsl(var(--primary))]"><Icon className="size-4" /></span><span className="min-w-0 flex-1"><strong className="block text-sm font-black">{text(locale, item.label)}</strong><span className="mt-1 block text-xs leading-5 text-[hsl(var(--muted-foreground))]">{text(locale, item.detail)}</span></span><ChevronRight className="size-4 shrink-0 text-[hsl(var(--primary))]" /></button>; })}
          </div>
        </div>
        <div className="cf-card rounded-[28px] border p-5 shadow-[var(--shadow-soft)] md:p-7" aria-live="polite">
          <div className="flex items-start justify-between gap-4"><div><p className="cf-mono text-[9px] text-[hsl(var(--primary))]">{locale === 'ar' ? 'مساحة عمل توضيحية' : 'EXAMPLE WORKSPACE'}</p><h3 className="cf-display mt-2 text-[26px] font-extrabold">{text(locale, role.label)}</h3><p className="cf-body-muted mt-2 max-w-lg text-sm leading-6">{text(locale, role.detail)}</p></div><span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[hsl(var(--tint))] text-[hsl(var(--primary))]"><RoleIcon className="size-5" /></span></div>
          <div className="mt-7 flex flex-wrap gap-2" role="tablist" aria-label={locale === 'ar' ? 'تدفقات العيادة' : 'Clinic workflows'}>{workflows.map((item, index) => <button key={item.id} type="button" role="tab" aria-selected={index === activeWorkflow} onClick={() => setActiveWorkflow(index)} className={`rounded-full border px-3 py-2 text-[10px] font-bold transition ${index === activeWorkflow ? 'border-[hsl(var(--primary))] bg-[hsl(var(--navy))] text-white' : 'border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--primary))]'}`}>{text(locale, item.label)}</button>)}</div>
          <div className="mt-6 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--tint))] p-4"><div className="flex flex-wrap items-center justify-between gap-3"><p className="cf-mono text-[9px] text-[hsl(var(--muted-foreground))]">{locale === 'ar' ? 'نبض مساحة العمل' : 'WORKSPACE PULSE'}</p><span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--lime-soft))] px-2 py-1 text-[9px] font-black text-[hsl(var(--accent))]"><span className="size-1.5 rounded-full bg-[hsl(var(--accent))]" />{locale === 'ar' ? 'جاهز' : 'Ready'}</span></div><div className="mt-4 grid gap-2 sm:grid-cols-3">{role.metrics.map(metric => <div key={metric.label.en} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3"><strong className="block text-sm font-black text-[hsl(var(--primary))]">{text(locale, metric.value)}</strong><span className="mt-1 block text-[10px] font-semibold text-[hsl(var(--muted-foreground))]">{text(locale, metric.label)}</span></div>)}</div></div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-[hsl(var(--border))] p-4"><div className="flex items-center gap-2"><Workflow className="size-4 text-[hsl(var(--primary))]" /><p className="cf-mono text-[9px] text-[hsl(var(--muted-foreground))]">{locale === 'ar' ? 'التدفق الحالي' : 'CURRENT WORKFLOW'}</p></div><p className="mt-3 text-sm font-black">{text(locale, workflow.label)}</p><p className="cf-body-muted mt-1 text-xs">{text(locale, workflow.detail)}</p></div><div className="rounded-2xl border border-[hsl(var(--border))] p-4"><div className="flex items-center gap-2"><Check className="size-4 text-[hsl(var(--accent))]" /><p className="cf-mono text-[9px] text-[hsl(var(--muted-foreground))]">{locale === 'ar' ? 'الخطوة التالية' : 'NEXT BEST ACTION'}</p></div><p className="mt-3 text-sm font-black text-[hsl(var(--accent))]">{locale === 'ar' ? 'السياق جاهز للفريق' : 'Context ready for the team'}</p></div></div>
          {onExplore ? <button type="button" onClick={onExplore} className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-[hsl(var(--primary))] hover:underline">{locale === 'ar' ? 'ابدأ مساحة عملك' : 'Start your workspace'}<ArrowUpRight className="size-3.5" /></button> : null}
        </div>
      </div>
    </section>
  );
}

export function HowItWorksSection({ locale }: { locale: Lang }) {
  const steps = locale === 'ar'
    ? [
      { number: '01', title: 'اربط عيادتك', body: 'أنشئ مساحة العمل واربط القنوات التي يستخدمها مرضاك بالفعل (واتساب، هاتف، انستغرام).' },
      { number: '02', title: 'أضف فريقك', body: 'ادعُ موظفي الاستقبال والأطباء والمديرين بأدوار واضحة ورؤية مشتركة.' },
      { number: '03', title: 'اعمل بوضوح', body: 'حوّل المحادثات إلى مواعيد ومتابعات وتدفقات عمل مؤتمتة دون أي فوضى.' },
    ]
    : [
      { number: '01', title: 'Connect your clinic', body: 'Create your workspace and connect the channels your patients already use.' },
      { number: '02', title: 'Bring the team in', body: 'Invite reception, doctors and managers with clear roles and a shared view.' },
      { number: '03', title: 'Run with clarity', body: 'Turn conversations into appointments, follow-ups and repeatable workflows.' },
    ];
  return <section id="setup" className="cf-section border-y border-[hsl(var(--border))] py-24 md:py-32"><div className="cf-container"><div className="max-w-2xl"><div className="cf-mono mb-5 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[.1em] text-[hsl(var(--primary))]"><span className="h-px w-8 bg-[hsl(var(--accent))]" />{locale === 'ar' ? 'كيف يعمل' : 'How it works'}</div><h2 className="cf-display max-w-2xl text-[38px] font-extrabold leading-[1.12] tracking-[-.06em] md:text-[53px]">{locale === 'ar' ? 'إعداد واحد.' : 'Set up once.'}<br /><span className="text-[hsl(var(--primary))]">{locale === 'ar' ? 'فرق واضح كل يوم.' : 'Feel the difference every day.'}</span></h2><p className="cf-body-muted mt-6 max-w-xl text-[15px] leading-[1.9]">{locale === 'ar' ? 'ابدأ بخطوات صغيرة، أثبت القيمة، ثم توسع بالسرعة المناسبة لك.' : 'Start small, prove the value, then expand at your own pace.'}</p></div><div className="mt-12 grid gap-4 md:grid-cols-3">{steps.map((step, index) => <article key={step.number} className="cf-card rounded-[24px] border p-6 shadow-[var(--shadow-soft)]"><div className="mb-12 flex items-center justify-between"><span className="cf-mono text-[10px] text-[hsl(var(--primary))]">{step.number}</span><span className="flex size-10 items-center justify-center rounded-xl bg-[hsl(var(--tint))] text-[hsl(var(--primary))]"><span className="text-sm font-black">{index === 0 ? '1' : index === 1 ? '2' : '3'}</span></span></div><h3 className="cf-display text-[20px] font-extrabold">{step.title}</h3><p className="cf-body-muted mt-3 text-[13px] leading-[1.85]">{step.body}</p></article>)}</div></div></section>;
}

export function RoiCalculatorSection({ locale, onAction }: { locale: Lang; onAction?: () => void }) {
  const isAr = locale === 'ar';
  const [doctors, setDoctors] = useState(3);
  const [dailyPatients, setDailyPatients] = useState(35);

  const hoursSavedPerMonth = Math.round(doctors * (dailyPatients * 0.08 * 24));
  const protectedRevenue = Math.round(dailyPatients * 0.12 * 45 * 24 * (doctors * 0.8));
  const noShowReduction = 38;

  return (
    <section id="roi-calculator" className="cf-section py-24 md:py-32 border-b border-[hsl(var(--border))]">
      <div className="cf-container">
        <div className="mx-auto max-w-3xl text-center mb-16">
          <div className="cf-mono mb-4 inline-flex items-center gap-2 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-1.5 text-[10px] font-bold uppercase tracking-[.1em] text-[hsl(var(--primary))]">
            <span className="size-2 rounded-full bg-[hsl(var(--accent))]" />
            {isAr ? "حاسبة العائد والوقت المستعاد" : "ROI & Time Saved Calculator"}
          </div>
          <h2 className="cf-display text-[36px] font-extrabold leading-[1.15] md:text-[50px]">
            {isAr ? "كم توفر عيادتك شهرياً مع" : "See how much your clinic saves with"}{" "}
            <span className="text-[hsl(var(--primary))]">MERUNA</span>
          </h2>
          <p className="cf-body-muted mt-4 text-[15px] leading-[1.8]">
            {isAr
              ? "حرّك المؤشرات بناءً على حجم عيادتك لترى الأثر المباشر على الإنتاجية والإيرادات."
              : "Adjust the sliders to match your clinic size and see the immediate impact on hours and recovered revenue."}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_.9fr] items-center">
          {/* Sliders Card */}
          <div className="cf-card rounded-[28px] border p-7 shadow-[var(--shadow-soft)] space-y-7">
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-extrabold text-[hsl(var(--foreground))]">
                  {isAr ? "عدد الأطباء / العيادات النشطة" : "Active Doctors / Chairs"}
                </label>
                <span className="cf-mono text-base font-black px-3 py-1 rounded-xl bg-[hsl(var(--tint))] text-[hsl(var(--primary))]">
                  {doctors} {isAr ? "أطباء" : "Doctors"}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="15"
                value={doctors}
                onChange={(e) => setDoctors(Number(e.target.value))}
                className="w-full accent-[hsl(var(--primary))] h-2 rounded-lg bg-[hsl(var(--muted))] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[hsl(var(--muted-foreground))] mt-1">
                <span>1</span>
                <span>5</span>
                <span>10</span>
                <span>15+</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-extrabold text-[hsl(var(--foreground))]">
                  {isAr ? "متوسط الاستفسارات والمراجعين يومياً" : "Daily Inquiries & Patients"}
                </label>
                <span className="cf-mono text-base font-black px-3 py-1 rounded-xl bg-[hsl(var(--tint))] text-[hsl(var(--primary))]">
                  {dailyPatients} {isAr ? "استفسار/مريض" : "Patients"}
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="120"
                step="5"
                value={dailyPatients}
                onChange={(e) => setDailyPatients(Number(e.target.value))}
                className="w-full accent-[hsl(var(--primary))] h-2 rounded-lg bg-[hsl(var(--muted))] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[hsl(var(--muted-foreground))] mt-1">
                <span>10</span>
                <span>40</span>
                <span>80</span>
                <span>120+</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[hsl(var(--tint))] border border-[hsl(var(--primary)/.15)] text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">
              💡 {isAr
                ? "الحساب مبني على خفض مهام الرد اليدوي بنسبة 75% وتقليل الغياب والمواعيد الضائعة بنسبة 38%."
                : "Calculations based on 75% automated inquiry resolution and 38% reduction in missed appointments."}
            </div>
          </div>

          {/* Result Card */}
          <div className="cf-navy rounded-[30px] p-8 text-white relative overflow-hidden shadow-[var(--shadow-float)]">
            <div className="absolute -right-12 -top-12 size-40 rounded-full bg-[hsl(var(--primary)/.2)] blur-2xl" />
            
            <span className="cf-mono text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--accent))]">
              {isAr ? "الأثر التقديري شهرياً" : "Estimated Monthly Impact"}
            </span>

            <div className="mt-6 space-y-6">
              <div className="border-b border-white/10 pb-4">
                <span className="text-xs text-[hsl(214_25%_75%)]">
                  {isAr ? "ساعات عمل مستعادة للاستقبال" : "Front-Desk Hours Saved"}
                </span>
                <p className="cf-mono text-4xl font-extrabold text-[hsl(var(--accent))] mt-1">
                  +{hoursSavedPerMonth} {isAr ? "ساعة" : "hrs"}
                </p>
                <p className="text-[11px] text-[hsl(214_25%_65%)] mt-1">
                  {isAr ? "تساوي توفير أكثر من نصف وظيفة استقبال شهرياً" : "Equivalent to over half a full-time staff role"}
                </p>
              </div>

              <div className="border-b border-white/10 pb-4">
                <span className="text-xs text-[hsl(214_25%_75%)]">
                  {isAr ? "إيرادات محمية من المواعيد الضائعة" : "Protected Monthly Revenue"}
                </span>
                <p className="cf-mono text-4xl font-extrabold text-white mt-1">
                  ${protectedRevenue.toLocaleString()}
                </p>
                <p className="text-[11px] text-[hsl(214_25%_65%)] mt-1">
                  {isAr ? `بفضل خفض نسبة عدم الحضور بنسبة ${noShowReduction}%` : `Through a ${noShowReduction}% drop in no-show rate`}
                </p>
              </div>
            </div>

            {onAction && (
              <button
                type="button"
                onClick={onAction}
                className="mt-7 w-full rounded-2xl bg-[hsl(var(--primary))] py-3.5 text-xs font-bold text-white shadow-lg transition hover:brightness-110"
              >
                {isAr ? "احصل على استشارة مجانية لعيادتك" : "Claim Your Free Clinic ROI Audit"}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export function BeforeAfterSection({ locale }: { locale: Lang }) {
  const isAr = locale === 'ar';

  const beforeItems = isAr ? [
    "مكالمات ضائعة خارج أوقات العمل تفقد العيادة مرضى جدد",
    "تأكيدات يدوية تستنزف 4-5 ساعات يومياً من موظفي الاستقبال",
    "غياب مفاجئ للمرضى يترك فراغات غير معوضة في جدول الأطباء",
    "محادثات متفرقة بين واتساب وانستغرام بدون سجل موحد",
  ] : [
    "Missed calls after hours leading to lost new patient leads",
    "Manual appointment confirmations wasting 4-5 hours daily",
    "Sudden no-shows leaving costly gaps in doctors' calendars",
    "Scattered chats across WhatsApp & Instagram with no shared record",
  ];

  const afterItems = isAr ? [
    "وكيل ذكي يستقبل المكالمات والرسائل فوراً 24/7 دون أي تأخير",
    "تأكيدات وتذكيرات آلية ذكية ترفع نسبة الحضور إلى أكثر من 94%",
    "قائمة انتظار ذكية تعوض أي إلغاء فوري بدعوة مرضى آخرين",
    "صندوق رسائل موحد يجمع الواتساب والمكالمات والسجلات في شاشة واحدة",
  ] : [
    "Smart agent responds to calls & messages 24/7 with zero delay",
    "Automated smart reminders boosting clinic attendance above 94%",
    "Automated waitlist fills sudden cancellations instantly",
    "Unified inbox consolidating all channels and history into one screen",
  ];

  return (
    <section className="cf-section py-24 md:py-32 bg-[hsl(var(--card))] border-b border-[hsl(var(--border))]">
      <div className="cf-container">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <div className="cf-mono mb-4 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.1em] text-[hsl(var(--primary))]">
            {isAr ? "التحول التشغيلي للعيادة" : "Clinic Operational Transformation"}
          </div>
          <h2 className="cf-display text-[36px] font-extrabold leading-[1.15] md:text-[50px]">
            {isAr ? "العيادة قبل وبعد" : "Before & After"}{" "}
            <span className="text-[hsl(var(--primary))]">MERUNA</span>
          </h2>
          <p className="cf-body-muted mt-4 text-[15px] leading-[1.8]">
            {isAr
              ? "شاهد الفارق المباشر في هدوء الاستقبال وإنتاجية طاقمك الطبي."
              : "Witness the direct difference in front-desk calm and clinical efficiency."}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Before */}
          <div className="rounded-[28px] border border-red-200/50 bg-red-50/40 dark:bg-red-950/20 dark:border-red-900/30 p-7 space-y-4">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-extrabold text-sm">
              <span className="size-2 rounded-full bg-red-500" />
              {isAr ? "العيادة التقليدية (قبل MERUNA)" : "Traditional Clinic (Without MERUNA)"}
            </div>
            <div className="space-y-3 pt-2">
              {beforeItems.map((item, i) => (
                <div key={i} className="flex items-start gap-3 text-xs text-red-900/80 dark:text-red-300 leading-relaxed">
                  <span className="text-red-500 font-bold shrink-0">✕</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* After */}
          <div className="rounded-[28px] border border-emerald-300/50 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-800/40 p-7 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-extrabold text-sm">
              <span className="size-2 rounded-full bg-emerald-500" />
              {isAr ? "مع نظام MERUNA الذكي" : "With MERUNA Smart System"}
            </div>
            <div className="space-y-3 pt-2">
              {afterItems.map((item, i) => (
                <div key={i} className="flex items-start gap-3 text-xs text-emerald-950 dark:text-emerald-200 font-medium leading-relaxed">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function FaqSection({ locale }: { locale: Lang }) {
  const isAr = locale === 'ar';
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = isAr ? [
    {
      q: "هل يحتاج نظام MERUNA إلى أجهزة خاصة أو خوادم داخل العيادة؟",
      a: "لا على الإطلاق! MERUNA نظام سحابي بالكامل (Cloud-based) يعمل على أي متصفح هاتف أو تابلت أو كمبيوتر، مع إمكانية تثبيته كتطبيق مستقل (PWA) للعمل بدون إنترنت مؤقتاً.",
    },
    {
      q: "كيف يتم ربط واتساب العيادة ورقم الهاتف؟",
      a: "نوفر ربطاً رسمياً وسلساً مع WhatsApp Business API وخطوط الهاتف في دقائق، مما يتيح الرد التلقائي على الرسائل والمكالمات في نفس اللحظة دون تغيير رقم عيادتك الحالي.",
    },
    {
      q: "هل يمكن لفريق الاستقبال التدخل في المحادثة في أي وقت؟",
      a: "نعم! الاستقبال البشري له الأولوية دائماً. بمجرد أن يفتح الموظف المحادثة أو يكتب رداً، يتوقف الذكاء الاصطناعي تلقائياً ويتيح للموظف إكمال الحوار بسلاسة.",
    },
    {
      q: "كم يستغرق تدريب الفريق وبدء العمل الفعلي؟",
      a: "واجهة MERUNA مصممة لتكون بديهية وسهلة للغاية كبرامج الدردشة اليومية، ويستغرق تدريب موظف الاستقبال أقل من 30 دقيقة للبدء الكامل.",
    },
    {
      q: "هل بيانات المرضى وسجلاتهم الطبية آمنة ومشفرة؟",
      a: "نعم، نطبق أعلى معايير التشفير (AES-256) مع ضوابط حماية خصوصية البيانات الطبية والنسخ الاحتياطي اللحظي المستمر.",
    },
  ] : [
    {
      q: "Does MERUNA require special hardware or on-premise servers?",
      a: "Not at all! MERUNA is 100% cloud-based and works on any browser, tablet, or phone, with PWA support for offline resilience.",
    },
    {
      q: "How does WhatsApp and phone integration work?",
      a: "We connect directly with official WhatsApp Business API and clinic telephony in minutes, allowing automatic 24/7 handling without changing your existing numbers.",
    },
    {
      q: "Can human staff take over conversations at any time?",
      a: "Absolutely! Human staff always have override control. As soon as a receptionist replies, the AI hands off the chat seamlessly.",
    },
    {
      q: "How long does onboarding and training take?",
      a: "MERUNA is designed to be as intuitive as standard messaging apps. Reception staff get fully proficient in under 30 minutes.",
    },
    {
      q: "Is patient medical data secure and compliant?",
      a: "Yes, we adhere to strict enterprise encryption (AES-256) and continuous automated cloud backups.",
    },
  ];

  return (
    <section id="faq" className="cf-section py-24 md:py-32 border-b border-[hsl(var(--border))]">
      <div className="cf-container">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <div className="cf-mono mb-4 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.1em] text-[hsl(var(--primary))]">
            {isAr ? "الأسئلة الشائعة" : "Frequently Asked Questions"}
          </div>
          <h2 className="cf-display text-[36px] font-extrabold leading-[1.15] md:text-[50px]">
            {isAr ? "كل ما تود معرفته عن" : "Everything you need to know about"}{" "}
            <span className="text-[hsl(var(--primary))]">MERUNA</span>
          </h2>
        </div>

        <div className="mx-auto max-w-3xl space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className={`rounded-2xl border transition ${
                  isOpen ? "border-[hsl(var(--primary))] bg-[hsl(var(--card))] shadow-sm" : "border-[hsl(var(--border))] bg-[hsl(var(--card)/.6)]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full items-center justify-between p-5 text-start font-bold text-sm text-[hsl(var(--foreground))]"
                >
                  <span>{faq.q}</span>
                  <span className="text-lg font-mono text-[hsl(var(--primary))]">
                    {isOpen ? "−" : "+"}
                  </span>
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs text-[hsl(var(--muted-foreground))] leading-relaxed border-t border-[hsl(var(--border)/.6)] pt-3 animate-fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

