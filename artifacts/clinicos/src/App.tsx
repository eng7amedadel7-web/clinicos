import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  ArrowLeft, ArrowUpLeft, Bell, Bot, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight,
  Clock3, Headphones, Inbox, Instagram, LayoutDashboard, Link2, LockKeyhole, Menu, MessageCircle,
  MessageSquareText, MoreHorizontal, PhoneCall, Plus, Search, Send, Settings2, ShieldCheck, Sparkles,
  Stethoscope, Target, TrendingUp, UserRound, UsersRound, WandSparkles, X, Zap,
} from 'lucide-react';
import { Link, Route, Switch, Router as WouterRouter, useLocation } from 'wouter';

const queryClient = new QueryClient();

const Logo = ({ light = false }: { light?: boolean }) => (
  <Link href="/" className="brand" data-testid="link-brand">
    <span className="brand-mark">C</span>
    <span style={light ? { color: 'hsl(var(--sidebar-foreground))' } : undefined}>ClinicOS</span>
  </Link>
);

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="header">
      <div className="container-wide header-inner">
        <Logo />
        <nav className={`nav-links ${menuOpen ? 'mobile-open' : ''}`} aria-label="التنقل الرئيسي">
          <a href="#platform" data-testid="link-platform">المنصة</a>
          <a href="#journey" data-testid="link-journey">كيف تعمل</a>
          <Link href="/pricing" data-testid="link-pricing">الأسعار</Link>
          <a href="#faq" data-testid="link-faq">الأسئلة الشائعة</a>
        </nav>
        <div className="header-actions">
          <Link href="/login" className="button button-ghost" data-testid="link-login">تسجيل الدخول</Link>
          <Link href="/trial" className="button button-primary" data-testid="link-start-trial">ابدأ تجربتك</Link>
          <button className="icon-button mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="فتح القائمة" data-testid="button-mobile-menu">
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container-wide footer-row">
        <div><Logo /><p>نظام التشغيل الذي يمنح عيادتك وقتاً أكبر للعناية.</p></div>
        <div className="footer-links">
          <Link href="/pricing" data-testid="link-footer-pricing">الأسعار</Link>
          <Link href="/trial" data-testid="link-footer-trial">ابدأ التجربة</Link>
          <a href="mailto:hello@clinicos.co" data-testid="link-footer-email">تواصل معنا</a>
        </div>
      </div>
    </footer>
  );
}

