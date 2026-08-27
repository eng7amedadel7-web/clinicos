export function ConversationListSkeleton() {
  return (
    <div className="space-y-3 p-3 animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-2xl border border-border/50 bg-card/40 p-3">
          <div className="size-11 shrink-0 rounded-2xl bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-24 rounded-md bg-muted" />
              <div className="h-2.5 w-10 rounded-md bg-muted" />
            </div>
            <div className="h-2.5 w-3/4 rounded-md bg-muted/60" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AppointmentGridSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 animate-pulse">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-3xl border border-border/50 bg-card/50 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-3 w-16 rounded-md bg-muted" />
            <div className="h-5 w-14 rounded-full bg-muted" />
          </div>
          <div className="h-4 w-32 rounded-md bg-muted" />
          <div className="h-3 w-24 rounded-md bg-muted/70" />
          <div className="h-8 w-full rounded-xl bg-muted/40" />
        </div>
      ))}
    </div>
  );
}

export function PatientCardsSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between rounded-2xl border border-border/50 bg-card/50 p-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-muted" />
            <div className="space-y-1.5">
              <div className="h-3.5 w-28 rounded-md bg-muted" />
              <div className="h-2.5 w-20 rounded-md bg-muted/70" />
            </div>
          </div>
          <div className="h-6 w-20 rounded-lg bg-muted" />
        </div>
      ))}
    </div>
  );
}

export function AnalyticsChartSkeleton() {
  return (
    <div className="rounded-3xl border border-border/50 bg-card/50 p-6 space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-4 w-36 rounded-md bg-muted" />
        <div className="h-4 w-16 rounded-md bg-muted" />
      </div>
      <div className="h-52 w-full rounded-2xl bg-muted/30 flex items-end justify-between p-4 gap-2">
        {[40, 75, 55, 90, 60, 85, 70].map((h, i) => (
          <div key={i} className="w-full rounded-t-lg bg-muted/60" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  );
}
