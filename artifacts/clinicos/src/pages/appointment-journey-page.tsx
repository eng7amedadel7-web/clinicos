import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight, CalendarDays, CheckCircle2, Clock3, Printer, RefreshCw } from "lucide-react";
import { Link, useLocation } from "wouter";
import { usePreferences } from "@/lib/preferences";
import { AppointmentSlipModal } from "@/components/appointment-slip";

type Journey = {
  appointment: {
    id?: string;
    patient_id?: string;
    appointment_status?: string;
    scheduled_at?: string;
    booking_number?: string | null;
    patientName?: string;
    patientPhone?: string;
    doctorName?: string;
    serviceName?: string;
  };
  events: Array<{
    id?: string;
    event_type?: string;
    actor_type?: string;
    occurred_at?: string;
    created_at?: string;
  }>;
  followUp?: {
    status?: string;
    followup_goal?: string;
    next_due_at?: string | null;
  } | null;
  noShow?: {
    case_status?: string;
    classification?: string | null;
    risk_level?: string | null;
    last_activity_at?: string | null;
  } | null;
};

async function getJourney(id: string, signal?: AbortSignal) {
  const response = await fetch(`/api/appointments/${encodeURIComponent(id)}/journey`, { credentials: "include", signal });
  const payload = await response.json().catch(() => null) as Journey | { error?: string } | null;
  if (!response.ok) throw new Error(payload && "error" in payload && typeof payload.error === "string" ? payload.error : "تعذر تحميل رحلة الموعد.");
  return payload as Journey;
}

