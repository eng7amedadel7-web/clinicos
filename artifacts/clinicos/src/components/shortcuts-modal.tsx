import { Keyboard, X } from "lucide-react";

type ShortcutsModalProps = {
  open: boolean;
  onClose: () => void;
  en?: boolean;
};

export function ShortcutsModal({ open, onClose, en = false }: ShortcutsModalProps) {
  if (!open) return null;

  const navigationShortcuts = [
    { key: "D", ar: "الرئيسية (لوحة العيادة)", en: "Dashboard / Overview" },
    { key: "C", ar: "تقويم المواعيد", en: "Appointments Calendar" },
    { key: "T", ar: "مهام الفريق", en: "Team Tasks" },
    { key: "I", ar: "صندوق الوارد والرسائل", en: "Inbox & Messages" },
    { key: "A", ar: "إدارة المواعيد", en: "Appointments List" },
    { key: "P", ar: "سجلات المرضى", en: "Patient Records" },
    { key: "R", ar: "التقارير والإحصائيات", en: "Analytics & Reports" },
    { key: "W", ar: "قائمة الانتظار", en: "Waitlist" },
    { key: "F", ar: "المتابعات", en: "Follow-ups" },
    { key: "N", ar: "حالات عدم الحضور", en: "No-shows" },
  ];

  const actionShortcuts = [
    { key: "⌘ K", enKey: "Ctrl + K", ar: "البحث الشامل الذكي", en: "Global Search & Command Palette" },
    { key: "/", ar: "فتح شريط البحث", en: "Focus Search" },
    { key: "?", ar: "عرض دليل الاختصارات", en: "Show Keyboard Shortcuts" },
    { key: "ESC", ar: "إغلاق النوافذ والقوائم", en: "Close Dialogs / Overlays" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in"
      onClick={onClose}
      dir="rtl"
    >
      <div
        className="surface w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-border space-y-5 animate-rise"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/80 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
              <Keyboard className="size-5" />
            </span>
            <div>
              <h2 className="text-base font-extrabold text-foreground">
                {en ? "Keyboard Shortcuts" : "اختصارات لوحة المفاتيح"}
              </h2>
              <p className="text-[11px] text-muted-foreground">
                {en
                  ? "Navigate quickly anywhere in MERUNA without touching your mouse"
                  : "تنقل بسرعة وسلاسة في النظام دون الحاجة للفأرة"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted"
            aria-label={en ? "Close" : "إغلاق"}
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Grid */}
        <div>
          <h3 className="text-xs font-bold text-muted-foreground mb-2.5 uppercase tracking-wider">
            {en ? "Page Navigation" : "التنقل بين الصفحات"}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {navigationShortcuts.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between p-2 rounded-xl bg-muted/30 border border-border/40"
              >
                <span className="text-xs font-medium text-foreground truncate">
                  {en ? item.en : item.ar}
                </span>
                <kbd className="grid size-6 place-items-center rounded-lg bg-card text-[11px] font-mono font-bold text-primary border border-border shadow-2xs">
                  {item.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>

        {/* Global Actions */}
        <div>
          <h3 className="text-xs font-bold text-muted-foreground mb-2.5 uppercase tracking-wider">
            {en ? "Global Actions" : "الإجراءات العامة"}
          </h3>
          <div className="space-y-1.5">
            {actionShortcuts.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between p-2 rounded-xl bg-muted/30 border border-border/40"
              >
                <span className="text-xs font-medium text-foreground">
                  {en ? item.en : item.ar}
                </span>
                <kbd className="px-2 py-0.5 rounded-lg bg-card text-[10px] font-mono font-bold text-primary border border-border shadow-2xs">
                  {item.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-1 border-t border-border/60">
          <span className="text-[10px] text-muted-foreground">
            {en ? "Press Esc or ? at any time to toggle this window" : "اضغط Esc أو ? في أي وقت لفتح أو إغلاق هذه النافذة"}
          </span>
        </div>
      </div>
    </div>
  );
}
