import { useState } from 'react';
import { Plus, X, CalendarDays, UserRound, MessageSquare, CheckSquare, Sparkles, Send } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { usePreferences } from '@/lib/preferences';
import { getGetDashboardSummaryQueryKey } from '@workspace/api-client-react';

type QuickAddTab = 'appointment' | 'patient' | 'message' | 'task';

export function QuickAddModal() {
  const { language } = usePreferences();
  const isArabic = language === 'ar';
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<QuickAddTab>('appointment');

  // Form states
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [doctorName, setDoctorName] = useState('طبيب عام');
  const [apptDate, setApptDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [apptTime, setApptTime] = useState('17:00');
  const [notes, setNotes] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('MEDIUM');

  const createPatientMutation = useMutation({
    mutationFn: async (payload: { fullName: string; phoneNumber: string; age?: number; gender: string; notes?: string }) => {
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
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
      toast.success(isArabic ? 'تم حفظ ملف المريض بنجاح' : 'Patient created successfully');
      resetForm();
      setIsOpen(false);
    },
    onError: (err: any) => {
      toast.error(err?.message || (isArabic ? 'فشل حفظ المريض' : 'Failed to save patient'));
    }
  });

  const createAppointmentMutation = useMutation({
    mutationFn: async (payload: { patientName: string; patientPhone?: string; doctorName?: string; startAt: string; notes?: string }) => {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
      toast.success(isArabic ? 'تم حجز الموعد وتأكيده بنجاح' : 'Appointment booked successfully');
      resetForm();
      setIsOpen(false);
    },
    onError: (err: any) => {
      toast.error(err?.message || (isArabic ? 'فشل حجز الموعد' : 'Failed to book appointment'));
    }
  });

  const resetForm = () => {
    setPatientName('');
    setPatientPhone('');
    setPatientAge('');
    setNotes('');
    setTaskTitle('');
  };

  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) return;

    createAppointmentMutation.mutate({
      patientName: patientName.trim(),
      patientPhone: patientPhone.trim() || undefined,
      doctorName: doctorName.trim() || undefined,
      startAt: `${apptDate}T${apptTime}:00Z`,
      notes: notes.trim() || undefined,
    });
  };

  const handleCreatePatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) return;

    createPatientMutation.mutate({
      fullName: patientName.trim(),
      phoneNumber: patientPhone.trim() || '01000000000',
      age: patientAge ? parseInt(patientAge, 10) : undefined,
      gender: patientGender,
      notes: notes.trim() || undefined
    });
  };

  const handleCreateMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim() || !notes.trim()) return;
    toast.success(isArabic ? `تم إرسال الرسالة إلى ${patientName} عبر الواتساب` : `Message sent to ${patientName} via WhatsApp`);
    resetForm();
    setIsOpen(false);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    toast.success(isArabic ? 'تمت إضافة المهمة إلى قائمة مهام العيادة' : 'Task added to clinic queue');
    resetForm();
    setIsOpen(false);
  };

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
                      {isArabic ? 'اسم المريض *' : 'Patient Name *'}
                    </label>
                    <input
                      required
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder={isArabic ? 'مثال: يوسف أحمد' : 'e.g. John Doe'}
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-hidden focus:border-primary"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                        {isArabic ? 'رقم الهاتف' : 'Phone Number'}
                      </label>
                      <input
                        value={patientPhone}
                        onChange={(e) => setPatientPhone(e.target.value)}
                        placeholder="010XXXXXXXX"
                        className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-hidden focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                        {isArabic ? 'الطبيب المعالج' : 'Doctor'}
                      </label>
                      <select
                        value={doctorName}
                        onChange={(e) => setDoctorName(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-hidden focus:border-primary"
                      >
                        <option value="طبيب عام">{isArabic ? 'طبيب 1 (كشف عام)' : 'General Physician 1'}</option>
                        <option value="طبيب استشاري">{isArabic ? 'طبيب 2 (استشاري)' : 'Specialist Physician 2'}</option>
                        <option value="طبيب جراحة">{isArabic ? 'طبيب 3 (جراحة)' : 'Surgeon 3'}</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                        {isArabic ? 'التاريخ' : 'Date'}
                      </label>
                      <input
                        type="date"
                        value={apptDate}
                        onChange={(e) => setApptDate(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-hidden focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                        {isArabic ? 'الوقت' : 'Time'}
                      </label>
                      <input
                        type="time"
                        value={apptTime}
                        onChange={(e) => setApptTime(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-hidden focus:border-primary"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={createAppointmentMutation.isPending}
                    className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-white shadow-md transition hover:opacity-90 disabled:opacity-50"
                  >
                    {createAppointmentMutation.isPending
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

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                        {isArabic ? 'رقم الهاتف *' : 'Phone *'}
                      </label>
                      <input
                        required
                        value={patientPhone}
                        onChange={(e) => setPatientPhone(e.target.value)}
                        placeholder="012XXXXXXXX"
                        className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-hidden focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                        {isArabic ? 'العمر' : 'Age'}
                      </label>
                      <input
                        type="number"
                        value={patientAge}
                        onChange={(e) => setPatientAge(e.target.value)}
                        placeholder="32"
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
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
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

              {/* TAB 3: Quick Message */}
              {activeTab === 'message' && (
                <form onSubmit={handleCreateMessage} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                      {isArabic ? 'اسم المريض أو الرقم *' : 'Recipient Name / Phone *'}
                    </label>
                    <input
                      required
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder={isArabic ? 'اسم المريض أو رقمه' : 'Patient name or phone'}
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-hidden focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                      {isArabic ? 'نص الرسالة *' : 'Message Content *'}
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={isArabic ? 'مرحباً، نود تذكيرك بموعد الكشف القادم...' : 'Hi, gentle reminder for your upcoming visit...'}
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm outline-hidden focus:border-primary"
                    />
                  </div>

                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-md transition hover:bg-emerald-700"
                  >
                    <Send className="size-4" />
                    <span>{isArabic ? 'إرسال عبر الواتساب فوراً' : 'Send via WhatsApp'}</span>
                  </button>
                </form>
              )}

              {/* TAB 4: Quick Task */}
              {activeTab === 'task' && (
                <form onSubmit={handleCreateTask} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                      {isArabic ? 'عنوان المهمة *' : 'Task Title *'}
                    </label>
                    <input
                      required
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      placeholder={isArabic ? 'مثال: طلب مستلزمات تعقيم إضافية' : 'e.g. Order sterilization supplies'}
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-hidden focus:border-primary"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                        {isArabic ? 'الأولوية' : 'Priority'}
                      </label>
                      <select
                        value={taskPriority}
                        onChange={(e: any) => setTaskPriority(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-hidden focus:border-primary"
                      >
                        <option value="HIGH">{isArabic ? 'عالية 🔴' : 'High 🔴'}</option>
                        <option value="MEDIUM">{isArabic ? 'متوسطة 🟡' : 'Medium 🟡'}</option>
                        <option value="LOW">{isArabic ? 'منخفضة 🟢' : 'Low 🟢'}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                        {isArabic ? 'المسؤول' : 'Assignee'}
                      </label>
                      <input
                        defaultValue={isArabic ? 'موظف الاستقبال' : 'Front Desk'}
                        className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-hidden focus:border-primary"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-white shadow-md transition hover:opacity-90"
                  >
                    {isArabic ? '✓ إضافة إلى قائمة المهام' : '✓ Add to Task List'}
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
