import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Clock3, CreditCard, Home, Inbox, PhoneCall, Search, Settings2, ShieldCheck, Sparkles, UserRound, UsersRound } from 'lucide-react';
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command';
import { appointmentDateLabel, getSearchAppointments, getSearchPatients } from '@/lib/search-api';

const pages: Array<{ href: string; ar: string; en: string; icon: typeof Home }> = [
  { href: '/dashboard', ar: 'الرئيسية', en: 'Overview', icon: Home },
  { href: '/patients', ar: 'المرضى', en: 'Patients', icon: UsersRound },
  { href: '/appointments', ar: 'المواعيد', en: 'Appointments', icon: Clock3 },
  { href: '/inbox', ar: 'صندوق الوارد', en: 'Inbox', icon: Inbox },
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

export function CommandPalette({ open, onOpenChange, language }: { open: boolean; onOpenChange: (open: boolean) => void; language: 'ar' | 'en' }) {
  const [query, setQuery] = useState('');
  const [, setLocation] = useLocation();
  const ar = language === 'ar';

  const patientsQuery = useQuery({ queryKey: ['search', 'patients'], queryFn: ({ signal }) => getSearchPatients(signal), enabled: open, staleTime: 60_000 });
  const appointmentsQuery = useQuery({ queryKey: ['search', 'appointments'], queryFn: ({ signal }) => getSearchAppointments(signal), enabled: open, staleTime: 60_000 });

  useEffect(() => { if (!open) setQuery(''); }, [open]);

  const term = query.trim();
  const pageResults = useMemo(
    () => pages.filter((page) => !term || matches(ar ? page.ar : page.en, term) || matches(page.href, term)),
    [term, ar],
  );
  const patientResults = useMemo(
    () => (patientsQuery.data ?? []).filter((patient) => !term || matches(patient.name, term) || matches(patient.phone, term)).slice(0, 6),
    [patientsQuery.data, term],
  );
  const appointmentResults = useMemo(
    () => (appointmentsQuery.data ?? []).filter((item) => !term || matches(item.name, term)).slice(0, 6),
    [appointmentsQuery.data, term],
  );

  const go = (href: string) => { onOpenChange(false); setLocation(href); };
  const loading = patientsQuery.isLoading || appointmentsQuery.isLoading;

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <div dir={ar ? 'rtl' : 'ltr'}>
        <CommandInput value={query} onValueChange={setQuery} placeholder={ar ? 'ابحث عن مريض، موعد، أو صفحة...' : 'Search patients, appointments, pages...'} data-testid="input-command-search" />
        <CommandList>
          <CommandEmpty>{loading ? (ar ? 'جارٍ البحث...' : 'Searching...') : ar ? 'لا توجد نتائج مطابقة.' : 'No matching results.'}</CommandEmpty>
          {patientResults.length ? (
            <CommandGroup heading={ar ? 'المرضى' : 'Patients'}>
              {patientResults.map((patient) => (
                <CommandItem key={patient.id} value={`patient-${patient.id}`} onSelect={() => go(`/patients/${patient.id}`)} data-testid={`command-patient-${patient.id}`}>
                  <UserRound className="me-2 size-4" />
                  <span className="flex-1 truncate">{patient.name}</span>
                  <span className="text-[10px] text-muted-foreground" dir="ltr">{patient.phone}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
          {appointmentResults.length ? (
            <CommandGroup heading={ar ? 'المواعيد' : 'Appointments'}>
              {appointmentResults.map((item) => (
                <CommandItem key={item.id} value={`appointment-${item.id}`} onSelect={() => go(`/appointments/${item.id}`)} data-testid={`command-appointment-${item.id}`}>
                  <Clock3 className="me-2 size-4" />
                  <span className="flex-1 truncate">{item.name}</span>
                  <span className="text-[10px] text-muted-foreground">{appointmentDateLabel(item.scheduledAt, language)}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
          {patientResults.length || appointmentResults.length ? <CommandSeparator /> : null}
          {pageResults.length ? (
            <CommandGroup heading={ar ? 'الصفحات' : 'Pages'}>
              {pageResults.map((page) => {
                const Icon = page.icon;
                return (
                  <CommandItem key={page.href} value={`page-${page.href}`} onSelect={() => go(page.href)} data-testid={`command-page-${page.href.slice(1)}`}>
                    <Icon className="me-2 size-4" />
                    <span>{ar ? page.ar : page.en}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          ) : null}
        </CommandList>
      </div>
    </CommandDialog>
  );
}

export function CommandPaletteTrigger({ onOpen, language }: { onOpen: () => void; language: 'ar' | 'en' }) {
  const ar = language === 'ar';
  return (
    <button type="button" onClick={onOpen} className="toolbar-search" aria-label={ar ? 'بحث عام' : 'Global search'} data-testid="button-open-search">
      <Search size={16} />
      <span className="toolbar-search-text">{ar ? 'ابحث في المرضى والمواعيد' : 'Search patients and appointments'}</span>
      <kbd className="toolbar-search-kbd" dir="ltr">⌘K</kbd>
    </button>
  );
}
