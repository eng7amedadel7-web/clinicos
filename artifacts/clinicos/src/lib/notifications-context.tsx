import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { useSoundNotification, type SoundType } from "@/hooks/use-sound-notification";
import { usePreferences } from "@/lib/preferences";

export type ClinicAlert = {
  id: string;
  type: "handoff" | "message" | "appointment" | "queue";
  title: string;
  description: string;
  time: string;
  link?: string;
  read: boolean;
};

type NotificationsContextType = {
  isMuted: boolean;
  toggleMute: () => void;
  playChime: (type?: SoundType) => void;
  unreadHandoffs: number;
  unreadMessages: number;
  recentAlerts: ClinicAlert[];
  markAllAsRead: () => void;
  clearAlerts: () => void;
};

const NotificationsContext = createContext<NotificationsContextType | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  const { language } = usePreferences();
  const en = language === "en";
  const { isMuted, toggleMute, playChime } = useSoundNotification();

  const [unreadHandoffs, setUnreadHandoffs] = useState<number>(0);
  const [unreadMessages, setUnreadMessages] = useState<number>(0);
  const [recentAlerts, setRecentAlerts] = useState<ClinicAlert[]>([]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof EventSource === "undefined") return;

    const source = new EventSource("/api/inbox/stream", { withCredentials: true });

    source.addEventListener("inbox.handoff_requested", (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data) as {
          patientName?: string;
          content?: string;
          conversationId?: string;
        };
        const patientName = payload.patientName || (en ? "Patient" : "مريض");
        const content = payload.content || "";

        playChime("handoff");
        setUnreadHandoffs((prev) => prev + 1);

        const newAlert: ClinicAlert = {
          id: crypto.randomUUID(),
          type: "handoff",
          title: en ? `AI Handoff: ${patientName}` : `طلب تدخل بشري: ${patientName}`,
          description: content.slice(0, 100) || (en ? "Patient requested human assistance." : "المريض طلب التحدث مع موظف بشري."),
          time: new Date().toLocaleTimeString(en ? "en-US" : "ar-SA", { hour: "2-digit", minute: "2-digit" }),
          link: payload.conversationId ? `/inbox?conversationId=${payload.conversationId}` : "/inbox",
          read: false,
        };

        setRecentAlerts((prev) => [newAlert, ...prev.slice(0, 19)]);

        toast.warning(newAlert.title, {
          description: newAlert.description,
          action: payload.conversationId
            ? {
                label: en ? "Open" : "فتح المحادثة",
                onClick: () => setLocation(`/inbox?conversationId=${payload.conversationId}`),
              }
            : undefined,
          duration: 7000,
        });
      } catch (err) {
        console.error("[Notifications] Error handling handoff event", err);
      }
    });

    source.addEventListener("inbox.message_received", (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data) as {
          patientName?: string;
          content?: string;
          conversationId?: string;
        };
        const patientName = payload.patientName || (en ? "Patient" : "مريض");
        const content = payload.content || "";

        playChime("message");
        setUnreadMessages((prev) => prev + 1);

        const newAlert: ClinicAlert = {
          id: crypto.randomUUID(),
          type: "message",
          title: en ? `New Message: ${patientName}` : `رسالة جديدة: ${patientName}`,
          description: content.slice(0, 100),
          time: new Date().toLocaleTimeString(en ? "en-US" : "ar-SA", { hour: "2-digit", minute: "2-digit" }),
          link: payload.conversationId ? `/inbox?conversationId=${payload.conversationId}` : "/inbox",
          read: false,
        };

        setRecentAlerts((prev) => [newAlert, ...prev.slice(0, 19)]);

        toast.info(newAlert.title, {
          description: newAlert.description,
          action: payload.conversationId
            ? {
                label: en ? "Reply" : "رد الآن",
                onClick: () => setLocation(`/inbox?conversationId=${payload.conversationId}`),
              }
            : undefined,
          duration: 5000,
        });
      } catch (err) {
        console.error("[Notifications] Error handling message event", err);
      }
    });

    source.addEventListener("appointment.booked", (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data) as {
          appointmentId?: string;
          scheduledAt?: string;
        };

        playChime("appointment");

        const newAlert: ClinicAlert = {
          id: crypto.randomUUID(),
          type: "appointment",
          title: en ? "New Appointment Booked" : "تم حجز موعد جديد",
          description: en ? "A new appointment was registered in the clinic schedule." : "تم تسجيل موعد جديد بنجاح في جدول العيادة.",
          time: new Date().toLocaleTimeString(en ? "en-US" : "ar-SA", { hour: "2-digit", minute: "2-digit" }),
          link: payload.appointmentId ? `/appointments/${payload.appointmentId}` : "/appointments",
          read: false,
        };

        setRecentAlerts((prev) => [newAlert, ...prev.slice(0, 19)]);

        toast.success(newAlert.title, {
          description: newAlert.description,
          action: payload.appointmentId
            ? {
                label: en ? "View" : "عرض",
                onClick: () => setLocation(`/appointments/${payload.appointmentId}`),
              }
            : undefined,
        });
      } catch (err) {
        console.error("[Notifications] Error handling appointment event", err);
      }
    });

    return () => {
      source.close();
    };
  }, [en, playChime, setLocation]);

  const markAllAsRead = () => {
    setUnreadHandoffs(0);
    setUnreadMessages(0);
    setRecentAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
  };

  const clearAlerts = () => {
    setUnreadHandoffs(0);
    setUnreadMessages(0);
    setRecentAlerts([]);
  };

  return (
    <NotificationsContext.Provider
      value={{
        isMuted,
        toggleMute,
        playChime,
        unreadHandoffs,
        unreadMessages,
        recentAlerts,
        markAllAsRead,
        clearAlerts,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useClinicNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error("useClinicNotifications must be used within a NotificationsProvider");
  }
  return context;
}
