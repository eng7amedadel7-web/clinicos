import { createContext, type CSSProperties, type ReactNode, Suspense, lazy, useContext, useEffect, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster, toast } from 'sonner';
import {
  Activity,
  Search,
  ArrowLeft,
  ArrowRight,
  Bell,
  ChevronRight,
  GripVertical,
  PanelRightClose,
  PanelRightOpen,
  Moon,
  Sun,
  Building2,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  CreditCard,
  FileText,
  Home,
  Inbox,
  LogOut,
  MapPin,
  RefreshCw,
  Settings2,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
  Bot,
  CalendarDays,
  ListTodo,
  Menu,
  PhoneCall,
  X,
} from 'lucide-react';
import {
  getGetAuthSessionQueryKey,
  getGetDashboardSummaryQueryKey,
  getGetClinicSettingsQueryKey,
  useGetAuthSession,
  useGetClinicSettings,
  useGetDashboardSummary,
  useLogout,
  useUpdateClinicSettings,
} from '@workspace/api-client-react';
import { Link, Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import { CommandPalette, CommandPaletteTrigger, useCommandPalette } from '@/components/command-palette';
import { NotificationsBell } from '@/components/notifications-panel';
import { ShortcutsModal } from '@/components/shortcuts-modal';
import { NetworkStatusBanner } from '@/components/network-status';
import { OnboardingTour } from '@/components/onboarding-tour';
import { QuickAddModal } from '@/components/quick-add-modal';
import { BrandMark } from '@/components/brand';
import { PreferencesProvider, usePreferences, type TranslationKey } from '@/lib/preferences';
import { NotificationsProvider, useClinicNotifications } from '@/lib/notifications-context';
import { RealtimeStatusContext, useRealtimeSync } from '@/lib/realtime';
import { getOperationsSummary } from '@/lib/operations-api';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10_000,
      gcTime: 10 * 60_000,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: 1,
      structuralSharing: true,
    },
  },
});
const LiveDashboard = lazy(() => import('@/pages/live-dashboard'));
const LiveVoiceAgentPage = lazy(() => import('@/pages/live-voice-agent'));
const BillingPage = lazy(() => import('@/pages/billing'));
const Patient360Page = lazy(() => import('@/pages/patient-360-page'));
const AppointmentJourneyPage = lazy(() => import('@/pages/appointment-journey-page'));
const CalendarPage = lazy(() => import('@/pages/calendar-page'));
const AiReceptionPage = lazy(() => import('@/pages/ai-reception-page'));
const TasksPage = lazy(() => import('@/pages/tasks-page'));
const TemplatesPage = lazy(() => import('@/pages/templates-page'));
const MerunaHome = lazy(() => import('@/pages/meruna-home'));
const CurrentMerunaHome = lazy(() => import('@/pages/meruna-home-current'));
const MergedMerunaHome = lazy(() => import('@/pages/meruna-home-merged'));
const LegalPage = lazy(() => import('@/pages/legal-pages'));
const OrganizationSettings = lazy(() => import('@/pages/organization-settings'));
const LivePatientsPage = lazy(() => import('@/pages/live-operations-pages').then((module) => ({ default: module.LivePatientsPage })));
const LiveAppointmentsPage = lazy(() => import('@/pages/live-operations-pages').then((module) => ({ default: module.LiveAppointmentsPage })));
const InboxPage = lazy(() => import('@/pages/inbox-page'));
const AnalyticsPage = lazy(() => import('@/pages/analytics-page'));
const WaitlistPage = lazy(() => import('@/pages/live-operations-pages').then((module) => ({ default: module.WaitlistPage })));
const FollowUpsPage = lazy(() => import('@/pages/live-operations-pages').then((module) => ({ default: module.FollowUpsPage })));
const NoShowsPage = lazy(() => import('@/pages/live-operations-pages').then((module) => ({ default: module.NoShowsPage })));
const PublicQueuePage = lazy(() => import('@/pages/public-queue-page'));
const LoginPage = lazy(() => import('@/pages/login-page'));
const RegisterPage = lazy(() => import('@/pages/register-page'));
const AdminPanelPage = lazy(() => import('@/pages/admin-panel'));

function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <div className="flex items-center gap-2.5" data-testid="brand-logo">
      <BrandMark size={32} />
      <strong className={`text-[1.02rem] font-extrabold tracking-[.16em] ${dark ? 'text-[#0b2940]' : 'text-[#eef6fa]'}`}>MERUNA</strong>
    </div>
  );
}

function ErrorMessage({ onRetry, compact = false }: { onRetry: () => void; compact?: boolean }) {
  const { language } = usePreferences();
  const en = language === 'en';
  return (
    <div className={`surface flex flex-col items-center justify-center text-center ${compact ? 'p-6' : 'min-h-[360px] p-10'}`} data-testid="state-error">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#f9e9e7] text-[#ad514a] dark:bg-[#3d1f1b] dark:text-[#eb9a90]"><RefreshCw size={20} /></div>
      <h2 className="text-lg font-bold text-[#18374d] dark:text-[#e2ecf1]">{en ? 'Could not load data' : 'تعذّر تحميل البيانات'}</h2>
      <p className="mt-1 max-w-sm text-sm leading-6 text-[#718591] dark:text-[#7e939e]">{en ? 'Something went wrong temporarily. Try again and we will resume where you left off.' : 'حدث خلل مؤقت. حاول مرة أخرى، وسنستأنف من حيث توقفت.'}</p>
      <button className="primary-button mt-5" onClick={onRetry} data-testid="button-retry"><RefreshCw size={16} /> {en ? 'Retry' : 'إعادة المحاولة'}</button>
    </div>
  );
}

function RouteLoadingFallback({ fullHeight = false }: { fullHeight?: boolean }) {
  return (
    <div className={`flex min-w-0 flex-1 items-center justify-center bg-transparent p-6 ${fullHeight ? 'min-h-[100dvh]' : 'min-h-[320px]'}`} dir="rtl" data-testid="state-route-loading">
      <div className="w-full max-w-xl space-y-4">
        <div className="skeleton h-5 w-32" />
        <div className="skeleton h-12 w-full" />
        <div className="skeleton h-40 w-full" />
      </div>
    </div>
  );
}