function Home() {
  const [openFaq, setOpenFaq] = useState(0);
  const faqs = [
    ['هل أحتاج إلى تغيير أدواتي الحالية؟', 'لا. يتصل ClinicOS بقنواتك الحالية ويجمعها في مساحة واحدة. يمكنك البدء بالحجز والرسائل، ثم إضافة الأتمتة والتحليلات تدريجياً دون توقف عمل العيادة.'],
    ['هل يتحدث المساعد الذكي العربية؟', 'نعم. يفهم اللهجات العربية الشائعة ويتنقل بين العربية والإنجليزية في نفس المحادثة، مع تحويل المحادثة لموظفك في أي لحظة.'],
    ['ماذا يحدث بعد انتهاء التجربة؟', 'تبقى بياناتك محفوظة، وتختار الخطة المناسبة لك. لا نطلب بطاقة ائتمانية للبدء ولا نفعّل أي اشتراك تلقائياً.'],
    ['هل يدعم أكثر من فرع؟', 'تبدأ الفروع المتعددة في خطة Pro، مع صلاحيات مستقلة، تقارير موحدة، وجدول مركزي لكل فريقك.'],
  ];
  return (
    <div className="site-shell" dir="rtl">
      <Header />
      <main>
        <section className="hero">
          <div className="container-wide hero-grid">
            <div className="reveal">
              <span className="eyebrow">نظام تشغيل العيادات الذكي</span>
              <h1 className="display">عيادتك تعمل.<br /><em>وأنت تطوّرها.</em></h1>
              <p className="hero-copy">ClinicOS يوحّد الحجوزات، المحادثات، المتابعة، والبيانات في نظام واحد يفهم إيقاع عيادتك — ليقضي فريقك وقتاً أكبر مع المرضى.</p>
              <div className="hero-actions">
                <Link href="/trial" className="button button-primary" data-testid="button-hero-trial">ابدأ 10 أيام مجاناً <ArrowLeft size={16} /></Link>
                <a href="#platform" className="button button-ghost" data-testid="link-hero-platform">اكتشف المنصة <ArrowUpLeft size={16} /></a>
              </div>
              <div className="hero-note"><ShieldCheck size={15} /> لا تحتاج بطاقة ائتمانية <span>·</span> إعداد في دقائق</div>
            </div>
            <div className="hero-visual reveal delay-2" aria-label="معاينة لوحة ClinicOS">
              <div className="orbit" />
              <div className="float-chip chip-one"><Bot size={16} /> الذكاء الاصطناعي متاح</div>
              <div className="float-chip chip-two"><TrendingUp size={16} /> +18% حجوزات هذا الشهر</div>
              <div className="float-chip chip-three"><Clock3 size={16} /> تذكير أُرسل تلقائياً</div>
              <div className="hero-panel">
                <div className="panel-top"><strong>صباح الخير، د. ليان</strong><span className="live-dot" /></div>
                <div className="panel-summary"><div><span>حجوزات اليوم</span><b>47</b></div><span>الثلاثاء، 14 مايو</span></div>
                <div className="sparkline" aria-label="رسم بياني للحجوزات">{[38,52,45,71,57,82,93,74,100].map((h, i) => <span key={i} style={{ height: `${h}%` }} />)}</div>
                <div className="inbox-card"><div className="inbox-avatar">ن</div><div><b>نورا تسأل عن موعد متاح</b><p>رد ذكي مقترح · واتساب</p></div><ChevronLeft size={15} /></div>
              </div>
            </div>
          </div>
        </section>
        <section className="logo-strip">
          <div className="container-wide"><p>موثوق من فرق الرعاية التي ترفض أن تضيع أي فرصة</p><div className="logos"><span>مركز توازن</span><span>العيادة 23</span><span>نواة الطبية</span><span>NOOR CLINIC</span><span>د.سارة</span></div></div>
        </section>
        <section id="platform" className="section-pad">
          <div className="container-wide">
            <div className="section-heading"><div><span className="eyebrow">كل شيء في مكانه</span><h2>من أول رسالة<br />إلى عودة المريض.</h2></div><p>بدلاً من سبع أدوات لا تتحدث مع بعضها، مساحة واحدة تجعل كل تفاعل واضحاً وقابلاً للتطوير.</p></div>
            <div className="feature-layout">
              <article className="feature-card large"><div className="feature-icon"><Bot size={22} /></div><h3>الذكاء الاصطناعي،<br />مع لمسة إنسانية.</h3><p>يجيب ClinicOS على الأسئلة المتكررة، يقترح المواعيد، ويجمع المعلومات قبل الزيارة. وعندما يحتاج المريض إنساناً، ينتقل الحوار بسلاسة إلى فريقك.</p><div className="thread"><div className="thread-row"><div className="thread-bullet">م</div><div><b>مريم · قبل دقيقة</b><p>أحتاج موعداً لتنظيف الأسنان هذا الأسبوع</p></div></div><div className="thread-row ai"><div className="thread-bullet"><Sparkles size={13} /></div><div><b>ClinicOS · اقتراح ذكي</b><p>أهلاً مريم، لدينا الخميس 5:30 أو السبت 11:00. أيهما يناسبك؟</p></div></div></div><ArrowLeft className="feature-arrow" size={19} /></article>
              <article className="feature-card"><div className="feature-icon"><CalendarDays size={21} /></div><h3>حجز بلا احتكاك</h3><p>جدول حيّ، تذكيرات تلقائية، واسترداد ذكي للمواعيد الملغاة.</p><ArrowLeft className="feature-arrow" size={19} /></article>
              <article className="feature-card"><div className="feature-icon"><MessageSquareText size={21} /></div><h3>صندوق وارد موحّد</h3><p>واتساب، إنستغرام، ماسنجر وتلغرام في محادثة واحدة.</p><ArrowLeft className="feature-arrow" size={19} /></article>
              <article className="feature-card"><div className="feature-icon"><PhoneCall size={21} /></div><h3>وكيل صوتي لا ينام</h3><p>يرد على المكالمات، يؤكد الموعد، ويرسل الموقع بعد الحجز.</p><ArrowLeft className="feature-arrow" size={19} /></article>
              <article className="feature-card"><div className="feature-icon"><Target size={21} /></div><h3>رحلات متابعة</h3><p>تذكير، متابعة، وتقييم في اللحظة التي تصنع الفرق.</p><ArrowLeft className="feature-arrow" size={19} /></article>
            </div>
          </div>
        </section>
        <div className="marquee-wrap" aria-hidden="true"><div className="marquee"><span>احجز بذكاء</span><span>تابع بإنسانية</span><span>انمُ بثقة</span><span>احجز بذكاء</span><span>تابع بإنسانية</span><span>انمُ بثقة</span></div></div>
        <section id="journey" className="section-pad journey">
          <div className="container-wide journey-grid">
            <div className="journey-statement"><span className="eyebrow">تجربة المريض</span><h2>كل تفصيلة تقول: نحن نهتم.</h2><p>الثقة لا تبدأ عند باب العيادة. تبدأ من سرعة الرد، وضوح الموعد، ورسالة صغيرة تصل في الوقت الصحيح.</p><Link href="/trial" className="button button-dark" data-testid="button-journey-trial">جرّب ClinicOS الآن <ArrowLeft size={16} /></Link></div>
            <div className="steps">
              <div className="step"><div className="step-number">01</div><div><h3>استقبل من أي قناة</h3><p>يصل المريض من واتساب أو إنستغرام أو مكالمة. يظهر كل شيء لفريقك في ملف واحد، مع تاريخ المحادثة كاملاً.</p></div></div>
              <div className="step"><div className="step-number">02</div><div><h3>دع الذكاء يرتّب الأولويات</h3><p>يفهم ClinicOS نية المريض، يصنّف المحادثة، ويقترح أفضل رد أو موعد — مع إشراف فريقك دائماً.</p></div></div>
              <div className="step"><div className="step-number">03</div><div><h3>اجعل العودة عادة</h3><p>بعد الحجز، يُرسل الموقع تلقائياً. وبعد الزيارة، تبدأ رحلة متابعة مصممة على نوع الخدمة.</p></div></div>
            </div>
          </div>
        </section>
        <section className="section-pad">
          <div className="container-wide">
            <div className="section-heading"><div><span className="eyebrow">قنواتك، بصوت واحد</span><h2>لا تجعل المريض<br />يبحث عنك.</h2></div><p>اجعل الوصول إليك سهلاً أينما بدأ الحوار. رد واحد، سجل واحد، وفريق واحد.</p></div>
            <div className="channels-grid">
              {[['واتساب','المحادثات التي تتحول إلى مواعيد',MessageCircle],['إنستغرام','اجعل كل تعليق بداية',Instagram],['ماسنجر','رد أسرع، ثقة أكبر',MessageSquareText],['تلغرام','موجودون حيث هم',Send]].map(([name, desc, Icon], i) => { const ChannelIcon = Icon as typeof MessageCircle; return <div className="channel" key={i}><div className="channel-icon"><ChannelIcon size={18} /></div><b>{name as string}</b><span>{desc as string}</span></div>; })}
            </div>
          </div>
        </section>
        <section className="dashboard-showcase">
          <div className="container-wide">
            <div className="dash-copy"><div><span className="eyebrow" style={{ color: 'hsl(var(--sidebar-primary))' }}>وضوح في كل قرار</span><h2>لوحة واحدة تجعل يومك أهدأ.</h2></div><p>مؤشرات مباشرة، فريق يعرف ما عليه فعله، ومحادثات لا تسقط بين الشقوق.</p></div>
            <div className="dashboard-frame"><DashboardWindow /></div>
          </div>
        </section>
        <section className="section-pad">
          <div className="container-wide testimonial-grid"><div className="quote-card"><blockquote>«لأول مرة أشعر أن فريق الاستقبال يعمل من نفس الصفحة. لم نعد نطارد الرسائل، بل نعتني بالمرضى.»</blockquote><div className="quote-author"><div className="quote-avatar">ل</div><div><b>د. ليان الحربي</b><small>مؤسسة مركز توازن الطبي · الرياض</small></div></div></div><div className="metric-card"><span className="eyebrow">الأثر في أول شهر</span><b>+31%</b><p>زيادة في الحجوزات المكتملة بعد تفعيل التذكيرات واسترداد المواعيد.</p></div></div>
        </section>
        <section id="faq" className="section-pad" style={{ paddingTop: 20 }}>
          <div className="container-narrow"><div className="section-heading" style={{ display: 'block', marginBottom: 35 }}><span className="eyebrow">أسئلة واضحة</span><h2>قبل أن تبدأ،<br />نعطيك الإجابة.</h2></div><div className="faq-list">{faqs.map(([q, a], i) => <div className="faq-item" key={q}><button className="faq-q" onClick={() => setOpenFaq(openFaq === i ? -1 : i)} data-testid={`button-faq-${i}`}><span>{q}</span>{openFaq === i ? <ChevronDown size={18} /> : <ChevronLeft size={18} />}</button>{openFaq === i && <div className="faq-a" data-testid={`text-faq-answer-${i}`}>{a}</div>}</div>)}</div></div>
        </section>
        <section className="cta"><div className="container-wide"><div className="cta-box"><h2>عيادة أفضل تبدأ<br />بقرار واحد واضح.</h2><Link href="/trial" className="button button-dark" data-testid="button-cta-trial">ابدأ تجربتك المجانية <ArrowLeft size={16} /></Link></div></div></section>
      </main>
      <Footer />
    </div>
  );
}

