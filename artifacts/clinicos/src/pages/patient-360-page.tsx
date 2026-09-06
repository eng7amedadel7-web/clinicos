import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight, CalendarDays, CheckCircle2, Inbox, Mail, MapPin, MessageSquare, Phone, RefreshCw, StickyNote, UserRound } from "lucide-react";
import { Link, useLocation } from "wouter";
import { formatWallDate, formatWallTime } from "@/lib/datetime";
import { usePreferences } from "@/lib/preferences";

type Patient360Response = {
  patient: { id?: string; name?: string; first_name?: string; last_name?: string; phone?: string; created_at?: string };
  appointments: Array<{ id?: string; scheduled_at?: string; appointment_status?: string; booking_number?: string | null }>;
  conversations: Array<{ id?: string; channel_id?: string | null; last_patient_message?: string | null; last_activity_at?: string | null; status?: string | null; is_handoff?: boolean }>;
  followUps: Array<{ id?: string; status?: string | null; next_due_at?: string | null; followup_goal?: string | null }>;
  noShows: Array<{ id?: string; case_status?: string | null; risk_level?: string | null; last_activity_at?: string | null }>;
};
type AppointmentItem = Patient360Response["appointments"][number];
// The 360 endpoint returns only name/phone/created_at for the patient row;
// email/age/address/notes live on the patients list payload, so the page
// enriches from GET /api/patients and shows a retry chip if that fails.
type PatientContact = { id?: string; email?: string | null; notes?: string | null; age?: number | null; address?: string | null };

async function getPatient360(id: string, signal?: AbortSignal) {
  const response = await fetch(`/api/patients/${encodeURIComponent(id)}/360`, { credentials: "include", signal });
  const payload = await response.json().catch(() => null) as Patient360Response | { error?: string } | null;
  if (!response.ok) throw new Error(payload && "error" in payload && typeof payload.error === "string" ? payload.error : "تعذر تحميل ملف المريض.");
  return payload as Patient360Response;
}

async function getPatientContact(id: string, signal?: AbortSignal) {
  const response = await fetch("/api/patients?limit=1000", { credentials: "include", signal });
  if (!response.ok) throw new Error("تعذر تحميل بيانات التواصل.");
  const payload = await response.json().catch(() => null) as { items?: PatientContact[] } | PatientContact[] | null;
  const items = Array.isArray(payload) ? payload : payload?.items ?? [];
  return items.find((item) => item.id === id) ?? null;
}

