import type { ReactNode } from "react";
import { AlertTriangle, RefreshCw, UsersRound } from "lucide-react";

type WorkspacePageProps = {
  children: ReactNode;
  className?: string;
};

export function WorkspacePage({ children, className = "" }: WorkspacePageProps) {
  return (
    <section className={`workspace-page mx-auto flex min-h-full w-full max-w-[1450px] flex-col gap-6 px-5 py-6 md:px-9 md:py-8 ${className}`}>
      {children}
    </section>
  );
}

type WorkspacePageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
};

export function WorkspacePageHeader({ eyebrow, title, description, action }: WorkspacePageHeaderProps) {
  return (
    <header className="workspace-page-header flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div className="min-w-0">
        <p className="mb-1.5 text-[11px] font-bold text-[hsl(var(--primary))]">{eyebrow}</p>
        <h1 className="ar text-[27px] font-extrabold tracking-tight text-[#18374d] md:text-[31px]">{title}</h1>
        <p className="mt-1 text-[13px] text-[hsl(var(--muted-foreground))]">{description}</p>
      </div>
      {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
    </header>
  );
}

type WorkspaceErrorStateProps = {
  onRetry: () => void;
  title?: string;
  detail?: string;
};

export function WorkspaceErrorState({ onRetry, title = "تعذر تحميل البيانات", detail = "حدث خلل مؤقت. حاول مرة أخرى، وسنستأنف من حيث توقفت." }: WorkspaceErrorStateProps) {
  return (
    <div className="surface flex min-h-[260px] flex-col items-center justify-center p-8 text-center md:p-10">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#f9e9e7] text-[#ad514a]"><AlertTriangle size={20} /></div>
      <p className="text-sm font-bold text-[#18374d]">{title}</p>
      <p className="mt-2 max-w-md text-xs leading-6 text-[hsl(var(--muted-foreground))]">{detail}</p>
      <button className="primary-button mt-5" onClick={onRetry}><RefreshCw size={15} /> إعادة المحاولة</button>
    </div>
  );
}

export function WorkspaceLoadingState({ rows = 3 }: { rows?: number }) {
  return (
    <div className="surface space-y-3 p-5 md:p-6">
      <div className="skeleton h-20 w-full" />
      {Array.from({ length: rows }, (_, index) => <div className="skeleton h-14 w-full" key={index} />)}
    </div>
  );
}

type WorkspaceEmptyStateProps = {
  icon?: ReactNode;
  title: string;
  detail?: string;
};

export function WorkspaceEmptyState({ icon = <UsersRound size={28} />, title, detail }: WorkspaceEmptyStateProps) {
  return (
    <div className="surface flex min-h-[240px] flex-col items-center justify-center p-8 text-center md:p-10">
      <div className="mb-3 text-[hsl(var(--muted-foreground)/.55)]">{icon}</div>
      <p className="text-sm font-bold text-[hsl(var(--muted-foreground))]">{title}</p>
      {detail ? <p className="mt-1 max-w-md text-xs leading-6 text-[hsl(var(--muted-foreground))]">{detail}</p> : null}
    </div>
  );
}

type WorkspaceDataStateProps = {
  isLoading: boolean;
  isError: boolean;
  retry: () => void;
  children: ReactNode;
};

export function WorkspaceDataState({ isLoading, isError, retry, children }: WorkspaceDataStateProps) {
  if (isLoading) return <WorkspaceLoadingState rows={2} />;
  if (isError) return <WorkspaceErrorState onRetry={retry} />;
  return <>{children}</>;
}