function DashboardWindow() {
  return <div className="dash-window" dir="ltr"><aside className="dash-sidebar"><div className="dash-side-brand"><i>C</i> ClinicOS</div><div className="dash-nav"><div className="active"><LayoutDashboard size={13} /> نظرة عامة</div><div><CalendarDays size={13} /> الحجوزات</div><div><Inbox size={13} /> صندوق الوارد <span style={{ marginRight: 'auto', color: 'hsl(var(--accent))' }}>6</span></div><div><UsersRound size={13} /> المرضى</div><div><TrendingUp size={13} /> التقارير</div></div></aside><div className="dash-main"><div className="dash-main-top"><div><h3>نظرة عامة</h3><p>الثلاثاء، 14 مايو 2024</p></div><div className="dash-actions"><div className="dash-mini"><CalendarDays size={12} /> هذا الأسبوع</div><div className="dash-mini filled"><Plus size={13} /> حجز جديد</div></div></div><div className="dash-cards"><div className="dash-stat"><span>مواعيد اليوم</span><b>47</b><em>↑ 12%</em></div><div className="dash-stat"><span>نسبة الحضور</span><b>93.4%</b><em>↑ 4.2%</em></div><div className="dash-stat"><span>محادثات مفتوحة</span><b>18</b><em>6 تحتاج رداً</em></div></div><div className="dash-table"><div className="dash-table-head"><span>المريض</span><span>الخدمة</span><span>الوقت</span><span>الحالة</span></div>{[['نورة العتيبي','استشارة جلدية','09:30','مؤكد'],['عبدالله سالم','تنظيف أسنان','10:15','قيد الانتظار'],['سارة منصور','متابعة تقويم','11:00','مؤكد']].map(([name, service, time, status], i) => <div className="dash-table-row" key={i}><div className="patient"><div className="patient-dot">{name[0]}</div>{name}</div><span>{service}</span><span className="mono">{time}</span><span className="status">{status}</span></div>)}</div></div></div>;
}

