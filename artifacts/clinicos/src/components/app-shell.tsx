import { useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  Activity, ArrowUpLeft, BarChart3, Bell, Bot, BriefcaseMedical, CalendarClock,
  CalendarDays, ChevronLeft, ClipboardCheck, Files, Inbox, LayoutDashboard,
  ListChecks, Menu, Moon, PhoneCall, Settings2, Stethoscope, Sun, UserRound, Users, X, Zap,
} from "lucide-react";
import { usePreferences } from "@/lib/preferences";

const primaryNav = [
  { href: "/dashboard", label: "نظرة عامة", en: "Overview", icon: LayoutDashboard },
  { href: "/appointments", label: "المواعيد", en: "Appointments", icon: CalendarDays },
  { href: "/patients", label: "المرضى", en: "Patients", icon: Users },
  { href: "/inbox", label: "صندوق الوارد", en: "Inbox", icon: Inbox, count: 4 },
  { href: "/tasks", label: "المهام", en: "Tasks", icon: ClipboardCheck, count: 3 },
  { href: "/waitlist", label: "قائمة الانتظار", en: "Waitlist", icon: ListChecks },
  { href: "/follow-ups", label: "المتابعات", en: "Follow-ups", icon: ClipboardCheck },
];
const workspaceNav = [
  { href: "/calendar", label: "التقويم", en: "Calendar", icon: CalendarClock },
  { href: "/doctors", label: "الأطباء", en: "Doctors", icon: Stethoscope },
  { href: "/services", label: "الخدمات", en: "Services", icon: BriefcaseMedical },
  { href: "/staff", label: "الفريق", en: "Team", icon: UserRound },
  { href: "/automation", label: "الأتمتة", en: "Automation", icon: Bot },
  { href: "/ai-receptionist", label: "الاستقبال الذكي", en: "AI Reception", icon: Bot },
  { href: "/voice-agent", label: "وكيل المكالمات", en: "Voice Agent", icon: PhoneCall },
  { href: "/templates", label: "القوالب", en: "Templates", icon: Files },
  { href: "/reports", label: "التقارير", en: "Reports", icon: BarChart3 },
];

