import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import './meruna-home.css';
import { ChannelSignalSection, MomentumMarquee, PatientJourneySection } from './meruna-home-inspired';
import HomeTrustSections from './meruna-home-trust';
import {
  HowItWorksSection,
  RoiCalculatorSection,
  BeforeAfterSection,
  FaqSection
} from './meruna-home-additions';
import {
  getGetAuthSessionQueryKey,
  getGetDashboardSummaryQueryKey,
  useGetAuthSession,
  useGetDashboardSummary
} from '@workspace/api-client-react';
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
  Pause,
  Plus,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Sun,
  UserRound,
  UsersRound,
  Volume2,
  VolumeX,
  Workflow,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react';

type Lang = 'en' | 'ar';
type Theme = 'dark' | 'light';
type DemoTab = 'capture' | 'book' | 'follow' | 'recover';
type ChatMessage = { from: 'patient' | 'agent'; text: string; booked?: boolean };

type Copy = {
  nav: { method: string; capabilities: string; voice: string; roi: string; pricing: string; faq: string };
  actions: { login: string; demo: string; start: string; explore: string; play: string; send: string; close: string; submit: string };
  hero: { eyebrow: string; title: string; accent: string; body: string; proof: string; clinics: string };
  demo: { live: string; welcome: string; appointments: string; attendance: string; week: string; confirmed: string; newMessage: string };
  trust: { label: string; dental: string; primary: string; networks: string; always: string };
  method: { eyebrow: string; title: string; accent: string; body: string; link: string; stat1: string; stat1Body: string; stat2: string; stat2Body: string };
  capabilities: { eyebrow: string; title: string; accent: string; body: string; cards: { title: string; body: string; tag: string }[] };
  workflow: { eyebrow: string; title: string; accent: string; body: string; items: { title: string; body: string }[] };
  voice: { eyebrow: string; title: string; accent: string; body: string; points: string[]; assistant: string; listening: string; placeholder: string; connected: string };
  pricing: { eyebrow: string; title: string; accent: string; body: string; plan: string; planTitle: string; features: string[]; action: string; plans: { key: string; name: string; description: string; monthly: number; yearly: number; features: string[]; popular?: boolean }[] };
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
    quickChips: { label: string; prompt: string; reply: string; booked?: boolean }[];
    input: string;
    agentName: string;
    agentStatus: string;
    bookingReady: string;
    actionHint: string;
    actionDone: string;
    pause: string;
    resume: string;
  };
};