function dateLabel(value: unknown, en?: boolean) {
  if (typeof value !== "string" || !value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat(en ? "en-GB" : "ar-EG", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}

function patientName(patient: Patient360Response["patient"]) {
  return patient.name || [patient.first_name, patient.last_name].filter(Boolean).join(" ") || "مريض بدون اسم";
}

const STATUS_LABELS: Record<string, [string, string]> = {
  scheduled: ["مجدول", "Scheduled"],
  confirmed: ["مؤكد", "Confirmed"],
  checked_in: ["وصل", "Checked in"],
  completed: ["مكتمل", "Completed"],
  cancelled: ["ملغي", "Cancelled"],
  no_show: ["لم يحضر", "No show"],
  pending: ["بانتظار التأكيد", "Pending confirmation"],
};

function statusText(status: string | null | undefined, en: boolean) {
  const key = (status ?? "").trim().toLowerCase();
  if (STATUS_LABELS[key]) return en ? STATUS_LABELS[key][1] : STATUS_LABELS[key][0];
  return status || (en ? "Unspecified" : "غير محدد");
}

function statusTone(status: string | null | undefined) {
  const key = (status ?? "").trim().toLowerCase();
  if (["checked_in", "completed"].includes(key)) return "bg-[#d9f0e8] text-[#176b58] dark:bg-[#123528] dark:text-[#7fd0b4]";
  if (["scheduled", "confirmed", "pending"].includes(key)) return "bg-[#fff0d8] text-[#9a6513] dark:bg-[#3a2c14] dark:text-[#e0b46a]";
  if (["cancelled", "no_show"].includes(key)) return "bg-[#f8dfdc] text-[#a64036] dark:bg-[#3d1f1b] dark:text-[#eb9a90]";
  return "bg-[#dcecf5] text-[#22617d] dark:bg-[#143242] dark:text-[#8cc3dd]";
}

function StatusBadge({ status, en }: { status: string | null | undefined; en: boolean }) {
  return <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${statusTone(status)}`}>{statusText(status, en)}</span>;
}

function AppointmentRow({ item, en }: { item: AppointmentItem; en: boolean }) {
  const inner = (
    <>
      <div className="min-w-0">
        <strong className="block text-xs dark:text-[#e2ecf1]">
          {formatWallDate(item.scheduled_at, en ? "en" : "ar")} · {formatWallTime(item.scheduled_at, en ? "en" : "ar")}
        </strong>
        <span className="mt-1 block text-[10px] text-[hsl(var(--muted-foreground))]">{item.booking_number || (en ? "No booking ref" : "بدون كود حجز")}</span>
      </div>
      <StatusBadge status={item.appointment_status} en={en} />
    </>
  );
  const rowClass = "flex items-center justify-between gap-3 rounded-xl border border-[#edf1f3] p-3 transition dark:border-[#1e3a4d]";
  if (item.id) {
    return (
      <Link href={`/appointments/${encodeURIComponent(String(item.id))}`} className={`${rowClass} hover:bg-[#f8fbfc] dark:hover:bg-[#10222f]`}>
        {inner}
      </Link>
    );
  }
  return <div className={rowClass}>{inner}</div>;
}

function AppointmentGroup({ title, items, en, accent }: { title: string; items: AppointmentItem[]; en: boolean; accent: string }) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-bold" style={{ color: accent }}>
        {title} ({items.length})
      </p>
      <div className="space-y-2">
        {items.map((item) => <AppointmentRow key={String(item.id ?? item.scheduled_at ?? Math.random())} item={item} en={en} />)}
      </div>
    </div>
  );
}