const plans = [
  { name: 'Starter', arabic: 'للبداية المنظمة', monthly: 79, description: 'كل الأساسيات لعيادة تنمو بثبات.', features: ['حجوزات وتذكيرات ذكية', 'صندوق وارد موحّد لقناتين', 'ملفات المرضى والفريق', 'تقارير شهرية'] },
  { name: 'Growth', arabic: 'للنمو المقصود', monthly: 179, description: 'الأدوات التي تحول الزيارات إلى علاقة.', features: ['كل ما في Starter', 'كل القنوات: واتساب وإنستغرام وغيرها', 'رحلات متابعة واسترداد الغياب', 'وكيل صوتي بـ 250 دقيقة', 'تحليلات المحادثات والسمعة'], featured: true },
  { name: 'Pro', arabic: 'للتشغيل الكامل', monthly: 349, description: 'قوة ClinicOS كاملة لفرق متعددة الفروع.', features: ['كل ما في Growth', 'فروع وصلاحيات غير محدودة', 'وكيل صوتي بـ 1,000 دقيقة', 'أتمتة مخصصة وواجهة API', 'مدير نجاح مخصص'] },
];

function Pricing() {
  const [annual, setAnnual] = useState(true);
  return <div className="site-shell" dir="rtl"><Header /><main><section className="page-hero"><span className="eyebrow">أسعار بسيطة، قيمة واضحة</span><h1 className="display">اختر مساحة<br /><em style={{ color: 'hsl(var(--primary))' }}>لنمو عيادتك.</em></h1><p>ابدأ بلا بطاقة ائتمانية. غيّر خطتك عندما يتغير احتياجك. كل خطة تشمل تجربة كاملة لمدة 10 أيام.</p><div className="billing-toggle"><button className={!annual ? 'active' : ''} onClick={() => setAnnual(false)} data-testid="button-billing-monthly">شهري</button><button className={annual ? 'active' : ''} onClick={() => setAnnual(true)} data-testid="button-billing-annual">سنوي <span className="save-pill">وفّر 20%</span></button></div></section><section className="container-wide"><div className="pricing-grid">{plans.map((plan) => { const price = annual ? Math.round(plan.monthly * .8) : plan.monthly; return <article className={`price-card ${plan.featured ? 'featured' : ''}`} key={plan.name}>{plan.featured && <span className="choice-badge">اختيار العيادات الأكثر نمواً</span>}<span className="eyebrow">{plan.arabic}</span><h3>{plan.name}</h3><p className="desc">{plan.description}</p><div className="price">${price}<small> / شهر</small></div><div className="annual-note">{annual ? `يُدفع سنوياً · ${price * 12}$ سنوياً` : 'مرونة شهرية كاملة'}</div><div className="feature-list">{plan.features.map((feature) => <div key={feature}><Check size={15} /> <span>{feature}</span></div>)}</div><Link href="/trial" className={`button ${plan.featured ? 'button-primary' : 'button-ghost'}`} data-testid={`button-plan-${plan.name.toLowerCase()}`}>ابدأ تجربتك <ArrowLeft size={15} /></Link></article>; })}</div></section><section className="section-pad" style={{ paddingTop: 20 }}><div className="container-narrow"><div className="faq-list"><div className="faq-item"><div className="faq-q"><span>هل هناك رسوم إعداد؟</span><Check size={18} /></div><div className="faq-a">لا توجد رسوم إعداد. نساعدك على نقل فريقك وقنواتك خلال التجربة المجانية.</div></div><div className="faq-item"><div className="faq-q"><span>هل يمكنني الإلغاء في أي وقت؟</span><Check size={18} /></div><div className="faq-a">نعم، يمكنك الإلغاء أو تغيير الخطة من إعدادات حسابك دون التزام طويل.</div></div></div></div></section></main><Footer /></div>;
}

