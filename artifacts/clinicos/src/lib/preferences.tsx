import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Language = "ar" | "en";
export type Theme = "light" | "dark";
export type Branch = { id: string; name: string; is_active?: boolean };

const translations = {
  ar: {
    today: "اليوم", clinicManagement: "إدارة العيادة", settings: "الإعدادات", assistantWorking: "المساعد الذكي يعمل",
    assistantCount: "تم الرد على 18 رسالة اليوم تلقائياً.", manageAssistant: "إدارة الاستقبال الذكي", allBranches: "كل الفروع",
    chooseBranch: "اختيار الفرع", goodMorning: "صباح الخير", clinicCenter: "مركز العمليات", clinicManager: "مديرة العيادة",
    switchLanguage: "English", lightMode: "الوضع الفاتح", darkMode: "الوضع الداكن", notifications: "الإشعارات",
    notificationsSubtitle: "كل ما يحتاج تدخلك الآن", noNotifications: "لا توجد تنبيهات عاجلة", markAllRead: "تحديد الكل كمقروء",
    loadingBranches: "جارٍ تحميل الفروع", branchError: "تعذر تحميل الفروع", conversationsNeedStaff: "محادثات تحتاج موظفًا",
    followUpsDue: "متابعات مفتوحة", noShowsOpen: "حالات عدم حضور", waitlistActive: "قائمة انتظار نشطة", viewDetails: "عرض التفاصيل",
    overview: "نظرة عامة", appointments: "المواعيد", patients: "المرضى", inbox: "صندوق الوارد", tasks: "المهام",
    waitlist: "قائمة الانتظار", followUps: "المتابعات", calendar: "التقويم", doctors: "الأطباء", services: "الخدمات",
    team: "الفريق", automation: "الأتمتة", aiReception: "الاستقبال الذكي", voiceAgent: "وكيل المكالمات", templates: "القوالب", reports: "التقارير", logout: "تسجيل الخروج", accountMenu: "حسابك في MERUNA SYSTEM", clinicOwner: "مالك العيادة", chooseBranchSidebar: "اختيار الفرع داخل العيادة", openToday: "مفتوحة اليوم", clinicWide: "كل الفروع",
  },
  en: {
    today: "Today", clinicManagement: "Clinic management", settings: "Settings", assistantWorking: "AI assistant is working",
    assistantCount: "18 messages answered automatically today.", manageAssistant: "Manage AI reception", allBranches: "All branches",
    chooseBranch: "Choose branch", goodMorning: "Good morning", clinicCenter: "Operations center", clinicManager: "Clinic manager",
    switchLanguage: "العربية", lightMode: "Light mode", darkMode: "Dark mode", notifications: "Notifications",
    notificationsSubtitle: "Everything needing your attention", noNotifications: "No urgent alerts", markAllRead: "Mark all as read",
    loadingBranches: "Loading branches", branchError: "Could not load branches", conversationsNeedStaff: "Conversations need staff",
    followUpsDue: "Open follow-ups", noShowsOpen: "Open no-shows", waitlistActive: "Active waitlist", viewDetails: "View details",
    overview: "Overview", appointments: "Appointments", patients: "Patients", inbox: "Inbox", tasks: "Tasks",
    waitlist: "Waitlist", followUps: "Follow-ups", calendar: "Calendar", doctors: "Doctors", services: "Services",
    team: "Team", automation: "Automation", aiReception: "AI reception", voiceAgent: "Voice agent", templates: "Templates", reports: "Reports", logout: "Sign out", accountMenu: "Your MERUNA SYSTEM account", clinicOwner: "Clinic owner", chooseBranchSidebar: "Choose a branch in this clinic", openToday: "Open today", clinicWide: "All branches",
  },
} as const;

export type TranslationKey = keyof typeof translations.ar;
type PreferencesContextValue = {
  language: Language; theme: Theme; dir: "rtl"; selectedBranchId: string; branches: Branch[]; branchesLoading: boolean; branchesError: boolean;
  t: (key: TranslationKey, values?: Record<string, string | number>) => string;
  toggleLanguage: () => void; toggleTheme: () => void; loadBranches: () => void; setSelectedBranchId: (id: string) => void;
};
const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => window.localStorage.getItem("clinicos-language") === "en" ? "en" : "ar");
  const [theme, setTheme] = useState<Theme>(() => window.localStorage.getItem("clinicos-theme") === "dark" ? "dark" : "light");
  const [selectedBranchId, setBranch] = useState(() => window.localStorage.getItem("clinicos-branch") || "all");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [branchesRequested, setBranchesRequested] = useState(false);
  const [branchesError, setBranchesError] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.lang = language;
    document.documentElement.dir = "rtl";
    window.localStorage.setItem("clinicos-theme", theme);
    window.localStorage.setItem("clinicos-language", language);
  }, [language, theme]);
  useEffect(() => {
    if (!branchesRequested) return;
    let active = true;
    setBranchesLoading(true);
    fetch("/api/organization/branches", { credentials: "include" }).then((response) => response.ok ? response.json() : Promise.reject(new Error("branches")))
      .then((data: unknown) => { if (active) { const rows = Array.isArray(data) ? data as Branch[] : []; setBranches(rows.filter((branch) => branch.is_active !== false)); setBranchesError(false); } })
      .catch(() => { if (active) setBranchesError(true); }).finally(() => { if (active) setBranchesLoading(false); });
    return () => { active = false; };
  }, [branchesRequested]);
  useEffect(() => { if (selectedBranchId !== "all" && !branchesLoading && !branches.some((branch) => branch.id === selectedBranchId)) setBranch("all"); }, [branches, branchesLoading, selectedBranchId]);

  const value = useMemo<PreferencesContextValue>(() => ({
    language, theme, dir: "rtl", selectedBranchId, branches, branchesLoading, branchesError,
    t: (key) => translations[language][key],
    toggleLanguage: () => setLanguage((current) => current === "ar" ? "en" : "ar"), toggleTheme: () => setTheme((current) => current === "light" ? "dark" : "light"), loadBranches: () => setBranchesRequested(true), setSelectedBranchId: (id) => { setBranch(id); window.localStorage.setItem("clinicos-branch", id); },
  }), [branches, branchesError, branchesLoading, language, selectedBranchId, theme]);
  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const value = useContext(PreferencesContext);
  if (!value) throw new Error("usePreferences must be used inside PreferencesProvider");
  return value;
}