export function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { language, theme, dir, t, toggleLanguage, toggleTheme } = usePreferences();
  const navItem = (item: (typeof primaryNav)[number]) => {
    const Icon = item.icon;
    const active = location === item.href || (item.href === "/dashboard" && location === "/");
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setMobileOpen(false)}
        data-testid={`link-nav-${item.href.slice(1)}`}
        className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] transition-all ${
          active ? "bg-[hsl(var(--sidebar-accent))] text-white shadow-sm" : "text-[hsl(var(--sidebar-foreground)/.68)] hover:bg-[hsl(var(--sidebar-accent)/.72)] hover:text-white"
        }`}
      >
        <Icon size={17} strokeWidth={active ? 2.2 : 1.8} />
        <span className="flex-1">{language === "ar" ? item.label : item.en}</span>
        {item.count && <span className={`rounded-md px-1.5 py-0.5 text-[10px] mono ${active ? "bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))]" : "bg-white/10 text-white/65"}`}>{item.count}</span>}
        {active && <ChevronLeft size={14} className="text-[hsl(var(--sidebar-primary))]" />}
      </Link>
    );
  };
  return (
    <div dir={dir} className="clinic-shell text-[hsl(var(--foreground))]">
      <button aria-label={language === "ar" ? "فتح القائمة" : "Open menu"} data-testid="button-open-mobile-nav" className={`fixed ${dir === "rtl" ? "right-4" : "left-4"} top-4 z-30 rounded-xl bg-[hsl(var(--sidebar))] p-2.5 text-white shadow-lg md:hidden`} onClick={() => setMobileOpen(true)}>
        <Menu size={20} />
      </button>
      <aside className={`sidebar fixed inset-y-0 z-40 flex w-[258px] flex-col px-4 py-5 transition-transform duration-300 ${dir === "rtl" ? "right-0 border-l" : "left-0 border-r"} border-white/10 md:translate-x-0 ${mobileOpen ? "translate-x-0" : dir === "rtl" ? "translate-x-full" : "-translate-x-full"}`}>
        <div className="mb-8 flex items-center justify-between px-2">
          <Link href="/dashboard" data-testid="link-logo" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))] shadow-[0_5px_18px_hsl(var(--sidebar-primary)/.25)]"><Activity size={19} strokeWidth={2.5} /></span>
            <span className="leading-tight"><strong className="block text-[17px] tracking-tight text-white">Clinic<span className="text-[hsl(var(--sidebar-primary))]">OS</span></strong><small className="text-[10px] text-white/45">{t("clinicCenter")}</small></span>
          </Link>
          <button aria-label={language === "ar" ? "إغلاق القائمة" : "Close menu"} data-testid="button-close-mobile-nav" className="rounded-lg p-1.5 text-white/55 hover:bg-white/10 md:hidden" onClick={() => setMobileOpen(false)}><X size={17} /></button>
        </div>
        <div className="mb-3 px-3 text-[10px] font-bold tracking-[.14em] text-white/35">{t("today")}</div>
        <nav className="space-y-1">{primaryNav.map(navItem)}</nav>
        <div className="mb-3 mt-7 px-3 text-[10px] font-bold tracking-[.14em] text-white/35">{t("clinicManagement")}</div>
        <nav className="space-y-1">{workspaceNav.map(navItem)}</nav>
        <div className="mt-auto">
          <div className="mb-3 rounded-2xl border border-[hsl(var(--sidebar-primary)/.2)] bg-[hsl(var(--sidebar-primary)/.08)] p-3.5">
            <div className="mb-2 flex items-center gap-2 text-[11px] font-bold text-[hsl(var(--sidebar-primary))]"><Zap size={14} /> {t("assistantWorking")}</div>
            <p className="mb-3 text-[11px] leading-5 text-white/55">{t("assistantCount")}</p>
            <Link href="/ai-receptionist" data-testid="link-sidebar-ai" className="flex items-center justify-between text-[11px] font-bold text-white/80 hover:text-white">{t("manageAssistant")} <ArrowUpLeft size={14} /></Link>
          </div>
          <Link href="/settings" data-testid="link-nav-settings" className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] ${location === "/settings" ? "bg-[hsl(var(--sidebar-accent))] text-white" : "text-white/65 hover:bg-white/10 hover:text-white"}`}><Settings2 size={17} /><span>{t("settings")}</span></Link>
          <div className="mt-4 flex items-center gap-2.5 border-t border-white/10 px-2 pt-4">
            <span className="grid size-8 place-items-center rounded-full bg-[#e7b98c] text-[11px] font-bold text-[#533421]">لن</span>
            <span className="flex-1 leading-tight"><strong className="block text-[11px] text-white">ليان الناصر</strong><small className="text-[10px] text-white/45">مديرة العيادة</small></span>
            <span className="size-2 rounded-full bg-[hsl(var(--sidebar-primary))]" />
          </div>
        </div>
      </aside>
      {mobileOpen && <button aria-label="إغلاق الخلفية" data-testid="button-close-backdrop" className="fixed inset-0 z-30 bg-[#102c32]/40 md:hidden" onClick={() => setMobileOpen(false)} />}
      <main className={`min-h-[100dvh] ${dir === "rtl" ? "md:mr-[258px]" : "md:ml-[258px]"}`}>
        <header className="sticky top-0 z-20 flex h-[70px] items-center gap-4 border-b border-[hsl(var(--border)/.7)] bg-[hsl(var(--background)/.94)] px-5 backdrop-blur-md md:px-8">
          <div className="flex-1"><p className="text-[11px] font-semibold text-[hsl(var(--muted-foreground))]">{language === "ar" ? "الثلاثاء، ١٨ يونيو ٢٠٢٤" : "Tuesday, June 18, 2024"}</p><p className="mt-0.5 text-sm font-bold">{t("goodMorning")} <span className="mr-1 text-[hsl(var(--accent))]">—</span></p></div>
          <div className="hidden items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-xs text-[hsl(var(--muted-foreground))] sm:flex"><span className="size-2 rounded-full bg-[hsl(var(--primary))]" /> {t("branch")} <ChevronLeft size={14} className="rotate-[-90deg]" /></div>
          <button aria-label={language === "ar" ? "الإشعارات" : "Notifications"} data-testid="button-notifications" className="relative rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2.5 text-[hsl(var(--muted-foreground))] transition hover:border-[hsl(var(--primary)/.4)] hover:text-[hsl(var(--primary))]"><Bell size={17} /><span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-[hsl(var(--accent))] text-[9px] font-bold text-[hsl(var(--accent-foreground))]">3</span></button>
          <button type="button" onClick={toggleTheme} aria-label={theme === "dark" ? t("lightMode") : t("darkMode")} data-testid="button-toggle-theme" className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2.5 text-[hsl(var(--muted-foreground))] transition hover:border-[hsl(var(--primary)/.4)] hover:text-[hsl(var(--primary))]">{theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}</button>
          <button type="button" onClick={toggleLanguage} aria-label={t("switchLanguage")} data-testid="button-toggle-language" className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-2.5 py-2 text-[11px] font-bold text-[hsl(var(--muted-foreground))] transition hover:border-[hsl(var(--primary)/.4)] hover:text-[hsl(var(--primary))]">{language === "ar" ? "EN" : "ع"}</button>
          <Link href="/settings" data-testid="link-header-settings" className="grid size-9 place-items-center rounded-full bg-[hsl(var(--secondary))] text-xs font-bold text-[hsl(var(--secondary-foreground))] transition hover:bg-[hsl(var(--primary))] hover:text-white">لن</Link>
        </header>
        <div className="p-5 md:p-8">{children}</div>
      </main>
    </div>
  );
}