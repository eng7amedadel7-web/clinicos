import { useState } from 'react';
import { Plus, X, CalendarDays, UserRound, MessageSquare, CheckSquare, Sparkles, Send } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { toast } from 'sonner';
import { usePreferences } from '@/lib/preferences';
import { getGetDashboardSummaryQueryKey } from '@workspace/api-client-react';

type QuickAddTab = 'appointment' | 'patient' | 'message' | 'task';

type BookingOptions = {
  patients: Array<{ id: string; name: string }>;
  doctors: Array<{ id: string; name: string; specialization?: string | null }>;
  services: Array<{ id: string; name: string; durationMinutes?: number | null }>;
  slots: Array<{ id: string; doctorId: string; serviceId: string; startTime: string; endTime: string; status: string }>;
};

const NEW_PATIENT = '__new__';

function formatSlotTime(value: string, locale: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
}

export function QuickAddModal() {
  const { language } = usePreferences();
  const isArabic = language === 'ar';
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<QuickAddTab>('appointment');

  // حقول تبويب الموعد
  const [apptPatientId, setApptPatientId] = useState('');
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientPhone, setNewPatientPhone] = useState('');
  const [apptSlotId, setApptSlotId] = useState('');
  const [apptNotes, setApptNotes] = useState('');

  // حقول تبويب المريض
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [patientNotes, setPatientNotes] = useState('');

  // خيارات الحجز الحقيقية من الخادم
  const bookingOptionsQuery = useQuery({
    queryKey: ['booking-options'],
    queryFn: async ({ signal }) => {
      const res = await fetch('/api/appointments?includeOptions=true', { credentials: 'include', signal });
      if (!res.ok) throw new Error(isArabic ? 'تعذر تحميل خيارات الحجز' : 'Failed to load booking options');
      const data = await res.json().catch(() => null);
      return (data?.options ?? null) as BookingOptions | null;
    },
    enabled: isOpen,
    staleTime: 60_000,
  });
  const bookingOptions = bookingOptionsQuery.data ?? null;
  const availableSlots = bookingOptions?.slots ?? [];
  const doctorName = (id: string) => bookingOptions?.doctors.find((d) => d.id === id)?.name || (isArabic ? 'الطبيب' : 'Doctor');
  const serviceName = (id: string) => bookingOptions?.services.find((s) => s.id === id)?.name || (isArabic ? 'الخدمة' : 'Service');

  const createPatientMutation = useMutation({
    mutationFn: async (payload: { name: string; phone?: string; email?: string; notes?: string }) => {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || (isArabic ? 'فشل حفظ المريض' : 'Failed to save patient'));
      }
      return res.json() as Promise<{ id?: string }>;
    }
  });

  const createAppointmentMutation = useMutation({
    mutationFn: async (payload: { patientId: string; slotId: string; notes?: string }) => {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || (isArabic ? 'فشل حجز الموعد' : 'Failed to book appointment'));
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-appointments'] });
      queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
      toast.success(isArabic ? 'تم حجز الموعد وتأكيده بنجاح' : 'Appointment booked successfully');
      resetForm();
      setIsOpen(false);
    },
    onError: (err: Error) => {
      toast.error(err?.message || (isArabic ? 'فشل حجز الموعد' : 'Failed to book appointment'));
    }
  });

  const resetForm = () => {
    setApptPatientId('');
    setNewPatientName('');
    setNewPatientPhone('');
    setApptSlotId('');
    setApptNotes('');
    setPatientName('');
    setPatientPhone('');
    setPatientEmail('');
    setPatientNotes('');
  };

  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apptSlotId) return;
    const notes = apptNotes.trim() || undefined;

    // مريض جديد: ننشئه أولاً ثم نحجز بمعرّف المريض الحقيقي
    if (apptPatientId === NEW_PATIENT) {
      if (!newPatientName.trim()) return;
      createPatientMutation.mutate(
        { name: newPatientName.trim(), phone: newPatientPhone.trim() || undefined },
        {
          onSuccess: (created) => {
            queryClient.invalidateQueries({ queryKey: ['patients'] });
            if (!created?.id) {
              toast.error(isArabic ? 'تعذر إنشاء المريض الجديد' : 'Failed to create the new patient');
              return;
            }
            createAppointmentMutation.mutate({ patientId: String(created.id), slotId: apptSlotId, notes });
          },
          onError: (err: Error) => {
            toast.error(err?.message || (isArabic ? 'فشل حفظ المريض' : 'Failed to save patient'));
          }
        }
      );
      return;
    }

    if (!apptPatientId) return;
    createAppointmentMutation.mutate({ patientId: apptPatientId, slotId: apptSlotId, notes });
  };

  const handleCreatePatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) return;

    // الخادم يقبل name/phone/email/notes فقط
    createPatientMutation.mutate(
      {
        name: patientName.trim(),
        phone: patientPhone.trim() || undefined,
        email: patientEmail.trim() || undefined,
        notes: patientNotes.trim() || undefined
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['patients'] });
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
          toast.success(isArabic ? 'تم حفظ ملف المريض بنجاح' : 'Patient created successfully');
          resetForm();
          setIsOpen(false);
        },
        onError: (err: Error) => {
          toast.error(err?.message || (isArabic ? 'فشل حفظ المريض' : 'Failed to save patient'));
        }
      }
    );
  };

  const bookingPending = createAppointmentMutation.isPending || createPatientMutation.isPending;
  const noSlotsAvailable = Boolean(bookingOptions) && availableSlots.length === 0;

  return (
    <>
      {/* Floating Action Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 start-6 z-40 flex size-13 items-center justify-center rounded-full bg-primary text-white shadow-xl transition-all duration-300 hover:scale-110 hover:shadow-2xl focus:outline-hidden focus:ring-4 focus:ring-primary/30"
        aria-label={isArabic ? 'إجراء سريع جديد' : 'Quick Action'}
        title={isArabic ? 'إضافة سريعة (+)' : 'Quick Add (+)'}
      >
        <Plus className="size-6 transition-transform group-hover:rotate-90" />
      </button>

      {/* Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in" dir="rtl">
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-border bg-card shadow-2xl animate-scale-up">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border p-5">
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Sparkles className="size-4.5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    {isArabic ? 'إجراء سريع جديد' : 'Quick Clinic Action'}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {isArabic ? 'حجز، إضافة مريض، مراسلة، أو تسجيل مهمة' : 'Instant booking, patient, message, or task'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="grid grid-cols-4 border-b border-border bg-muted/40 p-1.5 gap-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('appointment')}
                className={`flex flex-col items-center gap-1 rounded-xl py-2 transition ${
                  activeTab === 'appointment' ? 'bg-card text-primary shadow-xs' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <CalendarDays className="size-4" />
                <span>{isArabic ? 'موعد' : 'Appointment'}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('patient')}
                className={`flex flex-col items-center gap-1 rounded-xl py-2 transition ${
                  activeTab === 'patient' ? 'bg-card text-primary shadow-xs' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <UserRound className="size-4" />
                <span>{isArabic ? 'مريض' : 'Patient'}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('message')}
                className={`flex flex-col items-center gap-1 rounded-xl py-2 transition ${
                  activeTab === 'message' ? 'bg-card text-primary shadow-xs' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <MessageSquare className="size-4" />
                <span>{isArabic ? 'رسالة' : 'Message'}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('task')}
                className={`flex flex-col items-center gap-1 rounded-xl py-2 transition ${
                  activeTab === 'task' ? 'bg-card text-primary shadow-xs' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <CheckSquare className="size-4" />
                <span>{isArabic ? 'مهمة' : 'Task'}</span>
              </button>
            </div>

            {/* Form Content */}
            <div className="p-5">
              {/* TAB 1: Quick Appointment */}
              {activeTab === 'appointment' && (
                <form onSubmit={handleCreateAppointment} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                      {isArabic ? 'المريض *' : 'Patient *'}
                    </label>
                    <select
                      required
                      value={apptPatientId}
                      onChange={(e) => setApptPatientId(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-hidden focus:border-primary"
                    >
                      <option value="">{isArabic ? 'اختر مريضاً من العيادة' : 'Select an existing patient'}</option>
                      {bookingOptions?.patients.map((patient) => (
                        <option value={patient.id} key={patient.id}>{patient.name}</option>
                      ))}
                      <option value={NEW_PATIENT}>{isArabic ? '+ إضافة مريض جديد' : '+ New patient'}</option>
                    </select>
                  </div>

                  {apptPatientId === NEW_PATIENT && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                          {isArabic ? 'اسم المريض الجديد *' : 'New Patient Name *'}
                        </label>
                        <input
                          required
                          value={newPatientName}
                          onChange={(e) => setNewPatientName(e.target.value)}
                          placeholder={isArabic ? 'مثال: يوسف أحمد' : 'e.g. John Doe'}
                          className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-hidden focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                          {isArabic ? 'رقم الهاتف' : 'Phone Number'}
                        </label>
                        <input
                          value={newPatientPhone}
                          onChange={(e) => setNewPatientPhone(e.target.value)}
                          placeholder="010XXXXXXXX"
                          dir="ltr"
                          className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-hidden focus:border-primary"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                      {isArabic ? 'الموعد المتاح *' : 'Available Slot *'}
                    </label>
                    <select
                      required
                      value={apptSlotId}
                      onChange={(e) => setApptSlotId(e.target.value)}
                      disabled={availableSlots.length === 0}
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-hidden focus:border-primary disabled:opacity-60"
                    >
                      <option value="">
                        {bookingOptions
                          ? (availableSlots.length
                            ? (isArabic ? 'اختر موعداً متاحاً' : 'Select an available slot')
                            : (isArabic ? 'لا توجد مواعيد متاحة' : 'No available slots'))
                          : (isArabic ? 'جارٍ تحميل المواعيد المتاحة...' : 'Loading available slots...')}
                      </option>
                      {availableSlots.map((slot) => (
                        <option value={slot.id} key={slot.id}>
                          {formatSlotTime(slot.startTime, isArabic ? 'ar-EG' : 'en-US')} · {doctorName(slot.doctorId)} · {serviceName(slot.serviceId)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {bookingOptionsQuery.isError && (
                    <p className="rounded-xl bg-[#fff7f6] p-3 text-xs leading-6 text-[#a64036] dark:bg-[#3d1f1b] dark:text-[#eb9a90]">
                      {isArabic ? 'تعذر تحميل المواعيد المتاحة. حاول مرة أخرى.' : 'Could not load available slots. Please try again.'}
                    </p>
                  )}

                  {noSlotsAvailable && (
                    <p className="rounded-xl bg-[#fffaf0] p-3 text-xs leading-6 text-[#9a6513] dark:bg-[#3a2c14] dark:text-[#e0b46a]">
                      {isArabic ? 'لا توجد مواعيد متاحة — أضف أطباء ومواعيد متاحة من ' : 'No available slots — add doctors and available slots from '}
                      <Link href="/settings" className="font-bold underline underline-offset-2">{isArabic ? 'الإعدادات' : 'Settings'}</Link>
                    </p>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                      {isArabic ? 'ملاحظات الموعد' : 'Appointment Notes'}
                    </label>
                    <textarea
                      rows={2}
                      value={apptNotes}
                      onChange={(e) => setApptNotes(e.target.value)}
                      placeholder={isArabic ? 'ملاحظات إضافية للموعد...' : 'Optional notes for the appointment...'}
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm outline-hidden focus:border-primary"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={bookingPending || availableSlots.length === 0}
                    title={noSlotsAvailable ? (isArabic ? 'لا توجد مواعيد متاحة' : 'No available slots') : undefined}
                    className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-white shadow-md transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {bookingPending
                      ? (isArabic ? 'جارٍ الحجز...' : 'Booking...')
                      : (isArabic ? '✓ تأكيد حجز الموعد' : '✓ Confirm Booking')}
                  </button>
                </form>
              )}

              {/* TAB 2: Quick Patient */}
              {activeTab === 'patient' && (
                <form onSubmit={handleCreatePatient} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                      {isArabic ? 'الاسم الكامل *' : 'Full Name *'}
                    </label>
                    <input
                      required
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder={isArabic ? 'د. مروان سامي' : 'e.g. Alex Morgan'}
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-hidden focus:border-primary"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                        {isArabic ? 'رقم الهاتف *' : 'Phone *'}
                      </label>
                      <input
                        required
                        value={patientPhone}
                        onChange={(e) => setPatientPhone(e.target.value)}
                        placeholder="012XXXXXXXX"
                        dir="ltr"
                        className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-hidden focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                        {isArabic ? 'البريد الإلكتروني' : 'Email'}
                      </label>
                      <input
                        type="email"
                        value={patientEmail}
                        onChange={(e) => setPatientEmail(e.target.value)}
                        placeholder="patient@example.com"
                        dir="ltr"
                        className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-hidden focus:border-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                      {isArabic ? 'ملاحظات طبية / تشخيص مبدئي' : 'Medical Notes'}
                    </label>
                    <textarea
                      rows={2}
                      value={patientNotes}
                      onChange={(e) => setPatientNotes(e.target.value)}
                      placeholder={isArabic ? 'حساسية من البنسلين، مريض سكري...' : 'Any allergies or conditions...'}
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm outline-hidden focus:border-primary"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={createPatientMutation.isPending}
                    className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-white shadow-md transition hover:opacity-90 disabled:opacity-50"
                  >
                    {createPatientMutation.isPending
                      ? (isArabic ? 'جارٍ الحفظ...' : 'Saving...')
                      : (isArabic ? '✓ حفظ ملف المريض' : '✓ Create Patient Profile')}
                  </button>
                </form>
              )}

              {/* TAB 3: Quick Message — غير متاحة بعد */}
              {activeTab === 'message' && (
                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                  <p className="rounded-xl bg-muted/50 p-3 text-xs font-bold text-muted-foreground">
                    {isArabic ? 'هذه الميزة غير متاحة بعد — قريباً' : 'This feature is not available yet — coming soon'}
                  </p>
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                      {isArabic ? 'اسم المريض أو الرقم *' : 'Recipient Name / Phone *'}
                    </label>
                    <input
                      disabled
                      placeholder={isArabic ? 'اسم المريض أو رقمه' : 'Patient name or phone'}
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-hidden focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                      {isArabic ? 'نص الرسالة *' : 'Message Content *'}
                    </label>
                    <textarea
                      disabled
                      rows={3}
                      placeholder={isArabic ? 'مرحباً، نود تذكيرك بموعد الكشف القادم...' : 'Hi, gentle reminder for your upcoming visit...'}
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm outline-hidden focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>

                  <button
                    type="button"
                    disabled
                    title={isArabic ? 'قريباً' : 'Coming soon'}
                    aria-disabled
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-md transition disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Send className="size-4" />
                    <span>{isArabic ? 'إرسال عبر الواتساب' : 'Send via WhatsApp'}</span>
                  </button>
                </form>
              )}

              {/* TAB 4: Quick Task — غير متاحة بعد */}
              {activeTab === 'task' && (
                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                  <p className="rounded-xl bg-muted/50 p-3 text-xs font-bold text-muted-foreground">
                    {isArabic ? 'هذه الميزة غير متاحة بعد — قريباً' : 'This feature is not available yet — coming soon'}
                  </p>
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                      {isArabic ? 'عنوان المهمة *' : 'Task Title *'}
                    </label>
                    <input
                      disabled
                      placeholder={isArabic ? 'مثال: طلب مستلزمات تعقيم إضافية' : 'e.g. Order sterilization supplies'}
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-hidden focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                        {isArabic ? 'الأولوية' : 'Priority'}
                      </label>
                      <select
                        disabled
                        defaultValue="MEDIUM"
                        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-hidden focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <option value="HIGH">{isArabic ? 'عالية' : 'High'}</option>
                        <option value="MEDIUM">{isArabic ? 'متوسطة' : 'Medium'}</option>
                        <option value="LOW">{isArabic ? 'منخفضة' : 'Low'}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                        {isArabic ? 'المسؤول' : 'Assignee'}
                      </label>
                      <input
                        disabled
                        defaultValue={isArabic ? 'موظف الاستقبال' : 'Front Desk'}
                        className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-hidden focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled
                    title={isArabic ? 'قريباً' : 'Coming soon'}
                    aria-disabled
                    className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-white shadow-md transition disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isArabic ? 'إضافة إلى قائمة المهام' : 'Add to Task List'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
