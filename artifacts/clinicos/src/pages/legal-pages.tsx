import { useEffect, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Clock3, Languages, Mail, MapPin, ShieldCheck } from 'lucide-react';
import './meruna-home.css';

type Lang = 'ar' | 'en';
type PageKind = 'refund' | 'privacy' | 'terms' | 'cookies' | 'contact';
type Section = { title: string; body: ReactNode };

const updated = { ar: '25 أغسطس 2026', en: 'August 25, 2026' };

const pageNames: Record<PageKind, { ar: string; en: string }> = {
  refund: { ar: 'سياسة الاسترداد', en: 'Refund Policy' },
  privacy: { ar: 'سياسة الخصوصية', en: 'Privacy Policy' },
  terms: { ar: 'الشروط والأحكام', en: 'Terms & Conditions' },
  cookies: { ar: 'سياسة ملفات الارتباط', en: 'Cookie Policy' },
  contact: { ar: 'تواصل ودعم', en: 'Contact & Support' },
};

const links: Array<{ kind: PageKind; href: string }> = [
  { kind: 'refund', href: '/refund-policy' },
  { kind: 'privacy', href: '/privacy-policy' },
  { kind: 'terms', href: '/terms' },
  { kind: 'cookies', href: '/cookie-policy' },
  { kind: 'contact', href: '/contact' },
];

function paragraphs(lines: string[]) {
  return <>{lines.map((line) => <p key={line}>{line}</p>)}</>;
}