function Trial() {
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(() => localStorage.getItem('clinicos-trial-started') === 'true');
  const [form, setForm] = useState({ name: '', email: '', clinic: '', specialty: 'عيادة أسنان', size: '1–5' });
  const update = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [key]: event.target.value });
  const finish = (event: React.FormEvent) => { event.preventDefault(); if (step < 2) setStep(2); else { localStorage.setItem('clinicos-trial-started', 'true'); setDone(true); } };
  return <div className="trial-page" dir="rtl"><aside className="trial-aside"><Logo light /><h1>10 أيام لترى<br />الفرق بنفسك.</h1><p>جهّز عيادتك في دقائق، واكتشف كيف يصبح التشغيل اليومي أخف وأكثر وضوحاً.</p><div className="trial-benefits"><div className="trial-benefit"><Check size={16} /> وصول كامل لكل الميزات</div><div className="trial-benefit"><Check size={16} /> بدون بطاقة ائتمانية</div><div className="trial-benefit"><Check size={16} /> بياناتك تبقى لك</div></div></aside><main className="trial-main"><div className="trial-top"><Link href="/" className="button button-ghost" style={{ padding: '8px 12px' }} data-testid="link-trial-back"><ChevronRight size={15} /> العودة</Link><span className="mono" style={{ fontSize: '.68rem', color: 'hsl(var(--muted-foreground))' }}>CLINICOS / START</span></div>{done ? <div className="trial-success"><div className="success-mark"><Check size={31} /></div><h2>أهلاً بك في ClinicOS.</h2><p>حسابك جاهز. سنبدأ معك بإعداد بسيط يجعل أول يوم مفيداً، وليس مزدحماً.</p><div className="setup-card"><div className="setup-row"><Check size={16} /> مساحة <b>{form.clinic || 'عيادتك'}</b> تم إنشاؤها</div><div className="setup-row"><Check size={16} /> التجربة الكاملة تنتهي بعد 10 أيام</div><div className="setup-row"><Sparkles size={16} /> نوصي بالبدء بإضافة ساعات العمل</div></div><Link href="/app" className="button button-primary" style={{ marginTop: 25, width: '100%' }} data-testid="button-enter-app">ادخل إلى لوحة العيادة <ArrowLeft size={16} /></Link></div> : <><div className="progress" aria-label="تقدم التسجيل"><span className="active" /><span className={step === 2 ? 'active' : ''} /></div><form className="trial-form" onSubmit={finish}>{step === 1 ? <><span className="eyebrow">الخطوة الأولى من اثنتين</span><h2>لنبدأ من الأساس.</h2><p>أخبرنا عنك، لنصمم أول شاشة بما يناسب عيادتك.</p><div className="form-grid"><div className="field"><label htmlFor="name">اسمك الكامل</label><input id="name" required value={form.name} onChange={update('name')} placeholder="مثال: د. ليان الحربي" data-testid="input-trial-name" /></div><div className="field"><label htmlFor="email">البريد الإلكتروني</label><input id="email" type="email" required value={form.email} onChange={update('email')} placeholder="name@clinic.com" data-testid="input-trial-email" /></div><div className="field full"><label htmlFor="clinic">اسم العيادة</label><input id="clinic" required value={form.clinic} onChange={update('clinic')} placeholder="مثال: مركز توازن الطبي" data-testid="input-trial-clinic" /></div></div></> : <><span className="eyebrow">الخطوة الثانية من اثنتين</span><h2>صمّم أول يوم لك.</h2><p>خطوتان صغيرتان تساعدان ClinicOS على أن يكون مفيداً من اللحظة الأولى.</p><div className="form-grid"><div className="field"><label htmlFor="specialty">نوع العيادة</label><select id="specialty" value={form.specialty} onChange={update('specialty')} data-testid="select-trial-specialty"><option>عيادة أسنان</option><option>جلدية وتجميل</option><option>عيادة عامة</option><option>علاج طبيعي</option><option>تخصص آخر</option></select></div><div className="field"><label htmlFor="size">حجم الفريق</label><select id="size" value={form.size} onChange={update('size')} data-testid="select-trial-size"><option>1–5</option><option>6–15</option><option>16–40</option><option>أكثر من 40</option></select></div></div></>}<div className="form-foot"><small>بالاستمرار، أنت توافق على شروط الاستخدام<br />ونتعهد ألا نرسل لك ما لا تحتاجه.</small><button type="submit" className="button button-primary" data-testid="button-trial-next">{step === 1 ? 'التالي' : 'أنشئ حسابي المجاني'} <ArrowLeft size={16} /></button></div></form></>}</main></div>;
}

