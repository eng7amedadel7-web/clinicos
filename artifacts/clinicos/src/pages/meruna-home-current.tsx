import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import './meruna-home.css';
import {
  ArrowUpRight,
  BarChart3,
  Bell,
  Bot,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  Headphones,
  Languages,
  Menu,
  MessageCircle,
  Moon,
  Phone,
  Play,
  Plus,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Sun,
  UserRound,
  UsersRound,
  Workflow,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react';

type Lang = 'en' | 'ar';
type Theme = 'dark' | 'light';
type DemoTab = 'capture' | 'book' | 'follow' | 'recover';
type ChatMessage = { from: 'patient' | 'agent'; text: string };

type Copy = {
  nav: { method: string; capabilities: string; voice: string; pricing: string };
  actions: { login: string; demo: string; start: string; explore: string; play: string; send: string; close: string; submit: string };
  hero: { eyebrow: string; title: string; accent: string; body: string; proof: string; clinics: string };
  demo: { live: string; welcome: string; appointments: string; attendance: string; week: string; confirmed: string; newMessage: string };
  trust: { label: string; dental: string; primary: string; networks: string; always: string };
  method: { eyebrow: string; title: string; accent: string; body: string; link: string; stat1: string; stat1Body: string; stat2: string; stat2Body: string };
  capabilities: { eyebrow: string; title: string; accent: string; body: string; cards: { title: string; body: string; tag: string }[] };
  workflow: { eyebrow: string; title: string; accent: string; body: string; items: { title: string; body: string }[] };
  voice: { eyebrow: string; title: string; accent: string; body: string; points: string[]; assistant: string; listening: string; placeholder: string; connected: string };
  pricing: { eyebrow: string; title: string; accent: string; body: string; plan: string; planTitle: string; features: string[]; action: string };
  testimonial: { eyebrow: string; stat: string; statBody: string; quote: string; name: string; role: string };
  cta: { eyebrow: string; title: string; accent: string; body: string; details: string };
  footer: { tagline: string; product: string; company: string; legal: string; privacy: string; terms: string; rights: string };
  modal: { eyebrow: string; title: string; accent: string; body: string; name: string; namePlaceholder: string; contact: string; contactPlaceholder: string; sentTitle: string; sentBody: string; done: string };
  chat: {
    workspace: string;
    live: string;
    tabs: Record<DemoTab, string>;
    patients: string;
    search: string;
    newConversation: string;
    today: string;
    samplePatients: { name: string; detail: string; time: string }[];
    samples: { label: string; messages: ChatMessage[] }[];
    input: string;
    agentName: string;
    agentStatus: string;
    bookingReady: string;
    actionHint: string;
    actionDone: string;
  };
};

const copy: Record<Lang, Copy> = {
  en: {
    nav: { method: 'How it works', capabilities: 'Capabilities', voice: 'AI voice', pricing: 'Plans' },
    actions: { login: 'Sign in', demo: 'Book a demo', start: 'Start a conversation', explore: 'See how it works', play: 'Play voice preview', send: 'Send', close: 'Close', submit: 'Request my demo' },
    hero: { eyebrow: 'CLINIC OPERATIONS / ALWAYS ON', title: 'A calmer way to run', accent: 'any clinic.', body: 'Bring patients, appointments, conversations, AI and daily operations into one clear workspace your whole team can trust.', proof: 'Designed specifically for clinics in Saudi Arabia and the UAE.', clinics: 'WhatsApp & Phone AI Voice Integration' },
    demo: { live: 'LIVE FRONT DESK', welcome: 'Good morning, Dr. Maya', appointments: 'confirmed appointments', attendance: 'attendance rate', week: 'This week', confirmed: 'Appointment confirmed', newMessage: 'New patient message' },
    trust: { label: 'BUILT FOR THE MOMENTS BETWEEN PATIENTS', dental: 'Dental practices', primary: 'Primary care', networks: 'Multi-site networks', always: 'Teams that never close' },
    method: { eyebrow: 'THE OPERATING LAYER', title: 'The front desk is not a place.', accent: 'It is your clinic’s rhythm.', body: 'When calls, messages and follow-ups scatter across a busy team, the patient feels it. MERUNA brings each moment into one calm, accountable layer.', link: 'Explore the workspace', stat1: '−38%', stat1Body: 'fewer missed appointments', stat2: '24/7', stat2Body: 'coverage for every question' },
    capabilities: { eyebrow: 'ONE SYSTEM. EVERY MOMENT.', title: 'Less busywork.', accent: 'More care in motion.', body: 'The essentials work together, so your team can move from the first question to the next visit without losing context.', cards: [
      { title: 'Capture every intent', body: 'Turn calls, forms and conversations into a clear next step before a lead goes quiet.', tag: '01 / CAPTURE' },
      { title: 'Book without back-and-forth', body: 'Let patients find the right slot while your team keeps control of availability and rules.', tag: '02 / BOOK' },
      { title: 'Follow up with context', body: 'Keep thoughtful conversations moving after every appointment, referral and enquiry.', tag: '03 / FOLLOW UP' },
      { title: 'Recover lost moments', body: 'Find no-shows and unfinished conversations early, then give them a simple way back.', tag: '04 / RECOVER' },
    ] },
    workflow: { eyebrow: 'FROM FIRST MESSAGE TO NEXT VISIT', title: 'A patient journey with', accent: 'no dropped threads.', body: 'A single history gives every teammate the confidence to pick up where the last one left off.', items: [
      { title: 'A question arrives', body: 'A patient reaches out in the channel they already use.' },
      { title: 'The right slot appears', body: 'Availability, provider and patient preference line up.' },
      { title: 'The visit is protected', body: 'A relevant reminder makes showing up feel effortless.' },
      { title: 'The relationship continues', body: 'A helpful follow-up creates the next reason to return.' },
    ] },
    voice: { eyebrow: 'THE VOICE OF YOUR CLINIC', title: 'Not a robot reading a script.', accent: 'A teammate who knows when to listen.', body: 'MERUNA understands intent, remembers context and hands sensitive moments to your team. Patients get a natural conversation. Your people get the room to focus.', points: ['Natural conversations in every language', 'Live calendar awareness, not generic answers', 'Human handoff whenever the moment calls for it'], assistant: 'MERUNA voice assistant', listening: 'Listening for the patient', placeholder: 'Patients can speak naturally…', connected: 'Connected now' },
    pricing: { eyebrow: 'START WITH THE WAY YOU WORK', title: 'Begin with one clinic.', accent: 'Scale without the scramble.', body: 'A focused workspace for one location or a connected operating layer for your whole network. We shape the rollout around your reality.', plan: 'PLAN / CLINIC', planTitle: 'Your clinic workspace', features: ['Always-on patient conversations', 'Appointments, reminders and follow-ups', 'Permissions and visibility for every location'], action: 'Talk to our team' },
    testimonial: { eyebrow: 'A NOTE FROM THE FLOOR', stat: '+18 hrs', statBody: 'returned to the front desk each week', quote: 'For the first time, it feels like someone is holding every thread — even when the waiting room is full.', name: 'Dr. Samira Nasser', role: 'Director, Noura Health Network' },
    cta: { eyebrow: 'YOUR NEXT QUIETER DAY', title: 'Give the front desk room to breathe.', accent: 'Give your clinic room to grow.', body: 'A short working session built around your patient flow — not a long sales tour.', details: 'No pressure. Just a clearer view of what could change.' },
    footer: { tagline: 'The operating system for the moments that matter.', product: 'Product', company: 'Company', legal: 'Legal', privacy: 'Privacy', terms: 'Terms', rights: '© 2025 MERUNA. Built for better clinic days.' },
    modal: { eyebrow: 'A WORKING SESSION FOR YOUR CLINIC', title: 'Let’s make the day', accent: 'feel lighter.', body: 'Leave your details and our team will come back with a practical walkthrough in one business day.', name: 'Name and clinic', namePlaceholder: 'Your name · clinic name', contact: 'Work email', contactPlaceholder: 'you@clinic.com', sentTitle: 'Request received.', sentBody: 'We’ll be in touch soon to shape a session around your clinic.', done: 'Back to the page' },
    chat: { workspace: 'MERUNA workspace', live: 'Live demo', tabs: { capture: 'Capture', book: 'Book', follow: 'Follow up', recover: 'Recover' }, patients: 'Conversations', search: 'Search patients', newConversation: 'New conversation', today: 'Today', samplePatients: [{ name: 'Lena Morgan', detail: 'Appointment request', time: '09:41' }, { name: 'Marcus Lee', detail: 'Post-visit follow-up', time: '09:18' }, { name: 'Aisha Patel', detail: 'Missed appointment', time: 'Yesterday' }], samples: [{ label: 'Booking a new visit', messages: [{ from: 'patient', text: 'Hi, I’d like to see Dr. Chen this week.' }, { from: 'agent', text: 'I found Thursday at 4:30 PM. Would you like me to hold it for you?' }] }, { label: 'After a visit', messages: [{ from: 'patient', text: 'The care team was wonderful. What should I do next?' }, { from: 'agent', text: 'I’m glad to hear that. I can share your care notes and arrange the next check-in.' }] }, { label: 'Recovering a missed visit', messages: [{ from: 'patient', text: 'I missed my appointment this morning. I’m sorry.' }, { from: 'agent', text: 'No problem. Let’s find a new time that works for you — I have two options.' }] }], input: 'Write a message…', agentName: 'MERUNA agent', agentStatus: 'Available to help', bookingReady: 'Ready to book', actionHint: 'Choose a workflow above to see MERUNA adapt.', actionDone: 'Workflow selected' },
  },
  ar: {
    nav: { method: 'كيف يعمل', capabilities: 'الإمكانات', voice: 'الصوت الذكي', pricing: 'الخطط' },
    actions: { login: 'تسجيل الدخول', demo: 'احجز عرضاً', start: 'ابدأ محادثة', explore: 'اكتشف كيف يعمل', play: 'شغّل تجربة الصوت', send: 'إرسال', close: 'إغلاق', submit: 'أرسل طلب العرض' },
    hero: { eyebrow: 'تشغيل العيادة / دائماً حاضر', title: 'طريقة أكثر هدوءاً لإدارة', accent: 'أي عيادة.', body: 'اجمع المرضى والمواعيد والمحادثات والذكاء الاصطناعي والعمليات اليومية في مساحة عمل واضحة يثق بها فريقك بالكامل.', proof: 'يثق بنا فريق يهتم بكل لحظة مع المريض.', clinics: 'أكثر من ١٢٠ عيادة في ١٨ دولة' },
    demo: { live: 'الاستقبال مباشر', welcome: 'صباح هادئ، د. مايا', appointments: 'مواعيد مؤكدة', attendance: 'نسبة الحضور', week: 'هذا الأسبوع', confirmed: 'تم تأكيد الموعد', newMessage: 'رسالة مريض جديدة' },
    trust: { label: 'مصمم للحظات بين المرضى', dental: 'عيادات الأسنان', primary: 'الرعاية الأولية', networks: 'شبكات متعددة الفروع', always: 'فرق لا تغلق أبوابها' },
    method: { eyebrow: 'طبقة التشغيل', title: 'الاستقبال ليس مكاناً.', accent: 'إنه إيقاع عيادتك.', body: 'عندما تتوزع الاتصالات والرسائل والمتابعات بين فريق مشغول، يشعر المريض بذلك. يجمع MERUNA كل لحظة في طبقة واحدة هادئة وواضحة.', link: 'اكتشف مساحة العمل', stat1: '−٣٨٪', stat1Body: 'مواعيد فائتة أقل', stat2: '٢٤/٧', stat2Body: 'تغطية لكل سؤال' },
    capabilities: { eyebrow: 'نظام واحد. كل لحظة.', title: 'مهام يومية أقل.', accent: 'رعاية أكثر في الحركة.', body: 'تعمل الأساسيات معاً، لينتقل فريقك من السؤال الأول إلى الزيارة القادمة دون فقدان السياق.', cards: [
      { title: 'التقط كل نية', body: 'حوّل المكالمات والنماذج والمحادثات إلى خطوة واضحة قبل أن يختفي اهتمام المريض.', tag: '٠١ / التقاط' },
      { title: 'احجز بلا رسائل متكررة', body: 'دع المريض يجد الموعد المناسب مع بقاء التحكم بالجدول والقواعد لفريقك.', tag: '٠٢ / حجز' },
      { title: 'تابع بسياق كامل', body: 'حافظ على المحادثات المهمة بعد كل موعد وإحالة واستفسار.', tag: '٠٣ / متابعة' },
      { title: 'استعد اللحظات الضائعة', body: 'اكتشف الغياب والمحادثات غير المكتملة مبكراً وقدم طريقاً بسيطاً للعودة.', tag: '٠٤ / استعادة' },
    ] },
    workflow: { eyebrow: 'من الرسالة الأولى إلى الزيارة القادمة', title: 'رحلة مريض بلا', accent: 'خيوط مفقودة.', body: 'يمنح السجل الواحد كل عضو في الفريق الثقة ليكمل من حيث توقف زميله.', items: [
      { title: 'يصل السؤال', body: 'يتواصل المريض عبر القناة التي يستخدمها عادة.' },
      { title: 'يظهر الموعد المناسب', body: 'يتوافق التوفر والطبيب وتفضيل المريض.' },
      { title: 'تحصل الزيارة على حماية', body: 'تذكير مناسب يجعل الحضور أسهل.' },
      { title: 'تستمر العلاقة', body: 'متابعة مفيدة تفتح سبباً جديداً للعودة.' },
    ] },
    voice: { eyebrow: 'صوت عيادتك', title: 'ليس روبوتاً يقرأ نصاً.', accent: 'إنه زميل يعرف متى يستمع.', body: 'يفهم MERUNA النية ويتذكر السياق ويمرر اللحظات الحساسة إلى فريقك. يحصل المريض على حوار طبيعي، ويحصل فريقك على مساحة للتركيز.', points: ['محادثات طبيعية بكل اللغات', 'وعي مباشر بالتقويم لا إجابات عامة', 'تحويل فوري للفريق عندما تتطلب اللحظة ذلك'], assistant: 'مساعد MERUNA الصوتي', listening: 'يستمع للمريض', placeholder: 'يمكن للمريض التحدث بطبيعته…', connected: 'متصل الآن' },
    pricing: { eyebrow: 'ابدأ بالطريقة التي تعمل بها', title: 'ابدأ بعيادة واحدة.', accent: 'وتوسع بلا فوضى.', body: 'مساحة عمل مركزة لموقع واحد أو طبقة تشغيل مترابطة لشبكتك كلها. نصمم البداية حول واقعك.', plan: 'الخطة / العيادة', planTitle: 'مساحة عيادتك', features: ['محادثات مرضى حاضرة دائماً', 'مواعيد وتذكيرات ومتابعات', 'صلاحيات ورؤية لكل فرع'], action: 'تحدث مع فريقنا' },
    testimonial: { eyebrow: 'من أرض الواقع', stat: '+١٨ ساعة', statBody: 'يستعيدها فريق الاستقبال كل أسبوع', quote: 'لأول مرة أشعر أن هناك من يمسك كل الخيوط، حتى عندما تكون غرفة الانتظار ممتلئة.', name: 'د. سميرة ناصر', role: 'مديرة شبكة نورا الصحية' },
    cta: { eyebrow: 'يومك القادم بهدوء أكبر', title: 'امنح الاستقبال مساحة ليتنفس.', accent: 'وامنح عيادتك مساحة للنمو.', body: 'جلسة قصيرة مبنية حول رحلة مريضك، لا جولة مبيعات طويلة.', details: 'بلا ضغط. فقط رؤية أوضح لما يمكن أن يتغير.' },
    footer: { tagline: 'نظام تشغيل للحظات التي تهم.', product: 'المنتج', company: 'الشركة', legal: 'قانوني', privacy: 'الخصوصية', terms: 'الشروط', rights: '© ٢٠٢٥ MERUNA. لأيام عيادة أفضل.' },
    modal: { eyebrow: 'جلسة عمل لعيادتك', title: 'لنرتب يومك ليصبح', accent: 'أخف.', body: 'اترك بياناتك وسيتواصل معك فريقنا بجولة عملية خلال يوم عمل واحد.', name: 'الاسم والعيادة', namePlaceholder: 'اسمك · اسم العيادة', contact: 'البريد المهني', contactPlaceholder: 'you@clinic.com', sentTitle: 'وصل طلبك.', sentBody: 'سنعود إليك قريباً لنرتب جلسة تناسب عيادتك.', done: 'العودة إلى الصفحة' },
    chat: { workspace: 'مساحة MERUNA', live: 'تجربة مباشرة', tabs: { capture: 'التقاط', book: 'حجز', follow: 'متابعة', recover: 'استعادة' }, patients: 'المحادثات', search: 'ابحث عن مريض', newConversation: 'محادثة جديدة', today: 'اليوم', samplePatients: [{ name: 'لينا مورغان', detail: 'طلب موعد', time: '٠٩:٤١' }, { name: 'ماركوس لي', detail: 'متابعة بعد الزيارة', time: '٠٩:١٨' }, { name: 'عائشة باتل', detail: 'موعد فائت', time: 'أمس' }], samples: [{ label: 'حجز زيارة جديدة', messages: [{ from: 'patient', text: 'مرحباً، أريد زيارة د. تشين هذا الأسبوع.' }, { from: 'agent', text: 'وجدت لك الخميس الساعة ٤:٣٠. هل أحتفظ بالموعد لك؟' }] }, { label: 'بعد الزيارة', messages: [{ from: 'patient', text: 'كان فريق الرعاية رائعاً. ماذا أفعل الآن؟' }, { from: 'agent', text: 'سعيدون بسماع ذلك. يمكنني مشاركة ملاحظات الرعاية وترتيب المتابعة القادمة.' }] }, { label: 'استعادة موعد فائت', messages: [{ from: 'patient', text: 'فاتني موعدي هذا الصباح، أعتذر.' }, { from: 'agent', text: 'لا مشكلة. لنجد وقتاً جديداً يناسبك — لدي خياران.' }] }], input: 'اكتب رسالة…', agentName: 'وكيل MERUNA', agentStatus: 'متاح للمساعدة', bookingReady: 'جاهز للحجز', actionHint: 'اختر مساراً لترى كيف يتكيف MERUNA.', actionDone: 'تم اختيار المسار' },
  },
};

const capabilityIcons: LucideIcon[] = [MessageCircle, CalendarDays, Bell, ShieldCheck];
const workflowIcons: LucideIcon[] = [MessageCircle, CalendarDays, Bell, ArrowUpRight];
const tabIcons: Record<DemoTab, LucideIcon> = { capture: MessageCircle, book: CalendarDays, follow: Workflow, recover: Zap };

import { BrandMark as MerunaMark } from "@/components/brand";

function BrandMark() {
  return (
    <span className="flex items-center gap-2.5" dir="ltr">
      <MerunaMark size={30} />
      <span className="cf-display text-[18px] font-extrabold tracking-[.14em]">MERUNA</span>
    </span>
  );
}

function Eyebrow({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return <div className={`cf-mono mb-5 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[.1em] ${light ? 'text-[hsl(214_25%_67%)]' : 'text-[hsl(var(--primary))]'}`}><span className="h-px w-8 bg-[hsl(var(--accent))]" /><span>{children}</span></div>;
}

function PrimaryButton({ children, onClick, className = '', type = 'button', testId }: { children: ReactNode; onClick?: () => void; className?: string; type?: 'button' | 'submit'; testId: string }) {
  return <button type={type} onClick={onClick} data-testid={testId} className={`cf-button-primary group inline-flex items-center justify-center gap-3 rounded-full px-6 py-3.5 text-[13px] font-bold shadow-[0_12px_30px_hsl(var(--primary)/.2)] transition-all duration-300 hover:-translate-y-1 ${className}`}>{children}<ArrowUpRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></button>;
}

function App() {
  const [lang, setLang] = useState<Lang>('en');
  const [theme, setTheme] = useState<Theme>('dark');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [demoSent, setDemoSent] = useState(false);
  const [activeTab, setActiveTab] = useState<DemoTab>('capture');
  const [sampleIndex, setSampleIndex] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [toast, setToast] = useState('');
  const t = copy[lang];
  const isArabic = lang === 'ar';

  useEffect(() => {
    const storedTheme = window.localStorage.getItem('meruna-theme') as Theme | null;
    const storedLang = window.localStorage.getItem('meruna-language') as Lang | null;
    if (storedTheme === 'light' || storedTheme === 'dark') setTheme(storedTheme);
    if (storedLang === 'en' || storedLang === 'ar') setLang(storedLang);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = isArabic ? 'MERUNA — تشغيل عيادتك بهدوء' : 'MERUNA — A calmer way to run any clinic';
    window.localStorage.setItem('meruna-theme', theme);
    window.localStorage.setItem('meruna-language', lang);
  }, [theme, lang, isArabic]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const activeSample = useMemo(() => t.chat.samples[sampleIndex], [t, sampleIndex]);
  const currentMessages = messages.length ? messages : activeSample.messages;

  const openDemo = () => {
    setDemoSent(false);
    setDemoOpen(true);
    setMobileOpen(false);
  };

  const selectTab = (tab: DemoTab) => {
    const nextIndex = tab === 'book' ? 0 : tab === 'follow' ? 1 : tab === 'recover' ? 2 : 0;
    setActiveTab(tab);
    setSampleIndex(nextIndex);
    setMessages([]);
    setToast(`${t.chat.actionDone}: ${t.chat.tabs[tab]}`);
  };

  const sendMessage = (event?: FormEvent) => {
    event?.preventDefault();
    const text = messageInput.trim();
    if (!text) return;
    setMessages((current) => [...(current.length ? current : activeSample.messages), { from: 'patient', text }, { from: 'agent', text: isArabic ? 'شكراً لتوضيحك. سأراجع الخيارات المتاحة وأعود إليك بخطوة واضحة الآن.' : 'Thanks for sharing that. I’ll check the best options and come back with a clear next step.' }]);
    setMessageInput('');
  };

  return (
    <div className={`landing-home ${theme === 'dark' ? 'is-dark' : ''} ${isArabic ? 'is-arabic' : ''} cf-page cf-grain cf-section min-h-[100dvh]`} dir="ltr">
      <header className="fixed inset-x-0 top-0 z-30 border-b border-[hsl(var(--border)/.65)] bg-[hsl(var(--background)/.8)] backdrop-blur-xl">
        <div className="cf-container flex h-[76px] items-center justify-between">
          <a href="#top" data-testid="link-brand" aria-label="MERUNA home"><BrandMark /></a>
          <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
            {([['method', '#how-it-works'], ['capabilities', '#capabilities'], ['voice', '#voice'], ['pricing', '#pricing']] as const).map(([key, href]) => <a key={href} href={href} data-testid={`link-nav-${key}`} className="cf-link text-[12px] font-semibold text-[hsl(var(--muted-foreground))]">{t.nav[key]}</a>)}
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            <button type="button" onClick={() => setLang(lang === 'en' ? 'ar' : 'en')} data-testid="button-language" aria-label={isArabic ? 'تبديل اللغة' : 'Switch language'} className="cf-theme-control inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-bold transition-colors hover:border-[hsl(var(--primary))]"><Languages className="size-3.5" />{lang === 'en' ? 'عربي' : 'EN'}</button>
            <button type="button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} data-testid="button-theme" aria-label="Toggle theme" className="cf-theme-control flex size-9 items-center justify-center rounded-full transition-colors hover:border-[hsl(var(--primary))]">{theme === 'dark' ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}</button>
            <a href="/login" data-testid="button-login" className="px-3 text-[12px] font-bold text-[hsl(var(--muted-foreground))] transition-colors hover:text-[hsl(var(--primary))]">{t.actions.login}</a>
            <PrimaryButton onClick={openDemo} testId="button-header-demo" className="px-5 py-2.5 text-[12px]">{t.actions.demo}</PrimaryButton>
          </div>
          <button type="button" onClick={() => setMobileOpen((open) => !open)} data-testid="button-mobile-menu" aria-expanded={mobileOpen} aria-label={mobileOpen ? t.actions.close : (isArabic ? 'فتح القائمة' : 'Open menu')} className="cf-theme-control flex size-10 items-center justify-center rounded-full md:hidden">{mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}</button>
        </div>
        {mobileOpen && <div className="cf-container mt-1 rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/.97)] p-4 shadow-[var(--shadow-float)] md:hidden">
          <nav className="flex flex-col gap-1">
            {([['method', '#how-it-works'], ['capabilities', '#capabilities'], ['voice', '#voice'], ['pricing', '#pricing']] as const).map(([key, href]) => <a key={href} href={href} onClick={() => setMobileOpen(false)} data-testid={`link-mobile-${key}`} className="rounded-xl px-4 py-3 text-[13px] font-bold text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]">{t.nav[key]}</a>)}
            <div className="mt-2 flex items-center gap-2 border-t border-[hsl(var(--border))] pt-3">
              <button type="button" onClick={() => setLang(lang === 'en' ? 'ar' : 'en')} data-testid="button-mobile-language" className="cf-button-ghost flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-3 text-[12px] font-bold"><Languages className="size-4" />{lang === 'en' ? 'العربية' : 'English'}</button>
              <button type="button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} data-testid="button-mobile-theme" className="cf-button-ghost flex size-11 items-center justify-center rounded-xl">{theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}</button>
            </div>
                          <a href="/login" onClick={() => setMobileOpen(false)} data-testid="button-mobile-login" className="cf-button-ghost mt-2 flex items-center justify-center rounded-xl px-4 py-3 text-[13px] font-bold">{t.actions.login}</a><button type="button" onClick={openDemo} data-testid="button-mobile-demo" className="cf-button-primary mt-2 rounded-xl px-4 py-3 text-[13px] font-bold">{t.actions.demo}</button>

          </nav>
        </div>}
      </header>

      <main id="top">
        <section className="cf-hero relative overflow-hidden pb-24 pt-32 md:pb-32 md:pt-44">
          <div className="absolute inset-0 cf-grid-paper opacity-45" />
          <div className="absolute -right-40 top-[-190px] size-[600px] rounded-full bg-[hsl(var(--primary)/.08)] blur-3xl" />
          <div className="absolute -left-48 bottom-[-300px] size-[620px] rounded-full border-[90px] border-[hsl(var(--accent)/.08)]" />
          <div className="cf-container relative grid items-center gap-16 lg:grid-cols-[.84fr_1.16fr] lg:gap-20">
            <div className={`${isArabic ? 'text-right' : 'text-left'} order-2 lg:order-1`}>
              <Eyebrow>{t.hero.eyebrow}</Eyebrow>
              <h1 className="cf-display cf-reveal max-w-[650px] text-[44px] font-extrabold leading-[1.12] tracking-[-.065em] sm:text-[60px] md:text-[74px]">{t.hero.title}<br /><span className="text-[hsl(var(--primary))]">{t.hero.accent}</span></h1>
              <p className="cf-reveal cf-reveal-delay-1 mt-7 max-w-[570px] text-[16px] leading-[1.8] text-[hsl(var(--muted-foreground))] md:text-[18px]">{t.hero.body}</p>
              <div className="cf-reveal cf-reveal-delay-2 mt-9 flex flex-wrap items-center gap-4">
                <PrimaryButton onClick={openDemo} testId="button-hero-demo">{t.actions.start}</PrimaryButton>
                <a href="#how-it-works" data-testid="link-hero-method" className="group inline-flex items-center gap-2 px-2 py-3 text-[12px] font-bold text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))]"><span className="flex size-8 items-center justify-center rounded-full border border-[hsl(var(--border))] transition-colors group-hover:border-[hsl(var(--primary))]"><Play className="size-3 fill-current" /></span>{t.actions.explore}</a>
              </div>
              <div className="cf-reveal cf-reveal-delay-3 mt-10 flex items-center gap-3 text-[11px] text-[hsl(var(--muted-foreground))]"><div className="flex -space-x-2" dir="ltr">{['LM', 'MK', 'AP', 'SN'].map((initial, index) => <span key={initial} className={`flex size-8 items-center justify-center rounded-full border-2 border-[hsl(var(--hero))] text-[9px] font-bold text-white ${index % 2 ? 'bg-[hsl(var(--primary))]' : 'bg-[hsl(var(--accent))]'}`}>{initial}</span>)}</div><span><strong className="text-[hsl(var(--foreground))]">{t.hero.clinics}</strong><br />{t.hero.proof}</span></div>
            </div>
            <ProductPreview t={t} activeTab={activeTab} selectTab={selectTab} currentMessages={currentMessages} messageInput={messageInput} setMessageInput={setMessageInput} sendMessage={sendMessage} sampleIndex={sampleIndex} setSampleIndex={(index) => { setSampleIndex(index); setMessages([]); }} />
          </div>
        </section>

        <section className="border-y border-[hsl(var(--border))] bg-[hsl(var(--card))] py-7">
          <div className="cf-container flex flex-col items-center justify-between gap-5 md:flex-row"><p className="cf-mono text-[9px] font-bold uppercase tracking-[.14em] text-[hsl(var(--muted-foreground))]">{t.trust.label}</p><div className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-[11px] font-bold text-[hsl(var(--muted-foreground))] md:gap-x-10"><span className="flex items-center gap-2"><UserRound className="size-4 text-[hsl(var(--primary))]" />{t.trust.dental}</span><span className="flex items-center gap-2"><StethoscopeIcon />{t.trust.primary}</span><span className="flex items-center gap-2"><UsersRound className="size-4 text-[hsl(var(--accent))]" />{t.trust.networks}</span><span className="flex items-center gap-2"><Moon className="size-4 text-[hsl(var(--primary))]" />{t.trust.always}</span></div></div>
        </section>

        <section id="how-it-works" className="cf-section py-28 md:py-36">
          <div className="cf-container grid gap-16 lg:grid-cols-[.82fr_1.18fr] lg:items-end"><div><Eyebrow>{t.method.eyebrow}</Eyebrow><h2 className="cf-display max-w-[500px] text-[38px] font-extrabold leading-[1.12] tracking-[-.06em] md:text-[53px]">{t.method.title}<br /><span className="text-[hsl(var(--primary))]">{t.method.accent}</span></h2><p className="mt-6 max-w-[470px] text-[15px] leading-[1.9] text-[hsl(var(--muted-foreground))]">{t.method.body}</p><a href="#capabilities" data-testid="link-discover-capabilities" className="group mt-8 inline-flex items-center gap-3 text-[12px] font-bold text-[hsl(var(--primary))]"><span className="flex size-8 items-center justify-center rounded-full border border-[hsl(var(--primary)/.35)] transition-colors group-hover:bg-[hsl(var(--primary))] group-hover:text-white"><ChevronRight className="size-4" /></span>{t.method.link}</a></div><div className="grid gap-4 sm:grid-cols-2"><article className="cf-hover-lift cf-blue-soft rounded-[26px] border border-[hsl(var(--primary)/.16)] p-7 sm:translate-y-10"><Clock3 className="mb-12 size-7 text-[hsl(var(--primary))]" /><div className="cf-mono mb-2 text-[30px] font-bold text-[hsl(var(--foreground))]">{t.method.stat1}</div><h3 className="cf-display text-[20px] font-extrabold">{t.method.stat1Body}</h3><p className="mt-3 text-[12px] leading-[1.8] text-[hsl(var(--muted-foreground))]">{isArabic ? 'تذكيرات في القناة المناسبة، بالوقت الذي يستجيب فيه المريض.' : 'Relevant reminders, delivered when a patient is ready to respond.'}</p></article><article className="cf-hover-lift cf-lime-soft rounded-[26px] border border-[hsl(var(--accent)/.18)] p-7"><Zap className="mb-12 size-7 text-[hsl(var(--accent))]" /><div className="cf-mono mb-2 text-[30px] font-bold text-[hsl(var(--foreground))]">{t.method.stat2}</div><h3 className="cf-display text-[20px] font-extrabold">{t.method.stat2Body}</h3><p className="mt-3 text-[12px] leading-[1.8] text-[hsl(var(--muted-foreground))]">{isArabic ? 'لا توجد ساعات ميتة. كل سؤال يجد طريقاً.' : 'No dead hours. Every question finds a clear next step.'}</p></article></div></div>
        </section>

        <section id="capabilities" className="cf-navy relative overflow-hidden py-28 md:py-36"><div className="absolute inset-0 cf-navy-grid opacity-35" /><div className="cf-container relative"><div className="mb-16 flex flex-col justify-between gap-7 md:flex-row md:items-end"><div><Eyebrow light>{t.capabilities.eyebrow}</Eyebrow><h2 className="cf-display max-w-[630px] text-[38px] font-extrabold leading-[1.12] tracking-[-.06em] md:text-[53px]">{t.capabilities.title}<br /><span className="text-[hsl(var(--primary))]">{t.capabilities.accent}</span></h2></div><p className="cf-body-muted max-w-[320px] text-[13px] leading-[1.85]">{t.capabilities.body}</p></div><div className="grid gap-4 md:grid-cols-2">{t.capabilities.cards.map((item, index) => { const Icon = capabilityIcons[index]; return <article key={item.tag} className="cf-hover-lift group relative min-h-[250px] overflow-hidden rounded-[26px] border border-white/[.1] bg-white/[.045] p-7"><div className="flex items-start justify-between"><span className="cf-mono text-[9px] text-[hsl(214_25%_67%)]">{item.tag}</span><span className={`flex size-11 items-center justify-center rounded-2xl ${index === 1 ? 'bg-[hsl(var(--primary))] text-white' : 'bg-white/[.08] text-[hsl(var(--accent))]'} transition-transform duration-300 group-hover:rotate-[-8deg]`}><Icon className="size-5" /></span></div><div className="absolute -bottom-16 -left-12 size-44 rounded-full border border-white/10 transition-transform duration-500 group-hover:scale-125" /><div className="relative mt-16 max-w-[360px]"><h3 className="cf-display text-[23px] font-extrabold">{item.title}</h3><p className="mt-3 text-[13px] leading-[1.85] text-[hsl(214_22%_70%)]">{item.body}</p></div></article>; })}</div></div></section>

        <section id="voice" className="cf-tint py-28 md:py-36"><div className="cf-container grid items-center gap-16 lg:grid-cols-[1.05fr_.95fr]"><VoicePreview t={t} onPlay={() => setToast(t.actions.play)} /><div><Eyebrow>{t.voice.eyebrow}</Eyebrow><h2 className="cf-display text-[38px] font-extrabold leading-[1.12] tracking-[-.06em] md:text-[51px]">{t.voice.title}<br /><span className="text-[hsl(var(--primary))]">{t.voice.accent}</span></h2><p className="mt-6 max-w-[500px] text-[15px] leading-[1.9] text-[hsl(var(--muted-foreground))]">{t.voice.body}</p><div className="mt-9 space-y-3">{t.voice.points.map((item) => <div key={item} className="flex items-center gap-3 text-[12px] font-bold"><span className="flex size-6 items-center justify-center rounded-full bg-[hsl(var(--primary)/.13)] text-[hsl(var(--primary))]"><Check className="size-3.5" /></span>{item}</div>)}</div></div></div></section>

        <section className="cf-section py-28 md:py-36"><div className="cf-container"><div className="mb-14 flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><Eyebrow>{t.workflow.eyebrow}</Eyebrow><h2 className="cf-display text-[38px] font-extrabold leading-[1.12] tracking-[-.06em] md:text-[50px]">{t.workflow.title}<br /><span className="text-[hsl(var(--primary))]">{t.workflow.accent}</span></h2></div><p className="cf-body-muted max-w-[330px] text-[13px] leading-[1.85]">{t.workflow.body}</p></div><div className="relative grid gap-4 md:grid-cols-4"><div className="absolute right-[12%] left-[12%] top-[47px] hidden h-px bg-[hsl(var(--border))] md:block" />{t.workflow.items.map((item, index) => { const Icon = workflowIcons[index]; return <article key={item.title} className="cf-hover-lift cf-card relative rounded-[24px] border p-6"><div className="relative z-10 mb-14 flex items-center justify-between"><span className="cf-mono text-[10px] text-[hsl(var(--primary))]">0{index + 1}</span><span className="flex size-10 items-center justify-center rounded-xl bg-[hsl(var(--tint))] text-[hsl(var(--primary))]"><Icon className="size-4" /></span></div><h3 className="cf-display text-[19px] font-extrabold">{item.title}</h3><p className="cf-body-muted mt-3 text-[12px] leading-[1.85]">{item.body}</p></article>; })}</div></div></section>

        <section id="pricing" className="cf-blue-soft py-24 md:py-28"><div className="cf-container grid items-center gap-10 lg:grid-cols-[1fr_.8fr]"><div><Eyebrow>{t.pricing.eyebrow}</Eyebrow><h2 className="cf-display max-w-[610px] text-[38px] font-extrabold leading-[1.12] tracking-[-.06em] md:text-[51px]">{t.pricing.title}<br /><span className="text-[hsl(var(--primary))]">{t.pricing.accent}</span></h2><p className="cf-body-muted mt-6 max-w-[480px] text-[15px] leading-[1.9]">{t.pricing.body}</p></div><div className="cf-card rounded-[26px] border p-6 shadow-[var(--shadow-soft)] md:p-8"><div className="flex items-start justify-between border-b border-[hsl(var(--border))] pb-5"><div><span className="cf-mono text-[9px] text-[hsl(var(--primary))]">{t.pricing.plan}</span><h3 className="cf-display mt-2 text-[23px] font-extrabold">{t.pricing.planTitle}</h3></div><Sparkles className="size-6 text-[hsl(var(--accent))]" /></div><div className="space-y-4 py-6">{t.pricing.features.map((item) => <div key={item} className="flex items-center gap-3 text-[12px] font-bold"><CheckCircle2 className="size-4 text-[hsl(var(--primary))]" />{item}</div>)}</div><PrimaryButton onClick={openDemo} testId="button-pricing-demo" className="w-full justify-center">{t.pricing.action}</PrimaryButton></div></div></section>

        <section className="cf-navy py-28 md:py-36"><div className="cf-container grid gap-14 lg:grid-cols-[.7fr_1.3fr] lg:items-end"><div><Eyebrow light>{t.testimonial.eyebrow}</Eyebrow><div className="cf-mono text-[44px] font-bold text-[hsl(var(--primary))]">{t.testimonial.stat}</div><p className="mt-2 text-[12px] text-[hsl(214_22%_68%)]">{t.testimonial.statBody}</p></div><blockquote className="cf-display max-w-[780px] text-[25px] font-semibold leading-[1.45] text-[hsl(214_33%_94%)] md:text-[35px]">“{t.testimonial.quote}”<footer className="mt-7 flex items-center gap-3 font-sans text-[11px] not-italic text-[hsl(214_22%_68%)]"><span className="flex size-9 items-center justify-center rounded-full bg-[hsl(var(--primary))] text-[10px] font-bold text-white">SN</span><span><strong className="block text-[hsl(214_33%_94%)]">{t.testimonial.name}</strong><span>{t.testimonial.role}</span></span></footer></blockquote></div></section>

        <section className="cf-tint relative overflow-hidden py-28 text-center md:py-36"><div className="absolute right-[-80px] top-[-120px] size-[350px] rounded-full border-[55px] border-[hsl(var(--primary)/.1)]" /><div className="absolute bottom-[-160px] left-[-100px] size-[390px] rounded-full border-[65px] border-[hsl(var(--accent)/.1)]" /><div className="cf-container relative"><Eyebrow>{t.cta.eyebrow}</Eyebrow><h2 className="cf-display mx-auto max-w-[760px] text-[40px] font-extrabold leading-[1.12] tracking-[-.06em] md:text-[58px]">{t.cta.title}<br /><span className="text-[hsl(var(--primary))]">{t.cta.accent}</span></h2><p className="cf-body-muted mx-auto mt-6 max-w-[510px] text-[15px] leading-[1.9]">{t.cta.body}</p><div className="mt-9 flex flex-wrap justify-center gap-3"><PrimaryButton onClick={openDemo} testId="button-final-demo">{t.actions.demo}</PrimaryButton><button type="button" onClick={() => setToast(t.cta.details)} data-testid="button-final-contact" className="cf-button-ghost inline-flex items-center justify-center rounded-full px-5 py-3 text-[12px] font-bold transition-colors">{t.cta.details}</button></div></div></section>
      </main>

      <footer className="cf-card border-t py-10"><div className="cf-container flex flex-col items-center justify-between gap-7 md:flex-row"><div><BrandMark /><p className="cf-body-muted mt-4 max-w-[240px] text-[11px] leading-[1.7]">{t.footer.tagline}</p></div><div className="flex items-center gap-6 text-[11px] font-bold text-[hsl(var(--muted-foreground))]"><button type="button" onClick={() => setToast(`${t.footer.product}: ${t.nav.capabilities}`)} data-testid="button-footer-product" className="hover:text-[hsl(var(--primary))]">{t.footer.product}</button><button type="button" onClick={() => setToast(`${t.footer.company}: MERUNA`)} data-testid="button-footer-company" className="hover:text-[hsl(var(--primary))]">{t.footer.company}</button><button type="button" onClick={() => setToast(`${t.footer.legal}: ${t.footer.privacy}, ${t.footer.terms}`)} data-testid="button-footer-legal" className="hover:text-[hsl(var(--primary))]">{t.footer.legal}</button></div><p className="cf-mono text-[8px] text-[hsl(var(--muted-foreground))]">{t.footer.rights}</p></div></footer>

      {toast && <div role="status" aria-live="polite" data-testid="status-toast" className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full bg-[hsl(var(--navy))] px-5 py-3 text-[11px] font-bold text-white shadow-[0_15px_35px_hsl(var(--navy)/.28)]"><CheckCircle2 className="size-4 text-[hsl(var(--accent))]" />{toast}</div>}
      {demoOpen && <DemoModal t={t} sent={demoSent} setSent={setDemoSent} onClose={() => setDemoOpen(false)} />}
    </div>
  );
}

function StethoscopeIcon() {
  return <Headphones className="size-4 text-[hsl(var(--primary))]" />;
}

function ProductPreview({ t, activeTab, selectTab, currentMessages, messageInput, setMessageInput, sendMessage, sampleIndex, setSampleIndex }: { t: Copy; activeTab: DemoTab; selectTab: (tab: DemoTab) => void; currentMessages: ChatMessage[]; messageInput: string; setMessageInput: (value: string) => void; sendMessage: (event?: FormEvent) => void; sampleIndex: number; setSampleIndex: (index: number) => void }) {
  return <div className="order-1 relative lg:order-2"><div className="absolute -right-4 top-[-24px] z-10 hidden items-center gap-2 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card)/.9)] px-3 py-2 text-[9px] font-bold shadow-[var(--shadow-soft)] backdrop-blur sm:flex"><span className="size-2 rounded-full bg-[hsl(var(--accent))]" />{t.demo.newMessage}</div><div className="cf-dash-shadow overflow-hidden rounded-[25px] border border-white/[.12] bg-[hsl(var(--panel))] text-[hsl(214_33%_94%)]"><div className="flex items-center justify-between border-b border-white/[.1] px-5 py-4"><div className="flex items-center gap-2" dir="ltr"><span className="size-2 rounded-full bg-[#f07161]" /><span className="size-2 rounded-full bg-[#d5aa5f]" /><span className="size-2 rounded-full bg-[#69c49a]" /></div><div className="flex items-center gap-2 text-[9px] text-[hsl(214_25%_67%)]"><span className="size-1.5 rounded-full bg-[hsl(var(--accent))]" />{t.chat.live}</div></div><div className="border-b border-white/[.1] px-4 py-3"><div className="mb-3 flex items-center justify-between"><span className="text-[10px] font-bold text-[hsl(214_25%_76%)]">{t.chat.workspace}</span><Settings2 className="size-3.5 text-[hsl(214_25%_55%)]" /></div><div className="grid grid-cols-4 gap-1.5">{(Object.keys(t.chat.tabs) as DemoTab[]).map((tab) => { const Icon = tabIcons[tab]; return <button key={tab} type="button" onClick={() => selectTab(tab)} data-testid={`button-demo-tab-${tab}`} className={`flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[9px] font-bold transition-colors ${activeTab === tab ? 'bg-[hsl(var(--primary))] text-white' : 'text-[hsl(214_25%_68%)] hover:bg-white/[.07]'}`}><Icon className="size-3.5" />{t.chat.tabs[tab]}</button>; })}</div></div><div className="grid min-h-[390px] sm:grid-cols-[.72fr_1.28fr]"><aside className="hidden border-e border-white/[.1] p-4 sm:block"><div className="mb-4 flex items-center justify-between"><span className="text-[10px] font-bold">{t.chat.patients}</span><Plus className="size-3 text-[hsl(var(--primary))]" /></div><div className="mb-4 flex items-center gap-2 rounded-lg bg-white/[.06] px-2.5 py-2 text-[9px] text-[hsl(214_25%_55%)]"><MessageCircle className="size-3" />{t.chat.search}</div><div className="space-y-1">{t.chat.samplePatients.map((patient, index) => <button type="button" key={patient.name} onClick={() => { setSampleIndex(index); }} data-testid={`button-patient-${index}`} className={`w-full rounded-xl p-2.5 text-start transition-colors ${sampleIndex === index ? 'bg-white/[.1]' : 'hover:bg-white/[.05]'}`}><div className="flex items-center justify-between"><span className="text-[10px] font-bold">{patient.name}</span><span className="cf-mono text-[8px] text-[hsl(214_25%_52%)]">{patient.time}</span></div><span className="mt-1 block truncate text-[9px] text-[hsl(214_25%_58%)]">{patient.detail}</span></button>)}</div></aside><div className="flex min-w-0 flex-col p-4 sm:p-5"><div className="mb-5 flex items-center justify-between"><div className="flex items-center gap-2"><span className="flex size-8 items-center justify-center rounded-full bg-[hsl(var(--primary))] text-white"><Bot className="size-4" /></span><span><strong className="block text-[10px]">{t.chat.agentName}</strong><small className="text-[8px] text-[hsl(var(--accent))]">{t.chat.agentStatus}</small></span></div><span className="rounded-full bg-[hsl(var(--accent)/.13)] px-2 py-1 text-[8px] font-bold text-[hsl(var(--accent))]">{t.chat.bookingReady}</span></div><div className="cf-chat-scroll flex min-h-[190px] flex-1 flex-col gap-3 overflow-y-auto pr-1">{currentMessages.map((message, index) => <div key={`${message.from}-${index}`} data-testid={`text-chat-message-${index}`} className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[10px] leading-[1.7] ${message.from === 'agent' ? 'self-start rounded-bl-sm bg-[hsl(var(--primary))] text-white' : 'self-end rounded-br-sm bg-white/[.09] text-[hsl(214_28%_84%)]'}`}>{message.text}</div>)}</div><form onSubmit={sendMessage} className="mt-4 flex items-center gap-2 rounded-xl border border-white/[.12] bg-white/[.04] p-1.5"><input value={messageInput} onChange={(event) => setMessageInput(event.target.value)} data-testid="input-chat-message" aria-label={t.chat.input} placeholder={t.chat.input} className="min-w-0 flex-1 bg-transparent px-2 text-[10px] text-white outline-none placeholder:text-[hsl(214_25%_50%)]" /><button type="submit" data-testid="button-send-chat" aria-label={t.actions.send} className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--primary))] text-white transition-transform hover:scale-105"><Send className="size-3.5" /></button></form></div></div></div></div>;
}

function VoicePreview({ t, onPlay }: { t: Copy; onPlay: () => void }) {
  return <div className="relative"><div className="absolute -inset-5 rounded-[42px] border border-[hsl(var(--primary)/.15)]" /><div className="cf-card relative overflow-hidden rounded-[30px] border p-5 shadow-[var(--shadow-soft)] md:p-7"><div className="mb-6 flex items-center justify-between"><span className="cf-mono text-[9px] text-[hsl(var(--muted-foreground))]">VOICE PREVIEW / GLOBAL</span><span className="flex items-center gap-2 text-[9px] font-bold text-[hsl(var(--accent))]"><span className="size-2 animate-pulse rounded-full bg-[hsl(var(--accent))]" />{t.voice.connected}</span></div><div className="rounded-[22px] bg-[hsl(var(--tint))] p-5"><div className="mb-7 flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-full bg-[hsl(var(--navy))] text-[hsl(var(--primary))]"><Phone className="size-5" /></span><div><strong className="block text-[12px]">{t.voice.assistant}</strong><span className="text-[9px] text-[hsl(var(--muted-foreground))]">{t.voice.listening}</span></div><div className="ms-auto flex items-end gap-1" dir="ltr">{[12, 23, 17, 30, 20, 13, 26].map((height, index) => <span key={index} className="w-1 rounded-full bg-[hsl(var(--primary))]" style={{ height }} />)}</div></div><div className="space-y-3"><div className="max-w-[82%] rounded-2xl rounded-bl-sm bg-[hsl(var(--navy))] px-4 py-3 text-[11px] leading-[1.75] text-[hsl(214_33%_94%)]">{t.voice.listening}</div><div className="ms-auto max-w-[82%] rounded-2xl rounded-br-sm bg-[hsl(var(--card))] px-4 py-3 text-[11px] leading-[1.75] text-[hsl(var(--muted-foreground))]">{isArabicText(t) ? 'أحتاج مساعدة في موعدي القادم.' : 'I need help with my next appointment.'}</div><div className="max-w-[82%] rounded-2xl rounded-bl-sm bg-[hsl(var(--navy))] px-4 py-3 text-[11px] leading-[1.75] text-[hsl(214_33%_94%)]">{isArabicText(t) ? 'بالطبع. سأراجع الموعد وأخبرك بالخطوة التالية.' : 'Of course. I’ll check your appointment and share the next step.'}</div></div></div><div className="mt-5 flex items-center justify-between rounded-2xl border border-[hsl(var(--border))] px-4 py-3"><span className="text-[10px] text-[hsl(var(--muted-foreground))]">{t.voice.placeholder}</span><button type="button" onClick={onPlay} data-testid="button-voice-play" aria-label={t.actions.play} className="flex size-9 items-center justify-center rounded-full bg-[hsl(var(--primary))] text-white transition-transform hover:scale-105"><Play className="size-3 fill-current" /></button></div></div></div>;
}

function isArabicText(t: Copy) {
  return t === copy.ar;
}

function DemoModal({ t, sent, setSent, onClose }: { t: Copy; sent: boolean; setSent: (value: boolean) => void; onClose: () => void }) {
  return <div className="cf-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="demo-title"><div className="cf-modal relative w-full max-w-[500px] rounded-[30px] border p-6 shadow-[0_30px_90px_hsl(var(--navy)/.35)] md:p-8"><button type="button" onClick={onClose} data-testid="button-close-demo" aria-label={t.actions.close} className="cf-button-ghost absolute end-5 top-5 flex size-9 items-center justify-center rounded-full"><X className="size-4" /></button>{!sent ? <><div className="mb-7 flex size-12 items-center justify-center rounded-2xl bg-[hsl(var(--navy))] text-[hsl(var(--primary))]"><Phone className="size-5" /></div><Eyebrow>{t.modal.eyebrow}</Eyebrow><h2 id="demo-title" className="cf-display text-[29px] font-extrabold leading-[1.12]">{t.modal.title}<br /><span className="text-[hsl(var(--primary))]">{t.modal.accent}</span></h2><p className="cf-body-muted mt-4 text-[13px] leading-[1.8]">{t.modal.body}</p><form className="mt-7 space-y-3" onSubmit={(event) => { event.preventDefault(); setSent(true); }}><label className="block"><span className="mb-1.5 block text-[10px] font-bold text-[hsl(var(--muted-foreground))]">{t.modal.name}</span><input required data-testid="input-demo-name" className="cf-input w-full rounded-2xl px-4 py-3 text-[12px]" placeholder={t.modal.namePlaceholder} /></label><label className="block"><span className="mb-1.5 block text-[10px] font-bold text-[hsl(var(--muted-foreground))]">{t.modal.contact}</span><input required type="email" data-testid="input-demo-contact" className="cf-input w-full rounded-2xl px-4 py-3 text-[12px]" placeholder={t.modal.contactPlaceholder} /></label><button type="submit" data-testid="button-submit-demo" className="cf-button-primary mt-3 flex w-full items-center justify-center gap-2 rounded-full px-5 py-3.5 text-[12px] font-bold"><Send className="size-4" />{t.actions.submit}</button></form></> : <div className="py-12 text-center"><span className="mx-auto flex size-16 items-center justify-center rounded-full bg-[hsl(var(--lime-soft))] text-[hsl(var(--accent))]"><Check className="size-7" /></span><h2 className="cf-display mt-6 text-[28px] font-extrabold">{t.modal.sentTitle}</h2><p className="cf-body-muted mx-auto mt-3 max-w-[290px] text-[13px] leading-[1.8]">{t.modal.sentBody}</p><button type="button" onClick={onClose} data-testid="button-finish-demo" className="cf-button-ghost mt-7 rounded-full px-5 py-2.5 text-[11px] font-bold">{t.modal.done}</button></div>}</div></div>;
}

export default App;