function content(kind: PageKind, lang: Lang): { intro: string; sections: Section[] } {
  const ar = lang === 'ar';
  if (kind === 'refund') return {
    intro: ar ? 'نريد أن تبدأ مع MERUNA بثقة. توضح هذه السياسة متى وكيف يمكنك طلب استرداد قيمة اشتراكك.' : 'We want you to start with MERUNA confidently. This policy explains when and how you may request a subscription refund.',
    sections: ar ? [
      { title: 'ضمان استرداد لمدة 30 يوماً', body: paragraphs(['يمكن للمشترك الجديد طلب استرداد كامل لأول دفعة خلال 30 يوماً تقويمياً من تاريخ الشراء الأول. يسري الضمان مرة واحدة لكل عميل أو مؤسسة، ولا يشمل التجديدات اللاحقة.']) },
      { title: 'طريقة تقديم الطلب', body: paragraphs(['أرسل طلبك إلى meruna.tech@gmail.com من البريد المرتبط بالحساب، وأرفق اسم العيادة، وتاريخ الشراء، وسبب الطلب، ورقم المعاملة إن توفر. سنؤكد استلام الطلب خلال يومي عمل.']) },
      { title: 'المعالجة ووصول المبلغ', body: paragraphs(['نراجع الطلبات المؤهلة عادة خلال 5–10 أيام عمل. بعد الموافقة، يعاد المبلغ إلى وسيلة الدفع الأصلية، وقد يستغرق ظهوره وقتاً إضافياً بحسب البنك أو مزود الدفع.']) },
      { title: 'الاستثناءات والإلغاء', body: paragraphs(['لا يغطي الضمان إساءة الاستخدام، أو مخالفة الشروط، أو المشتريات السابقة، أو الخدمات المخصصة التي بدأ تنفيذها بموافقة العميل. يمكنك إلغاء التجديد في أي وقت، ويظل الوصول فعالاً حتى نهاية مدة الفوترة المدفوعة. لا تنتقص هذه السياسة من أي حقوق إلزامية يمنحها القانون للمستهلك.']) },
    ] : [
      { title: '30-day money-back guarantee', body: paragraphs(['New subscribers may request a full refund of their first payment within 30 calendar days of the initial purchase. The guarantee may be used once per customer or organization and does not cover later renewals.']) },
      { title: 'How to request a refund', body: paragraphs(['Email meruna.tech@gmail.com from the address linked to your account. Include your clinic name, purchase date, reason, and transaction reference when available. We aim to acknowledge requests within two business days.']) },
      { title: 'Review and payment timing', body: paragraphs(['Eligible requests are normally reviewed within 5–10 business days. Approved refunds return to the original payment method and may take additional time to appear depending on your bank or payment provider.']) },
      { title: 'Exceptions and cancellation', body: paragraphs(['The guarantee does not cover abuse, a breach of these terms, previous purchases, or custom services already started with your approval. You may cancel renewal at any time and retain access through the paid billing period. This policy does not limit mandatory consumer rights.']) },
    ],
  };
  if (kind === 'privacy') return {
    intro: ar ? 'تشرح هذه السياسة كيف تتعامل MERUNA مع البيانات اللازمة لتقديم منصة تشغيل العيادات وتحسينها وحمايتها.' : 'This policy explains how MERUNA handles data needed to provide, improve, and protect its clinic operations platform.',
    sections: ar ? [
      { title: 'البيانات التي نجمعها', body: paragraphs(['نجمع بيانات الحساب والتواصل والفوترة، وإعدادات العيادة، والمحتوى الذي يدخله المستخدمون، وبيانات الاستخدام والجهاز والسجلات الفنية. يجب على العيادات ألا تدخل بيانات صحية أو شخصية إلا إذا كان ذلك مشروعاً ومصرحاً به.']) },
      { title: 'كيف نستخدم البيانات', body: paragraphs(['نستخدم البيانات لتشغيل الخدمة، والتحقق من الحسابات، وتقديم الدعم، ومعالجة الفوترة، ومنع الاحتيال، وتحسين الأداء، والوفاء بالالتزامات القانونية. لا نبيع البيانات الشخصية.']) },
      { title: 'المشاركة والاحتفاظ', body: paragraphs(['قد نشارك الحد الأدنى اللازم مع مزودي الاستضافة والدفع والتحليلات والدعم الذين يعملون نيابة عنا، أو عندما يقتضي القانون. نحتفظ بالبيانات طوال مدة الحساب وبقدر ما يلزم للالتزامات الأمنية والقانونية، ثم نحذفها أو نجعلها مجهولة.']) },
      { title: 'حقوقك وأمانك', body: paragraphs(['يمكنك طلب الوصول أو التصحيح أو الحذف أو التقييد بحسب القانون المطبق عبر meruna.tech@gmail.com. نستخدم ضوابط تقنية وتنظيمية مناسبة، لكن لا توجد وسيلة نقل أو تخزين آمنة بنسبة 100%.']) },
    ] : [
      { title: 'Data we collect', body: paragraphs(['We collect account, contact and billing data, clinic settings, user-provided content, usage information, device details, and technical logs. Clinics should only enter health or personal data where they have a lawful basis and authorization.']) },
      { title: 'How we use data', body: paragraphs(['We use data to operate the service, authenticate accounts, provide support, process billing, prevent fraud, improve performance, and meet legal obligations. We do not sell personal data.']) },
      { title: 'Sharing and retention', body: paragraphs(['We may share the minimum required data with hosting, payment, analytics, and support providers acting for us, or where law requires. We retain data while an account is active and as needed for security and legal obligations, then delete or anonymize it.']) },
      { title: 'Your rights and security', body: paragraphs(['You may request access, correction, deletion, or restriction where applicable by emailing meruna.tech@gmail.com. We use appropriate technical and organizational controls, but no transmission or storage method is completely secure.']) },
    ],
  };
  if (kind === 'terms') return {
    intro: ar ? 'تحكم هذه الشروط وصولك إلى خدمات MERUNA واستخدامك لها. باستخدام الخدمة، فإنك توافق عليها.' : 'These terms govern your access to and use of MERUNA services. By using the service, you agree to them.',
    sections: ar ? [
      { title: 'الحساب والاستخدام المقبول', body: paragraphs(['يجب تقديم معلومات صحيحة، وحماية بيانات الدخول، وأن تكون مخولاً بالتصرف نيابة عن المؤسسة. يُحظر إساءة الاستخدام، أو محاولة الوصول غير المصرح، أو تعطيل الخدمة، أو استخدامها بما يخالف القانون أو حقوق الآخرين.']) },
      { title: 'الاشتراك والفوترة', body: paragraphs(['تعرض الأسعار والعملة ومدة الفوترة قبل الشراء. تتجدد الاشتراكات تلقائياً ما لم تُلغ قبل موعد التجديد. قد تعالج Paddle أو جهة دفع معتمدة المدفوعات والضرائب والفواتير بصفتها مزود الدفع أو التاجر المسجل بحسب المعاملة.']) },
      { title: 'الإلغاء والاسترداد', body: paragraphs(['يمكنك إلغاء التجديد في أي وقت ويستمر الوصول حتى نهاية الفترة المدفوعة. تخضع طلبات الاسترداد لسياسة الاسترداد المنشورة، بما فيها ضمان أول دفعة لمدة 30 يوماً.']) },
      { title: 'الملكية والتوافر والمسؤولية', body: paragraphs(['تظل حقوق المنصة والبرمجيات والعلامات مملوكة لـ MERUNA أو مرخصيها، ويحتفظ العميل بحقوق محتواه. نسعى إلى خدمة موثوقة لكن لا نضمن توافراً متواصلاً. الخدمة أداة تشغيلية وليست نصيحة طبية أو بديلاً للحكم المهني. في حدود القانون، تقتصر المسؤولية على المبلغ المدفوع خلال الاثني عشر شهراً السابقة للحدث.']) },
      { title: 'التغييرات والتواصل', body: paragraphs(['قد نحدّث هذه الشروط مع نشر تاريخ جديد، وسنخطر بالتغييرات الجوهرية عند الاقتضاء. للاستفسارات، تواصل عبر meruna.tech@gmail.com.']) },
    ] : [
      { title: 'Accounts and acceptable use', body: paragraphs(['You must provide accurate information, protect login credentials, and be authorized to act for your organization. You may not misuse the service, gain unauthorized access, disrupt it, or use it unlawfully or against others’ rights.']) },
      { title: 'Subscriptions and billing', body: paragraphs(['Price, currency, and billing period are shown before purchase. Subscriptions renew automatically unless cancelled before renewal. Paddle or another approved provider may process payments, tax, and invoices as payment provider or merchant of record for the transaction.']) },
      { title: 'Cancellation and refunds', body: paragraphs(['You may cancel renewal at any time and retain access through the paid period. Refund requests follow our published Refund Policy, including its 30-day first-payment guarantee.']) },
      { title: 'Ownership, availability, and liability', body: paragraphs(['The platform, software, and marks remain owned by MERUNA or its licensors; customers retain rights in their content. We aim for reliable service but do not promise uninterrupted availability. MERUNA is an operations tool, not medical advice or a substitute for professional judgment. To the extent permitted by law, liability is limited to fees paid in the 12 months before the event.']) },
      { title: 'Changes and contact', body: paragraphs(['We may update these terms and publish a new effective date, with notice for material changes where appropriate. Questions may be sent to meruna.tech@gmail.com.']) },
    ],
  };
  if (kind === 'cookies') return {
    intro: ar ? 'توضح هذه السياسة التقنيات المشابهة لملفات الارتباط التي تساعدنا في تشغيل الموقع وحمايته وفهم استخدامه.' : 'This policy describes cookies and similar technologies that help us operate, protect, and understand use of the site.',
    sections: ar ? [
      { title: 'الملفات الضرورية', body: paragraphs(['تدعم تسجيل الدخول والأمان وتفضيلات الجلسة واللغة. لا يمكن تعطيلها من خلال أدوات الموافقة لأنها ضرورية لعمل الخدمة.']) },
      { title: 'التحليلات والتفضيلات', body: paragraphs(['قد نستخدم تحليلات محدودة لفهم أداء الصفحات وتحسين التجربة، وملفات تفضيلات لحفظ اختيارات مثل اللغة والمظهر. لا نستخدم ملفات إعلانية سلوكية حالياً.']) },
      { title: 'التحكم', body: paragraphs(['يمكنك حذف الملفات أو حظرها من إعدادات المتصفح. قد يؤدي حظر الملفات الضرورية إلى توقف أجزاء من الخدمة. عند إضافة أدوات اختيارية جديدة، سنوفر خيارات موافقة مناسبة حيث يلزم.']) },
    ] : [
      { title: 'Strictly necessary cookies', body: paragraphs(['These support sign-in, security, session preferences, and language. They cannot be disabled through consent tools because they are needed for the service to work.']) },
      { title: 'Analytics and preferences', body: paragraphs(['We may use limited analytics to understand page performance and improve the experience, and preference storage for choices such as language and theme. We do not currently use behavioral advertising cookies.']) },
      { title: 'Your controls', body: paragraphs(['You can delete or block cookies in your browser settings. Blocking necessary storage may prevent parts of the service from working. If we add optional tools, we will provide appropriate consent controls where required.']) },
    ],
  };
  return {
    intro: ar ? 'نحن هنا لمساعدة عيادتك قبل الاشتراك وبعده. اختر الطريقة الأنسب وسنعود إليك برسالة واضحة.' : 'We are here to help your clinic before and after subscribing. Reach out and we will respond with a clear next step.',
    sections: ar ? [
      { title: 'الدعم العام والمبيعات', body: paragraphs(['راسلنا على meruna.tech@gmail.com للاستفسارات، وطلبات العرض، ومساعدة الحساب، والفوترة. استخدم البريد المرتبط بحسابك لتسريع التحقق.']) },
      { title: 'طلبات الاسترداد', body: paragraphs(['اكتب «طلب استرداد» في عنوان الرسالة وأرفق اسم العيادة وتاريخ الشراء ورقم المعاملة إن توفر. تطبق شروط سياسة الاسترداد لمدة 30 يوماً.']) },
      { title: 'أوقات الاستجابة', body: paragraphs(['ساعات الدعم المعتادة: الأحد إلى الخميس، 9:00 صباحاً–5:00 مساءً بتوقيت مصر. نهدف للرد خلال يومي عمل. للحوادث الأمنية العاجلة، اكتب «أمان عاجل» في عنوان الرسالة.']) },
    ] : [
      { title: 'General and sales support', body: paragraphs(['Email meruna.tech@gmail.com for questions, demo requests, account help, and billing. Use the email associated with your account to speed up verification.']) },
      { title: 'Refund requests', body: paragraphs(['Use “Refund request” as the subject and include the clinic name, purchase date, and transaction reference when available. Our 30-day Refund Policy conditions apply.']) },
      { title: 'Response times', body: paragraphs(['Normal support hours are Sunday–Thursday, 9:00 AM–5:00 PM Egypt time. We aim to respond within two business days. For urgent security incidents, use “Urgent security” as the subject.']) },
    ],
  };
}

