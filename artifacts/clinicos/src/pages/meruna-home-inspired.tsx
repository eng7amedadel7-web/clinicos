import { Instagram, MessageCircle, Phone, Send, ArrowUpLeft, Check } from 'lucide-react';
import type { ReactNode } from 'react';

type Locale = 'en' | 'ar';

type Localized = { en: string; ar: string };

const channelCards: Array<{ icon: typeof MessageCircle; name: Localized; detail: Localized; tone: string }> = [
  { icon: MessageCircle, name: { en: 'WhatsApp', ar: 'واتساب' }, detail: { en: 'Turn conversations into visits.', ar: 'حوّل المحادثات إلى مواعيد.' }, tone: 'green' },
  { icon: Instagram, name: { en: 'Instagram', ar: 'إنستغرام' }, detail: { en: 'Catch intent while it is warm.', ar: 'التقط اهتمام المريض في وقته.' }, tone: 'blue' },
  { icon: Phone, name: { en: 'Phone calls', ar: 'المكالمات' }, detail: { en: 'Give every call a clear next step.', ar: 'امنح كل مكالمة خطوة واضحة.' }, tone: 'amber' },
  { icon: Send, name: { en: 'Messages', ar: 'الرسائل' }, detail: { en: 'Keep the whole context together.', ar: 'احتفظ بالسياق كله في مكان واحد.' }, tone: 'coral' },
];

const journeySteps: Array<{ number: string; title: Localized; body: Localized }> = [
  { number: '01', title: { en: 'A message arrives', ar: 'تصل الرسالة' }, body: { en: 'A patient reaches out through the channel they already trust.', ar: 'يتواصل المريض عبر القناة التي يثق بها بالفعل.' } },
  { number: '02', title: { en: 'The next step becomes clear', ar: 'تظهر الخطوة التالية' }, body: { en: 'The right context, person and appointment move into view.', ar: 'يظهر السياق والموظف والموعد المناسب في لحظة واحدة.' } },
  { number: '03', title: { en: 'The relationship keeps moving', ar: 'تستمر العلاقة' }, body: { en: 'Helpful follow-up gives every visit a reason to continue.', ar: 'تمنح المتابعة المفيدة كل زيارة سببًا جديدًا للاستمرار.' } },
];

function value(locale: Locale, copy: Localized) {
  return locale === 'ar' ? copy.ar : copy.en;
}

export function MomentumMarquee({ locale }: { locale: Locale }) {
  const items = locale === 'ar'
    ? ['احجز بذكاء', 'تابع بإنسانية', 'أنمِ بثقة', 'كل لحظة أوضح']
    : ['Book with clarity', 'Follow up with care', 'Grow with confidence', 'Make every moment visible'];
  const repeated = [...items, ...items];
  return <div className="meruna-momentum" aria-label={locale === 'ar' ? 'مبادئ MERUNA' : 'MERUNA principles'}><div className="meruna-momentum-track">{repeated.map((item, index) => <span key={`${item}-${index}`}><b>{item}</b><i>/</i></span>)}</div></div>;
}

export function ChannelSignalSection({ locale }: { locale: Locale }) {
  return <section className="meruna-channel-section" aria-labelledby="channel-signals-title"><div className="cf-container"><div className="meruna-section-heading"><div><span className="meruna-kicker">{locale === 'ar' ? 'قنواتك، في إيقاع واحد' : 'EVERY CHANNEL, ONE RHYTHM'}</span><h2 id="channel-signals-title" className="cf-display">{locale === 'ar' ? <>لا تجعل المريض<br /><em>يبحث عنك.</em></> : <>Meet patients<br /><em>where they are.</em></>}</h2></div><p>{locale === 'ar' ? 'اجعل الوصول إليك أسهل. كل رسالة تصل إلى نفس مساحة العمل وبنفس الوضوح.' : 'Make reaching your clinic feel easy. Every message arrives in the same calm workspace.'}</p></div><div className="meruna-channel-grid">{channelCards.map(({ icon: Icon, name, detail, tone }) => <article className={`meruna-channel-card tone-${tone}`} key={name.en}><span className="meruna-channel-icon"><Icon size={20} /></span><h3>{value(locale, name)}</h3><p>{value(locale, detail)}</p><span className="meruna-channel-mark"><Check size={13} /></span></article>)}</div></div></section>;
}

export function PatientJourneySection({ locale, children }: { locale: Locale; children?: ReactNode }) {
  return <section className="meruna-journey-section" aria-labelledby="journey-title"><div className="cf-container"><div className="meruna-journey-intro"><span className="meruna-kicker">{locale === 'ar' ? 'تجربة المريض' : 'THE PATIENT EXPERIENCE'}</span><h2 id="journey-title" className="cf-display">{locale === 'ar' ? <>كل تفصيلة تقول:<br /><em>نحن نرتبهم.</em></> : <>Every detail says:<br /><em>we have it covered.</em></>}</h2><p>{locale === 'ar' ? 'من أول سؤال إلى الزيارة القادمة، يظل فريقك حاضرًا بالسياق الصحيح والخطوة الواضحة.' : 'From the first question to the next visit, your team stays present with the right context and the next clear action.'}</p>{children}</div><div className="meruna-journey-steps">{journeySteps.map((step) => <article key={step.number} className="meruna-journey-step"><span className="meruna-journey-number">{step.number}</span><div><h3>{value(locale, step.title)}</h3><p>{value(locale, step.body)}</p></div><ArrowUpLeft className="meruna-journey-arrow" size={18} /></article>)}</div></div></section>;
}
