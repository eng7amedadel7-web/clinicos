import { useState } from 'react';
import { Check, ChevronDown, LockKeyhole, RefreshCw, ShieldCheck } from 'lucide-react';

type Lang = 'en' | 'ar';

export default function HomeTrustSections({ locale }: { locale: Lang }) {
  const ar = locale === 'ar';
  const faqs = ar ? [
    ['هل MERUNA برنامج طبي؟', 'MERUNA منصة SaaS لتنظيم تشغيل العيادة والتواصل والمواعيد. لا تقدم تشخيصاً أو نصيحة طبية، وتظل القرارات السريرية مسؤولية المختصين.'],
    ['هل أحتاج بطاقة دفع لطلب عرض؟', 'لا. يمكنك طلب جلسة تعريفية دون بطاقة أو التزام. تشرح لك الجلسة ما يناسب عيادتك قبل أي اشتراك.'],
    ['هل يمكنني إلغاء الاشتراك؟', 'نعم، يمكنك إيقاف التجديد في أي وقت مع استمرار وصولك حتى نهاية فترة الفوترة المدفوعة.'],
    ['ماذا عن الاسترداد؟', 'يتمتع المشتركون الجدد بضمان استرداد لأول دفعة خلال 30 يوماً وفق شروط سياسة الاسترداد المنشورة.'],
    ['هل يناسب الفروع المتعددة؟', 'نعم. تدعم الخطط المتقدمة إدارة الفروع والصلاحيات والرؤية الموحدة، ويحدد فريقنا إعداد الانتقال المناسب أثناء العرض.'],
  ] : [
    ['Is MERUNA medical software?', 'MERUNA is a SaaS platform for clinic operations, communication, and appointments. It does not provide diagnosis or medical advice; clinical decisions remain with qualified professionals.'],
    ['Do I need a card to request a demo?', 'No. You can request a working session without a card or commitment, and understand the right setup before subscribing.'],
    ['Can I cancel my subscription?', 'Yes. You can stop renewal at any time and retain access through the end of your paid billing period.'],
    ['What is the refund policy?', 'New subscribers have a 30-day first-payment money-back guarantee, subject to our published Refund Policy.'],
    ['Does it work for multiple branches?', 'Yes. Advanced plans support branches, permissions, and unified visibility. Our team will map the right rollout during your demo.'],
  ];
  const [open, setOpen] = useState(0);
  return <>
    <section className="meruna-assurance" aria-labelledby="assurance-title"><div className="cf-container"><div className="meruna-assurance-copy"><span className="meruna-kicker">{ar ? 'الثقة قبل الاشتراك' : 'CONFIDENCE BEFORE COMMITMENT'}</span><h2 id="assurance-title" className="cf-display">{ar ? 'شروط واضحة.' : 'Clear terms.'}<br /><em>{ar ? 'وبيانات تحت سيطرتك.' : 'Your data under control.'}</em></h2><p>{ar ? 'من أول عرض إلى أول دفعة، تعرف ما الذي تحصل عليه وكيف تلغي أو تطلب المساعدة.' : 'From the first demo to the first payment, know what you receive, how to cancel, and where to get help.'}</p><a href="/privacy-policy">{ar ? 'اقرأ سياسة الخصوصية' : 'Read our Privacy Policy'}</a></div><div className="meruna-assurance-grid"><article><ShieldCheck /><h3>{ar ? 'استرداد خلال 30 يوماً' : '30-day refund guarantee'}</h3><p>{ar ? 'لأول دفعة للمشترك الجديد وفق السياسة المنشورة.' : 'For a new subscriber’s first payment under the published policy.'}</p></article><article><RefreshCw /><h3>{ar ? 'إلغاء التجديد بسهولة' : 'Simple renewal cancellation'}</h3><p>{ar ? 'أوقف التجديد واحتفظ بالوصول حتى نهاية الفترة المدفوعة.' : 'Stop renewal and keep access through the paid period.'}</p></article><article><LockKeyhole /><h3>{ar ? 'أمان وصلاحيات واضحة' : 'Security and clear access'}</h3><p>{ar ? 'حسابات وصلاحيات وسجلات تشغيل تساعد فريقك على حماية السياق.' : 'Accounts, permissions, and operational records help your team protect context.'}</p></article></div></div></section>
    <section className="meruna-faq" aria-labelledby="faq-title"><div className="cf-container"><div className="meruna-faq-heading"><span className="meruna-kicker">{ar ? 'قبل أن تبدأ' : 'BEFORE YOU START'}</span><h2 id="faq-title" className="cf-display">{ar ? 'أسئلة واضحة،' : 'Straight answers,'}<br /><em>{ar ? 'بلا مفاجآت.' : 'no surprises.'}</em></h2><p>{ar ? 'كل ما تحتاجه لاتخاذ قرار واثق قبل طلب العرض.' : 'What you need to make a confident decision before requesting a demo.'}</p></div><div className="meruna-faq-list">{faqs.map(([question, answer], index) => <article key={question} className={open === index ? 'open' : ''}><button type="button" onClick={() => setOpen(open === index ? -1 : index)} aria-expanded={open === index} aria-controls={`faq-${index}`}><span>{question}</span><ChevronDown size={19} /></button><div id={`faq-${index}`} hidden={open !== index}><p>{answer}</p>{index === 3 && <a href="/refund-policy"><Check size={14} />{ar ? 'اقرأ سياسة الاسترداد كاملة' : 'Read the full Refund Policy'}</a>}</div></article>)}</div></div></section>
  </>;
}