function Field({ label, error, children, hint }: { label: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block text-right">
      <span className="mb-2 block text-[.78rem] font-bold text-slate-700 dark:text-slate-200">{label}</span>
      {children}
      {error ? <span className="mt-1.5 block text-xs font-semibold text-red-500" data-testid="text-field-error">{error}</span> : hint ? <span className="mt-1.5 block text-xs text-slate-500 dark:text-slate-400">{hint}</span> : null}
    </label>
  );
}

function getApiErrorMessage(error: unknown, language: 'ar' | 'en' = 'ar'): string | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const candidate = error as { data?: unknown; error?: unknown; message?: unknown; status?: unknown };
  const fallback = language === 'ar'
    ? 'تعذر الاتصال بخدمة الدخول مؤقتًا. استخدم رابط Production الرسمي وحاول مرة أخرى.'
    : 'The sign-in service is temporarily unavailable. Use the official Production link and try again.';
  const status = typeof candidate.status === 'number' ? candidate.status : undefined;
  const data = candidate.data;
  if (data && typeof data === 'object') {
    const nestedError = (data as { error?: unknown }).error;
    if (typeof nestedError === 'string' && nestedError.trim()) return nestedError;
  }
  if (typeof candidate.error === 'string' && candidate.error.trim()) return candidate.error;
  if (typeof candidate.message === 'string' && candidate.message.trim()) {
    const message = candidate.message.trim();
    if (status !== undefined && status >= 500 || /<(!doctype|html)|internal server error/i.test(message)) return fallback;
    return message;
  }
  return status !== undefined && status >= 500 ? fallback : undefined;
}
function Sidebar({ clinicName, userName, mobileOpen = false, onNavigate }: { clinicName: string; userName: string; mobileOpen?: boolean; onNavigate?: () => void }) {
  const [location, setLocation] = useLocation();
  const logout = useLogout();
  const { unreadHandoffs, unreadMessages } = useClinicNotifications();
  const [collapsed, setCollapsed] = useState(() => window.localStorage.getItem('meruna-sidebar-collapsed') === 'true');
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = Number(window.localStorage.getItem('meruna-sidebar-width'));
    return Number.isFinite(saved) ? Math.min(360, Math.max(220, saved)) : 248;
  });
  const resizeRef = useRef<{ startX: number; startWidth: number } | null>(null);
  const asideRef = useRef<HTMLElement | null>(null);
  const [tip, setTip] = useState<{ label: string; y: number; left: number } | null>(null);
  const [clinicMenuOpen, setClinicMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const { language, theme, t, toggleLanguage, toggleTheme, selectedBranchId, setSelectedBranchId, branches, branchesLoading, branchesError, loadBranches } = usePreferences();
  const navGroups: Array<{ id: string; title: string; links: Array<{ href: string; label: string; icon: typeof Home }> }> = [
    { id: 'operations', title: language === 'ar' ? 'التشغيل' : 'Operations', links: [
      { href: '/dashboard', label: t('overview'), icon: Home },
      { href: '/calendar', label: language === 'ar' ? 'التقويم' : 'Calendar', icon: CalendarDays },
      { href: '/tasks', label: language === 'ar' ? 'المهام' : 'Tasks', icon: ListTodo },
      { href: '/waitlist', label: t('waitlist'), icon: Clock3 },
      { href: '/follow-ups', label: t('followUps'), icon: Sparkles },
      { href: '/no-shows', label: t('noShowsOpen'), icon: ShieldCheck },
    ] },
    { id: 'patients', title: language === 'ar' ? 'المرضى' : 'Patients', links: [
      { href: '/patients', label: t('patients'), icon: UsersRound },
      { href: '/appointments', label: t('appointments'), icon: Clock3 },
      { href: '/inbox', label: t('inbox'), icon: Inbox },
      { href: '/ai-reception', label: language === 'ar' ? 'الاستقبال الذكي' : 'AI Reception', icon: Bot },
      { href: '/templates', label: language === 'ar' ? 'القوالب' : 'Templates', icon: FileText },
      { href: '/voice-agent', label: t('voiceAgent'), icon: PhoneCall },
    ] },
    { id: 'settings', title: language === 'ar' ? 'الإعدادات' : 'Settings', links: [
      { href: '/analytics', label: language === 'ar' ? 'التقارير والإحصائيات' : 'Analytics', icon: Activity },
      { href: '/organization', label: language === 'ar' ? 'بيانات المنشأة' : 'Organization', icon: Building2 },
      { href: '/billing', label: t('reports'), icon: CreditCard },
      { href: '/settings', label: t('settings'), icon: Settings2 },
    ] },
  ];
  const doLogout = () => logout.mutate(undefined, { onSuccess: () => { queryClient.clear(); toast.success(language === 'ar' ? 'تم تسجيل الخروج' : 'Signed out'); setLocation('/login'); }, onError: () => toast.error(language === 'ar' ? 'تعذر تسجيل الخروج، حاول مجددًا' : 'Could not sign out, try again') });

  useEffect(() => {
    window.localStorage.setItem('meruna-sidebar-collapsed', String(collapsed));
  }, [collapsed]);
  useEffect(() => {
    window.localStorage.setItem('meruna-sidebar-width', String(sidebarWidth));
  }, [sidebarWidth]);
  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      if (!resizeRef.current || collapsed) return;
      const nextWidth = Math.min(360, Math.max(220, resizeRef.current.startWidth + event.clientX - resizeRef.current.startX));
      setSidebarWidth(nextWidth);
    };
    const onPointerUp = () => {
      resizeRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [collapsed]);

  const sidebarStyle = { '--sidebar-width': `${collapsed ? 84 : sidebarWidth}px` } as CSSProperties;
  const showTip = (label: string) => (event: { currentTarget: EventTarget & HTMLAnchorElement }) => {
    if (!collapsed || !asideRef.current) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const asideRect = asideRef.current.getBoundingClientRect();
    const onLeft = asideRect.left + asideRect.width / 2 < window.innerWidth / 2;
    setTip({ label, y: rect.top + rect.height / 2, left: onLeft ? asideRect.right + 10 : asideRect.left - 10 });
  };
  const hideTip = () => setTip(null);
  return (
    <aside ref={(node) => { asideRef.current = node; }} className={`sidebar relative flex w-full flex-col px-4 py-5 md:sticky md:top-0 md:h-[100dvh] md:w-[var(--sidebar-width)] md:shrink-0 md:px-5 md:py-7 ${mobileOpen ? 'sidebar-open' : ''}`} style={sidebarStyle} dir="rtl" aria-hidden={undefined}>
      {tip && <span className="sidebar-tip" role="tooltip" style={{ top: tip.y, left: tip.left, transform: `translate(${tip.left > window.innerWidth / 2 ? '-100%' : '0'}, -50%)` }}>{tip.label}</span>}
      <button type="button" className="sidebar-close" onClick={onNavigate} aria-label={language === 'ar' ? 'إغلاق القائمة' : 'Close menu'}><X size={18} /></button>
      <div className={`brand-lockup mb-10 flex items-center ${collapsed ? 'justify-center gap-2 px-0' : 'justify-between px-2'}`}>
        {collapsed ? <BrandMark size={34} /> : <Logo />}
        <button type="button" onClick={() => setCollapsed((value) => !value)} className="sidebar-tool" aria-label={collapsed ? 'توسيع الشريط الجانبي' : 'طي الشريط الجانبي'} title={collapsed ? 'توسيع الشريط الجانبي' : 'طي الشريط الجانبي'} data-testid="button-toggle-sidebar">
          {collapsed ? <PanelRightOpen size={17} /> : <PanelRightClose size={17} />}
        </button>
      </div>
      <div className="relative mb-7">
        <button type="button" onClick={() => { loadBranches(); setClinicMenuOpen((value) => !value); }} aria-expanded={clinicMenuOpen} aria-label={language === 'ar' ? 'تبديل العيادة أو الفرع' : 'Switch clinic or branch'} title={collapsed ? clinicName : undefined} className={`sidebar-clinic flex w-full items-center rounded-xl border border-[#688b9c]/20 bg-[#143149] p-3 text-right ${collapsed ? 'justify-center gap-0' : 'gap-3'}`} data-testid="button-clinic-switcher">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#8fbaca]/15 text-[#9cc6d3]"><Building2 size={18} /></div>
          <div className={`min-w-0 ${collapsed ? 'md:hidden' : ''}`}><p className="truncate text-xs font-bold text-[#e6f0f2]" data-testid="text-sidebar-clinic">{clinicName}</p><p className="mt-0.5 flex items-center gap-1.5 text-[.68rem] text-[#8ea9b5]"><span className="status-dot" /> {branchesLoading ? t('loadingBranches') : selectedBranchId === 'all' ? t('clinicWide') : branches.find((branch) => branch.id === selectedBranchId)?.name || t('chooseBranch')}</p></div>
          <ChevronDown size={14} className={`mr-auto text-[#7895a2] transition-transform ${clinicMenuOpen ? 'rotate-180' : ''} ${collapsed ? 'md:hidden' : ''}`} />
        </button>
        {clinicMenuOpen && <div className={`sidebar-popover absolute z-20 mt-2 rounded-xl border border-[#688b9c]/20 bg-[#123047] p-2 shadow-xl ${collapsed ? 'md:right-0 md:w-56' : 'inset-x-0'}`} role="menu" aria-label={language === 'ar' ? 'اختيار الفرع' : 'Choose branch'}>
          <div className="px-2 py-1.5 text-[10px] font-bold text-[#8ea9b5]">{t('chooseBranchSidebar')}</div>
          <button type="button" onClick={() => { setSelectedBranchId('all'); setClinicMenuOpen(false); }} className={`sidebar-menu-item ${selectedBranchId === 'all' ? 'selected' : ''}`} role="menuitem" data-testid="button-branch-all"><span>{t('allBranches')}</span>{selectedBranchId === 'all' && <Check size={14} />}</button>
          {branches.map((branch) => <button type="button" key={branch.id} onClick={() => { setSelectedBranchId(branch.id); setClinicMenuOpen(false); }} className={`sidebar-menu-item ${selectedBranchId === branch.id ? 'selected' : ''}`} role="menuitem" data-testid={`button-branch-${branch.id}`}><span className="truncate">{branch.name}</span>{selectedBranchId === branch.id && <Check size={14} />}</button>)}
          {!branchesLoading && branchesError && <p className="px-2 py-2 text-[10px] leading-5 text-[#efb2ac]">{t('branchError')}</p>}
          {!branchesLoading && !branchesError && branches.length === 0 && <p className="px-2 py-2 text-[10px] leading-5 text-[#8ea9b5]">{language === 'ar' ? 'لا توجد فروع نشطة؛ الاختيار الحالي يشمل العيادة كلها.' : 'No active branches; the current selection covers the whole clinic.'}</p>}
        </div>}
      </div>
      <nav className={`sidebar-nav min-h-0 overflow-y-auto space-y-1 ${collapsed ? 'md:space-y-2' : ''}`} aria-label={language === 'ar' ? 'التنقل الرئيسي' : 'Main navigation'}>
        {navGroups.map((group) => <div key={group.id} className="sidebar-group">
          <p className={`sidebar-group-label ${collapsed ? 'md:sr-only' : ''}`}>{group.title}</p>
          {group.links.map(({ href, label, icon: Icon }) => {
            const hasInboxBadge = href === '/inbox' && (unreadHandoffs > 0 || unreadMessages > 0);
            return (
              <Link key={href} href={href} onClick={() => { onNavigate?.(); hideTip(); }} onMouseEnter={showTip(label)} onMouseLeave={hideTip} onFocus={showTip(label)} onBlur={hideTip} aria-label={label} className={`sidebar-link px-3 py-3 text-sm font-semibold ${collapsed ? 'md:justify-center md:gap-0' : ''} ${location === href || location.startsWith(`${href}/`) ? 'active' : ''}`} data-testid={`link-nav-${href.slice(1)}`}>
                <Icon size={18} strokeWidth={1.8} />
                <span className={collapsed ? 'md:sr-only' : ''}>{label}</span>
                {hasInboxBadge && (
                  <span className={`ms-auto rounded-full px-1.5 py-0.5 text-[10px] font-extrabold ${unreadHandoffs > 0 ? 'bg-[#c75b54] text-white animate-pulse' : 'bg-[#3d8a72] text-white'} ${collapsed ? 'md:hidden' : ''}`}>
                    {unreadHandoffs > 0 ? '!' : unreadMessages}
                  </span>
                )}
                {collapsed ? <ChevronRight size={12} className="hidden md:block" aria-hidden="true" /> : null}
              </Link>
            );
          })}
        </div>)}
      </nav>
      <div className={`sidebar-footer mt-auto shrink-0 border-t border-[#688b9c]/15 pt-5 ${collapsed ? 'md:px-0' : ''}`}>
        <div className="relative">
          <button type="button" onClick={() => setProfileMenuOpen((value) => !value)} aria-expanded={profileMenuOpen} aria-label={t('accountMenu')} title={collapsed ? userName : undefined} className={`mb-2 flex w-full items-center gap-3 rounded-xl px-2 py-2 text-right transition hover:bg-white/10 ${collapsed ? 'md:justify-center md:px-0' : ''}`} data-testid="button-profile-menu"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#b2ccd6] text-sm font-bold text-[#15384d]">{userName.slice(0, 1)}</div><div className={`min-w-0 ${collapsed ? 'md:hidden' : ''}`}><p className="truncate text-xs font-bold text-[#e6f0f2]" data-testid="text-sidebar-user">{userName}</p><p className="text-[.68rem] text-[#8ea9b5]">{t('clinicOwner')}</p></div><ChevronDown size={14} className={`mr-auto text-[#7895a2] transition-transform ${profileMenuOpen ? 'rotate-180' : ''} ${collapsed ? 'md:hidden' : ''}`} /></button>
          {profileMenuOpen && <div className={`sidebar-popover absolute bottom-full z-20 mb-2 rounded-xl border border-[#688b9c]/20 bg-[#123047] p-2 shadow-xl ${collapsed ? 'md:right-0 md:w-56' : 'inset-x-0'}`} role="menu" aria-label={language === 'ar' ? 'قائمة الملف الشخصي' : 'Profile menu'}><div className="px-2 py-1.5 text-[10px] font-bold text-[#8ea9b5]">{t('accountMenu')}</div><Link href="/settings" onClick={() => setProfileMenuOpen(false)} className="sidebar-menu-item" role="menuitem" data-testid="link-profile-settings"><Settings2 size={15} /><span>{t('settings')}</span></Link><button type="button" onClick={doLogout} disabled={logout.isPending} className="sidebar-menu-item danger" role="menuitem" data-testid="button-profile-logout"><LogOut size={15} /><span>{logout.isPending ? (language === 'ar' ? 'جارٍ الخروج...' : 'Signing out...') : t('logout')}</span></button></div>}
        </div>
      </div>
      <div className={`sidebar-resizer ${collapsed ? 'hidden' : ''}`} role="separator" aria-orientation="vertical" aria-label={language === 'ar' ? 'تغيير عرض الشريط الجانبي' : 'Resize sidebar'} tabIndex={0} onPointerDown={(event) => { event.preventDefault(); resizeRef.current = { startX: event.clientX, startWidth: sidebarWidth }; document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none'; }}><GripVertical size={15} /></div>
    </aside>
  );
}

function WorkspaceToolbar({ onOpenMenu, onOpenSearch, onOpenShortcuts }: { onOpenMenu?: () => void; onOpenSearch?: () => void; onOpenShortcuts?: () => void }) {
  const { language, theme, t, toggleLanguage, toggleTheme } = usePreferences();
  return (
    <div className="workspace-toolbar flex items-center gap-2 border-b border-[#dbe5ea] bg-[#f6f9fa]/90 px-5 py-3 backdrop-blur md:px-9" dir="rtl">
      <button type="button" onClick={onOpenMenu} className="toolbar-button md:hidden" aria-label={language === 'ar' ? 'فتح القائمة' : 'Open menu'} data-testid="button-open-menu"><Menu size={18} /></button>
      <div className="min-w-0 flex-1 md:hidden"><p className="truncate text-[11px] font-bold text-[#78909c] dark:text-[#a8bfc9]">MERUNA</p><p className="truncate text-xs text-[#8a9ba4] dark:text-[#7e939e]">{language === 'ar' ? 'مساحة عمل العيادة' : 'Clinic workspace'}</p></div>
      {onOpenSearch ? <div className="hidden min-w-0 flex-1 md:block"><CommandPaletteTrigger onOpen={onOpenSearch} language={language} /></div> : null}
      {onOpenSearch ? <button type="button" onClick={onOpenSearch} className="toolbar-button md:hidden" aria-label={language === 'ar' ? 'بحث' : 'Search'} data-testid="button-open-search-mobile"><Search size={17} /></button> : null}
      <NotificationsBell />
      {onOpenShortcuts ? (
        <button
          type="button"
          onClick={onOpenShortcuts}
          aria-label={language === 'ar' ? 'اختصارات لوحة المفاتيح' : 'Keyboard shortcuts'}
          title={language === 'ar' ? 'اختصارات لوحة المفاتيح (?)' : 'Keyboard shortcuts (?)'}
          className="toolbar-button hidden sm:flex"
          data-testid="button-shortcuts-toggle"
        >
          <span className="font-mono text-xs font-bold">?</span>
        </button>
      ) : null}
      <button type="button" onClick={toggleTheme} aria-label={theme === 'dark' ? t('lightMode') : t('darkMode')} title={theme === 'dark' ? t('lightMode') : t('darkMode')} className="toolbar-button" data-testid="button-theme-toggle">{theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}</button>
      <button type="button" onClick={toggleLanguage} aria-label={t('switchLanguage')} title={t('switchLanguage')} className="toolbar-language" data-testid="button-language-toggle">{language === 'ar' ? 'EN' : 'ع'}</button>
    </div>
  );
}

function DashboardSkeleton() {
  return <div className="space-y-6" data-testid="state-loading"><div className="skeleton h-32 w-full" /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[1, 2, 3, 4].map(i => <div className="skeleton h-36" key={i} />)}</div><div className="skeleton h-64 w-full" /></div>;
}