function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const submit = (event: React.FormEvent) => { event.preventDefault(); setSubmitted(true); setTimeout(() => setLocation('/app'), 550); };
  return <div className="auth-page" dir="rtl"><div className="auth-card reveal"><Logo /><h1>مرحباً بعودتك.</h1><p>أكمل يومك من حيث توقفت.</p>{submitted ? <div className="app-empty" style={{ minHeight: 150 }}><Sparkles size={24} /><p>جارٍ فتح مساحة عيادتك...</p></div> : <form className="auth-form" onSubmit={submit}><div className="field"><label htmlFor="login-email">البريد الإلكتروني</label><input id="login-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@clinic.com" data-testid="input-login-email" /></div><div className="field"><label htmlFor="login-password">كلمة المرور</label><input id="login-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" data-testid="input-login-password" /></div><div style={{ textAlign: 'left' }}><a href="mailto:support@clinicos.co" className="text-muted" style={{ fontSize: '.7rem' }} data-testid="link-forgot-password">نسيت كلمة المرور؟</a></div><button type="submit" className="button button-primary" data-testid="button-login-submit">دخول إلى ClinicOS <ArrowLeft size={16} /></button></form>}<p className="auth-switch">ليس لديك حساب؟ <Link href="/trial" data-testid="link-login-trial">ابدأ تجربتك المجانية</Link></p></div></div>;
}

