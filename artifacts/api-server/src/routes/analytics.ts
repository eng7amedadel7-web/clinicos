import { Router } from "express";
import { requireClinicPermission } from "../lib/permissions";
import { supabaseRequest } from "../lib/supabase";

const router = Router();

type AppointmentRow = {
  id?: string;
  appointment_status?: string;
  scheduled_at?: string;
  created_at?: string;
};

type ConversationRow = {
  id?: string;
  channel_type?: string;
  mode?: string;
  status?: string;
  created_at?: string;
};

type MessageRow = {
  id?: string;
  created_at?: string;
  direction?: string;
  sender_type?: string;
};

function isoWeekStart(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function dayKey(isoString: string) {
  return isoString.slice(0, 10); // YYYY-MM-DD
}

router.get("/analytics/summary", async (req, res) => {
  let session;
  try {
    session = await requireClinicPermission(req, "Operations", "workspace", "read");
  } catch (error) {
    const statusCode =
      typeof error === "object" && error && "statusCode" in error && typeof error.statusCode === "number"
        ? error.statusCode
        : 500;
    res.status(statusCode).json({ error: error instanceof Error ? error.message : "Unauthorized" });
    return;
  }

  const clinicId = session.clinicId;
  const headers = { Authorization: `Bearer ${session.accessToken}` };
  const clinicFilter = `clinic_id=eq.${encodeURIComponent(clinicId)}&deleted_at=is.null`;

  // Date ranges
  const now = new Date();
  const thisWeekStart = isoWeekStart(now);
  const lastWeekStart = isoWeekStart(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000));
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [appointmentsResult, conversationsResult, messagesResult, patientsResult] = await Promise.all([
    supabaseRequest<AppointmentRow[]>(
      `/rest/v1/appointments?select=id,appointment_status,scheduled_at,created_at&${clinicFilter}&scheduled_at=gte.${encodeURIComponent(lastWeekStart)}&order=scheduled_at.asc&limit=2000`,
      { headers }
    ),
    supabaseRequest<ConversationRow[]>(
      `/rest/v1/inbox_conversations?select=id,channel_type,mode,status,created_at&${clinicFilter}&created_at=gte.${encodeURIComponent(last30Days)}&limit=2000`,
      { headers }
    ),
    supabaseRequest<MessageRow[]>(
      `/rest/v1/inbox_messages?select=id,created_at,direction,sender_type&${clinicFilter}&created_at=gte.${encodeURIComponent(last30Days)}&limit=5000`,
      { headers }
    ),
    supabaseRequest<{ id: string }[]>(
      `/rest/v1/patients?select=id&${clinicFilter}&created_at=gte.${encodeURIComponent(last30Days)}&limit=2000`,
      { headers }
    ),
  ]);

  const appointments = appointmentsResult.ok ? (appointmentsResult.data ?? []) : [];
  const conversations = conversationsResult.ok ? (conversationsResult.data ?? []) : [];
  const messages = messagesResult.ok ? (messagesResult.data ?? []) : [];
  const newPatients = patientsResult.ok ? (patientsResult.data ?? []) : [];

  // Split appointments by week
  const thisWeekAppts = appointments.filter((a) => (a.scheduled_at ?? "") >= thisWeekStart);
  const lastWeekAppts = appointments.filter(
    (a) => (a.scheduled_at ?? "") >= lastWeekStart && (a.scheduled_at ?? "") < thisWeekStart
  );

  // Appointment status breakdown (this week)
  const statusCounts: Record<string, number> = {};
  for (const appt of thisWeekAppts) {
    const s = appt.appointment_status ?? "unknown";
    statusCounts[s] = (statusCounts[s] ?? 0) + 1;
  }

  const totalThisWeek = thisWeekAppts.length;
  const totalLastWeek = lastWeekAppts.length;
  const completedThisWeek = statusCounts["completed"] ?? 0;
  const cancelledThisWeek = statusCounts["cancelled"] ?? 0;
  const noShowThisWeek = statusCounts["no_show"] ?? 0;
  const cancellationRate = totalThisWeek > 0 ? Math.round((cancelledThisWeek / totalThisWeek) * 100) : 0;
  const noShowRate = totalThisWeek > 0 ? Math.round((noShowThisWeek / totalThisWeek) * 100) : 0;
  const completionRate = totalThisWeek > 0 ? Math.round((completedThisWeek / totalThisWeek) * 100) : 0;

  // Daily appointment trend (last 14 days from thisWeekStart backwards)
  const dailyMap: Record<string, { total: number; completed: number; cancelled: number; noShow: number }> = {};
  for (const appt of appointments) {
    const day = dayKey(appt.scheduled_at ?? appt.created_at ?? "");
    if (!day) continue;
    if (!dailyMap[day]) dailyMap[day] = { total: 0, completed: 0, cancelled: 0, noShow: 0 };
    dailyMap[day].total++;
    if (appt.appointment_status === "completed") dailyMap[day].completed++;
    if (appt.appointment_status === "cancelled") dailyMap[day].cancelled++;
    if (appt.appointment_status === "no_show") dailyMap[day].noShow++;
  }
  const dailyTrend = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, counts]) => ({ date, ...counts }));

  // Channel distribution for conversations
  const channelMap: Record<string, number> = {};
  for (const conv of conversations) {
    const ch = conv.channel_type ?? "unknown";
    channelMap[ch] = (channelMap[ch] ?? 0) + 1;
  }
  const channelDistribution = Object.entries(channelMap).map(([channel, count]) => ({ channel, count }));

  // AI vs Human breakdown
  const aiConvs = conversations.filter((c) => c.mode === "AI").length;
  const humanConvs = conversations.filter((c) => c.mode === "Human").length;

  // Messages stats
  const inboundMessages = messages.filter((m) => m.direction === "incoming").length;
  const outboundMessages = messages.filter((m) => m.direction === "outgoing").length;
  const aiMessages = messages.filter((m) => m.sender_type === "ai").length;
  const staffMessages = messages.filter((m) => m.sender_type === "staff").length;

  // Week-over-week change
  const weekOverWeekChange =
    totalLastWeek > 0 ? Math.round(((totalThisWeek - totalLastWeek) / totalLastWeek) * 100) : null;

  res.json({
    appointments: {
      thisWeek: totalThisWeek,
      lastWeek: totalLastWeek,
      weekOverWeekChange,
      completed: completedThisWeek,
      cancelled: cancelledThisWeek,
      noShow: noShowThisWeek,
      cancellationRate,
      noShowRate,
      completionRate,
      statusBreakdown: Object.entries(statusCounts).map(([status, count]) => ({ status, count })),
      dailyTrend,
    },
    inbox: {
      totalConversations: conversations.length,
      aiConversations: aiConvs,
      humanConversations: humanConvs,
      totalMessages: messages.length,
      inboundMessages,
      outboundMessages,
      aiMessages,
      staffMessages,
      channelDistribution,
    },
    patients: {
      newThisMonth: newPatients.length,
    },
  });
});

export default router;