function StatCard({ label, value, helper, tone, index }: { label: string; value: string; helper: string; tone: string; index: number }) {
  const palette: Record<string, string> = { blue: '#347b98', green: '#3d8a72', amber: '#a6773a', violet: '#7568a0' };
  const color = palette[tone] ?? palette.blue;
  return <article className="surface stat-card animate-rise p-5" style={{ color, animationDelay: `${index * 70}ms` }} data-testid={`card-stat-${index}`}><div className="mb-6 flex items-start justify-between"><span className="text-[.78rem] font-bold text-[#66808e]" data-testid={`text-stat-label-${index}`}>{label}</span><span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} /></div><p className="text-3xl font-extrabold tracking-tight text-[#18374d]" data-testid={`text-stat-value-${index}`}>{value}</p><p className="mt-2 text-xs text-[#8a9ba4]" data-testid={`text-stat-helper-${index}`}>{helper}</p></article>;
}

function DashboardPage({ session }: { session: { user: { fullName: string }; clinic: { name: string; city: string } } }) {
  const summaryQuery = useGetDashboardSummary({ query: { retry: 1, queryKey: getGetDashboardSummaryQueryKey() } });
  const summary = summaryQuery.data;
  const firstName = session.user.fullName.split(' ')[0];
  const activities = summary?.recentActivity ?? [];
  const dateLabel = new Intl.DateTimeFormat('ar-SA', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
  return <div className="main-content min-w-0 flex-1" dir="rtl">
    <header className="flex items-center justify-between border-b border-[#dbe5ea] bg-[#f6f9fa]/90 px-5 py-4 backdrop-blur md:px-9"><div><p className="text-xs font-semibold text-[#78909c]" data-testid="text-current-date">{dateLabel}</p><h1 className="ar mt-1 text-xl font-bold text-[#15364b]" data-testid="heading-dashboard">صباح الخير، {firstName}</h1></div><div className="flex items-center gap-2"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#c9dce3] text-sm font-bold text-[#1c4b61]" data-testid="avatar-user">{firstName.slice(0, 1)}</div></div></header>
    <div className="mx-auto max-w-[1450px] space-y-7 p-5 md:p-9">
      <div className="animate-rise relative overflow-hidden rounded-2xl bg-[#0c2b41] px-6 py-7 text-[#edf7f8] shadow-[0_16px_32px_rgba(17,55,74,.12)] md:px-8 md:py-8"><div className="relative z-10 max-w-xl"><div className="mb-3 flex items-center gap-2 text-xs font-semibold text-[#9ec8d3]"><span className="status-dot" /> لوحة عيادتك اليوم</div><h2 className="ar text-2xl font-bold leading-relaxed md:text-3xl">هذه هي الصورة الكاملة لعيادتك.</h2><p className="ar mt-2 text-sm leading-7 text-[#aac1ca]">ابدأ بالأهم، واترك الباقي لMERUNA SYSTEM.</p></div><div className="absolute -left-8 -top-20 h-64 w-64 rounded-full border border-[#80b6c7]/20" /><div className="absolute -left-16 -top-28 h-80 w-80 rounded-full border border-[#80b6c7]/10" /><div className="absolute bottom-0 left-12 hidden h-20 w-20 rotate-45 border border-[#80b6c7]/20 md:block" /></div>
      {summaryQuery.isLoading ? <DashboardSkeleton /> : summaryQuery.isError ? <ErrorMessage onRetry={() => summaryQuery.refetch()} /> : summary ? <><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{summary.stats.map((stat, i) => <StatCard {...stat} index={i} key={`${stat.label}-${i}`} />)}</section><section className="grid gap-6 xl:grid-cols-[1.25fr_.75fr]"><div className="surface animate-rise delay-2 p-6"><div className="mb-6 flex items-center justify-between"><div><h2 className="font-bold text-[#18374d]">آخر النشاطات</h2><p className="mt-1 text-xs text-[#8496a0]">ما تم إنجازه مؤخرًا في العيادة</p></div><button className="quiet-button text-xs" onClick={() => toast.info('أنت ترى آخر النشاطات بالفعل')} data-testid="button-view-activity">عرض الكل <ArrowLeft size={14} /></button></div>{activities.length ? <div className="divide-y divide-[#edf1f3]">{activities.map((item) => <div className="animate-sweep flex gap-4 py-4 first:pt-0 last:pb-0" key={item.id} data-testid={`activity-${item.id}`}><div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e8f2f4] text-[#4c8b9e]"><Activity size={17} /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-bold text-[#28495b]" data-testid={`text-activity-title-${item.id}`}>{item.title}</h3><time className="text-[.68rem] text-[#99a8af]" dateTime={item.createdAt}>{new Intl.DateTimeFormat('ar-SA', { day: 'numeric', month: 'short' }).format(new Date(item.createdAt))}</time></div><p className="mt-1 text-xs leading-6 text-[#7f919a]" data-testid={`text-activity-description-${item.id}`}>{item.description}</p></div></div>)}</div> : <div className="flex flex-col items-center py-10 text-center" data-testid="state-empty-activity"><div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#edf4f5] text-[#789daa]"><FileText size={20} /></div><p className="text-sm font-bold text-[#527080]">لا توجد نشاطات بعد</p><p className="mt-1 text-xs text-[#95a4ab]">ستظهر هنا آخر مستجدات عيادتك.</p></div>}</div><div className="surface animate-rise delay-3 p-6"><div className="mb-6 flex items-center justify-between"><div><h2 className="font-bold text-[#18374d]">نبض العيادة</h2><p className="mt-1 text-xs text-[#8496a0]">مؤشرات تساعدك على القرار</p></div><Sparkles size={19} className="text-[#77a5b2]" /></div><div className="space-y-5"><div className="rounded-xl bg-[#f1f7f7] p-4"><div className="flex items-center justify-between text-xs"><span className="font-bold text-[#3c6f79]">جاهزية اليوم</span><span className="font-extrabold text-[#3d8a72]">مستقرة</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#d7e8e7]"><div className="h-full w-[82%] rounded-full bg-[#66a898]" /></div><p className="mt-2 text-[.68rem] text-[#80969a]">كل ما يلزم فريقك واضح الآن</p></div><div className="flex items-start gap-3 border-b border-[#edf1f3] pb-4"><Clock3 size={17} className="mt-0.5 text-[#ad8248]" /><div><p className="text-xs font-bold text-[#355467]">الوقت في صفك</p><p className="mt-1 text-xs leading-5 text-[#8b9aa2]">استغل هدوء بداية اليوم لمراجعة الأولويات.</p></div></div><div className="flex items-start gap-3"><UsersRound size={17} className="mt-0.5 text-[#6f69a0]" /><div><p className="text-xs font-bold text-[#355467]">فريقك متصل</p><p className="mt-1 text-xs leading-5 text-[#8b9aa2]">تابع العمل من لوحة واحدة.</p></div></div></div></div></section></> : <div className="surface p-10 text-center" data-testid="state-empty-dashboard"><Building2 className="mx-auto mb-3 text-[#7d9eaa]" /><p className="font-bold text-[#36596d]">لا توجد بيانات للعيادة</p></div>}
    </div>
  </div>;
}

function SettingsPage({ session }: { session: { user: { fullName: string; email: string; role: string }; clinic: { name: string; city: string; status: string } } }) {
  const client = useQueryClient();
  const settingsQuery = useGetClinicSettings();
  const updateSettings = useUpdateClinicSettings();
  const [saved, setSaved] = useState(false);
  const { language } = usePreferences();
  const en = language === 'en';
  const form = useForm({ defaultValues: { fullName: session.user.fullName, email: session.user.email, clinicName: session.clinic.name, city: session.clinic.city } });

  useEffect(() => {
    if (settingsQuery.data) {
      form.reset({
        fullName: settingsQuery.data.user.fullName,
        email: settingsQuery.data.user.email,
        clinicName: settingsQuery.data.clinic.name,
        city: settingsQuery.data.clinic.city === '—' ? '' : settingsQuery.data.clinic.city,
      });
    }
  }, [settingsQuery.data, form]);

  const save = (values: Record<string, string>) => {
    updateSettings.mutate({ data: { fullName: values.fullName, clinicName: values.clinicName, city: values.city } }, {
      onSuccess: (data) => {
        client.setQueryData(getGetAuthSessionQueryKey(), data);
        client.setQueryData(getGetClinicSettingsQueryKey(), data);
        form.reset({ fullName: data.user.fullName, email: data.user.email, clinicName: data.clinic.name, city: data.clinic.city === '—' ? '' : data.clinic.city });
        setSaved(true);
        toast.success(en ? 'Changes saved' : 'تم حفظ التغييرات');
        window.setTimeout(() => setSaved(false), 2200);
      },
    });
  };

  if (settingsQuery.isLoading) return <div className="main-content min-w-0 flex-1 p-9" dir="rtl"><DashboardSkeleton /></div>;
  if (settingsQuery.isError) return <div className="main-content min-w-0 flex-1 p-9" dir="rtl"><ErrorMessage onRetry={() => settingsQuery.refetch()} /></div>;

  return <div className="main-content min-w-0 flex-1" dir="rtl"><header className="flex items-center justify-between border-b border-[#dbe5ea] bg-[#f6f9fa]/90 px-5 py-4 md:px-9 dark:border-[#1e3a4d] dark:bg-[#0b1824]/90"><div><p className="text-xs font-semibold text-[#78909c] dark:text-[#7e939e]">{en ? 'Your personal space' : 'مساحتك الخاصة'}</p><h1 className="ar mt-1 text-xl font-bold text-[#15364b] dark:text-[#e2ecf1]" data-testid="heading-settings">{en ? 'Settings' : 'الإعدادات'}</h1></div><button className="quiet-button" onClick={() => form.reset()} data-testid="button-reset-settings"><RefreshCw size={17} /> {en ? 'Reset' : 'إعادة الضبط'}</button></header><div className="mx-auto max-w-[1020px] space-y-6 p-5 md:p-9"><div className="animate-rise rounded-2xl bg-[#dcebef] p-6 md:p-8 dark:bg-[#143242]"><div className="flex items-start gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#f2fafb] text-[#4c8a9b] dark:bg-[#0f2a3a] dark:text-[#8cc3dd]"><Settings2 size={22} /></div><div><h2 className="ar text-xl font-bold text-[#173f54] dark:text-[#e2ecf1]">{en ? 'Account & clinic details' : 'تفاصيل الحساب والعيادة'}</h2><p className="mt-1 text-sm leading-6 text-[#587785] dark:text-[#a8bfc9]">{en ? 'Update your core information so your workspace stays accurate and clear for your team.' : 'حدّث معلوماتك الأساسية لتبقى مساحة العمل دقيقة وواضحة لفريقك.'}</p></div></div></div>{updateSettings.error ? <div className="surface rounded-xl border-[#edc4c0] bg-[#fff7f6] p-3 text-sm text-[#a54c46] dark:border-[#5a2a25] dark:bg-[#3d1f1b] dark:text-[#eb9a90]" data-testid="alert-settings-error">{en ? 'Could not save changes. Try again.' : 'تعذر حفظ التغييرات. حاول مرة أخرى.'}</div> : null}<form onSubmit={form.handleSubmit(save)} className="space-y-6"><section className="surface animate-rise delay-1 p-6 md:p-7"><div className="mb-6 flex items-center gap-3 border-b border-[#edf1f3] pb-5 dark:border-[#1e3a4d]"><UserRound size={18} className="text-[#578b9d]" /><div><h2 className="font-bold text-[#23475b] dark:text-[#e2ecf1]">{en ? 'Admin information' : 'بيانات المسؤول'}</h2><p className="mt-1 text-xs text-[#8999a1] dark:text-[#7e939e]">{en ? 'Sign-in and identity details' : 'بيانات تسجيل الدخول والهوية'}</p></div></div><div className="grid gap-5 md:grid-cols-2"><Field label={en ? 'Full name' : 'الاسم الكامل'}><input {...form.register('fullName')} className="input-field" data-testid="input-settings-full-name" /></Field><Field label={en ? 'Email' : 'البريد الإلكتروني'}><input {...form.register('email')} className="input-field text-left bg-[#f3f6f7] dark:bg-[#10222f]" dir="ltr" type="email" readOnly data-testid="input-settings-email" /></Field></div><div className="mt-5 flex items-center gap-2 text-xs text-[#72909b] dark:text-[#7e939e]"><ShieldCheck size={15} /> {en ? 'Account role:' : 'صلاحية الحساب:'} <strong className="text-[#3d7587] dark:text-[#8cc3dd]">{session.user.role === 'owner' ? (en ? 'Clinic owner' : 'مالك العيادة') : (en ? 'Manager' : 'مدير')}</strong></div></section><section className="surface animate-rise delay-2 p-6 md:p-7"><div className="mb-6 flex items-center gap-3 border-b border-[#edf1f3] pb-5 dark:border-[#1e3a4d]"><Building2 size={18} className="text-[#578b9d]" /><div><h2 className="font-bold text-[#23475b] dark:text-[#e2ecf1]">{en ? 'Clinic information' : 'معلومات العيادة'}</h2><p className="mt-1 text-xs text-[#8999a1] dark:text-[#7e939e]">{en ? 'This information is visible to your team' : 'تظهر هذه المعلومات لفريقك'}</p></div></div><div className="grid gap-5 md:grid-cols-2"><Field label={en ? 'Clinic name' : 'اسم العيادة'}><input {...form.register('clinicName')} className="input-field" data-testid="input-settings-clinic-name" /></Field><Field label={en ? 'City' : 'المدينة'}><div className="relative"><MapPin size={17} className="absolute right-3.5 top-3.5 text-[#8ca2ad]" /><input {...form.register('city')} className="input-field pr-11" data-testid="input-settings-city" /></div></Field></div><div className="mt-5 flex items-center gap-2 text-xs text-[#72909b] dark:text-[#7e939e]"><span className="status-dot" /> {en ? 'Clinic status:' : 'حالة العيادة:'} <strong className="text-[#3d7587] dark:text-[#8cc3dd]">{session.clinic.status || (en ? 'Active' : 'نشطة')}</strong></div></section><div className="flex items-center justify-end gap-3"><span className={`text-xs font-bold text-[#4d967f] transition-opacity ${saved ? 'opacity-100' : 'opacity-0'}`} data-testid="text-settings-saved"><Check size={14} className="inline" /> {en ? 'Saved' : 'تم الحفظ'}</span><button type="submit" className="primary-button" disabled={updateSettings.isPending} data-testid="button-save-settings"><Check size={17} /> {updateSettings.isPending ? (en ? 'Saving...' : 'جارٍ الحفظ...') : (en ? 'Save changes' : 'حفظ التغييرات')}</button></div></form></div></div>;
}

function ShellCommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { language } = usePreferences();
  return <CommandPalette open={open} onOpenChange={onOpenChange} language={language} />;
}

function ProtectedShell() {
  const sessionQuery = useGetAuthSession({ query: { retry: false, queryKey: getGetAuthSessionQueryKey() } });
  const [location, setLocation] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const { language } = usePreferences();
  const { open: searchOpen, setOpen: setSearchOpen } = useCommandPalette();
  const needsLogin = sessionQuery.isError || !sessionQuery.data;
  const realtimeStatus = useRealtimeSync(sessionQuery.data?.clinic.id);

  useEffect(() => {
    if (needsLogin && location !== '/login') {
      setLocation('/login');
    }
  }, [location, needsLogin, setLocation]);

  useEffect(() => { setMenuOpen(false); }, [location]);
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === '/') { event.preventDefault(); setSearchOpen(true); return; }
      if (event.key === '?' || (event.shiftKey && event.key === '/')) { event.preventDefault(); setShortcutsOpen(v => !v); return; }
      const map: Record<string, string> = { d: '/dashboard', c: '/calendar', t: '/tasks', i: '/inbox', a: '/appointments', p: '/patients', w: '/waitlist', f: '/follow-ups', n: '/no-shows', b: '/billing', r: '/analytics' };
      const to = map[event.key.toLowerCase()];
      if (to) setLocation(to);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setLocation, setSearchOpen]);

  if (sessionQuery.isLoading) return <div className="flex min-h-[100dvh] items-center justify-center bg-[#eef3f7]" data-testid="state-session-loading"><div className="w-64 space-y-3"><div className="skeleton h-4 w-24" /><div className="skeleton h-10 w-full" /><div className="skeleton h-24 w-full" /></div></div>;
  if (needsLogin) return null;
  const session = sessionQuery.data;
  return (
    <RealtimeStatusContext.Provider value={realtimeStatus}>
      <NotificationsProvider>
        <div className="app-shell flex min-h-[100dvh] md:flex-row" dir="ltr">
        <Sidebar clinicName={session.clinic.name} userName={session.user.fullName} mobileOpen={menuOpen} onNavigate={() => setMenuOpen(false)} />
        {menuOpen ? <div className="sidebar-overlay md:hidden" role="presentation" onClick={() => setMenuOpen(false)} /> : null}
        <div className={`main-content flex min-h-0 min-w-0 flex-1 flex-col ${location === '/inbox' ? 'md:h-[100dvh] md:overflow-hidden' : ''}`} dir="rtl">
          <WorkspaceToolbar onOpenMenu={() => setMenuOpen(true)} onOpenSearch={() => setSearchOpen(true)} onOpenShortcuts={() => setShortcutsOpen(true)} />
          <ShellCommandPalette open={searchOpen} onOpenChange={setSearchOpen} />
          <ShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} en={language === 'en'} />
          <NetworkStatusBanner />
          <OnboardingTour />
          <QuickAddModal />
          <div className="workspace-route flex min-h-0 flex-1 flex-col">
            <Suspense fallback={<RouteLoadingFallback />}>
              <Switch>
                <Route path="/settings">{() => <SettingsPage session={session} />}</Route>
                <Route path="/patients" component={LivePatientsPage} />
                <Route path="/patients/:id" component={Patient360Page} />
                <Route path="/appointments" component={LiveAppointmentsPage} />
                <Route path="/appointments/:id" component={AppointmentJourneyPage} />
                <Route path="/calendar" component={CalendarPage} />
                <Route path="/tasks" component={TasksPage} />
                <Route path="/inbox" component={InboxPage} />
                <Route path="/ai-reception" component={AiReceptionPage} />
                <Route path="/templates" component={TemplatesPage} />
                <Route path="/analytics" component={AnalyticsPage} />
                <Route path="/waitlist" component={WaitlistPage} />
                <Route path="/follow-ups" component={FollowUpsPage} />
                <Route path="/no-shows" component={NoShowsPage} />
                <Route path="/voice-agent/:view">{() => <LiveVoiceAgentPage />}</Route>
                <Route path="/voice-agent" component={LiveVoiceAgentPage} />
                <Route path="/billing" component={BillingPage} />
                <Route path="/organization" component={OrganizationSettings} />
                <Route>{() => <LiveDashboard session={session} />}</Route>
              </Switch>
            </Suspense>
          </div>
        </div>
        </div>
      </NotificationsProvider>
    </RealtimeStatusContext.Provider>
  );
}