const copy: Record<Lang, Copy> = {
  en: {
    nav: { method: 'How it works', capabilities: 'Capabilities', voice: 'AI voice', roi: 'ROI calculator', pricing: 'Plans', faq: 'FAQ' },
    actions: { login: 'Sign in', demo: 'Book a demo', start: 'Start live demo', explore: 'See how it works', play: 'Play call audio', send: 'Send', close: 'Close', submit: 'Request my demo' },
    hero: { eyebrow: 'CLINIC OPERATIONS / ALWAYS ON', title: 'A calmer way to run', accent: 'any clinic.', body: 'Bring patients, appointments, conversations, AI voice reception, and daily operations into one clear workspace your whole team can trust.', proof: 'Designed specifically for modern clinics in Saudi Arabia and the UAE.', clinics: 'Seamless WhatsApp & Phone AI Voice Integration' },
    demo: { live: 'LIVE FRONT DESK', welcome: 'Good morning, Doctor', appointments: 'confirmed appointments', attendance: 'attendance rate', week: 'This week', confirmed: 'Appointment confirmed', newMessage: 'New patient message' },
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
    voice: { eyebrow: 'THE VOICE OF YOUR CLINIC', title: 'Not a robot reading a script.', accent: 'A teammate who knows when to listen.', body: 'MERUNA understands intent, remembers context and hands sensitive moments to your team. Patients get a natural conversation. Your people get the room to focus.', points: ['Natural conversation in native Saudi & Gulf dialects', 'Live calendar slot checking with instant WhatsApp confirmation', 'Seamless human handoff whenever requested by patient'], assistant: 'MERUNA Voice Agent', listening: 'Listening for patient inquiries', placeholder: 'Try realistic phone call scenarios below…', connected: 'Live Phone Line · 24/7' },
    pricing: { eyebrow: 'START WITH THE WAY YOU WORK', title: 'Begin with one clinic.', accent: 'Scale without the scramble.', body: 'A focused workspace for one location or a connected operating layer for your whole network. We shape the rollout around your reality.', plan: 'PLAN / CLINIC', planTitle: 'Your clinic workspace', features: ['Always-on patient conversations', 'Appointments, reminders and follow-ups', 'Permissions and visibility for every location'], action: 'Talk to our team', plans: [{ key: 'starter', name: 'Starter', description: 'For organized beginnings', monthly: 79, yearly: 64, features: ['One branch', 'Up to 3 users', 'Appointments and patients', 'PWA offline support'] }, { key: 'growth', name: 'Growth', description: 'For clinics on the move', monthly: 179, yearly: 144, features: ['Up to 3 branches', 'Up to 15 users', 'AI Reception & Follow-ups', 'Automated Waitlist'], popular: true }, { key: 'pro', name: 'Pro', description: 'For medical groups', monthly: 349, yearly: 280, features: ['Unlimited branches', 'AI Voice Calling Agent', 'Advanced Analytics & Reports', 'Dedicated Account Manager'] }] },
    testimonial: { eyebrow: 'DESIGNED FOR YOUR REGION', stat: '24/7 AI', statBody: 'coverage across WhatsApp and Phone', quote: 'A dedicated operational layer that captures every inquiry, confirms appointments, and keeps your front desk calm.', name: 'Saudi & UAE Ready', role: 'Enterprise Front-Office AI' },
    cta: { eyebrow: 'YOUR NEXT QUIETER DAY', title: 'Give the front desk room to breathe.', accent: 'Give your clinic room to grow.', body: 'A short working session built around your patient flow — not a long sales tour.', details: 'No pressure. Just a clearer view of what could change.' },
    footer: { tagline: 'The operating system for the moments that matter.', product: 'Product', company: 'Company', legal: 'Legal', privacy: 'Privacy', terms: 'Terms', rights: '© 2026 MERUNA. Built for better clinic days.' },
    modal: { eyebrow: 'A WORKING SESSION FOR YOUR CLINIC', title: 'Let’s make the day', accent: 'feel lighter.', body: 'Leave your details and our team will come back with a practical walkthrough in one business day.', name: 'Name and clinic', namePlaceholder: 'Your name · clinic name', contact: 'Work email', contactPlaceholder: 'you@clinic.com', sentTitle: 'Request received.', sentBody: 'We’ll be in touch soon to shape a session around your clinic.', done: 'Back to the page' },
    chat: {
      workspace: 'MERUNA workspace',
      live: 'Live demo',
      pause: 'Pause motion',
      resume: 'Resume motion',
      tabs: { capture: 'Capture', book: 'Book', follow: 'Follow up', recover: 'Recover' },
      patients: 'Conversations',
      search: 'Search patients',
      newConversation: 'New conversation',
      today: 'Today',
      samplePatients: [{ name: 'Patient 1', detail: 'Appointment request', time: '09:41' }, { name: 'Patient 2', detail: 'Post-visit follow-up', time: '09:18' }, { name: 'Patient 3', detail: 'Missed appointment', time: 'Yesterday' }],
      samples: [
        { label: 'Booking a new visit', messages: [{ from: 'patient', text: 'Hi, I would like to book an appointment this week.' }, { from: 'agent', text: 'I found Thursday at 4:30 PM with the attending physician. Would you like me to confirm it?' }] },
        { label: 'After a visit', messages: [{ from: 'patient', text: 'Thank you for the care today. What are my next instructions?' }, { from: 'agent', text: 'Glad to care for you! I just shared your post-visit care notes and scheduled your follow-up check-in.' }] },
        { label: 'Recovering a missed visit', messages: [{ from: 'patient', text: 'I missed my appointment this morning.' }, { from: 'agent', text: 'No problem at all! Let us find a convenient alternate slot for you tomorrow.' }] }
      ],
      quickChips: [
        { label: '🦷 Book Dental Visit', prompt: 'I would like to book a dental checkup this Thursday afternoon.', reply: 'I reserved Thursday at 4:30 PM with the attending physician. A confirmation slip was created for you!', booked: true },
        { label: '💰 Pricing & Services', prompt: 'How much is a general consultation and teeth cleaning?', reply: 'Consultation is 150 SAR, and cleaning is 250 SAR including a full preventative scan.' },
        { label: '🔄 Reschedule to Saturday', prompt: 'Can I reschedule tomorrow appointment to Saturday morning?', reply: 'Sure! I moved your booking to Saturday 10:30 AM and notified the medical team.' },
        { label: '👨‍⚕️ Doctor Availability', prompt: 'Is the physician available for walk-ins today?', reply: 'The attending physician is in clinic until 8:00 PM today. Two slot openings remain at 5:15 PM and 6:45 PM.' },
      ],
      input: 'Type a message or click a quick scenario above…',
      agentName: 'MERUNA AI Agent',
      agentStatus: 'Available 24/7',
      bookingReady: 'Instant Confirmation',
      actionHint: 'Choose a workflow above to see MERUNA adapt.',
      actionDone: 'Workflow selected'
    },
  },
  ar: {
    nav: { method: 'كيف يعمل', capabilities: 'الإمكانات', voice: 'الصوت الذكي', roi: 'حاسبة العائد', pricing: 'الخطط', faq: 'الأسئلة الشائعة' },
    actions: { login: 'تسجيل الدخول', demo: 'احجز عرضاً', start: 'ابدأ التجربة الحية', explore: 'اكتشف كيف يعمل', play: 'تشغيل المكالمة الصوتية', send: 'إرسال', close: 'إغلاق', submit: 'أرسل طلب العرض' },
    hero: { eyebrow: 'تشغيل العيادة / دائماً حاضر', title: 'طريقة أكثر هدوءاً لإدارة', accent: 'أي عيادة.', body: 'اجمع المرضى والمواعيد والمحادثات واستقبال المكالمات بالذكاء الاصطناعي والعمليات اليومية في مساحة عمل واضحة يثق بها فريقك بالكامل.', proof: 'مصمم خصيصاً لبيئة عمل العيادات في السعودية والإمارات.', clinics: 'ربط مباشر بالواتساب والمكالمات الهاتفية' },
    demo: { live: 'الاستقبال مباشر', welcome: 'مرحباً بك، دكتور', appointments: 'مواعيد مؤكدة', attendance: 'نسبة الحضور', week: 'هذا الأسبوع', confirmed: 'تم تأكيد الموعد', newMessage: 'رسالة مريض جديدة' },
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
    voice: { eyebrow: 'صوت عيادتك', title: 'ليس روبوتاً يقرأ نصاً.', accent: 'إنه زميل يعرف متى يستمع.', body: 'يفهم MERUNA النية ويتذكر السياق ويمرر اللحظات الحساسة إلى فريقك. يحصل المريض على حوار طبيعي، ويحصل فريقك على مساحة للتركيز.', points: ['حوار طبيعي واقعي باللهجة السعودية والخليجية', 'ربط فوري بالتقويم وحجز مباشر مع إرسال تأكيد واتساب', 'تحويل تلقائي لموظف الاستقبال عند رغبة المريض'], assistant: 'المساعد الصوتي الذكي MERUNA', listening: 'جاهز لاستقبال المكالمات فوراً', placeholder: 'جرّب سيناريوهات المكالمات الهاتفية الحية أدناه…', connected: 'خط الهاتف نشط 24/7' },
    pricing: { eyebrow: 'ابدأ بالطريقة التي تعمل بها', title: 'ابدأ بعيادة واحدة.', accent: 'وتوسع بلا فوضى.', body: 'مساحة عمل مركزة لموقع واحد أو طبقة تشغيل مترابطة لشبكتك كلها. نصمم البداية حول واقعك.', plan: 'الخطة / العيادة', planTitle: 'مساحة عيادتك', features: ['محادثات مرضى حاضرة دائماً', 'مواعيد وتذكيرات ومتابعات', 'صلاحيات ورؤية لكل فرع'], action: 'تحدث مع فريقنا', plans: [{ key: 'starter', name: 'Starter', description: 'للبدايات المنظمة', monthly: 79, yearly: 64, features: ['فرع واحد', 'حتى ٣ مستخدمين', 'المواعيد وسجلات المرضى', 'تطبيق PWA للعمل بدون إنترنت'] }, { key: 'growth', name: 'Growth', description: 'للعيادات سريعة النمو', monthly: 179, yearly: 144, features: ['حتى ٣ فروع', 'حتى ١٥ مستخدماً', 'الاستقبال الذكي والمتابعات الآلية', 'قائمة الانتظار الذكية'], popular: true }, { key: 'pro', name: 'Pro', description: 'للمجموعات الطبية', monthly: 349, yearly: 280, features: ['فروع بلا حدود', 'الوكيل الصوتي للمكالمات الهاتفية', 'تقارير وإحصائيات متقدمة', 'مدير حساب ودعم مخصص'] }] },
    testimonial: { eyebrow: 'ركائز النظام الذكي', stat: '24/7', statBody: 'جاهزية كاملة للمكالمات والواتساب', quote: 'نظام تشغيل واستقبال ذكي مصمم لخصوصية العيادات وخدمة المرضى على مدار الساعة بأعلى كفاءة.', name: 'جاهزية السوق السعودي والإماراتي', role: 'نظام الاستقبال الذكي المتكامل' },
    cta: { eyebrow: 'يومك القادم بهدوء أكبر', title: 'امنح الاستقبال مساحة ليتنفس.', accent: 'وامنح عيادتك مساحة للنمو.', body: 'جلسة قصيرة مبنية حول رحلة مريضك، لا جولة مبيعات طويلة.', details: 'بلا ضغط. فقط رؤية أوضح لما يمكن أن يتغير.' },
    footer: { tagline: 'نظام تشغيل للحظات التي تهم.', product: 'المنتج', company: 'الشركة', legal: 'قانوني', privacy: 'الخصوصية', terms: 'الشروط', rights: '© ٢٠٢٦ MERUNA. لأيام عيادة أفضل.' },
    modal: { eyebrow: 'جلسة عمل لعيادتك', title: 'لنرتب يومك ليصبح', accent: 'أخف.', body: 'اترك بياناتك وسيتواصل معك فريقنا بجولة عملية خلال يوم عمل واحد.', name: 'الاسم والعيادة', namePlaceholder: 'اسمك · اسم العيادة', contact: 'البريد المهني', contactPlaceholder: 'you@clinic.com', sentTitle: 'وصل طلبك.', sentBody: 'سنعود إليك قريباً لنرتب جلسة تناسب عيادتك.', done: 'العودة إلى الصفحة' },
    chat: {
      workspace: 'مساحة MERUNA',
      live: 'تجربة مباشرة',
      pause: 'إيقاف الحركة',
      resume: 'استئناف الحركة',
      tabs: { capture: 'التقاط', book: 'حجز', follow: 'متابعة', recover: 'استعادة' },
      patients: 'المحادثات',
      search: 'ابحث عن مريض',
      newConversation: 'محادثة جديدة',
      today: 'اليوم',
      samplePatients: [{ name: 'مريض 1', detail: 'طلب موعد كشف', time: '٠٩:٤١' }, { name: 'مريض 2', detail: 'متابعة بعد الزيارة', time: '٠٩:١٨' }, { name: 'مريض 3', detail: 'تعديل موعد', time: 'أمس' }],
      samples: [
        { label: 'حجز زيارة جديدة', messages: [{ from: 'patient', text: 'مرحباً، أحتاج أحجز أقرب موعد كشف هذا الأسبوع.' }, { from: 'agent', text: 'وجدت لك موعداً يوم الخميس الساعة ٤:٣٠ م مع الطبيب المعالج. هل أثبت لك الحجز؟' }] },
        { label: 'بعد الزيارة', messages: [{ from: 'patient', text: 'شكراً لكم على الرعاية. ما هي تعليمات المتابعة؟' }, { from: 'agent', text: 'سعداء بخدمتك! أرسلت لك تعليمات ما بعد العلاج وتم تثبيت موعد المراجعة القادم.' }] },
        { label: 'استعادة موعد فائت', messages: [{ from: 'patient', text: 'فاتني موعدي اليوم وأود اختيار موعد بديل.' }, { from: 'agent', text: 'أهلاً بك! لا مشكلة إطلاقاً، إليك خياران متاحان غداً لاختيار الأنسب لك.' }] }
      ],
      quickChips: [
        { label: '🦷 حجز كشف أسنان', prompt: 'مساء الخير، أريد حجز موعد كشف أسنان يوم الخميس القادم.', reply: 'أهلاً بك! تم حجز موعد الخميس ٤:٣٠ م مع الطبيب المعالج. إليك تذكرة التأكيد فوراً:', booked: true },
        { label: '💰 استفسار عن الأسعار', prompt: 'كم سعر كشف العيادة وجلسات تنظيف الأسنان؟', reply: 'سعر الكشف ١٥٠ ريال، وخدمة التنظيف تبدأ من ٢٥٠ ريال شاملة الفحص الشامل.' },
        { label: '🔄 تعديل الموعد للسبت', prompt: 'أرغب في تأجيل موعدي غداً إلى يوم السبت صباحاً.', reply: 'تم تعديل الموعد بنجاح إلى السبت ١٠:٣٠ ص وتم تحديث التقويم وإشعار الطبيب المعالج.' },
        { label: '👨‍⚕️ مواعيد الطبيب اليوم', prompt: 'هل الطبيب متواجد في العيادة اليوم لإجراء كشف؟', reply: 'نعم، الطبيب المعالج متواجد اليوم حتى ٩:٠٠ م، ويوجد موعدان متاحان الساعة ٥:٣٠ م و ٧:٠٠ م.' },
      ],
      input: 'اكتب رسالة أو اختر سيناريو سريع من الأعلى…',
      agentName: 'وكيل MERUNA الذكي',
      agentStatus: 'متاح للرد فوراً 24/7',
      bookingReady: 'تأكيد مباشر',
      actionHint: 'اختر مساراً لترى كيف يتكيف MERUNA.',
      actionDone: 'تم اختيار المسار'
    },
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

function LiveWorkspacePulse({ lang, clinicName, stats }: { lang: Lang; clinicName: string; stats: Array<{ label: string; value: string; helper: string }> }) {
  const isArabic = lang === 'ar';
  return <aside className="meruna-live-pulse" aria-label={isArabic ? 'ملخص عيادتك الحالي' : 'Your live clinic summary'}><div><span className="meruna-kicker">{isArabic ? 'مساحة العمل متصلة' : 'WORKSPACE CONNECTED'}</span><h2>{isArabic ? `مرحباً بفريق ${clinicName}` : `Welcome back, ${clinicName}`}</h2><p>{isArabic ? 'هذه لمحة مباشرة من مساحة عيادتك الحالية.' : 'A live glimpse from your current clinic workspace.'}</p></div><div className="meruna-live-stats">{stats.slice(0, 3).map((stat) => <div key={`${stat.label}-${stat.value}`}><strong>{stat.value}</strong><span>{stat.label}</span><small>{stat.helper}</small></div>)}</div><a href="/dashboard" className="meruna-live-link">{isArabic ? 'فتح مساحة العمل' : 'Open workspace'} <ArrowUpRight size={15} /></a></aside>;
}

/* ─── Core Pillars (Built for Saudi & UAE Market) ───────────────────── */
const testimonials = [
  { nameAr: 'فهم متقدم للهجة السعودية والخليجية', nameEn: 'Native Saudi & Gulf Dialect Understanding', roleAr: 'تفاعل طبيعي ومريح للمريض', roleEn: 'Natural & Empathetic Dialogue', initials: '🇸🇦', quoteAr: 'يفهم الوكيل الصوتي اللهجات المحلية الدارجة بدقة وسلاسة، ويتحدث مع المريض بطبيعية واحترافية كاملة بدون أي تعقيد.', quoteEn: 'The voice agent naturally comprehends local dialects and communicates with warmth and clarity 24/7.', stat: '24/7 AI Voice' },
  { nameAr: 'ربط رسمي ومباشر مع الواتساب', nameEn: 'Official WhatsApp Business Integration', roleAr: 'أتمتة التأكيد والموقع الجغرافي', roleEn: 'Automated Confirmation & Maps', initials: '💬', quoteAr: 'إرسال تأكيد الموعد فوراً، وتفاصيل موقع العيادة واللوكيشن، وروابط التذكير والمتابعة دون الحاجة لأي تدخل يدوي.', quoteEn: 'Instantly dispatches booking confirmation slips, clinic location on Google Maps, and automated reminders.', stat: '100% Automated' },
  { nameAr: 'تزامن فوري ومحكم مع التقويم', nameEn: 'Real-Time Calendar Synchronization', roleAr: 'منع التضارب والازدحام', roleEn: 'Zero Double-Booking Conflicts', initials: '📅', quoteAr: 'يتحقق النظام من أوقات دوام الأطباء والغرف الشاغرة لحظياً، ويثبت الموعد في التقويم فور تأكيده مع المريض.', quoteEn: 'Checks doctor schedules and availability in real-time, locking slots accurately and preventing overlaps.', stat: '0 Conflicts' },
  { nameAr: 'استعادة المواعيد الفائتة تلقائياً', nameEn: 'Smart No-Show Auto-Recovery', roleAr: 'حماية إيرادات العيادة', roleEn: 'Revenue & Flow Protection', initials: '⚡', quoteAr: 'في حال فوات الموعد، يرسل النظام رسالة لطيفة لاقتراح موعد بديل بضغطة زر واحدة لتقليل الغيابات واستعادة المرضى.', quoteEn: 'Automatically reaches out to missed appointments with 1-click rescheduling options to protect clinic revenue.', stat: '−38% No-Shows' },
];

const globalStats = [
  { labelAr: 'تغطية واستقبال آلي', labelEn: 'Automated Coverage', target: 24, suffix: '/7' },
  { labelAr: 'سرعة الاستجابة', labelEn: 'Instant Response', target: 3, suffix: 's' },
  { labelAr: 'ربط مباشر بالواتساب', labelEn: 'Direct WhatsApp Sync', target: 100, suffix: '%' },
  { labelAr: 'انخفاض المواعيد الفائتة', labelEn: 'Fewer No-Shows', target: 38, suffix: '%' },
];

function App() {
  const [lang, setLang] = useState<Lang>('ar');
  const [theme, setTheme] = useState<Theme>('dark');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [demoSent, setDemoSent] = useState(false);
  const [activeTab, setActiveTab] = useState<DemoTab>('capture');
  const [sampleIndex, setSampleIndex] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [toast, setToast] = useState('');
  const [activeSection, setActiveSection] = useState('method');
  const [isThinking, setIsThinking] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);
  const [scrollY, setScrollY] = useState(0);
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [countersVisible, setCountersVisible] = useState(false);
  const [counterValues, setCounterValues] = useState(globalStats.map(() => 0));
  const [heroMouse, setHeroMouse] = useState({ x: 0, y: 0 });
  const replyTimerRef = useRef<number | null>(null);
  const statsRef = useRef<HTMLDivElement | null>(null);
  const sessionQuery = useGetAuthSession({ query: { queryKey: getGetAuthSessionQueryKey(), retry: false, staleTime: 60_000 } });
  const summaryQuery = useGetDashboardSummary({ query: { queryKey: getGetDashboardSummaryQueryKey(), enabled: Boolean(sessionQuery.data), retry: false, staleTime: 30_000 } });
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
    document.title = isArabic ? 'MERUNA — تشغيل عيادتك بهدوء وذكاء' : 'MERUNA — A calmer way to run any clinic';
    window.localStorage.setItem('meruna-theme', theme);
    window.localStorage.setItem('meruna-language', lang);
  }, [theme, lang, isArabic]);

  useEffect(() => {
    const sectionIds = ['how-it-works', 'capabilities', 'voice', 'roi-calculator', 'pricing', 'faq'];
    const sections = sectionIds.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (!sections.length) return;
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActiveSection(visible.target.id === 'how-it-works' ? 'method' : visible.target.id);
    }, { rootMargin: '-25% 0px -60% 0px', threshold: [0.1, 0.35, 0.6] });
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  // Scroll tracking for sticky CTA
  useEffect(() => {
    const handler = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Testimonials auto-advance
  useEffect(() => {
    const timer = window.setInterval(() => setTestimonialIndex((i) => (i + 1) % testimonials.length), 5500);
    return () => window.clearInterval(timer);
  }, []);

  // Stats counter animation
  useEffect(() => {
    if (!statsRef.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !countersVisible) {
        setCountersVisible(true);
        globalStats.forEach((stat, idx) => {
          const duration = 1800;
          const steps = 50;
          const interval = duration / steps;
          let step = 0;
          const timer = window.setInterval(() => {
            step++;
            setCounterValues((prev) => {
              const next = [...prev];
              next[idx] = Math.round((stat.target * step) / steps);
              return next;
            });
            if (step >= steps) window.clearInterval(timer);
          }, interval);
        });
      }
    }, { threshold: 0.3 });
    observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, [countersVisible]);

  // Hero mouse parallax
  const handleHeroMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHeroMouse({
      x: ((e.clientX - rect.left) / rect.width - 0.5) * 30,
      y: ((e.clientY - rect.top) / rect.height - 0.5) * 30,
    });
  }, []);

  const activeSample = useMemo(() => t.chat.samples[sampleIndex], [t, sampleIndex]);
  const currentMessages = messages.length ? messages : activeSample.messages;

  const openDemo = () => {
    setDemoSent(false);
    setDemoOpen(true);
    setMobileOpen(false);
  };

  const cancelPendingReply = () => {
    if (replyTimerRef.current) window.clearTimeout(replyTimerRef.current);
    replyTimerRef.current = null;
    setIsThinking(false);
  };

  const selectTab = (tab: DemoTab, announce = true) => {
    const nextIndex = tab === 'book' ? 0 : tab === 'follow' ? 1 : tab === 'recover' ? 2 : 0;
    cancelPendingReply();
    setActiveTab(tab);
    setSampleIndex(nextIndex);
    setMessages([]);
    if (announce) setToast(`${t.chat.actionDone}: ${t.chat.tabs[tab]}`);
  };

  useEffect(() => {
    if (!autoPlay) return;
    const tabOrder: DemoTab[] = ['capture', 'book', 'follow', 'recover'];
    const timer = window.setTimeout(() => {
      const currentIndex = tabOrder.indexOf(activeTab);
      selectTab(tabOrder[(currentIndex + 1) % tabOrder.length], false);
    }, 6200);
    return () => window.clearTimeout(timer);
  }, [activeTab, autoPlay]);

  const handleChipClick = (chip: { prompt: string; reply: string; booked?: boolean }) => {
    if (isThinking) return;
    cancelPendingReply();
    setAutoPlay(false);
    setMessages((current) => [...(current.length ? current : activeSample.messages), { from: 'patient', text: chip.prompt }]);
    setIsThinking(true);
    replyTimerRef.current = window.setTimeout(() => {
      setMessages((current) => [...current, { from: 'agent', text: chip.reply, booked: chip.booked }]);
      setIsThinking(false);
      setToast(isArabic ? 'تم الرد الآلي بواسطة الذكاء الاصطناعي' : 'Automated response generated');
    }, 600);
  };

  const sendMessage = (event?: FormEvent) => {
    event?.preventDefault();
    const text = messageInput.trim();
    if (!text || isThinking) return;
    cancelPendingReply();
    setAutoPlay(false);
    setMessages((current) => [...(current.length ? current : activeSample.messages), { from: 'patient', text }]);
    setMessageInput('');
    setIsThinking(true);
    replyTimerRef.current = window.setTimeout(() => {
      setMessages((current) => [...current, { from: 'agent', text: isArabic ? 'شكراً لتواصلك. راجعت جدول المواعيد وسجل العيادة، والخيارات جاهزة للتأكيد فوراً.' : 'Thank you for reaching out. I checked the live calendar and your options are ready to confirm.' }]);
      setIsThinking(false);
      setToast(isArabic ? 'تم تجهيز الخطوة التالية' : 'Next step prepared');
    }, 650);
  };

  useEffect(() => () => { if (replyTimerRef.current) window.clearTimeout(replyTimerRef.current); }, []);

  return (
    <div className={`landing-home ${theme === 'dark' ? 'is-dark' : ''} ${isArabic ? 'is-arabic' : ''} cf-page cf-grain cf-section min-h-[100dvh]`} dir={isArabic ? 'rtl' : 'ltr'}>
      <header className="fixed inset-x-0 top-0 z-30 border-b border-[hsl(var(--border)/.65)] bg-[hsl(var(--background)/.8)] backdrop-blur-xl">
        <div className="cf-container flex h-[76px] items-center justify-between">
          <a href="#top" data-testid="link-brand" aria-label="MERUNA home"><BrandMark /></a>
          <nav className="hidden items-center gap-7 md:flex" aria-label="Main navigation">
            {([['method', '#how-it-works'], ['voice', '#voice'], ['roi', '#roi-calculator'], ['capabilities', '#capabilities'], ['pricing', '#pricing'], ['faq', '#faq']] as const).map(([key, href]) => <a key={href} href={href} data-testid={`link-nav-${key}`} className={`cf-link text-[12px] font-semibold transition-colors ${activeSection === key ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--muted-foreground))]'}`}>{t.nav[key]}</a>)}
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
            {([['method', '#how-it-works'], ['voice', '#voice'], ['roi', '#roi-calculator'], ['capabilities', '#capabilities'], ['pricing', '#pricing'], ['faq', '#faq']] as const).map(([key, href]) => <a key={href} href={href} onClick={() => setMobileOpen(false)} data-testid={`link-mobile-${key}`} className="rounded-xl px-4 py-3 text-[13px] font-bold text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]">{t.nav[key]}</a>)}
            <div className="mt-2 flex items-center gap-2 border-t border-[hsl(var(--border))] pt-3">
              <button type="button" onClick={() => setLang(lang === 'en' ? 'ar' : 'en')} data-testid="button-mobile-language" className="cf-button-ghost flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-3 text-[12px] font-bold"><Languages className="size-4" />{lang === 'en' ? 'العربية' : 'English'}</button>
              <button type="button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} data-testid="button-mobile-theme" className="cf-button-ghost flex size-11 items-center justify-center rounded-xl">{theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}</button>
            </div>
            <a href="/login" onClick={() => setMobileOpen(false)} data-testid="button-mobile-login" className="cf-button-ghost mt-2 flex items-center justify-center rounded-xl px-4 py-3 text-[13px] font-bold">{t.actions.login}</a>
            <button type="button" onClick={openDemo} data-testid="button-mobile-demo" className="cf-button-primary mt-2 rounded-xl px-4 py-3 text-[13px] font-bold">{t.actions.demo}</button>
          </nav>
        </div>}
      </header>

      <MomentumMarquee locale={isArabic ? 'ar' : 'en'} />

      <main id="top">
        {/* STICKY DEMO CTA PILL */}
        <div
          className={`fixed bottom-6 right-6 z-40 transition-all duration-500 ${scrollY > 400 ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}
          aria-hidden={scrollY <= 400}
        >
          <button
            type="button"
            onClick={openDemo}
            data-testid="button-sticky-demo"
            className="flex items-center gap-2.5 rounded-full bg-[hsl(var(--primary))] px-5 py-3 text-[12px] font-bold text-white shadow-[0_8px_30px_hsl(var(--primary)/.4)] transition-all hover:scale-105 hover:shadow-[0_12px_40px_hsl(var(--primary)/.55)]"
          >
            <Sparkles className="size-4" />
            {isArabic ? 'احجز عرضاً تجريبياً' : 'Book a live demo'}
          </button>
        </div>

        {/* HERO SECTION */}
        <section
          className="cf-hero relative overflow-hidden pb-20 pt-32 md:pb-28 md:pt-40"
          onMouseMove={handleHeroMouseMove}
        >
          <div className="absolute inset-0 cf-grid-paper opacity-45" />
          {/* Parallax orbs */}
          <div
            className="pointer-events-none absolute -right-40 top-[-190px] size-[600px] rounded-full bg-[hsl(var(--primary)/.08)] blur-3xl transition-transform duration-[800ms] ease-out"
            style={{ transform: `translate(${heroMouse.x * 0.6}px, ${heroMouse.y * 0.5}px)` }}
          />
          <div
            className="pointer-events-none absolute -left-48 bottom-[-300px] size-[620px] rounded-full border-[90px] border-[hsl(var(--accent)/.08)] transition-transform duration-[1000ms] ease-out"
            style={{ transform: `translate(${heroMouse.x * -0.4}px, ${heroMouse.y * -0.3}px)` }}
          />
          <div
            className="pointer-events-none absolute left-1/3 top-1/4 size-[220px] rounded-full bg-[hsl(var(--accent)/.06)] blur-2xl transition-transform duration-[1200ms] ease-out"
            style={{ transform: `translate(${heroMouse.x * 0.8}px, ${heroMouse.y * 0.7}px)` }}
          />
          <div className="cf-container relative grid items-center gap-14 lg:grid-cols-[.84fr_1.16fr] lg:gap-16">
            <div className={`${isArabic ? 'text-right' : 'text-left'}`}>
              <Eyebrow>{t.hero.eyebrow}</Eyebrow>
              <h1 className="cf-display cf-reveal max-w-[650px] text-[40px] font-extrabold leading-[1.12] tracking-[-.06em] sm:text-[54px] md:text-[68px]">
                {t.hero.title}<br />
                <span className="text-[hsl(var(--primary))]">{t.hero.accent}</span>
              </h1>
              <p className="cf-reveal cf-reveal-delay-1 mt-6 max-w-[570px] text-[15px] leading-[1.8] text-[hsl(var(--muted-foreground))] md:text-[17px]">
                {t.hero.body}
              </p>
              <div className="cf-reveal cf-reveal-delay-2 mt-8 flex flex-wrap items-center gap-4">
                <PrimaryButton onClick={openDemo} testId="button-hero-demo">{t.actions.start}</PrimaryButton>
                <a href="#how-it-works" data-testid="link-hero-method" className="group inline-flex items-center gap-2 px-2 py-3 text-[12px] font-bold text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))]">
                  <span className="flex size-8 items-center justify-center rounded-full border border-[hsl(var(--border))] transition-colors group-hover:border-[hsl(var(--primary))]">
                    <Play className="size-3 fill-current" />
                  </span>
                  {t.actions.explore}
                </a>
              </div>
              <div className="cf-reveal cf-reveal-delay-3 mt-9 flex items-center gap-3 text-[11px] text-[hsl(var(--muted-foreground))]">
                <div className="flex -space-x-2" dir="ltr">
                  {['LM', 'MK', 'AP', 'SN'].map((initial, index) => (
                    <span key={initial} className={`flex size-8 items-center justify-center rounded-full border-2 border-[hsl(var(--hero))] text-[9px] font-bold text-white ${index % 2 ? 'bg-[hsl(var(--primary))]' : 'bg-[hsl(var(--accent))]'}`}>{initial}</span>
                  ))}
                </div>
                <span>
                  <strong className="text-[hsl(var(--foreground))]">{t.hero.clinics}</strong><br />
                  {t.hero.proof}
                </span>
              </div>
            </div>

            {/* Interactive Chat Playground */}
            <ProductPreview
              t={t}
              activeTab={activeTab}
              selectTab={selectTab}
              currentMessages={currentMessages}
              messageInput={messageInput}
              setMessageInput={setMessageInput}
              sendMessage={sendMessage}
              sampleIndex={sampleIndex}
              setSampleIndex={(index) => { cancelPendingReply(); setSampleIndex(index); setMessages([]); }}
              isThinking={isThinking}
              autoPlay={autoPlay}
              setAutoPlay={setAutoPlay}
              onChipClick={handleChipClick}
              isArabic={isArabic}
            />
          </div>
        </section>

        {/* TRUST STRIP */}
        <section className="border-y border-[hsl(var(--border))] bg-[hsl(var(--card))] py-6">
          <div className="cf-container flex flex-col items-center justify-between gap-5 md:flex-row">
            <p className="cf-mono text-[9px] font-bold uppercase tracking-[.14em] text-[hsl(var(--muted-foreground))]">{t.trust.label}</p>
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-[11px] font-bold text-[hsl(var(--muted-foreground))] md:gap-x-10">
              <span className="flex items-center gap-2"><UserRound className="size-4 text-[hsl(var(--primary))]" />{t.trust.dental}</span>
              <span className="flex items-center gap-2"><StethoscopeIcon />{t.trust.primary}</span>
              <span className="flex items-center gap-2"><UsersRound className="size-4 text-[hsl(var(--accent))]" />{t.trust.networks}</span>
              <span className="flex items-center gap-2"><Moon className="size-4 text-[hsl(var(--primary))]" />{t.trust.always}</span>
            </div>
          </div>
        </section>

        {/* ANIMATED STATS COUNTER ROW */}
        <section className="cf-blue-soft border-b border-[hsl(var(--border))] py-10">
          <div ref={statsRef} className="cf-container grid grid-cols-2 gap-6 md:grid-cols-4">
            {globalStats.map((stat, idx) => (
              <div key={stat.labelEn} className="text-center">
                <div className="cf-mono text-[36px] font-extrabold text-[hsl(var(--primary))] md:text-[48px]">
                  {counterValues[idx]}{stat.suffix}
                </div>
                <div className="mt-1 text-[11px] font-bold text-[hsl(var(--muted-foreground))]">
                  {isArabic ? stat.labelAr : stat.labelEn}
                </div>
              </div>
            ))}
          </div>
        </section>

        {summaryQuery.data?.clinic && (
          <div className="cf-container mt-6">
            <LiveWorkspacePulse lang={lang} clinicName={summaryQuery.data.clinic.name} stats={summaryQuery.data.stats} />
          </div>
        )}

        {/* CONNECTED CHANNELS BAR */}
        <ChannelSignalSection locale={isArabic ? 'ar' : 'en'} />

        {/* INTERACTIVE VOICE AGENT SECTION */}
        <section id="voice" className="cf-tint py-24 md:py-32">
          <div className="cf-container grid items-center gap-14 lg:grid-cols-[1.05fr_.95fr]">
            <VoicePreview t={t} isArabic={isArabic} onPlay={() => setToast(isArabic ? 'جاري تشغيل المعاينة الصوتية التفاعلية...' : 'Playing interactive voice preview...')} />
            <div>
              <Eyebrow>{t.voice.eyebrow}</Eyebrow>
              <h2 className="cf-display text-[36px] font-extrabold leading-[1.12] tracking-[-.06em] md:text-[48px]">
                {t.voice.title}<br />
                <span className="text-[hsl(var(--primary))]">{t.voice.accent}</span>
              </h2>
              <p className="mt-6 max-w-[500px] text-[15px] leading-[1.9] text-[hsl(var(--muted-foreground))]">
                {t.voice.body}
              </p>
              <div className="mt-8 space-y-3">
                {t.voice.points.map((item) => (
                  <div key={item} className="flex items-center gap-3 text-[12px] font-bold">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--primary)/.13)] text-[hsl(var(--primary))]">
                      <Check className="size-3.5" />
                    </span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS (3 STEPS) */}
        <HowItWorksSection locale={isArabic ? 'ar' : 'en'} />

        {/* INTERACTIVE ROI CALCULATOR */}
        <RoiCalculatorSection locale={isArabic ? 'ar' : 'en'} onAction={openDemo} />

        {/* CAPABILITIES SECTION */}
        <section id="capabilities" className="cf-navy relative overflow-hidden py-24 md:py-32">
          <div className="absolute inset-0 cf-navy-grid opacity-35" />
          <div className="cf-container relative">
            <div className="mb-16 flex flex-col justify-between gap-7 md:flex-row md:items-end">
              <div>
                <Eyebrow light>{t.capabilities.eyebrow}</Eyebrow>
                <h2 className="cf-display max-w-[630px] text-[36px] font-extrabold leading-[1.12] tracking-[-.06em] md:text-[50px]">
                  {t.capabilities.title}<br />
                  <span className="text-[hsl(var(--primary))]">{t.capabilities.accent}</span>
                </h2>
              </div>
              <p className="cf-body-muted max-w-[320px] text-[13px] leading-[1.85]">{t.capabilities.body}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {t.capabilities.cards.map((item, index) => {
                const Icon = capabilityIcons[index];
                return (
                  <article key={item.tag} className="cf-hover-lift group relative min-h-[250px] overflow-hidden rounded-[26px] border border-white/[.1] bg-white/[.045] p-7">
                    <div className="flex items-start justify-between">
                      <span className="cf-mono text-[9px] text-[hsl(214_25%_67%)]">{item.tag}</span>
                      <span className={`flex size-11 items-center justify-center rounded-2xl ${index === 1 ? 'bg-[hsl(var(--primary))] text-white' : 'bg-white/[.08] text-[hsl(var(--accent))]'} transition-transform duration-300 group-hover:rotate-[-8deg]`}>
                        <Icon className="size-5" />
                      </span>
                    </div>
                    <div className="absolute -bottom-16 -left-12 size-44 rounded-full border border-white/10 transition-transform duration-500 group-hover:scale-125" />
                    <div className="relative mt-14 max-w-[360px]">
                      <h3 className="cf-display text-[22px] font-extrabold text-white">{item.title}</h3>
                      <p className="mt-3 text-[13px] leading-[1.85] text-[hsl(214_22%_70%)]">{item.body}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* BEFORE VS AFTER SECTION */}
        <BeforeAfterSection locale={isArabic ? 'ar' : 'en'} />

        {/* PATIENT JOURNEY / TIMELINE */}
        <PatientJourneySection locale={isArabic ? 'ar' : 'en'} />

        {/* TRUST SECTIONS */}
        <HomeTrustSections locale={lang} />

        {/* PRICING SECTION */}
        <section id="pricing" className="cf-blue-soft py-24 md:py-32">
          <div className="cf-container">
            <div className="mb-12 max-w-[700px]">
              <Eyebrow>{t.pricing.eyebrow}</Eyebrow>
              <h2 className="cf-display text-[36px] font-extrabold leading-[1.12] tracking-[-.06em] md:text-[48px]">
                {t.pricing.title}<br />
                <span className="text-[hsl(var(--primary))]">{t.pricing.accent}</span>
              </h2>
              <p className="cf-body-muted mt-5 max-w-[560px] text-[15px] leading-[1.9]">{t.pricing.body}</p>
            </div>
            <div className="grid gap-5 lg:grid-cols-3">
              {t.pricing.plans.map((plan) => (
                <article key={plan.key} className={`cf-card relative flex flex-col rounded-[28px] border p-7 shadow-[var(--shadow-soft)] ${plan.popular ? 'border-[hsl(var(--primary)/.5)] shadow-[0_18px_45px_hsl(var(--primary)/.13)]' : ''}`}>
                  {plan.popular && <span className="absolute -top-3 right-6 rounded-full bg-[hsl(var(--primary))] px-3 py-1 text-[10px] font-bold text-white">{isArabic ? 'الأكثر اختياراً' : 'Most chosen'}</span>}
                  <div className="flex items-start justify-between border-b border-[hsl(var(--border))] pb-5">
                    <div>
                      <span className="cf-mono text-[9px] text-[hsl(var(--primary))]">{t.pricing.plan}</span>
                      <h3 className="cf-display mt-1.5 text-[22px] font-extrabold">{plan.name}</h3>
                      <p className="mt-1 text-[11px] text-[hsl(var(--muted-foreground))]">{plan.description}</p>
                    </div>
                    <Sparkles className={`size-5 ${plan.popular ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--accent))]'}`} />
                  </div>
                  <div className="mt-6 flex items-end gap-2">
                    <strong className="cf-mono text-[36px] font-bold text-[hsl(var(--foreground))]">${plan.monthly}</strong>
                    <span className="pb-1 text-[11px] text-[hsl(var(--muted-foreground))]">/ {isArabic ? 'شهرياً' : 'month'}</span>
                  </div>
                  <p className="mt-1 text-[10px] text-[hsl(var(--muted-foreground))]">{isArabic ? `أو $${plan.yearly} شهرياً عند الدفع السنوي` : `or $${plan.yearly} / month billed yearly`}</p>
                  <div className="my-6 flex flex-1 flex-col gap-3">
                    {plan.features.map((item) => (
                      <div key={item} className="flex items-center gap-2.5 text-[12px] font-bold">
                        <CheckCircle2 className="size-4 shrink-0 text-[hsl(var(--primary))]" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                  <PrimaryButton onClick={openDemo} testId={`button-pricing-${plan.key}`} className="w-full justify-center">{t.pricing.action}</PrimaryButton>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* SYSTEM PILLARS (SAUDI & UAE CLINIC OPERATIONS) */}
        <section className="cf-navy py-24 md:py-32">
          <div className="cf-container">
            <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <Eyebrow light>{t.testimonial.eyebrow}</Eyebrow>
                <h2 className="cf-display text-[32px] font-extrabold text-white md:text-[44px]">
                  {isArabic ? 'ركائز النظام لبيئة العيادات في السعودية والإمارات' : 'Built for Modern Clinic Operations in Saudi Arabia & UAE'}
                </h2>
              </div>
              {/* Carousel navigation controls */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  {testimonials.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setTestimonialIndex(idx)}
                      className={`size-2.5 rounded-full transition-all ${
                        testimonialIndex === idx ? 'w-7 bg-[hsl(var(--primary))]' : 'bg-white/20 hover:bg-white/40'
                      }`}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-1.5" dir="ltr">
                  <button
                    type="button"
                    onClick={() => setTestimonialIndex((i) => (i - 1 + testimonials.length) % testimonials.length)}
                    className="flex size-9 items-center justify-center rounded-full border border-white/20 text-white transition hover:bg-white/10"
                    aria-label="Previous testimonial"
                  >
                    <ChevronRight className="size-4 rotate-180" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setTestimonialIndex((i) => (i + 1) % testimonials.length)}
                    className="flex size-9 items-center justify-center rounded-full border border-white/20 text-white transition hover:bg-white/10"
                    aria-label="Next testimonial"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Active Testimonial Card */}
            <div className="grid gap-10 rounded-[30px] border border-white/10 bg-white/[.04] p-8 md:grid-cols-[.65fr_1.35fr] md:items-center md:p-12">
              <div className="border-b border-white/10 pb-6 md:border-b-0 md:border-e md:pe-8 md:pb-0">
                <div className="cf-mono text-[36px] font-bold text-[hsl(var(--primary))] md:text-[44px]">
                  {testimonials[testimonialIndex].stat}
                </div>
                <p className="mt-2 text-[12px] text-[hsl(214_22%_68%)]">
                  {isArabic ? 'تأثير حقيقي في تشغيل العيادة' : 'Measurable impact on daily operations'}
                </p>
                <div className="mt-6 flex items-center gap-1 text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className="text-sm">★</span>
                  ))}
                  <span className="ms-2 text-[11px] font-bold text-white/80">5.0 / 5.0</span>
                </div>
              </div>

              <blockquote className="cf-display text-[22px] font-semibold leading-[1.5] text-[hsl(214_33%_94%)] md:text-[30px]">
                “{isArabic ? testimonials[testimonialIndex].quoteAr : testimonials[testimonialIndex].quoteEn}”
                <footer className="mt-7 flex items-center gap-3.5 font-sans text-[12px] not-italic text-[hsl(214_22%_68%)]">
                  <span className="flex size-10 items-center justify-center rounded-full bg-[hsl(var(--primary))] text-[11px] font-bold text-white shadow-md">
                    {testimonials[testimonialIndex].initials}
                  </span>
                  <div>
                    <strong className="block text-[14px] text-[hsl(214_33%_94%)]">
                      {isArabic ? testimonials[testimonialIndex].nameAr : testimonials[testimonialIndex].nameEn}
                    </strong>
                    <span className="text-[11px] text-[hsl(214_22%_68%)]">
                      {isArabic ? testimonials[testimonialIndex].roleAr : testimonials[testimonialIndex].roleEn}
                    </span>
                  </div>
                </footer>
              </blockquote>
            </div>
          </div>
        </section>


        {/* FAQ SECTION */}
        <FaqSection locale={isArabic ? 'ar' : 'en'} />

        {/* FINAL CTA SECTION */}
        <section className="cf-tint meruna-final-cta relative overflow-hidden py-24 text-center md:py-32">
          <div className="absolute right-[-80px] top-[-120px] size-[350px] rounded-full border-[55px] border-[hsl(var(--primary)/.1)]" />
          <div className="absolute bottom-[-160px] left-[-100px] size-[390px] rounded-full border-[65px] border-[hsl(var(--accent)/.1)]" />
          <div className="cf-container relative">
            <Eyebrow>{t.cta.eyebrow}</Eyebrow>
            <h2 className="cf-display mx-auto max-w-[760px] text-[38px] font-extrabold leading-[1.12] tracking-[-.06em] md:text-[54px]">
              {t.cta.title}<br />
              <span className="text-[hsl(var(--primary))]">{t.cta.accent}</span>
            </h2>
            <p className="cf-body-muted mx-auto mt-5 max-w-[510px] text-[15px] leading-[1.9]">{t.cta.body}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <PrimaryButton onClick={openDemo} testId="button-final-demo">{t.actions.demo}</PrimaryButton>
              <button type="button" onClick={() => setToast(t.cta.details)} data-testid="button-final-contact" className="cf-button-ghost inline-flex items-center justify-center rounded-full px-5 py-3 text-[12px] font-bold transition-colors">{t.cta.details}</button>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="cf-card border-t py-12">
        <div className="cf-container grid gap-10 md:grid-cols-[1.3fr_.7fr_.8fr_.9fr]">
          <div>
            <BrandMark />
            <p className="cf-body-muted mt-4 max-w-[260px] text-[11px] leading-[1.8]">{t.footer.tagline}</p>
            <p className="cf-mono mt-4 text-[9px] text-[hsl(var(--muted-foreground))]">MERUNA — Smart Clinic Operations</p>
          </div>
          <div>
            <strong className="mb-4 block text-[11px]">{t.footer.product}</strong>
            <nav className="flex flex-col gap-2.5 text-[11px] text-[hsl(var(--muted-foreground))]">
              <a href="#how-it-works">{t.nav.method}</a>
              <a href="#voice">{t.nav.voice}</a>
              <a href="#roi-calculator">{t.nav.roi}</a>
              <a href="#capabilities">{t.nav.capabilities}</a>
              <a href="#pricing">{t.nav.pricing}</a>
            </nav>
          </div>
          <div>
            <strong className="mb-4 block text-[11px]">{isArabic ? 'الدعم' : 'Support'}</strong>
            <nav className="flex flex-col gap-2.5 text-[11px] text-[hsl(var(--muted-foreground))]">
              <a href="/contact">{isArabic ? 'تواصل معنا' : 'Contact us'}</a>
              <a href="mailto:meruna.tech@gmail.com">meruna.tech@gmail.com</a>
              <a href="/refund-policy">{isArabic ? 'الاسترداد خلال 30 يوماً' : '30-day refunds'}</a>
              <a href="#faq">{t.nav.faq}</a>
            </nav>
          </div>
          <div>
            <strong className="mb-4 block text-[11px]">{t.footer.legal}</strong>
            <nav className="flex flex-col gap-2.5 text-[11px] text-[hsl(var(--muted-foreground))]">
              <a href="/privacy-policy">{t.footer.privacy}</a>
              <a href="/terms">{t.footer.terms}</a>
              <a href="/cookie-policy">{isArabic ? 'ملفات الارتباط' : 'Cookie policy'}</a>
            </nav>
          </div>
        </div>
        <div className="cf-container mt-10 border-t border-[hsl(var(--border))] pt-6">
          <p className="cf-mono text-[8px] text-[hsl(var(--muted-foreground))]">{isArabic ? '© 2026 MERUNA. جميع الحقوق محفوظة.' : '© 2026 MERUNA. All rights reserved.'}</p>
        </div>
      </footer>

      {toast && (
        <div role="status" aria-live="polite" data-testid="status-toast" className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full bg-[hsl(var(--navy))] px-5 py-3 text-[11px] font-bold text-white shadow-[0_15px_35px_hsl(var(--navy)/.28)]">
          <CheckCircle2 className="size-4 text-[hsl(var(--accent))]" />
          {toast}
        </div>
      )}

      {demoOpen && <DemoModal t={t} sent={demoSent} setSent={setDemoSent} onClose={() => setDemoOpen(false)} />}
    </div>
  );
}

