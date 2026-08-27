import type { ReactNode } from "react";

export function WhatsAppIcon({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm5.79 14.07c-.24.68-1.39 1.3-1.92 1.38-.5.08-1.14.11-3.69-.95-2.99-1.24-4.9-4.29-5.05-4.49-.15-.2-1.2-1.6-1.2-3.05 0-1.45.76-2.16 1.03-2.46.27-.3.59-.37.79-.37.2 0 .39.003.56.01.18.01.42-.07.66.5.25.6.84 2.06.91 2.21.08.15.13.33.02.53-.1.2-.15.32-.3.5-.15.18-.31.39-.45.52-.15.15-.31.31-.13.61.18.3 1.13 1.86 2.43 3.01 1.67 1.48 3.08 1.94 3.51 2.16.43.21.68.18.93-.11.25-.28 1.07-1.25 1.36-1.68.29-.43.58-.36.97-.21.39.15 2.47 1.16 2.89 1.37.42.21.7.32.81.49.09.21.09 1.2-.15 1.88z" />
    </svg>
  );
}

export function InstagramIcon({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

export function MessengerIcon({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.91 1.455 5.518 3.735 7.207v3.535l3.39-1.86c.928.257 1.91.396 2.925.396 5.523 0 10-4.145 10-9.258C22 6.145 17.523 2 12 2zm1.066 12.438l-2.684-2.863-5.238 2.863 5.762-6.115 2.754 2.863 5.168-2.863-5.762 6.115z" />
    </svg>
  );
}

export function TelegramIcon({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .37z" />
    </svg>
  );
}

export function ChannelIcon({ type, className = "size-3.5" }: { type?: string; className?: string }) {
  const t = type?.toLowerCase();
  if (t === "whatsapp") return <WhatsAppIcon className={className} />;
  if (t === "instagram") return <InstagramIcon className={className} />;
  if (t === "messenger") return <MessengerIcon className={className} />;
  if (t === "telegram") return <TelegramIcon className={className} />;
  return null;
}

export function StatusPill({ children, tone = "teal" }: { children: ReactNode; tone?: string }) {
  const tones: Record<string, string> = {
    teal: "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60",
    amber: "bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60",
    blue: "bg-sky-50 text-sky-700 border-sky-200/80 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/60",
    purple: "bg-purple-50 text-purple-700 border-purple-200/80 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60",
    gray: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${tones[tone] ?? tones.blue}`}>
      {children}
    </span>
  );
}

export function formatRelativeTime(dateString: string | null | undefined, en: boolean) {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "—";

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return en ? "Just now" : "الآن";
  if (diffInSeconds < 3600) {
    const mins = Math.floor(diffInSeconds / 60);
    return en ? `${mins}m` : `${mins} د`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return en ? `${hours}h` : `${hours} س`;
  }
  if (diffInSeconds < 172800) {
    return en ? "Yesterday" : "أمس";
  }
  return date.toLocaleDateString(en ? "en-US" : "ar-EG", { month: "numeric", day: "numeric" });
}

export function formatMessageTime(dateString: string | null | undefined, en: boolean) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString(en ? "en-US" : "ar-EG", { hour: "numeric", minute: "2-digit", hour12: true });
}