function NotFound() {
  const [, setLocation] = useLocation();
  const { language } = usePreferences();
  const en = language === 'en';
  return <main className="noise flex min-h-[100dvh] items-center justify-center bg-[#eef3f7] p-6 dark:bg-[#0b1824]" dir="rtl"><div className="surface w-full max-w-[520px] rounded-2xl p-8 text-center md:p-12"><div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#dbecef] text-[#528b9b] dark:bg-[#143242] dark:text-[#8cc3dd]"><CircleHelp size={29} /></div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#75a0ae]">404 / {en ? 'Page not found' : 'الصفحة غير موجودة'}</p><h1 className="ar mt-3 text-2xl font-bold text-[#173c52] dark:text-[#e2ecf1]">{en ? 'This page took a break.' : 'هذه الصفحة أخذت استراحة.'}</h1><p className="mt-2 text-sm leading-7 text-[#7b8f99] dark:text-[#7e939e]">{en ? 'The link you are following is unavailable. Head back to the clinic dashboard to continue your day.' : 'الرابط الذي تتبعه غير متاح. عد إلى لوحة العيادة لنكمل يومك.'}</p><button className="primary-button mt-7" onClick={() => setLocation('/dashboard')} data-testid="button-go-dashboard"><ArrowRight size={17} /> {en ? 'Back to home' : 'العودة إلى الرئيسية'}</button></div></main>;
}

