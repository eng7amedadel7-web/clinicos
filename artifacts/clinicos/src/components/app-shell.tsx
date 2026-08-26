import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Activity, BarChart3, Bell, Bot, BriefcaseMedical, CalendarClock, CalendarDays, Check, ChevronDown, ChevronLeft, ClipboardCheck, Files, Inbox, LayoutDashboard, ListChecks, Menu, MessageCircle, Moon, PanelLeftClose, PanelLeftOpen, PhoneCall, Send, Settings2, Stethoscope, Sun, UserRound, Users, X, Zap } from "lucide-react";
import { usePreferences, type TranslationKey } from "@/lib/preferences";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type NavItem = { href: string; key: TranslationKey; icon: typeof Activity; count?: number };
const primaryNav: NavItem[] = [
  { href: "/dashboard", key: "overview", icon: LayoutDashboard }, { href: "/appointments", key: "appointments", icon: CalendarDays },
  { href: "/patients", key: "patients", icon: Users }, { href: "/inbox", key: "inbox", icon: Inbox, count: 4 },
  { href: "/tasks", key: "tasks", icon: ClipboardCheck, count: 3 }, { href: "/waitlist", key: "waitlist", icon: ListChecks },
  { href: "/follow-ups", key: "followUps", icon: ClipboardCheck },
];
const workspaceNav: NavItem[] = [
  { href: "/calendar", key: "calendar", icon: CalendarClock }, { href: "/doctors", key: "doctors", icon: Stethoscope },
  { href: "/services", key: "services", icon: BriefcaseMedical }, { href: "/staff", key: "team", icon: UserRound },
  { href: "/automation", key: "automation", icon: Bot }, { href: "/ai-receptionist", key: "aiReception", icon: Bot },
  { href: "/voice-agent", key: "voiceAgent", icon: PhoneCall }, { href: "/templates", key: "templates", icon: Files },
  { href: "/reports", key: "reports", icon: BarChart3 },
];
const channels = [{ key: "whatsapp", label: "WhatsApp", icon: PhoneCall }, { key: "messenger", label: "Messenger", icon: MessageCircle }, { key: "telegram", label: "Telegram", icon: Send }];
type Summary = { stats?: { conversationsNeedingStaff?: number | null; openFollowUps?: number | null; openNoShows?: number | null; activeWaitlist?: number | null } };

