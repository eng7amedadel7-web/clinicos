import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle, Check, ChevronLeft, Clock3, Filter, Inbox,
  MessageSquare, RefreshCw, Sparkles, UserRound, X, Zap
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";
import { usePreferences } from "@/lib/preferences";
import { getOperationsList, runOperationsAction, type OperationsItem } from "@/lib/operations-api";
import { WorkspacePage, WorkspacePageHeader } from "@/components/workspace-page";

type TaskType = "follow_up" | "no_show" | "conversation" | "waitlist";
type Priority = "high" | "medium" | "low";

type Task = {
  id: string;
  type: TaskType;
  patientName: string;
  description: string;
  dueAt: string | null;
  priority: Priority;
  status: string;
  actionUrl: string;
  operationId?: string;
};

function displayPatient(item: OperationsItem, en?: boolean) {
  if (item.patientName) return item.patientName;
  const p = item.patient;
  return p?.name || [p?.first_name, p?.last_name].filter(Boolean).join(" ") || (en ? "Unnamed patient" : "مريض بدون اسم");
}

function dateLabel(value: unknown, en?: boolean) {
  if (typeof value !== "string" || !value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffHours = Math.round(diffMs / 3_600_000);
  if (Math.abs(diffHours) < 24) {
    if (diffHours < 0) return en ? `${Math.abs(diffHours)}h overdue` : `متأخر ${Math.abs(diffHours)} ساعة`;
    if (diffHours === 0) return en ? "Due now" : "مستحق الآن";
    return en ? `In ${diffHours}h` : `خلال ${diffHours} ساعة`;
  }
  return new Intl.DateTimeFormat(en ? "en-US" : "ar-EG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(d);
}

function priorityColor(p: Priority) {
  if (p === "high") return "bg-[#f8dfdc] text-[#a64036] dark:bg-[#3d1f1b] dark:text-[#eb9a90]";
  if (p === "medium") return "bg-[#fff0d8] text-[#9a6513] dark:bg-[#3a2c14] dark:text-[#e0b46a]";
  return "bg-[#dcecf5] text-[#22617d] dark:bg-[#143242] dark:text-[#8cc3dd]";
}

function priorityLabel(p: Priority, en: boolean) {
  const labels: Record<Priority, [string, string]> = { high: ["عالية", "High"], medium: ["متوسطة", "Medium"], low: ["منخفضة", "Low"] };
  return en ? labels[p][1] : labels[p][0];
}

function typeIcon(type: TaskType) {
  if (type === "follow_up") return <Sparkles size={15} className="text-[#347b98] dark:text-[#8cc3dd]" />;
  if (type === "no_show") return <AlertTriangle size={15} className="text-[#a64036] dark:text-[#eb9a90]" />;
  if (type === "conversation") return <MessageSquare size={15} className="text-[#7568a0] dark:text-[#bcaede]" />;
  return <Clock3 size={15} className="text-[#9a6513] dark:text-[#e0b46a]" />;
}

function typeLabel(type: TaskType, en: boolean) {
  const labels: Record<TaskType, [string, string]> = {
    follow_up: ["متابعة", "Follow-up"],
    no_show: ["عدم حضور", "No-show"],
    conversation: ["محادثة", "Conversation"],
    waitlist: ["قائمة انتظار", "Waitlist"],
  };
  return en ? labels[type][1] : labels[type][0];
}

function buildTasks(
  followUps: OperationsItem[],
  noShows: OperationsItem[],
  waitlist: OperationsItem[],
  en: boolean,
): Task[] {
  const tasks: Task[] = [];

  for (const item of followUps) {
    tasks.push({
      id: `fu-${String(item.id)}`,
      operationId: String(item.id),
      type: "follow_up",
      patientName: displayPatient(item, en),
      description: typeof item.followup_goal === "string" && item.followup_goal ? item.followup_goal : (en ? "Follow-up due" : "متابعة مستحقة"),
      dueAt: typeof item.next_due_at === "string" ? item.next_due_at : null,
      priority: "medium",
      status: typeof item.status === "string" ? item.status : "pending",
      actionUrl: "/follow-ups",
    });
  }

  for (const item of noShows) {
    const risk = typeof item.risk_level === "string" ? item.risk_level : "low";
    tasks.push({
      id: `ns-${String(item.id)}`,
      operationId: String(item.id),
      type: "no_show",
      patientName: displayPatient(item, en),
      description: en ? `Risk: ${risk}` : `مستوى الخطر: ${risk}`,
      dueAt: typeof item.last_activity_at === "string" ? item.last_activity_at : null,
      priority: risk === "high" ? "high" : risk === "medium" ? "medium" : "low",
      status: typeof item.case_status === "string" ? item.case_status : "open",
      actionUrl: "/no-shows",
    });
  }

  for (const item of waitlist) {
    const priority = typeof item.priority === "number" ? (item.priority <= 2 ? "high" : item.priority <= 5 ? "medium" : "low") : "low";
    tasks.push({
      id: `wl-${String(item.id)}`,
      operationId: String(item.id),
      type: "waitlist",
      patientName: displayPatient(item, en),
      description: en ? "Waiting for available slot" : "بانتظار موعد متاح",
      dueAt: typeof item.created_at === "string" ? item.created_at : null,
      priority: priority as Priority,
      status: typeof item.status === "string" ? item.status : "active",
      actionUrl: "/waitlist",
    });
  }

  // Sort: high priority first, then by due date
  return tasks.sort((a, b) => {
    const pOrder = { high: 0, medium: 1, low: 2 };
    const pDiff = pOrder[a.priority] - pOrder[b.priority];
    if (pDiff !== 0) return pDiff;
    if (a.dueAt && b.dueAt) return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
    return 0;
  });
}

export default function TasksPage() {
  const queryClient = useQueryClient();
  const { language, selectedBranchId } = usePreferences();
  const en = language === "en";

  const [typeFilter, setTypeFilter] = useState<TaskType | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "all">("all");

  const followUpsQuery = useQuery({
    queryKey: ["operations", "follow-ups", selectedBranchId],
    queryFn: ({ signal }) => getOperationsList("follow-ups", signal, selectedBranchId === "all" ? undefined : selectedBranchId),
    staleTime: 15_000, refetchInterval: 60_000, refetchIntervalInBackground: false,
  });
  const noShowsQuery = useQuery({
    queryKey: ["operations", "no-shows", selectedBranchId],
    queryFn: ({ signal }) => getOperationsList("no-shows", signal, selectedBranchId === "all" ? undefined : selectedBranchId),
    staleTime: 15_000, refetchInterval: 60_000, refetchIntervalInBackground: false,
  });
  const waitlistQuery = useQuery({
    queryKey: ["operations", "waitlist", selectedBranchId],
    queryFn: ({ signal }) => getOperationsList("waitlist", signal, selectedBranchId === "all" ? undefined : selectedBranchId),
    staleTime: 15_000, refetchInterval: 60_000, refetchIntervalInBackground: false,
  });

  const followUpAction = useMutation({
    mutationFn: (id: string) => runOperationsAction(`/api/operations/follow-ups/${encodeURIComponent(id)}/decision`, { outcome: "completed_by_staff", stopFollowup: true, needsHandoff: false }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["operations", "follow-ups"] }),
  });
  const noShowAction = useMutation({
    mutationFn: (id: string) => runOperationsAction(`/api/operations/no-shows/${encodeURIComponent(id)}/close`, { outcome: "closed_by_staff", reason: "تمت المراجعة من فريق العيادة" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["operations", "no-shows"] }),
  });
  const waitlistAction = useMutation({
    mutationFn: (id: string) => runOperationsAction(`/api/operations/waitlist/${encodeURIComponent(id)}/cancel`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["operations", "waitlist"] }),
  });

  const isLoading = followUpsQuery.isLoading || noShowsQuery.isLoading || waitlistQuery.isLoading;
  const isError = followUpsQuery.isError && noShowsQuery.isError && waitlistQuery.isError;

  const allTasks = useMemo(() => buildTasks(
    followUpsQuery.data?.items ?? [],
    noShowsQuery.data?.items ?? [],
    waitlistQuery.data?.items ?? [],
    en,
  ), [followUpsQuery.data, noShowsQuery.data, waitlistQuery.data, en]);

  const filtered = useMemo(() => allTasks.filter((task) => {
    if (typeFilter !== "all" && task.type !== typeFilter) return false;
    if (priorityFilter !== "all" && task.priority !== priorityFilter) return false;
    return true;
  }), [allTasks, typeFilter, priorityFilter]);

  const highCount = allTasks.filter(t => t.priority === "high").length;

  const handleComplete = (task: Task) => {
    if (!task.operationId) return;
    if (task.type === "follow_up") {
      followUpAction.mutate(task.operationId, { onSuccess: () => toast.success(en ? "Follow-up marked complete" : "تم إغلاق المتابعة") });
    } else if (task.type === "no_show") {
      noShowAction.mutate(task.operationId, { onSuccess: () => toast.success(en ? "No-show case closed" : "تم إغلاق حالة عدم الحضور") });
    } else if (task.type === "waitlist") {
      if (window.confirm(en ? "Cancel this waitlist request?" : "إلغاء طلب الانتظار؟")) {
        waitlistAction.mutate(task.operationId, { onSuccess: () => toast.success(en ? "Waitlist request cancelled" : "تم إلغاء طلب الانتظار") });
      }
    }
  };

  const refetchAll = () => { followUpsQuery.refetch(); noShowsQuery.refetch(); waitlistQuery.refetch(); };

  const typeOptions: Array<{ value: TaskType | "all"; label: string }> = [
    { value: "all", label: en ? "All types" : "كل الأنواع" },
    { value: "follow_up", label: en ? "Follow-ups" : "المتابعات" },
    { value: "no_show", label: en ? "No-shows" : "عدم الحضور" },
    { value: "waitlist", label: en ? "Waitlist" : "قائمة الانتظار" },
    { value: "conversation", label: en ? "Conversations" : "المحادثات" },
  ];

  const priorityOptions: Array<{ value: Priority | "all"; label: string }> = [
    { value: "all", label: en ? "All priorities" : "كل الأولويات" },
    { value: "high", label: en ? "High" : "عالية" },
    { value: "medium", label: en ? "Medium" : "متوسطة" },
    { value: "low", label: en ? "Low" : "منخفضة" },
  ];

  return (
    <WorkspacePage>
      <WorkspacePageHeader
        eyebrow={en ? "Operations / Tasks" : "التشغيل / المهام"}
        title={en ? "Team Tasks" : "مهام الفريق"}
        description={isLoading
          ? (en ? "Loading tasks from all operations..." : "جارٍ تحميل المهام من كل العمليات...")
          : `${allTasks.length} ${en ? "tasks" : "مهمة"}${highCount > 0 ? ` · ${highCount} ${en ? "high priority" : "أولوية عالية"}` : ""}`}
        action={
          <button className="quiet-button" onClick={refetchAll} disabled={isLoading} data-testid="button-refresh-tasks">
            <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
            {en ? "Refresh" : "تحديث"}
          </button>
        }
      />

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Filter size={15} className="shrink-0 text-[#8496a0] dark:text-[#7e939e]" />
        {typeOptions.map(opt => (
          <button
            key={opt.value}
            onClick={() => setTypeFilter(opt.value)}
            className={`rounded-full border px-3 py-1.5 text-[11px] font-bold transition ${typeFilter === opt.value
              ? "border-[#9fc0ca] bg-[#e6f4ee] text-[#2c7a5d] dark:border-[#1e3a4d] dark:bg-[#123528] dark:text-[#7fd0b4]"
              : "border-[#dbe5ea] bg-white text-[#66808e] hover:border-[#9fc0ca] dark:border-[#1e3a4d] dark:bg-[#122434] dark:text-[#7e939e]"}`}
            data-testid={`filter-type-${opt.value}`}
          >
            {opt.label}
          </button>
        ))}
        <span className="mx-1 h-4 w-px bg-[#dbe5ea] dark:bg-[#1e3a4d]" />
        {priorityOptions.map(opt => (
          <button
            key={opt.value}
            onClick={() => setPriorityFilter(opt.value)}
            className={`rounded-full border px-3 py-1.5 text-[11px] font-bold transition ${priorityFilter === opt.value
              ? "border-[#d08327] bg-[#fff0d8] text-[#9a6513] dark:border-[#4a3a1a] dark:bg-[#3a2c14] dark:text-[#e0b46a]"
              : "border-[#dbe5ea] bg-white text-[#66808e] hover:border-[#d08327] dark:border-[#1e3a4d] dark:bg-[#122434] dark:text-[#7e939e]"}`}
            data-testid={`filter-priority-${opt.value}`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)}
        </div>
      )}

      {/* Error */}
      {!isLoading && isError && (
        <div className="surface flex flex-col items-center justify-center py-16 text-center">
          <AlertTriangle size={28} className="mb-3 text-[#a64036] dark:text-[#eb9a90]" />
          <p className="text-sm font-bold text-[#527080] dark:text-[#a8bfc9]">{en ? "Could not load tasks" : "تعذر تحميل المهام"}</p>
          <button className="primary-button mt-4" onClick={refetchAll}>
            <RefreshCw size={15} /> {en ? "Retry" : "إعادة المحاولة"}
          </button>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !isError && filtered.length === 0 && (
        <div className="surface flex flex-col items-center justify-center py-16 text-center">
          <Zap size={28} className="mb-3 text-[#a8bfc9] dark:text-[#4a6475]" />
          <p className="text-sm font-bold text-[#527080] dark:text-[#a8bfc9]">{en ? "No pending tasks" : "لا توجد مهام معلقة"}</p>
          <p className="mt-1 text-xs text-[#8a9ba4] dark:text-[#7e939e]">{en ? "All operations are clear." : "كل العمليات تحت السيطرة."}</p>
        </div>
      )}

      {/* Task list */}
      {!isLoading && !isError && filtered.length > 0 && (
        <div className="space-y-3 animate-rise">
          {filtered.map((task) => (
            <div
              key={task.id}
              className="surface flex flex-wrap items-center gap-3 rounded-2xl p-4"
              data-testid={`task-row-${task.id}`}
            >
              {/* Type icon */}
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f1f7f7] dark:bg-[#10222f]">
                {typeIcon(task.type)}
              </span>

              {/* Main content */}
              <div className="min-w-[180px] flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="text-sm text-[#28495b] dark:text-[#dbe7ee]">{task.patientName}</strong>
                  <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold ${priorityColor(task.priority)}`}>
                    {priorityLabel(task.priority, en)}
                  </span>
                  <span className="rounded-md bg-[#f1f7f7] px-1.5 py-0.5 text-[9px] font-bold text-[#66808e] dark:bg-[#10222f] dark:text-[#7e939e]">
                    {typeLabel(task.type, en)}
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-[#8496a0] dark:text-[#7e939e]">{task.description}</p>
              </div>

              {/* Due date */}
              <div className="flex items-center gap-1 text-[11px] text-[#8496a0] dark:text-[#7e939e]">
                <Clock3 size={12} />
                <span>{dateLabel(task.dueAt, en)}</span>
              </div>

              {/* Actions */}
              <div className="flex shrink-0 items-center gap-2">
                <Link href={task.actionUrl} className="quiet-button text-[10px]" data-testid={`task-view-${task.id}`}>
                  <ChevronLeft size={13} /> {en ? "Details" : "التفاصيل"}
                </Link>
                {task.type !== "conversation" && (
                  <button
                    className="flex items-center gap-1.5 rounded-xl border border-[#b0dac8] bg-[#f0fbf6] px-3 py-2 text-[10px] font-bold text-[#176b58] transition hover:bg-[#d9f0e8] disabled:opacity-50 dark:border-[#1d4a35] dark:bg-[#0c1f17] dark:text-[#7fd0b4]"
                    onClick={() => handleComplete(task)}
                    disabled={followUpAction.isPending || noShowAction.isPending || waitlistAction.isPending}
                    data-testid={`task-complete-${task.id}`}
                  >
                    <Check size={12} /> {en ? "Done" : "أنجزت"}
                  </button>
                )}
                {task.type === "conversation" && (
                  <Link href="/inbox" className="flex items-center gap-1.5 rounded-xl border border-[#b0cfe0] bg-[#dcecf5] px-3 py-2 text-[10px] font-bold text-[#22617d] transition hover:bg-[#c8e2ef] dark:border-[#1e3a4d] dark:bg-[#143242] dark:text-[#8cc3dd]">
                    <Inbox size={12} /> {en ? "Open" : "فتح"}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </WorkspacePage>
  );
}