function Router() {
  const [location] = useLocation();
  const legalRoutes = ['/refund-policy', '/privacy-policy', '/terms', '/cookie-policy', '/contact'];
  const publicRoute = location === '/' || location === '/current-home' || location === '/merged-home' || location === '/login' || location === '/register' || location === '/admin' || location === '/forgot-password' || location === '/reset-password' || location.startsWith('/queue/') || legalRoutes.includes(location);
  return <ErrorBoundary resetKey={location}>{publicRoute ? <Suspense fallback={<RouteLoadingFallback fullHeight />}>{location.startsWith('/queue/') ? <PublicQueuePage /> : <Switch><Route path="/" component={MerunaHome} /><Route path="/current-home" component={CurrentMerunaHome} /><Route path="/merged-home" component={MergedMerunaHome} /><Route path="/refund-policy">{() => <LegalPage kind="refund" />}</Route><Route path="/privacy-policy">{() => <LegalPage kind="privacy" />}</Route><Route path="/terms">{() => <LegalPage kind="terms" />}</Route><Route path="/cookie-policy">{() => <LegalPage kind="cookies" />}</Route><Route path="/contact">{() => <LegalPage kind="contact" />}</Route><Route path="/login" component={LoginPage} /><Route path="/register" component={RegisterPage} /><Route path="/admin" component={AdminPanelPage} /><Route path="/forgot-password" component={LoginPage} /><Route path="/reset-password" component={LoginPage} /></Switch>}</Suspense> : <PreferencesProvider><Switch><Route path="/dashboard" component={ProtectedShell} /><Route path="/settings" component={ProtectedShell} /><Route path="/patients" component={ProtectedShell} /><Route path="/patients/:id" component={ProtectedShell} /><Route path="/appointments" component={ProtectedShell} /><Route path="/appointments/:id" component={ProtectedShell} /><Route path="/calendar" component={ProtectedShell} /><Route path="/tasks" component={ProtectedShell} /><Route path="/inbox" component={ProtectedShell} /><Route path="/ai-reception" component={ProtectedShell} /><Route path="/templates" component={ProtectedShell} /><Route path="/waitlist" component={ProtectedShell} /><Route path="/follow-ups" component={ProtectedShell} /><Route path="/no-shows" component={ProtectedShell} /><Route path="/voice-agent/:view" component={ProtectedShell} />
      <Route path="/voice-agent" component={ProtectedShell} /><Route path="/billing" component={ProtectedShell} /><Route path="/organization" component={ProtectedShell} /><Route path="/analytics" component={ProtectedShell} /><Route component={NotFound} /></Switch></PreferencesProvider>}</ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster position="bottom-left" richColors /></QueryClientProvider>;
}

export default App;
