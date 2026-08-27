import { useEffect, useState } from "react";
import { CheckCircle2, Wifi, WifiOff } from "lucide-react";
import { usePreferences } from "@/lib/preferences";

export function NetworkStatusBanner() {
  const { language } = usePreferences();
  const en = language === "en";

  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== "undefined" && typeof navigator.onLine === "boolean"
      ? navigator.onLine
      : true
  );
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      const timer = window.setTimeout(() => setShowReconnected(false), 4000);
      return () => window.clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline && !showReconnected) return null;

  return (
    <div
      className={`fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-2xl px-4 py-2.5 shadow-xl text-xs font-bold transition-all animate-rise ${
        !isOnline
          ? "bg-[#3d1f1b] text-[#eb9a90] border border-[#5a2a25]"
          : "bg-[#123528] text-[#7fd0b4] border border-[#1d4a35]"
      }`}
      dir="rtl"
      role="status"
    >
      {!isOnline ? (
        <>
          <WifiOff className="size-4 animate-pulse shrink-0" />
          <span>
            {en
              ? "You are currently offline. Viewing cached clinic data."
              : "أنت في وضع عدم الاتصال. يتم عرض البيانات من الذاكرة المؤقتة."}
          </span>
        </>
      ) : (
        <>
          <CheckCircle2 className="size-4 shrink-0" />
          <span>
            {en ? "Connection restored. Live sync active." : "تم استعادة الاتصال. المزامنة الحية تعمل الآن."}
          </span>
        </>
      )}
    </div>
  );
}