export function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => window.localStorage.getItem("clinicos-sidebar-collapsed") === "true");
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [readAlerts, setReadAlerts] = useState(() => new Set((window.localStorage.getItem("clinicos-read-alerts") || "").split(",").filter(Boolean)));
  const mounted = useRef(false);
  const { language, theme, t, toggleLanguage, toggleTheme, selectedBranchId, setSelectedBranchId, branches, branchesLoading, branchesError } = usePreferences();
  const expanded = !sidebarCollapsed || sidebarHovered;
  const branchQuery = selectedBranchId === "all" ? "" : `?branchId=${encodeURIComponent(selectedBranchId)}`;

  useEffect(() => {
    fetch(`/api/operations/summary${branchQuery}`, { credentials: "include" }).then((response) => response.ok ? response.json() : null).then(setSummary).catch(() => setSummary(null));
  }, [branchQuery, location]);
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    setIsNavigating(true); const timeout = window.setTimeout(() => setIsNavigating(false), 420); return () => window.clearTimeout(timeout);
  }, [location]);

  const alerts = useMemo(() => [
    { id: "conversations", label: t("conversationsNeedStaff"), count: summary?.stats?.conversationsNeedingStaff || 0, href: "/inbox", icon: MessageCircle },
    { id: "followups", label: t("followUpsDue"), count: summary?.stats?.openFollowUps || 0, href: "/follow-ups", icon: ClipboardCheck },
    { id: "noshows", label: t("noShowsOpen"), count: summary?.stats?.openNoShows || 0, href: "/no-shows", icon: CalendarDays },
    { id: "waitlist", label: t("waitlistActive"), count: summary?.stats?.activeWaitlist || 0, href: "/waitlist", icon: ListChecks },
  ].filter((item) => item.count > 0), [summary, t]);
  const unread = alerts.filter((item) => !readAlerts.has(item.id)).length;
  const markAllRead = () => { const next = new Set(alerts.map((item) => item.id)); setReadAlerts(next); window.localStorage.setItem("clinicos-read-alerts", [...next].join(",")); };
  const toggleSidebar = () => setSidebarCollapsed((current) => { window.localStorage.setItem("clinicos-sidebar-collapsed", String(!current)); return !current; });
  const navItem = (item: NavItem) => { const Icon = item.icon; const active = location === item.href || (item.href === "/dashboard" && location === "/"); return <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} title={!expanded ? t(item.key) : undefined} className={`group flex items-center rounded-xl py-2.5 text-[13px] transition ${expanded ? "gap-3 px-3" : "justify-center px-2"} ${active ? "bg-[hsl(var(--sidebar-accent))] text-white" : "text-white/65 hover:bg-white/10 hover:text-white"}`}><Icon size={17} />{expanded && <span className="flex-1 truncate">{t(item.key)}</span>}{item.count && <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px]">{item.count}</span>}{active && expanded && <ChevronLeft size={14} />}</Link>; };

  return <div dir="ltr" aria-busy={isNavigating} className="clinic-shell min-h-screen bg-background text-foreground">
    {isNavigating && <div className="fixed inset-x-0 top-0 z-[60] h-1 bg-primary/15"><div className="h-full w-2/5 animate-[loading-slide_.9s_ease-in-out_infinite] bg-primary" /></div>}
    <button aria-label={language === "ar" ? "فتح القائمة" : "Open menu"} className="fixed left-4 top-4 z-30 rounded-xl bg-[hsl(var(--sidebar))] p-2.5 text-white md:hidden" onClick={() => setMobileOpen(true)}><Menu size={20} /></button>
    <aside onMouseEnter={() => sidebarCollapsed && setSidebarHovered(true)} onMouseLeave={() => setSidebarHovered(false)} className={`sidebar fixed inset-y-0 left-0 z-40 flex flex-col border-r border-white/10 py-5 transition-all duration-300 md:translate-x-0 ${expanded ? "w-[258px] px-4" : "w-[78px] px-2"} ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
      <div className={`mb-8 flex items-center ${expanded ? "justify-between px-2" : "justify-center"}`}><Link href="/dashboard" className="flex items-center gap-2.5"><span className="grid size-9 place-items-center rounded-xl bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))]"><Activity size={19} /></span>{expanded && <span><strong className="block text-[17px] text-white">Clinic<span className="text-[hsl(var(--sidebar-primary))]">OS</span></strong><small className="text-[10px] text-white/45">{t("clinicCenter")}</small></span>}</Link><button aria-label="Close" className="text-white/60 md:hidden" onClick={() => setMobileOpen(false)}><X size={18} /></button></div>
      {expanded && <div className="mb-3 px-3 text-[10px] font-bold tracking-widest text-white/35">{t("today")}</div>}<nav className="flex flex-col gap-1">{primaryNav.map(navItem)}</nav>
      {expanded && <div className="mb-3 mt-7 px-3 text-[10px] font-bold tracking-widest text-white/35">{t("clinicManagement")}</div>}<nav className="flex flex-col gap-1">{workspaceNav.map(navItem)}</nav>
      <div className="mt-auto">{expanded && <div className="mb-3 rounded-2xl border border-white/10 bg-white/5 p-3.5"><div className="mb-2 flex items-center gap-2 text-[11px] font-bold text-[hsl(var(--sidebar-primary))]"><Zap size={14} />{t("assistantWorking")}</div><p className="text-[11px] leading-5 text-white/55">{t("assistantCount")}</p></div>}<Link href="/settings" className={`flex items-center rounded-xl py-2.5 text-[13px] text-white/65 hover:bg-white/10 ${expanded ? "gap-3 px-3" : "justify-center"}`}><Settings2 size={17} />{expanded && t("settings")}</Link><button onClick={toggleSidebar} className="mt-3 hidden w-full items-center justify-center gap-2 rounded-xl border border-white/10 py-2.5 text-white/65 md:flex">{sidebarCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}</button></div>
    </aside>
    {mobileOpen && <button aria-label="Close" className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setMobileOpen(false)} />}
    <main className={`min-h-screen transition-[margin] duration-300 ${expanded ? "md:ml-[258px]" : "md:ml-[78px]"}`}>
      <header className="sticky top-0 z-20 flex min-h-[70px] flex-wrap items-center gap-2 border-b border-border/70 bg-background/95 px-5 py-3 backdrop-blur md:px-8">
        <div className="min-w-[150px] flex-1 pl-12 md:pl-0"><p className="text-[11px] text-muted-foreground">{new Intl.DateTimeFormat(language === "ar" ? "ar-SA" : "en-US", { weekday: "long", day: "numeric", month: "long" }).format(new Date())}</p><p className="mt-0.5 text-sm font-bold">{t("goodMorning")}</p></div>
        <nav className="order-3 flex w-full gap-1.5 overflow-x-auto md:order-none md:w-auto">{channels.map(({ key, label, icon: Icon }) => <Link key={key} href={`/inbox?channel=${key}`} className="channel-shortcut"><Icon size={15} /><span>{label}</span></Link>)}</nav>
        <Select value={selectedBranchId} onValueChange={setSelectedBranchId}><SelectTrigger aria-label={t("chooseBranch")} className="w-[150px] bg-card text-xs"><SelectValue placeholder={branchesLoading ? t("loadingBranches") : t("chooseBranch")} /></SelectTrigger><SelectContent><SelectGroup><SelectItem value="all">{t("allBranches")}</SelectItem>{branches.map((branch) => <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>)}</SelectGroup></SelectContent></Select>
        {branchesError && <span className="sr-only" role="status">{t("branchError")}</span>}
        <Popover><PopoverTrigger asChild><button aria-label={t("notifications")} className="relative rounded-xl border border-border bg-card p-2.5 text-muted-foreground hover:text-primary"><Bell size={17} />{unread > 0 && <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-accent text-[9px] font-bold text-accent-foreground">{unread}</span>}</button></PopoverTrigger><PopoverContent align="end" className="w-[340px] p-0"><div className="flex items-start justify-between border-b border-border p-4"><div><h2 className="font-bold">{t("notifications")}</h2><p className="text-xs text-muted-foreground">{t("notificationsSubtitle")}</p></div>{alerts.length > 0 && <button onClick={markAllRead} className="text-xs font-semibold text-primary">{t("markAllRead")}</button>}</div><div className="flex max-h-80 flex-col">{alerts.length ? alerts.map((alert) => { const Icon = alert.icon; return <Link key={alert.id} href={alert.href} className="flex items-center gap-3 border-b border-border/60 p-4 hover:bg-muted/60"><span className="grid size-9 place-items-center rounded-lg bg-secondary text-secondary-foreground"><Icon size={17} /></span><span className="min-w-0 flex-1"><strong className="block text-sm">{alert.label}</strong><span className="text-xs text-muted-foreground">{alert.count} · {t("viewDetails")}</span></span>{!readAlerts.has(alert.id) ? <span className="size-2 rounded-full bg-primary" /> : <Check size={15} className="text-muted-foreground" />}</Link>; }) : <p className="p-8 text-center text-sm text-muted-foreground">{t("noNotifications")}</p>}</div></PopoverContent></Popover>
        <button onClick={toggleTheme} aria-label={theme === "dark" ? t("lightMode") : t("darkMode")} className="rounded-xl border border-border bg-card p-2.5 text-muted-foreground hover:text-primary">{theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}</button>
        <button onClick={toggleLanguage} aria-label={t("switchLanguage")} className="rounded-xl border border-border bg-card px-2.5 py-2 text-[11px] font-bold text-muted-foreground hover:text-primary">{language === "ar" ? "EN" : "ع"}</button>
      </header><div className="p-5 md:p-8">{children}</div>
    </main>
  </div>;
}