function StethoscopeIcon() {
  return <Headphones className="size-4 text-[hsl(var(--primary))]" />;
}

/* ENHANCED PRODUCT PREVIEW WITH QUICK SCENARIO CHIPS */
function ProductPreview({
  t,
  activeTab,
  selectTab,
  currentMessages,
  messageInput,
  setMessageInput,
  sendMessage,
  sampleIndex,
  setSampleIndex,
  isThinking,
  autoPlay,
  setAutoPlay,
  onChipClick,
  isArabic
}: {
  t: Copy;
  activeTab: DemoTab;
  selectTab: (tab: DemoTab) => void;
  currentMessages: ChatMessage[];
  messageInput: string;
  setMessageInput: (value: string) => void;
  sendMessage: (event?: FormEvent) => void;
  sampleIndex: number;
  setSampleIndex: (index: number) => void;
  isThinking: boolean;
  autoPlay: boolean;
  setAutoPlay: (playing: boolean) => void;
  onChipClick: (chip: { prompt: string; reply: string; booked?: boolean }) => void;
  isArabic: boolean;
}) {
  return (
    <div className="meruna-product-preview relative">
      <div className="absolute -right-4 top-[-22px] z-10 hidden items-center gap-2 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card)/.9)] px-3 py-2 text-[9px] font-bold shadow-[var(--shadow-soft)] backdrop-blur sm:flex">
        <span className="size-2 rounded-full bg-[hsl(var(--accent))]" />
        {t.demo.newMessage}
      </div>
      <div className="meruna-sim-shell cf-dash-shadow overflow-hidden rounded-[26px] border border-white/[.12] bg-[hsl(var(--panel))] text-[hsl(214_33%_94%)]">
        {/* Topbar */}
        <div className="meruna-sim-topbar flex items-center justify-between border-b border-white/[.1] px-5 py-3.5">
          <div className="flex items-center gap-2" dir="ltr">
            <span className="size-2.5 rounded-full bg-[#f07161]" />
            <span className="size-2.5 rounded-full bg-[#d5aa5f]" />
            <span className="size-2.5 rounded-full bg-[#69c49a]" />
          </div>
          <div className="flex items-center gap-3 text-[9px] text-[hsl(214_25%_67%)]">
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 animate-pulse rounded-full bg-[hsl(var(--accent))]" />
              {t.chat.live} · {t.chat.tabs[activeTab]}
            </span>
            <button
              type="button"
              onClick={() => setAutoPlay(!autoPlay)}
              className="meruna-sim-playback rounded-full border border-current px-2 py-0.5 text-[9px] transition-colors hover:text-[hsl(var(--primary))]"
              aria-label={autoPlay ? t.chat.pause : t.chat.resume}
            >
              {autoPlay ? 'Ⅱ' : '▶'}
            </button>
          </div>
        </div>

        {/* Workflow Switcher */}
        <div className="meruna-sim-toolbar border-b border-white/[.1] px-4 py-2.5">
          <div className="grid grid-cols-4 gap-1.5">
            {(Object.keys(t.chat.tabs) as DemoTab[]).map((tab) => {
              const Icon = tabIcons[tab];
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => selectTab(tab)}
                  data-testid={`button-demo-tab-${tab}`}
                  className={`flex flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[9px] font-bold transition-colors ${
                    activeTab === tab ? 'bg-[hsl(var(--primary))] text-white' : 'text-[hsl(214_25%_68%)] hover:bg-white/[.07]'
                  }`}
                >
                  <Icon className="size-3.5" />
                  {t.chat.tabs[tab]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sim Body */}
        <div className="meruna-sim-body grid min-h-[380px] sm:grid-cols-[.72fr_1.28fr]">
          <aside className="meruna-sim-sidebar hidden border-e border-white/[.1] p-4 sm:block">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[10px] font-bold">{t.chat.patients}</span>
              <Plus className="size-3 text-[hsl(var(--primary))]" />
            </div>
            <div className="space-y-1">
              {t.chat.samplePatients.map((patient, index) => (
                <button
                  type="button"
                  key={patient.name}
                  onClick={() => setSampleIndex(index)}
                  data-testid={`button-patient-${index}`}
                  className={`w-full rounded-xl p-2.5 text-start transition-colors ${
                    sampleIndex === index ? 'bg-white/[.1]' : 'hover:bg-white/[.05]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold">{patient.name}</span>
                    <span className="cf-mono text-[8px] text-[hsl(214_25%_52%)]">{patient.time}</span>
                  </div>
                  <span className="mt-0.5 block truncate text-[9px] text-[hsl(214_25%_58%)]">{patient.detail}</span>
                </button>
              ))}
            </div>
          </aside>

          <div className="meruna-sim-content flex min-w-0 flex-col p-4 sm:p-5">
            {/* Header in Chat */}
            <div className="mb-3 flex items-center justify-between border-b border-white/[.08] pb-2.5">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-full bg-[hsl(var(--primary))] text-white">
                  <Bot className="size-3.5" />
                </span>
                <div>
                  <strong className="block text-[10px]">{t.chat.agentName}</strong>
                  <small className="text-[8px] text-[hsl(var(--accent))]">{t.chat.agentStatus}</small>
                </div>
              </div>
              <span className="rounded-full bg-[hsl(var(--accent)/.13)] px-2 py-0.5 text-[8px] font-bold text-[hsl(var(--accent))]">
                {t.chat.bookingReady}
              </span>
            </div>

            {/* Quick Scenario Chips */}
            <div className="mb-3 flex flex-wrap gap-1.5">
              {t.chat.quickChips.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onChipClick(chip)}
                  className="rounded-lg border border-white/10 bg-white/[.05] px-2 py-1 text-[9px] font-bold text-[hsl(214_25%_80%)] transition hover:bg-[hsl(var(--primary)/.2)] hover:border-[hsl(var(--primary)/.4)] hover:text-white"
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Messages Stream */}
            <div className="cf-chat-scroll flex min-h-[170px] max-h-[220px] flex-1 flex-col gap-2.5 overflow-y-auto pr-1">
              {currentMessages.map((message, index) => (
                <div key={`${message.from}-${index}`} className={`flex flex-col ${message.from === 'agent' ? 'items-start' : 'items-end'}`}>
                  <div
                    data-testid={`text-chat-message-${index}`}
                    className={`max-w-[90%] rounded-2xl px-3.5 py-2 text-[10px] leading-[1.65] ${
                      message.from === 'agent'
                        ? 'rounded-bl-sm bg-[hsl(var(--primary))] text-white'
                        : 'rounded-br-sm bg-white/[.12] text-[hsl(214_28%_88%)]'
                    }`}
                  >
                    {message.text}
                  </div>

                  {/* Interactive Booking Card Inside Chat */}
                  {message.booked && (
                    <div className="mt-1.5 max-w-[85%] rounded-xl border border-emerald-400/40 bg-emerald-950/60 p-2.5 text-[9px] text-emerald-200 animate-rise">
                      <div className="flex items-center justify-between font-bold border-b border-emerald-400/20 pb-1 mb-1">
                        <span>{isArabic ? "✓ حجز موعد مؤكد" : "✓ Confirmed Appointment"}</span>
                        <span className="font-mono text-[8px] opacity-80">MRN-90214</span>
                      </div>
                      <p>{isArabic ? "الخميس، ٤:٣٠ م · الطبيب المعالج (عيادة الأسنان)" : "Thursday, 4:30 PM · Attending Physician (Dental Clinic)"}</p>
                    </div>
                  )}
                </div>
              ))}
              {isThinking && (
                <div className="meruna-thinking self-start rounded-2xl rounded-bl-sm px-3.5 py-2 text-[10px]">
                  {t.chat.agentName} <span aria-hidden="true">•••</span>
                </div>
              )}
            </div>

            {/* Message Input */}
            <form onSubmit={sendMessage} className="mt-3 flex items-center gap-2 rounded-xl border border-white/[.12] bg-white/[.04] p-1.5">
              <input
                value={messageInput}
                onChange={(event) => setMessageInput(event.target.value)}
                data-testid="input-chat-message"
                aria-label={t.chat.input}
                placeholder={t.chat.input}
                className="min-w-0 flex-1 bg-transparent px-2 text-[10px] text-white outline-none placeholder:text-[hsl(214_25%_50%)]"
              />
              <button
                type="submit"
                data-testid="button-send-chat"
                aria-label={t.actions.send}
                className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--primary))] text-white transition-transform hover:scale-105"
              >
                <Send className="size-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ENHANCED INTERACTIVE VOICE CALL PLAYGROUND (SAUDI & GULF DIALECT READY) */
function VoicePreview({ t, onPlay, isArabic }: { t: Copy; onPlay: () => void; isArabic: boolean }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState(0);

  const callScenarios = isArabic ? [
    {
      title: "📞 حجز موعد كشف جديد",
      caller: "مريض يتصل هاتفياً بالعيادة",
      patientLine: "مرحباً، أحتاج أحجز أقرب موعد كشف متاح عندكم اليوم أو بكرة.",
      agentLine: "أهلاً وسهلاً بك! أقرب موعد كشف متاح غداً الأربعاء الساعة ٥:٠٠ مساءً مع الطبيب المعالج. هل أثبت لك الحجز وأرسل تفاصيل التأكيد واللوكيشن على الواتساب؟",
      followup: "تم حجز الموعد وتثبيته في التقويم وإرسال رسالة التأكيد والموقع عبر الواتساب فوراً."
    },
    {
      title: "🚨 حالة عاجلة واستفسار فوري",
      caller: "مراجع يسأل عن الحالات الطارئة",
      patientLine: "هل الطبيب متواجد بالعيادة الآن؟ حالة طارئة وتحتاج فحص سريع.",
      agentLine: "سلامتك وألف لا بأس! تم إشعار الطبيب المناوب فوراً وتثبيت أولوية دخول فور وصولك للعيادة.",
      followup: "تم تنبيه شاشة الاستقبال وتجهيز غرفة الكشف للطبيب."
    },
    {
      title: "📍 الاستفسار عن الأسعار والموقع",
      caller: "استفسار عن الخدمات والأسعار",
      patientLine: "كم سعر جلسة تنظيف وتبييض الأسنان ووين موقع العيادة بالتحديد؟",
      agentLine: "أهلاً بك! جلسة تنظيف الأسنان تبدأ من ٢٥٠ ريال، وموقعنا على طريق الملك فهد مع توفر مواقف سيارات. أرسلت لك تفاصيل الأسعار ورابط اللوكيشن على الواتساب.",
      followup: "تم إرسال بطاقة الخدمات والأسعار وتفاصيل الموقع الجغرافي عبر الواتساب."
    }
  ] : [
    {
      title: "📞 New Appointment Booking",
      caller: "Patient calling clinic",
      patientLine: "Hello, I would like to book the earliest available checkup slot.",
      agentLine: "Welcome! The earliest opening is tomorrow Wednesday at 5:00 PM with the attending physician. Shall I confirm and send details to your WhatsApp?",
      followup: "Booking confirmed and appointment slip sent to patient phone."
    },
    {
      title: "🚨 Urgent Care Request",
      caller: "Urgent care caller",
      patientLine: "Is the physician available on duty right now for an emergency checkup?",
      agentLine: "Hope you feel better soon! I alerted the on-duty doctor and prioritized your check-in upon arrival.",
      followup: "Front desk alerted and exam room prepared."
    },
    {
      title: "📍 Prices & Directions",
      caller: "General inquiry",
      patientLine: "What are your checkup rates and where is the clinic located?",
      agentLine: "Checkup starts at 150 SAR. We are located on King Fahd Road with dedicated parking. I just texted you exact map directions via WhatsApp.",
      followup: "Directions and price card sent to caller."
    }
  ];

  const currentScenario = callScenarios[selectedScenario];

  const handleTogglePlay = () => {
    const next = !isPlaying;
    setIsPlaying(next);
    onPlay();
    if (next && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(currentScenario.agentLine);
        utterance.lang = isArabic ? 'ar-SA' : 'en-US';
        utterance.rate = 1.05;
        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = () => setIsPlaying(false);
        window.speechSynthesis.speak(utterance);
      } catch {
        // Speech synthesis fallback
      }
    } else {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }
  };

  return (
    <div className="meruna-voice-preview relative">
      <div className="absolute -inset-5 rounded-[42px] border border-[hsl(var(--primary)/.15)]" />
      <div className="cf-card relative overflow-hidden rounded-[30px] border p-5 shadow-[var(--shadow-soft)] md:p-7">
        {/* Top bar */}
        <div className="mb-5 flex items-center justify-between">
          <span className="cf-mono text-[9px] text-[hsl(var(--muted-foreground))]">
            VOICE AGENT / SIMULATION
          </span>
          <span className="flex items-center gap-2 text-[9px] font-bold text-[hsl(var(--accent))]">
            <span className="size-2 animate-pulse rounded-full bg-[hsl(var(--accent))]" />
            {t.voice.connected}
          </span>
        </div>

        {/* Scenario Tabs */}
        <div className="mb-4 flex flex-wrap gap-1.5">
          {callScenarios.map((sc, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
                setIsPlaying(false);
                setSelectedScenario(idx);
              }}
              className={`rounded-xl px-2.5 py-1 text-[10px] font-bold transition ${
                selectedScenario === idx
                  ? "bg-[hsl(var(--primary))] text-white shadow-sm"
                  : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
              }`}
            >
              {sc.title}
            </button>
          ))}
        </div>

        {/* Interactive Call Card */}
        <div className="rounded-[22px] bg-[hsl(var(--tint))] p-5 space-y-4">
          <div className="flex items-center justify-between gap-3 border-b border-[hsl(var(--border)/.6)] pb-3.5">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-[hsl(var(--navy))] text-[hsl(var(--primary))] shadow-sm">
                <Phone className="size-5" />
              </span>
              <div>
                <strong className="block text-[12px]">{t.voice.assistant}</strong>
                <span className="text-[9px] text-[hsl(var(--muted-foreground))]">
                  {isPlaying ? (isArabic ? "المساعد يتحدث الآن..." : "Speaking with patient...") : t.voice.listening}
                </span>
              </div>
            </div>

            {/* Dynamic Waveform Bars */}
            <div className="flex items-end gap-1" dir="ltr">
              {[14, 28, 18, 36, 22, 16, 32, 20, 26].map((height, index) => (
                <span
                  key={index}
                  className={`w-1 rounded-full bg-[hsl(var(--primary))] transition-all duration-200 ${
                    isPlaying ? "animate-pulse" : "opacity-60"
                  }`}
                  style={{
                    height: isPlaying ? `${Math.max(8, (height * 1.2) % 36)}px` : `${height}px`,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Dialogue Bubbles */}
          <div className="space-y-2.5">
            {/* Patient line */}
            <div className="meruna-voice-bubble meruna-voice-patient ms-auto max-w-[85%] rounded-2xl rounded-br-sm bg-[hsl(var(--card))] px-4 py-2.5 text-[11px] leading-[1.65] text-[hsl(var(--foreground))] border border-[hsl(var(--border)/.6)] shadow-2xs">
              <span className="text-[9px] font-bold text-[hsl(var(--muted-foreground))] block mb-0.5">🧑 {currentScenario.caller}:</span>
              {currentScenario.patientLine}
            </div>

            {/* Agent line */}
            <div className={`meruna-voice-bubble meruna-voice-agent max-w-[85%] rounded-2xl rounded-bl-sm px-4 py-2.5 text-[11px] leading-[1.65] transition ${
              isPlaying
                ? "bg-[hsl(var(--primary))] text-white shadow-md"
                : "bg-[hsl(var(--navy))] text-[hsl(214_33%_94%)]"
            }`}>
              <span className="text-[9px] font-bold text-emerald-300 block mb-0.5">🤖 {t.voice.assistant}:</span>
              {currentScenario.agentLine}
            </div>

            {/* Automation Follow-up note */}
            <div className="text-[9px] text-emerald-800 dark:text-emerald-300 font-bold bg-emerald-100/70 dark:bg-emerald-950/40 p-2 rounded-xl border border-emerald-300/40 flex items-center gap-1.5">
              <span>⚡</span>
              <span>{currentScenario.followup}</span>
            </div>
          </div>
        </div>

        {/* Play Control Bar */}
        <div className="mt-4 flex items-center justify-between rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3">
          <div className="flex items-center gap-2 text-[11px] font-medium text-[hsl(var(--muted-foreground))]">
            {isPlaying ? <Volume2 className="size-4 text-[hsl(var(--primary))] animate-bounce" /> : <VolumeX className="size-4" />}
            <span>{isArabic ? "انقر للاستماع للمكالمة بالصوت التفاعلي" : "Click to hear interactive voice speech"}</span>
          </div>
          <button
            type="button"
            onClick={handleTogglePlay}
            data-testid="button-voice-play"
            aria-label={t.actions.play}
            className="flex items-center gap-2 rounded-full bg-[hsl(var(--primary))] px-4 py-2 text-xs font-bold text-white shadow-md transition-transform hover:scale-105"
          >
            {isPlaying ? <Pause className="size-3.5 fill-current" /> : <Play className="size-3.5 fill-current" />}
            <span>{isPlaying ? (isArabic ? "إيقاف" : "Stop") : (isArabic ? "استماع" : "Play")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function DemoModal({ t, sent, setSent, onClose }: { t: Copy; sent: boolean; setSent: (value: boolean) => void; onClose: () => void }) {
  return (
    <div className="cf-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="demo-title">
      <div className="cf-modal relative w-full max-w-[500px] rounded-[30px] border p-6 shadow-[0_30px_90px_hsl(var(--navy)/.35)] md:p-8">
        <button type="button" onClick={onClose} data-testid="button-close-demo" aria-label={t.actions.close} className="cf-button-ghost absolute end-5 top-5 flex size-9 items-center justify-center rounded-full">
          <X className="size-4" />
        </button>
        {!sent ? (
          <>
            <div className="mb-6 flex size-12 items-center justify-center rounded-2xl bg-[hsl(var(--navy))] text-[hsl(var(--primary))]">
              <Phone className="size-5" />
            </div>
            <Eyebrow>{t.modal.eyebrow}</Eyebrow>
            <h2 id="demo-title" className="cf-display text-[28px] font-extrabold leading-[1.12]">
              {t.modal.title}<br />
              <span className="text-[hsl(var(--primary))]">{t.modal.accent}</span>
            </h2>
            <p className="cf-body-muted mt-3 text-[13px] leading-[1.8]">{t.modal.body}</p>
            <form className="mt-6 space-y-3" onSubmit={(event) => { event.preventDefault(); setSent(true); }}>
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-bold text-[hsl(var(--muted-foreground))]">{t.modal.name}</span>
                <input required data-testid="input-demo-name" className="cf-input w-full rounded-2xl px-4 py-3 text-[12px]" placeholder={t.modal.namePlaceholder} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-bold text-[hsl(var(--muted-foreground))]">{t.modal.contact}</span>
                <input required type="email" data-testid="input-demo-contact" className="cf-input w-full rounded-2xl px-4 py-3 text-[12px]" placeholder={t.modal.contactPlaceholder} />
              </label>
              <button type="submit" data-testid="button-submit-demo" className="cf-button-primary mt-3 flex w-full items-center justify-center gap-2 rounded-full px-5 py-3.5 text-[12px] font-bold">
                <Send className="size-4" />
                {t.actions.submit}
              </button>
            </form>
          </>
        ) : (
          <div className="py-12 text-center">
            <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-[hsl(var(--lime-soft))] text-[hsl(var(--accent))]">
              <Check className="size-7" />
            </span>
            <h2 className="cf-display mt-6 text-[28px] font-extrabold">{t.modal.sentTitle}</h2>
            <p className="cf-body-muted mx-auto mt-3 max-w-[290px] text-[13px] leading-[1.8]">{t.modal.sentBody}</p>
            <button type="button" onClick={onClose} data-testid="button-finish-demo" className="cf-button-ghost mt-7 rounded-full px-5 py-2.5 text-[11px] font-bold">
              {t.modal.done}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
export default App;

