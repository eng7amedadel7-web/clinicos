export type AnalyticsSummary = {
  appointments: {
    thisWeek: number;
    lastWeek: number;
    weekOverWeekChange: number | null;
    completed: number;
    cancelled: number;
    noShow: number;
    cancellationRate: number;
    noShowRate: number;
    completionRate: number;
    statusBreakdown: { status: string; count: number }[];
    dailyTrend: { date: string; total: number; completed: number; cancelled: number; noShow: number }[];
  };
  inbox: {
    totalConversations: number;
    aiConversations: number;
    humanConversations: number;
    totalMessages: number;
    inboundMessages: number;
    outboundMessages: number;
    aiMessages: number;
    staffMessages: number;
    channelDistribution: { channel: string; count: number }[];
  };
  patients: {
    newThisMonth: number;
  };
};

export async function getAnalyticsSummary(signal?: AbortSignal): Promise<AnalyticsSummary> {
  const response = await fetch("/api/analytics/summary", { credentials: "include", signal });
  const payload = (await response.json().catch(() => null)) as AnalyticsSummary | { error?: string } | null;
  if (!response.ok) {
    throw new Error(
      payload && "error" in payload && typeof payload.error === "string"
        ? payload.error
        : "تعذر تحميل بيانات التقارير."
    );
  }
  return payload as AnalyticsSummary;
}
