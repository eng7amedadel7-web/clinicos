import { Printer, QrCode, X } from "lucide-react";
import { BrandMark } from "@/components/brand";

type AppointmentSlipProps = {
  open: boolean;
  onClose: () => void;
  bookingNumber?: string | null;
  patientName?: string;
  patientPhone?: string;
  scheduledAt?: string;
  serviceName?: string;
  doctorName?: string;
  clinicName?: string;
  status?: string;
  en?: boolean;
};

export function AppointmentSlipModal({
  open,
  onClose,
  bookingNumber,
  patientName,
  patientPhone,
  scheduledAt,
  serviceName,
  doctorName,
  clinicName = "MERUNA Clinic",
  status = "confirmed",
  en = false,
}: AppointmentSlipProps) {
  if (!open) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = scheduledAt
    ? new Intl.DateTimeFormat(en ? "en-US" : "ar-EG", {
        dateStyle: "full",
        timeStyle: "short",
      }).format(new Date(scheduledAt))
    : "—";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 print:p-0 print:bg-white print:static"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl text-slate-900 border border-slate-200 print:border-none print:shadow-none print:max-w-none print:w-full"
        dir={en ? "ltr" : "rtl"}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Screen only */}
        <div className="flex items-center justify-between border-b pb-3 mb-4 print:hidden">
          <span className="text-xs font-bold text-slate-600">
            {en ? "Printable Appointment Slip" : "تذكرة الموعد للطباعة"}
          </span>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700"
            aria-label={en ? "Close" : "إغلاق"}
          >
            <X size={16} />
          </button>
        </div>

        {/* Printable Card Area */}
        <div className="space-y-4 print:space-y-3" id="printable-slip">
          {/* Clinic Brand */}
          <div className="text-center pb-3 border-b border-dashed border-slate-300">
            <div className="flex justify-center mb-1">
              <BrandMark size={28} />
            </div>
            <h2 className="text-sm font-extrabold tracking-wide uppercase text-slate-900">{clinicName}</h2>
            <p className="text-[10px] text-slate-500">{en ? "Appointment Confirmation Slip" : "إشعار تأكيد الموعد"}</p>
          </div>

          {/* Booking Number Banner */}
          <div className="rounded-lg bg-slate-100 p-2.5 text-center">
            <p className="text-[10px] font-semibold text-slate-500">{en ? "Booking Number" : "رقم الحجز"}</p>
            <p className="text-lg font-mono font-black text-slate-900 tracking-wider">
              {bookingNumber || "MRN-" + Math.floor(100000 + Math.random() * 900000)}
            </p>
          </div>

          {/* Details Table */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">{en ? "Patient Name" : "اسم المريض"}</span>
              <strong className="text-slate-900">{patientName || (en ? "Patient" : "مريض")}</strong>
            </div>

            {patientPhone && (
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">{en ? "Phone" : "رقم الجوال"}</span>
                <span className="font-mono text-slate-700" dir="ltr">{patientPhone}</span>
              </div>
            )}

            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">{en ? "Date & Time" : "التاريخ والوقت"}</span>
              <strong className="text-slate-900">{formattedDate}</strong>
            </div>

            {doctorName && (
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">{en ? "Doctor" : "الطبيب المعالج"}</span>
                <span className="text-slate-800">{doctorName}</span>
              </div>
            )}

            {serviceName && (
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">{en ? "Service" : "الخدمة"}</span>
                <span className="text-slate-800">{serviceName}</span>
              </div>
            )}

            <div className="flex justify-between py-1">
              <span className="text-slate-500">{en ? "Status" : "حالة الموعد"}</span>
              <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 uppercase">
                {status}
              </span>
            </div>
          </div>

          {/* Simulated Barcode */}
          <div className="pt-3 border-t border-dashed border-slate-300 text-center">
            <div className="flex justify-center items-center gap-1 h-8 opacity-80">
              {[2, 4, 1, 3, 2, 5, 1, 4, 2, 3, 5, 2, 1, 4, 3, 2, 1, 5, 2, 3, 4, 1, 2].map((w, i) => (
                <div
                  key={i}
                  className="bg-slate-900 h-full"
                  style={{ width: `${w}px` }}
                />
              ))}
            </div>
            <p className="mt-1 font-mono text-[9px] text-slate-400 tracking-widest">
              *{bookingNumber || "CLINIC-APP"}*
            </p>
          </div>

          {/* Footer Notice */}
          <p className="text-[9px] text-center text-slate-400 leading-normal pt-1">
            {en
              ? "Please arrive 10 minutes prior to your appointment time. Thank you for choosing us."
              : "يرجى التواجد قبل الموعد بـ 10 دقائق. نتمنى لكم دوام الصحة والعافية."}
          </p>
        </div>

        {/* Action Buttons - Screen only */}
        <div className="mt-5 flex gap-2 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
          >
            {en ? "Close" : "إغلاق"}
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2 text-xs font-bold text-white hover:bg-slate-800 transition"
            data-testid="button-print-slip"
          >
            <Printer size={14} />
            {en ? "Print Slip" : "طباعة التذكرة"}
          </button>
        </div>
      </div>
    </div>
  );
}