export default function LegalPage({ kind }: { kind: PageKind }) {
  const [lang, setLang] = useState<Lang>('ar');
  const ar = lang === 'ar';
  const page = content(kind, lang);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = `${pageNames[kind][lang]} — MERUNA SYSTEM`;
  }, [kind, lang]);
  return <div className="landing-home legal-page cf-section min-h-[100dvh]" dir={ar ? 'rtl' : 'ltr'}>
    <header className="legal-header"><div className="cf-container flex h-[76px] items-center justify-between gap-4"><a href="/" className="flex items-center gap-3" aria-label="MERUNA SYSTEM home"><img src="/meruna-mark-square.png" alt="" className="meruna-brand-mark" /><strong className="cf-display text-lg">MERUNA <span className="text-[hsl(var(--primary))]">SYSTEM</span></strong></a><div className="flex items-center gap-2"><button type="button" onClick={() => setLang(ar ? 'en' : 'ar')} className="cf-theme-control inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold"><Languages size={15} />{ar ? 'English' : 'العربية'}</button><a href="/" className="cf-button-ghost inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold">{ar ? <ArrowRight size={15} /> : <ArrowLeft size={15} />}{ar ? 'الرئيسية' : 'Home'}</a></div></div></header>
    <main>
      <section className="legal-hero"><div className="cf-container"><span className="meruna-kicker">MERUNA / {kind.toUpperCase()}</span><h1 className="cf-display">{pageNames[kind][lang]}</h1><p>{page.intro}</p><div className="legal-meta"><span><MapPin size={15} />MERUNA — Egypt</span><span><Clock3 size={15} />{ar ? 'آخر تحديث: ' : 'Last updated: '}{updated[lang]}</span></div></div></section>
      <div className="cf-container legal-layout"><aside aria-label={ar ? 'الصفحات القانونية' : 'Legal pages'}>{links.map((link) => <a key={link.kind} href={link.href} className={link.kind === kind ? 'active' : ''}>{pageNames[link.kind][lang]}</a>)}</aside><article className="legal-article">{page.sections.map((section) => <section key={section.title}><h2>{section.title}</h2><div>{section.body}</div></section>)}<div className="legal-contact"><ShieldCheck size={22} /><div><strong>{ar ? 'هل لديك سؤال؟' : 'Have a question?'}</strong><p>{ar ? 'تواصل معنا وسنوضح لك أي جزء من هذه السياسة.' : 'Contact us and we will clarify any part of this policy.'}</p><a href="mailto:meruna.tech@gmail.com"><Mail size={15} />meruna.tech@gmail.com</a></div></div></article></div>
    </main>
    <footer className="legal-footer"><div className="cf-container"><span>© 2026 MERUNA SYSTEM · Egypt</span><nav>{links.slice(0, 4).map((link) => <a key={link.kind} href={link.href}>{pageNames[link.kind][lang]}</a>)}</nav></div></footer>
  </div>;
}