function AppDashboard() {
  const [active, setActive] = useState('overview');
  const [toast, setToast] = useState('');
  const navItems: [string, string, typeof LayoutDashboard][] = [['overview', 'نظرة عامة', LayoutDashboard], ['bookings', 'الحجوزات', CalendarDays], ['inbox', 'صندوق الوارد', Inbox], ['patients', 'المرضى', UsersRound], ['reports', 'التقارير', TrendingUp], ['settings', 'الإعدادات', Settings2]];
  const notify = (text: string) => { setToast(text); setTimeout(() => setToast(''), 2200); };
  return <div className="app-layout" dir="rtl"><aside className="app-sidebar"><Logo light /><span className="app-label">مساحة العيادة</span><nav className="app-nav">{navItems.map(([key, label, Icon]) => <button className={active === key ? 'active' : ''} onClick={() => { setActive(key); notify(`تم فتح ${label}`); }} key={key} data-testid={`button-app-${key}`}><Icon size={16} /><span>{label}</span>{key === 'inbox' && <small style={{ marginRight: 'auto', color: 'hsl(var(--accent))' }}>6</small>}</button>)}</nav><div className="app-sidebar-bottom"><div className="clinic-switch"><div className="clinic-avatar">ت</div><div><strong>مركز توازن الطبي</strong><small>الفرع الرئيسي</small></div><MoreHorizontal size={14} style={{ marginRight: 'auto' }} /></div></div></aside><main className="app-main"><div className="app-top"><div><h1>{active === 'overview' ? 'نظرة عامة' : navItems.find((item) => item[0] === active)?.[1]}</h1><p>صباح هادئ، د. ليان. إليك ما يحدث في عيادتك اليوم.</p></div><div className="app-top-actions"><button className="icon-button" onClick={() => notify('لا توجد تنبيهات جديدة')} data-testid="button-app-notifications"><Bell size={17} /></button><button className="button button-primary" onClick={() => notify('تم فتح نموذج حجز جديد')} data-testid="button-app-new-booking"><Plus size={16} /> حجز جديد</button></div></div>{active === 'overview' ? <><div className="app-overview"><div className="overview-card"><header><span>مواعيد اليوم</span><CalendarDays size={15} /></header><b>47</b><small>↑ 12% من الأسبوع الماضي</small></div><div className="overview-card"><header><span>نسبة الحضور</span><ShieldCheck size={15} /></header><b>93.4%</b><small>↑ 4.2% هذا الشهر</small></div><div className="overview-card"><header><span>محادثات مفتوحة</span><Inbox size={15} /></header><b>18</b><small>6 تحتاج رداً</small></div><div className="overview-card"><header><span>تقييم العيادة</span><Sparkles size={15} /></header><b>4.8</b><small>من 126 تقييماً</small></div></div><div className="app-content-grid"><section className="app-panel"><header><h2>المواعيد القادمة</h2><button onClick={() => notify('تم فتح كل المواعيد')} data-testid="button-view-all-appointments">عرض الكل <ChevronLeft size={12} /></button></header>{[['09:30','نورة العتيبي','استشارة جلدية','مؤكد'],['10:15','عبدالله سالم','تنظيف أسنان','قيد الانتظار'],['11:00','سارة منصور','متابعة تقويم','مؤكد'],['12:30','خالد يوسف','فحص أولي','مؤكد']].map(([time, name, service, status], i) => <div className="appointment" key={i}><span className="appointment-time">{time}</span><div className="appointment-info"><strong>{name}</strong><span>{service}</span></div><span className={`appointment-status ${status === 'قيد الانتظار' ? 'pending' : ''}`}>{status}</span></div>)}</section><section className="app-panel"><header><h2>آخر المحادثات</h2><button onClick={() => { setActive('inbox'); notify('تم فتح صندوق الوارد'); }} data-testid="button-view-inbox">صندوق الوارد <ChevronLeft size={12} /></button></header><div className="inbox-preview"><div className="inbox-card"><div className="inbox-avatar">ن</div><div><b>نورا العتيبي</b><p>هل يمكنني تغيير موعدي إلى...</p></div><span className="channel-label">واتساب</span></div><div className="inbox-card"><div className="inbox-avatar" style={{ background: 'hsl(var(--secondary))' }}>م</div><div><b>مريم السالم</b><p>شكراً، أراكِ الخميس.</p></div><span className="channel-label">إنستغرام</span></div><div className="inbox-card"><div className="inbox-avatar" style={{ background: 'hsl(var(--primary)/.18)', color: 'hsl(var(--primary))' }}><Bot size={15} /></div><div><b>ClinicOS</b><p>تم إرسال موقع العيادة تلقائياً</p></div><span className="channel-label">آلي</span></div></div></section></div></> : <div className="app-empty"><Inbox size={30} /><h2>{navItems.find((item) => item[0] === active)?.[1]}</h2><p>هذه المساحة جاهزة لفريقك. عد إلى النظرة العامة لترى ملخص يومك.</p><button className="button button-primary" onClick={() => setActive('overview')} data-testid="button-back-overview">العودة للنظرة العامة</button></div>}{toast && <div style={{ position: 'fixed', bottom: 24, left: 24, background: 'hsl(var(--sidebar))', color: 'hsl(var(--sidebar-foreground))', borderRadius: 10, padding: '12px 16px', fontSize: '.78rem', boxShadow: 'var(--shadow-md)' }} data-testid="status-app-toast">{toast}</div>}</main></div>;
}

function NotFound() {
  return <div className="notfound" dir="rtl"><div><Logo light /><h1>404</h1><p>هذه الصفحة أخذت استراحة قصيرة.</p><Link href="/" className="button button-primary" data-testid="link-notfound-home">العودة إلى ClinicOS <ArrowLeft size={16} /></Link></div></div>;
}

function RoutedErrorBoundary({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function Router() {
  return <RoutedErrorBoundary><Switch><Route path="/" component={Home} /><Route path="/pricing" component={Pricing} /><Route path="/trial" component={Trial} /><Route path="/login" component={Login} /><Route path="/app" component={AppDashboard} /><Route path="/faq" component={Home} /><Route component={NotFound} /></Switch></RoutedErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;