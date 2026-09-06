import { Bot, Clock3, MessageSquareText, ShieldCheck, Sparkles, ToggleLeft } from "lucide-react";
import { usePreferences } from "@/lib/preferences";
import { WorkspacePage, WorkspacePageHeader } from "@/components/workspace-page";

export default function AiReceptionPage() {
  const { language } = usePreferences();
  const en = language === "en";

  return (
    <WorkspacePage>
      <WorkspacePageHeader
        eyebrow={en ? "Automation / AI Reception" : "الأتمتة / الاستقبال الذكي"}
        title={en ? "AI Reception Control" : "لوحة تحكم الاستقبال الذكي"}
        description={en
          ? "Monitor and control the AI assistant that handles patient conversations automatically"
          : "راقب وتحكم في المساعد الذكي الذي يرد على المرضى تلقائياً"}
        action={
          // Honest state: there is no API to enable/disable AI reception yet,
          // so the toggle stays disabled instead of faking success.
          <button
            disabled
            title={en ? "Coming soon — AI engine integration in progress" : "قريباً — الربط مع محرك الذكاء قيد التشغيل"}
            className="flex cursor-not-allowed items-center gap-2 rounded-full bg-[#f1f1f4] px-4 py-2 text-xs font-bold text-[#66808e] dark:bg-[#1e2a30] dark:text-[#7e939e]"
            data-testid="button-toggle-ai"
          >
            <ToggleLeft size={16} />
            {en ? "Coming soon — AI engine integration in progress" : "قريباً — الربط مع محرك الذكاء قيد التشغيل"}
          </button>
        }
      />

      {/* Honest empty state: no real AI reception data exists yet (no backend endpoint),
          so we show no fabricated numbers. */}
      <section
        className="surface flex flex-col items-center rounded-2xl p-14 text-center animate-rise"
        data-testid="ai-reception-empty-state"
      >
        <span className="mb-4 grid size-14 place-items-center rounded-2xl bg-[#f1f7f7] text-[#578b9d] dark:bg-[#10222f] dark:text-[#8cc3dd]">
          <Bot size={26} />
        </span>
        <h2 className="text-base font-extrabold text-[#18374d] dark:text-[#e2ecf1]">
          {en ? "AI engine integration is in progress" : "الربط مع محرك الذكاء قيد التشغيل"}
        </h2>
        <p className="mt-2 max-w-md text-sm text-[#527080] dark:text-[#a8bfc9]">
          {en ? "Statistics will appear once the AI reception is running." : "ستظهر الإحصائيات عند تشغيل الاستقبال الذكي."}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-[11px] font-bold">
          {[
            { icon: <MessageSquareText size={13} />, label: en ? "Automated replies" : "الردود الآلية" },
            { icon: <ShieldCheck size={13} />, label: en ? "Handoff tracking" : "متابعة التحويلات" },
            { icon: <Sparkles size={13} />, label: en ? "Intent analytics" : "تحليل المقاصد" },
            { icon: <Clock3 size={13} />, label: en ? "Response times" : "أزمنة الرد" },
          ].map((item, i) => (
            <span
              key={i}
              className="flex items-center gap-1.5 rounded-full bg-[#f8fbfc] px-3 py-1.5 text-[#66808e] dark:bg-[#10222f] dark:text-[#7e939e]"
            >
              {item.icon}
              {item.label}
            </span>
          ))}
        </div>
      </section>
    </WorkspacePage>
  );
}
