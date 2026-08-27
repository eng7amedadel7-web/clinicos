import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import {
  BarChart3,
  Bot,
  CalendarDays,
  Clock3,
  CreditCard,
  FileText,
  Home,
  Inbox,
  ListTodo,
  MessageSquare,
  PhoneCall,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
} from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  appointmentDateLabel,
  getSearchAppointments,
  getSearchConversations,
  getSearchPatients,
} from '@/lib/search-api';

const pages: Array<{ href: string; ar: string; en: string; icon: typeof Home }> = [
  { href: '/dashboard', ar: 'الرئيسية', en: 'Overview', icon: Home },
  { href: '/calendar', ar: 'التقويم', en: 'Calendar', icon: CalendarDays },
  { href: '/tasks', ar: 'المهام', en: 'Tasks', icon: ListTodo },
  { href: '/patients', ar: 'المرضى', en: 'Patients', icon: UsersRound },
  { href: '/appointments', ar: 'المواعيد', en: 'Appointments', icon: Clock3 },
  { href: '/inbox', ar: 'صندوق الوارد', en: 'Inbox', icon: Inbox },
  { href: '/ai-reception', ar: 'الاستقبال الذكي', en: 'AI Reception', icon: Bot },
  { href: '/templates', ar: 'القوالب', en: 'Templates', icon: FileText },
  { href: '/analytics', ar: 'التقارير والإحصائيات', en: 'Analytics & Reports', icon: BarChart3 },
  { href: '/waitlist', ar: 'قائمة الانتظار', en: 'Waitlist', icon: Clock3 },
  { href: '/follow-ups', ar: 'المتابعات', en: 'Follow-ups', icon: Sparkles },
  { href: '/no-shows', ar: 'عدم الحضور', en: 'No-shows', icon: ShieldCheck },
  { href: '/voice-agent', ar: 'الوكيل الصوتي', en: 'Voice agent', icon: PhoneCall },
  { href: '/billing', ar: 'الاشتراك والفوترة', en: 'Billing', icon: CreditCard },
  { href: '/settings', ar: 'الإعدادات', en: 'Settings', icon: Settings2 },
];

function matches(haystack: string, needle: string) {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

export function useCommandPalette() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return { open, setOpen };
}