export default function Patient360Page() {
  const { language } = usePreferences();
  const en = language === "en";
  const [location] = useLocation();
  const id = decodeURIComponent(location.split("/")[2] ?? "");
  const query = useQuery({ queryKey: ["patient-360", id], queryFn: ({ signal }) => getPatient360(id, signal), enabled: Boolean(id), staleTime: 15_000 });
  const detailsQuery = useQuery({ queryKey: ["patient-contact", id], queryFn: ({ signal }) => getPatientContact(id, signal), enabled: Boolean(id) && query.isSuccess, staleTime: 60_000, retry: false });
  const data = query.data;
  const contact = detailsQuery.data ?? null;

  if (!id) {
    return (
      <section className="mx-auto max-w-[1150px]" dir="rtl">
        <div className="surface flex min-h-[360px] flex-col items-center justify-center p-10 text-center">
          <AlertTriangle className="mb-3 text-[#a64036] dark:text-[#eb9a90]" />
          <p className="text-sm font-bold dark:text-[#e2ecf1]">{en ? "Invalid patient link" : "رابط المريض غير صالح"}</p>
        </div>
      </section>
    );
  }

  if (query.isLoading) {
    return (
      <section className="mx-auto max-w-[1150px]">
        <div className="surface flex min-h-[360px] items-center justify-center text-sm text-[hsl(var(--muted-foreground))]">
          {en ? "Loading patient record..." : "جارٍ تحميل ملف المريض..."}
        </div>
      </section>
    );
  }

  if (query.isError || !data) {
    return (
      <section className="mx-auto max-w-[1150px]">
        <div className="surface flex min-h-[360px] flex-col items-center justify-center p-10 text-center">
          <AlertTriangle className="mb-3 text-[#a64036] dark:text-[#eb9a90]" />
          <p className="text-sm font-bold dark:text-[#e2ecf1]">{en ? "Could not load patient record" : "تعذر تحميل ملف المريض"}</p>
          <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">
            {query.error instanceof Error ? query.error.message : (en ? "A temporary error occurred." : "حدث خطأ مؤقت.")}
          </p>
          <button className="primary-button mt-5" onClick={() => query.refetch()}>
            <RefreshCw size={15} /> {en ? "Retry" : "إعادة المحاولة"}
          </button>
        </div>
      </section>
    );
  }

  const patient = data.patient;
  const nowTs = Date.now();
  const scheduledTs = (value?: string) => {
    if (!value) return NaN;
    const ts = new Date(value).getTime();
    return Number.isNaN(ts) ? NaN : ts;
  };
  const upcoming = data.appointments.filter((item) => { const ts = scheduledTs(item.scheduled_at); return Number.isFinite(ts) && ts >= nowTs; });
  const past = data.appointments.filter((item) => { const ts = scheduledTs(item.scheduled_at); return !Number.isFinite(ts) || ts < nowTs; });
  const lastVisit = past.find((item) => Number.isFinite(scheduledTs(item.scheduled_at)))?.scheduled_at ?? null;
  const summaryStatus = upcoming.length
    ? en ? `${upcoming.length} upcoming appointment${upcoming.length > 1 ? "s" : ""}` : `لديه ${upcoming.length} موعد قادم`
    : past.length
      ? en ? "Past visits only" : "زيارات سابقة فقط"
      : en ? "No appointments yet" : "لا توجد مواعيد بعد";

  return (
    <section className="mx-auto max-w-[1150px]" dir="rtl">
      {/* Header + quick summary */}
      <div className="mb-6 flex items-center gap-3">
        <Link href="/patients" className="grid size-9 place-items-center rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]" aria-label={en ? "Back to patients" : "العودة إلى المرضى"}>
          <ArrowRight size={16} />
        </Link>
        <div>
          <p className="text-[11px] font-bold text-[hsl(var(--primary))]">{en ? "Patients / Full Record" : "المرضى / الملف الكامل"}</p>
          <h1 className="text-[27px] font-extrabold tracking-tight dark:text-[#e2ecf1]">{patientName(patient)}</h1>
          <p className="mt-1 text-[13px] text-[hsl(var(--muted-foreground))]">
            {en ? "Quick summary" : "ملخص سريع"}: {en ? `${data.appointments.length} bookings` : `${data.appointments.length} حجز`} · {en ? "Last visit" : "آخر زيارة"} {formatWallDate(lastVisit, en ? "en" : "ar")} · {en ? "Status" : "الحالة"}: {summaryStatus}
          </p>
        </div>
      </div>

      {/* Patient Profile Card */}
      <section className="surface mb-5 flex flex-wrap items-center gap-4 p-5">
        <span className="grid size-14 place-items-center rounded-full bg-[#dcecf5] dark:bg-[#143242] text-lg font-bold text-[#22617d] dark:text-[#8cc3dd]">
          {patientName(patient).slice(0, 2)}
        </span>
        <div className="min-w-[240px] flex-1">
          <h2 className="text-lg font-extrabold dark:text-[#e2ecf1]">{patientName(patient)}</h2>
          {patient.phone && patient.phone !== "—" ? (
            <a href={`tel:${patient.phone.replace(/\s+/g, "")}`} dir="ltr" className="mt-1 inline-flex items-center gap-1.5 text-xs font-bold text-[#22617d] hover:underline dark:text-[#8cc3dd]">
              <Phone size={12} /> {patient.phone}
            </a>
          ) : (
            <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{en ? "No phone number" : "لا يوجد رقم هاتف"}</p>
          )}
          {contact?.email ? (
            <a href={`mailto:${contact.email}`} dir="ltr" className="mt-1 inline-flex items-center gap-1.5 text-xs text-[#22617d] hover:underline dark:text-[#8cc3dd]">
              <Mail size={12} /> {contact.email}
            </a>
          ) : null}
          <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
            {en ? "Age" : "العمر"}: {typeof contact?.age === "number" ? contact.age : "—"} · {en ? "Address" : "العنوان"}: {contact?.address || "—"} · {en ? "Registered" : "تاريخ التسجيل"}: {dateLabel(patient.created_at, en)}
          </p>
          {contact?.notes ? (
            <p className="mt-2 flex items-start gap-1.5 rounded-xl bg-[#f8fbfc] dark:bg-[#10222f] p-2 text-[11px] text-[hsl(var(--muted-foreground))]">
              <StickyNote size={12} className="mt-0.5 shrink-0" /> {contact.notes}
            </p>
          ) : null}
          {detailsQuery.isError ? (
            <div className="mt-2 flex items-center gap-2 text-[11px] text-[#a64036] dark:text-[#eb9a90]">
              <AlertTriangle size={12} />
              <span>{en ? "Contact details could not be loaded." : "تعذر تحميل بيانات التواصل الكاملة."}</span>
              <button onClick={() => detailsQuery.refetch()} className="inline-flex items-center gap-1 font-bold underline">
                <RefreshCw size={11} /> {en ? "Retry" : "إعادة المحاولة"}
              </button>
            </div>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
          <div className="rounded-xl bg-[#f8fbfc] dark:bg-[#10222f] px-4 py-3">
            <strong className="block text-lg dark:text-[#e2ecf1]">{data.appointments.length}</strong>
            <span className="text-[10px] text-[hsl(var(--muted-foreground))]">{en ? "Appointments" : "مواعيد"}</span>
          </div>
          <div className="rounded-xl bg-[#f8fbfc] dark:bg-[#10222f] px-4 py-3">
            <strong className="block text-lg dark:text-[#e2ecf1]">{data.conversations.length}</strong>
            <span className="text-[10px] text-[hsl(var(--muted-foreground))]">{en ? "Conversations" : "محادثات"}</span>
          </div>
          <div className="rounded-xl bg-[#f8fbfc] dark:bg-[#10222f] px-4 py-3">
            <strong className="block text-lg dark:text-[#e2ecf1]">{data.followUps.length}</strong>
            <span className="text-[10px] text-[hsl(var(--muted-foreground))]">{en ? "Follow-ups" : "متابعات"}</span>
          </div>
          <div className="rounded-xl bg-[#f8fbfc] dark:bg-[#10222f] px-4 py-3">
            <strong className="block text-lg dark:text-[#e2ecf1]">{data.noShows.length}</strong>
            <span className="text-[10px] text-[hsl(var(--muted-foreground))]">{en ? "No-shows" : "عدم حضور"}</span>
          </div>
        </div>
      </section>

      {/* Grid of details */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Appointments: upcoming vs past */}
        <section className="surface p-5">
          <div className="mb-4 flex items-center gap-2">
            <CalendarDays size={17} className="text-[#347b98] dark:text-[#8cc3dd]" />
            <h2 className="text-base font-extrabold dark:text-[#e2ecf1]">{en ? "Appointment History" : "سجل المواعيد"}</h2>
          </div>
          {data.appointments.length ? (
            <div className="space-y-4">
              {upcoming.length ? <AppointmentGroup title={en ? "Upcoming" : "قادمة"} items={upcoming} en={en} accent="#347b98" /> : null}
              {past.length ? <AppointmentGroup title={en ? "Past" : "سابقة"} items={past} en={en} accent="#7d929c" /> : null}
            </div>
          ) : (
            <p className="py-8 text-center text-xs text-[hsl(var(--muted-foreground))]">{en ? "No linked appointments." : "لا توجد مواعيد مرتبطة."}</p>
          )}
        </section>

        {/* WhatsApp / Telegram conversations */}
        <section className="surface p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Inbox size={17} className="text-[#7568a0] dark:text-[#bcaede]" />
              <h2 className="text-base font-extrabold dark:text-[#e2ecf1]">{en ? "WhatsApp / Telegram Conversations" : "محادثات واتساب/تلجرام"}</h2>
            </div>
            <Link href="/inbox" className="rounded-full border border-[hsl(var(--border))] px-2.5 py-1 text-[10px] font-bold text-[#7568a0] dark:text-[#bcaede]">
              {en ? "Open inbox" : "فتح الوارد"}
            </Link>
          </div>
          {data.conversations.length ? (
            <div className="space-y-2">
              {data.conversations.map((item) => (
                <Link href={`/inbox?conversationId=${encodeURIComponent(String(item.id ?? ""))}`} key={String(item.id)} className="flex items-center gap-3 rounded-xl border border-[#edf1f3] dark:border-[#1e3a4d] p-3 hover:bg-[#f8fbfc] dark:hover:bg-[#10222f]">
                  <MessageSquare size={15} className="text-[#7568a0] dark:text-[#bcaede]" />
                  <div className="min-w-0 flex-1">
                    <strong className="block truncate text-xs dark:text-[#e2ecf1]">{item.last_patient_message || (en ? "No recent message" : "لا توجد رسالة أخيرة")}</strong>
                    <span className="mt-1 block text-[10px] text-[hsl(var(--muted-foreground))]">{dateLabel(item.last_activity_at, en)} · {statusText(item.status, en)}</span>
                  </div>
                  {item.is_handoff ? <AlertTriangle size={14} className="text-[#a64036] dark:text-[#eb9a90]" /> : null}
                </Link>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-xs text-[hsl(var(--muted-foreground))]">{en ? "No linked conversations." : "لا توجد محادثات مرتبطة."}</p>
          )}
        </section>

        {/* Follow ups */}
        <section className="surface p-5">
          <div className="mb-4 flex items-center gap-2">
            <CheckCircle2 size={17} className="text-[#3d8a72] dark:text-[#7fd0b4]" />
            <h2 className="text-base font-extrabold dark:text-[#e2ecf1]">{en ? "Follow-ups" : "المتابعات"}</h2>
          </div>
          {data.followUps.length ? (
            <div className="space-y-2">
              {data.followUps.map((item) => (
                <div key={String(item.id)} className="rounded-xl border border-[#edf1f3] dark:border-[#1e3a4d] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <strong className="text-xs dark:text-[#e2ecf1]">{item.followup_goal || (en ? "Follow-up" : "متابعة")}</strong>
                    <span className="text-[10px] font-bold text-[#3d8a72] dark:text-[#7fd0b4]">{statusText(item.status, en)}</span>
                  </div>
                  <p className="mt-1 text-[10px] text-[hsl(var(--muted-foreground))]">{en ? "Due" : "الاستحقاق"}: {dateLabel(item.next_due_at, en)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-xs text-[hsl(var(--muted-foreground))]">{en ? "No linked follow-ups." : "لا توجد متابعات مرتبطة."}</p>
          )}
        </section>

        {/* No shows */}
        <section className="surface p-5">
          <div className="mb-4 flex items-center gap-2">
            <UserRound size={17} className="text-[#a64036] dark:text-[#eb9a90]" />
            <h2 className="text-base font-extrabold dark:text-[#e2ecf1]">{en ? "No-show Cases" : "حالات عدم الحضور"}</h2>
          </div>
          {data.noShows.length ? (
            <div className="space-y-2">
              {data.noShows.map((item) => (
                <div key={String(item.id)} className="rounded-xl border border-[#edf1f3] dark:border-[#1e3a4d] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <strong className="text-xs dark:text-[#e2ecf1]">{statusText(item.case_status, en)}</strong>
                    <span className="text-[10px] text-[#a64036] dark:text-[#eb9a90]">{en ? "Risk" : "الخطر"}: {item.risk_level || (en ? "Unspecified" : "غير محدد")}</span>
                  </div>
                  <p className="mt-1 text-[10px] text-[hsl(var(--muted-foreground))]">{en ? "Last activity" : "آخر نشاط"}: {dateLabel(item.last_activity_at, en)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-xs text-[hsl(var(--muted-foreground))]">{en ? "No linked no-show cases." : "لا توجد حالات عدم حضور مرتبطة."}</p>
          )}
        </section>
      </div>

      {/* UNIFIED CHRONOLOGICAL PATIENT TIMELINE */}
      <section className="surface mt-5 p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold dark:text-[#e2ecf1]">
              {en ? "Patient Care Journey & Timeline" : "مسار الرعاية والجدول الزمني للمريض"}
            </h2>
            <p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">
              {en ? "Complete chronological interaction history" : "السجل التفاعلي الشامل لجميع الزيارات والمحادثات"}
            </p>
          </div>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            {en ? "Timeline" : "سجل زمني"}
          </span>
        </div>

        <div className="relative border-s-2 border-primary/20 ms-4 space-y-6 ps-6">
          {/* Milestone 1: Registered */}
          <div className="relative">
            <span className="absolute -start-[31px] top-0 flex size-5 items-center justify-center rounded-full bg-primary text-white text-[10px] ring-4 ring-card">
              ✓
            </span>
            <div className="rounded-2xl border border-border/70 bg-card/60 p-4">
              <div className="flex items-center justify-between">
                <strong className="text-xs font-bold text-foreground">
                  {en ? "Patient Profile Created" : "تسجيل ملف المريض في العيادة"}
                </strong>
                <time className="font-mono text-[10px] text-muted-foreground">{dateLabel(patient.created_at, en)}</time>
              </div>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin size={11} className="shrink-0" />
                {en ? `Registered by front desk system under phone ${patient.phone || "—"}` : `تم فتح الملف عبر الاستقبال برقم ${patient.phone || "—"}`}
              </p>
            </div>
          </div>

          {/* Appointments in timeline */}
          {data.appointments.map((appt, i) => (
            <div key={appt.id || i} className="relative">
              <span className="absolute -start-[31px] top-0 flex size-5 items-center justify-center rounded-full bg-sky-600 text-white text-[10px] ring-4 ring-card">
                📅
              </span>
              <div className="rounded-2xl border border-sky-500/20 bg-sky-950/10 p-4">
                <div className="flex items-center justify-between gap-2">
                  <strong className="text-xs font-bold text-sky-800 dark:text-sky-300">
                    {en ? "Appointment" : "موعد كشف"}
                  </strong>
                  <time className="font-mono text-[10px] text-muted-foreground">
                    {formatWallDate(appt.scheduled_at, en ? "en" : "ar")} · {formatWallTime(appt.scheduled_at, en ? "en" : "ar")}
                  </time>
                </div>
                <p className="mt-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>{en ? `Booking reference ${appt.booking_number || "MRN-Auto"}` : `كود الحجز المرجعي ${appt.booking_number || "MRN-Auto"}`}</span>
                  {appt.id ? (
                    <Link href={`/appointments/${encodeURIComponent(String(appt.id))}`} className="shrink-0 font-bold underline">
                      {en ? "View journey" : "عرض المسار"}
                    </Link>
                  ) : null}
                </p>
              </div>
            </div>
          ))}

          {/* Messages in timeline */}
          {data.conversations.map((conv, i) => (
            <div key={conv.id || i} className="relative">
              <span className="absolute -start-[31px] top-0 flex size-5 items-center justify-center rounded-full bg-violet-600 text-white text-[10px] ring-4 ring-card">
                💬
              </span>
              <div className="rounded-2xl border border-violet-500/20 bg-violet-950/10 p-4">
                <div className="flex items-center justify-between">
                  <strong className="text-xs font-bold text-violet-800 dark:text-violet-300">
                    {en ? "Inbound conversation (WhatsApp / Telegram)" : "محادثة واردة (واتساب/تلجرام)"}
                  </strong>
                  <time className="font-mono text-[10px] text-muted-foreground">{dateLabel(conv.last_activity_at, en)}</time>
                </div>
                <p className="mt-1 text-xs text-muted-foreground italic">
                  "{conv.last_patient_message || (en ? "Inquiry resolved" : "تم الرد على الاستفسار")}"
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}
