import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Language = "ar" | "en";
export type Theme = "light" | "dark";

const translations = {
  ar: {
    today: "اليوم",
    clinicManagement: "إدارة العيادة",
    settings: "الإعدادات",
    assistantWorking: "المساعد الذكي يعمل",
    assistantCount: "تم الرد على 18 رسالة اليوم تلقائياً.",
    manageAssistant: "إدارة الاستقبال الذكي",
    branch: "الفرع الرئيسي",
    goodMorning: "صباح الخير، ليان",
    clinicCenter: "مركز العمليات",
    clinicManager: "مديرة العيادة",
    language: "العربية",
    switchLanguage: "English",
    lightMode: "الوضع الفاتح",
    darkMode: "الوضع الداكن",
  },
  en: {
    today: "Today",
    clinicManagement: "Clinic management",
    settings: "Settings",
    assistantWorking: "AI assistant is working",
    assistantCount: "18 messages answered automatically today.",
    manageAssistant: "Manage AI reception",
    branch: "Main branch",
    goodMorning: "Good morning, Layan",
    clinicCenter: "Operations center",
    clinicManager: "Clinic manager",
    language: "English",
    switchLanguage: "العربية",
    lightMode: "Light mode",
    darkMode: "Dark mode",
  },
} as const;

type PreferencesContextValue = {
  language: Language;
  theme: Theme;
  dir: "rtl" | "ltr";
  t: (key: keyof (typeof translations)["ar"]) => string;
  toggleLanguage: () => void;
  toggleTheme: () => void;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const stored = window.localStorage.getItem("clinicos-language");
    return stored === "en" ? "en" : "ar";
  });
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = window.localStorage.getItem("clinicos-theme");
    return stored === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    window.localStorage.setItem("clinicos-theme", theme);
    window.localStorage.setItem("clinicos-language", language);
  }, [language, theme]);

  const value = useMemo<PreferencesContextValue>(() => ({
    language,
    theme,
    dir: language === "ar" ? "rtl" : "ltr",
    t: (key) => translations[language][key],
    toggleLanguage: () => setLanguage((current) => current === "ar" ? "en" : "ar"),
    toggleTheme: () => setTheme((current) => current === "light" ? "dark" : "light"),
  }), [language, theme]);

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const value = useContext(PreferencesContext);
  if (!value) throw new Error("usePreferences must be used inside PreferencesProvider");
  return value;
}