export function CommandPalette({
  open,
  onOpenChange,
  language,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  language: 'ar' | 'en';
}) {
  const [query, setQuery] = useState('');
  const [, setLocation] = useLocation();
  const ar = language === 'ar';

  const patientsQuery = useQuery({
    queryKey: ['search', 'patients'],
    queryFn: ({ signal }) => getSearchPatients(signal),
    enabled: open,
    staleTime: 60_000,
  });

  const appointmentsQuery = useQuery({
    queryKey: ['search', 'appointments'],
    queryFn: ({ signal }) => getSearchAppointments(signal),
    enabled: open,
    staleTime: 60_000,
  });

  const conversationsQuery = useQuery({
    queryKey: ['search', 'conversations'],
    queryFn: ({ signal }) => getSearchConversations(signal),
    enabled: open,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const term = query.trim();
  const pageResults = useMemo(
    () => pages.filter((page) => !term || matches(ar ? page.ar : page.en, term) || matches(page.href, term)),
    [term, ar],
  );
  const patientResults = useMemo(
    () =>
      (patientsQuery.data ?? [])
        .filter((patient) => !term || matches(patient.name, term) || matches(patient.phone, term))
        .slice(0, 5),
    [patientsQuery.data, term],
  );
  const appointmentResults = useMemo(
    () =>
      (appointmentsQuery.data ?? [])
        .filter((item) => !term || matches(item.name, term))
        .slice(0, 5),
    [appointmentsQuery.data, term],
  );
  const conversationResults = useMemo(
    () =>
      (conversationsQuery.data ?? [])
        .filter(
          (item) =>
            !term ||
            matches(item.patientName, term) ||
            (item.lastMessage && matches(item.lastMessage, term)),
        )
        .slice(0, 5),
    [conversationsQuery.data, term],
  );

  const go = (href: string) => {
    onOpenChange(false);
    setLocation(href);
  };
  const loading = patientsQuery.isLoading || appointmentsQuery.isLoading || conversationsQuery.isLoading;

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <div dir="rtl" className="overflow-hidden">
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder={ar ? 'ابحث عن مريض، موعد، محادثة، أو صفحة...' : 'Search patients, appointments, chats, pages...'}
          data-testid="input-command-search"
        />
        <CommandList className="max-h-[360px] overflow-y-auto">
          <CommandEmpty>{loading ? (ar ? 'جارٍ البحث...' : 'Searching...') : ar ? 'لا توجد نتائج مطابقة.' : 'No matching results.'}</CommandEmpty>
          
          {patientResults.length > 0 && (
            <CommandGroup heading={ar ? 'المرضى' : 'Patients'}>
              {patientResults.map((patient) => (
                <CommandItem
                  key={patient.id}
                  value={`patient-${patient.id}-${patient.name}`}
                  onSelect={() => go(`/patients/${patient.id}`)}
                  data-testid={`command-patient-${patient.id}`}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <UserRound className="size-4 text-sky-600 shrink-0" />
                  <span className="flex-1 truncate font-medium">{patient.name}</span>
                  <span className="text-[11px] text-muted-foreground font-mono" dir="ltr">{patient.phone}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {appointmentResults.length > 0 && (
            <CommandGroup heading={ar ? 'المواعيد' : 'Appointments'}>
              {appointmentResults.map((item) => (
                <CommandItem
                  key={item.id}
                  value={`appointment-${item.id}-${item.name}`}
                  onSelect={() => go(`/appointments/${item.id}`)}
                  data-testid={`command-appointment-${item.id}`}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Clock3 className="size-4 text-emerald-600 shrink-0" />
                  <span className="flex-1 truncate font-medium">{item.name}</span>
                  <span className="text-[10px] text-muted-foreground">{appointmentDateLabel(item.scheduledAt, language)}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {conversationResults.length > 0 && (
            <CommandGroup heading={ar ? 'محادثات صندوق الوارد' : 'Inbox Chats'}>
              {conversationResults.map((conv) => (
                <CommandItem
                  key={conv.id}
                  value={`conv-${conv.id}-${conv.patientName}`}
                  onSelect={() => go(`/inbox?conversationId=${conv.id}`)}
                  data-testid={`command-conv-${conv.id}`}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <MessageSquare className="size-4 text-indigo-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{conv.patientName}</p>
                    {conv.lastMessage && (
                      <p className="truncate text-[10px] text-muted-foreground">{conv.lastMessage}</p>
                    )}
                  </div>
                  {conv.channelType && (
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] uppercase font-semibold text-muted-foreground">
                      {conv.channelType}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {(patientResults.length > 0 || appointmentResults.length > 0 || conversationResults.length > 0) && <CommandSeparator />}
          
          {/* Quick Actions (when no search query) */}
          {!term && (
            <>
              <CommandGroup heading={ar ? 'إجراءات سريعة' : 'Quick Actions'}>
                <CommandItem
                  value="action-new-appointment"
                  onSelect={() => go('/calendar')}
                  className="flex items-center gap-2 cursor-pointer text-primary font-bold"
                >
                  <Clock3 className="size-4 shrink-0" />
                  <span className="flex-1">{ar ? 'حجز موعد كشف جديد' : 'Book New Appointment'}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">C</span>
                </CommandItem>
                <CommandItem
                  value="action-new-patient"
                  onSelect={() => go('/patients')}
                  className="flex items-center gap-2 cursor-pointer text-primary font-bold"
                >
                  <UserRound className="size-4 shrink-0" />
                  <span className="flex-1">{ar ? 'إضافة ملف مريض جديد' : 'Create New Patient Profile'}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">P</span>
                </CommandItem>
                <CommandItem
                  value="action-voice-agent"
                  onSelect={() => go('/voice-agent')}
                  className="flex items-center gap-2 cursor-pointer text-primary font-bold"
                >
                  <PhoneCall className="size-4 shrink-0" />
                  <span className="flex-1">{ar ? 'تشغيل وكيل المكالمات الصوتي' : 'Launch AI Voice Agent'}</span>
                </CommandItem>
                <CommandItem
                  value="action-analytics"
                  onSelect={() => go('/analytics')}
                  className="flex items-center gap-2 cursor-pointer text-primary font-bold"
                >
                  <BarChart3 className="size-4 shrink-0" />
                  <span className="flex-1">{ar ? 'استعراض تقارير العيادة' : 'View Clinic Reports & Analytics'}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">R</span>
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          {pageResults.length > 0 && (
            <CommandGroup heading={ar ? 'الصفحات والأقسام' : 'Pages & Sections'}>
              {pageResults.map((page) => {
                const Icon = page.icon;
                return (
                  <CommandItem
                    key={page.href}
                    value={`page-${page.href}-${ar ? page.ar : page.en}`}
                    onSelect={() => go(page.href)}
                    data-testid={`command-page-${page.href.slice(1)}`}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Icon className="size-4 text-muted-foreground shrink-0" />
                    <span>{ar ? page.ar : page.en}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}

        </CommandList>
        <div className="flex items-center justify-between border-t border-border/50 px-3 py-1.5 text-[10px] text-muted-foreground bg-muted/30">
          <span>{ar ? 'استخدم الأسهم للتنقل و Enter للاختيار' : 'Use arrows to navigate, Enter to select'}</span>
          <kbd className="rounded border bg-background px-1.5 py-0.5 text-[9px] font-mono">ESC {ar ? 'للإغلاق' : 'to close'}</kbd>
        </div>
      </div>
    </CommandDialog>
  );
}

export function CommandPaletteTrigger({ onOpen, language }: { onOpen: () => void; language: 'ar' | 'en' }) {
  const ar = language === 'ar';
  return (
    <button type="button" onClick={onOpen} className="toolbar-search" aria-label={ar ? 'بحث عام' : 'Global search'} data-testid="button-open-search">
      <Search size={16} />
      <span className="toolbar-search-text">{ar ? 'ابحث في المرضى والمواعيد والمحادثات...' : 'Search patients, appointments, chats...'}</span>
      <kbd className="toolbar-search-kbd" dir="ltr">⌘K</kbd>
    </button>
  );
}