function dateLabel(value: unknown) {
  if (typeof value !== "string" || !value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("ar-EG");
}

export default function AppointmentJourneyPage() {
  const { language } = usePreferences();
  const en = language === "en";
  const [location] = useLocation();
  const [slipOpen, setSlipOpen] = useState(false);
  const id = location.split("/")[2] ?? "";
  const query = useQuery({ queryKey: ["appointment-journey", id], queryFn: ({ signal }) => getJourney(id, signal), enabled: Boolean(id), staleTime: 15_000, refetchInterval: 30_000, refetchIntervalInBackground: false });
  if (query.isLoading) return <section className="mx-auto max-w-[1150px]"><div className="surface flex min-h-[320px] items-center justify-center text-sm text-[hsl(var(--muted-foreground))]">{en ? "Loading appointment journey..." : "جارٍ تحميل رحلة الموعد..."}</div></section>;
  if (query.isError || !query.data) return <section className="mx-auto max-w-[1150px]"><div className="surface flex min-h-[320px] flex-col items-center justify-center p-10 text-center"><AlertTriangle className="mb-3 text-[#a64036] dark:text-[#eb9a90]" /><p className="text-sm font-bold dark:text-[#e2ecf1]">{en ? "Could not load appointment journey" : "تعذر تحميل رحلة الموعد"}</p><p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">{query.error instanceof Error ? query.error.message : (en ? "A temporary error occurred." : "حدث خطأ مؤقت.")}</p><button className="primary-button mt-5" onClick={() => query.refetch()}><RefreshCw size={15} /> {en ? "Retry" : "إعادة المحاولة"}</button></div></section>;
  const data = query.data;
  return (
    <section className="mx-auto max-w-[1150px]" dir="rtl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/appointments" className="grid size-9 place-items-center rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]" aria-label={en ? "Back to appointments" : "العودة إلى المواعيد"}>
            <ArrowRight size={16} />
          </Link>
          <div>
            <p className="text-[11px] font-bold text-[hsl(var(--primary))]">{en ? "Appointments / Journey" : "المواعيد / الرحلة"}</p>
            <h1 className="text-[27px] font-extrabold tracking-tight dark:text-[#e2ecf1]">{en ? "Appointment Journey" : "رحلة الموعد"}</h1>
            <p className="mt-1 text-[13px] text-[hsl(var(--muted-foreground))]">{dateLabel(data.appointment.scheduled_at)} · {data.appointment.appointment_status || (en ? "Unspecified" : "غير محدد")}</p>
          </div>
        </div>

        <button
          onClick={() => setSlipOpen(true)}
          className="flex items-center gap-1.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3.5 py-2 text-xs font-bold text-[hsl(var(--foreground))] transition hover:bg-[hsl(var(--muted))]"
          data-testid="button-open-slip"
        >
          <Printer size={15} className="text-[#347b98] dark:text-[#8cc3dd]" />
          <span>{en ? "Print Slip" : "طباعة التذكرة"}</span>
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
        <div className="space-y-5">
          <section className="surface p-5">
            <div className="mb-4 flex items-center gap-2">
              <CalendarDays size={17} className="text-[#347b98] dark:text-[#8cc3dd]" />
              <h2 className="text-base font-extrabold dark:text-[#e2ecf1]">{en ? "Appointment Summary" : "ملخص الموعد"}</h2>
            </div>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between"><span className="text-[hsl(var(--muted-foreground))]">{en ? "Status" : "الحالة"}</span><strong className="dark:text-[#e2ecf1]">{data.appointment.appointment_status || (en ? "Unspecified" : "غير محدد")}</strong></div>
              <div className="flex items-center justify-between"><span className="text-[hsl(var(--muted-foreground))]">{en ? "Booking number" : "رقم الحجز"}</span><strong className="dark:text-[#e2ecf1]">{data.appointment.booking_number || "—"}</strong></div>
              <div className="flex items-center justify-between"><span className="text-[hsl(var(--muted-foreground))]">{en ? "Patient ID" : "معرّف المريض"}</span><strong className="max-w-[190px] truncate dark:text-[#e2ecf1]" dir="ltr">{data.appointment.patient_id || "—"}</strong></div>
            </div>
          </section>
          <section className="surface p-5">
            <h2 className="mb-4 text-base font-extrabold dark:text-[#e2ecf1]">{en ? "Recovery" : "التعافي"}</h2>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-xl bg-[#f8fbfc] dark:bg-[#10222f] p-3"><span className="text-[10px] text-[hsl(var(--muted-foreground))]">Follow-up</span><strong className="mt-1 block text-sm dark:text-[#e2ecf1]">{data.followUp ? data.followUp.status || (en ? "Open" : "مفتوحة") : (en ? "No case" : "لا توجد حالة")}</strong>{data.followUp ? <span className="mt-1 block text-[10px] text-[hsl(var(--muted-foreground))]">{data.followUp.followup_goal || (en ? "Follow-up" : "متابعة")} · {dateLabel(data.followUp.next_due_at)}</span> : null}</div>
              <div className="rounded-xl bg-[#fff7f6] dark:bg-[#3d1f1b] p-3"><span className="text-[10px] text-[hsl(var(--muted-foreground))]">{en ? "No-show" : "عدم الحضور"}</span><strong className="mt-1 block text-sm text-[#a64036] dark:text-[#eb9a90]">{data.noShow ? data.noShow.case_status || (en ? "Open" : "مفتوحة") : (en ? "No case" : "لا توجد حالة")}</strong>{data.noShow ? <span className="mt-1 block text-[10px] text-[#a64036] dark:text-[#eb9a90]">{en ? "Risk" : "الخطر"}: {data.noShow.risk_level || (en ? "Unspecified" : "غير محدد")}</span> : null}</div>
            </div>
          </section>
        </div>
        <section className="surface p-5">
          <div className="mb-5 flex items-center justify-between">
            <div><h2 className="text-base font-extrabold dark:text-[#e2ecf1]">{en ? "Events" : "الأحداث"}</h2><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{en ? "Logged appointment changes in chronological order" : "التغييرات المسجلة للموعد بترتيبها الزمني"}</p></div>
            <Clock3 size={18} className="text-[#347b98] dark:text-[#8cc3dd]" />
          </div>
          {data.events.length ? <div className="relative space-y-5 before:absolute before:right-[7px] before:top-2 before:h-[calc(100%-16px)] before:w-px before:bg-[#dce7eb] dark:before:bg-[#1e3a4d]">{data.events.map((event) => <div key={String(event.id)} className="relative flex gap-3"><span className="z-10 mt-1 grid size-4 shrink-0 place-items-center rounded-full bg-[#dcecf5] dark:bg-[#143242] text-[#347b98] dark:text-[#8cc3dd]"><CheckCircle2 size={10} /></span><div className="min-w-0 flex-1 rounded-xl border border-[#edf1f3] dark:border-[#1e3a4d] p-3"><strong className="block text-xs dark:text-[#e2ecf1]">{event.event_type || (en ? "Appointment update" : "تحديث الموعد")}</strong><span className="mt-1 block text-[10px] text-[hsl(var(--muted-foreground))]">{event.actor_type || (en ? "System" : "النظام")} · {dateLabel(event.occurred_at || event.created_at)}</span></div></div>)}</div> : <div className="py-12 text-center text-xs text-[hsl(var(--muted-foreground))]">{en ? "No events recorded for this appointment." : "لا توجد أحداث مسجلة لهذا الموعد."}</div>}
        </section>
      </div>

      {/* Printable Slip Modal */}
      <AppointmentSlipModal
        open={slipOpen}
        onClose={() => setSlipOpen(false)}
        bookingNumber={data.appointment.booking_number}
        scheduledAt={data.appointment.scheduled_at}
        status={data.appointment.appointment_status}
        en={en}
      />
    </section>
  );
}
