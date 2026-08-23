import { type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell } from "@/components/app-shell";
import Dashboard from "@/pages/dashboard";
import {
  AiReceptionistPage, AppointmentsPage, FollowUpsPage, InboxPage, PatientsPage,
  SettingsPage, SimpleOperationsPage, TasksPage, VoiceAgentPage, WaitlistPage,
} from "@/pages/operations-pages";
import NotFound from "@/pages/not-found";
import { Route, Switch, useLocation, Router as WouterRouter } from "wouter";
import { PreferencesProvider } from "@/lib/preferences";

const queryClient = new QueryClient();

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function Router() {
  return <RoutedErrorBoundary><AppShell><Switch>
    <Route path="/" component={Dashboard} />
    <Route path="/dashboard" component={Dashboard} />
    <Route path="/appointments" component={AppointmentsPage} />
    <Route path="/patients" component={PatientsPage} />
    <Route path="/inbox" component={InboxPage} />
    <Route path="/tasks" component={TasksPage} />
    <Route path="/waitlist" component={WaitlistPage} />
    <Route path="/follow-ups" component={FollowUpsPage} />
    <Route path="/ai-receptionist" component={AiReceptionistPage} />
    <Route path="/voice-agent" component={VoiceAgentPage} />
    <Route path="/settings" component={SettingsPage} />
    <Route path="/calendar">{() => <SimpleOperationsPage type="calendar" eyebrow="إدارة العيادة / calendar" title="التقويم" desc="رؤية أسبوعية واضحة لكل طبيب وغرفة." />}</Route>
    <Route path="/doctors">{() => <SimpleOperationsPage type="doctors" eyebrow="إدارة العيادة / doctors" title="الأطباء" desc="جداول الأطباء وتوزيع المواعيد." />}</Route>
    <Route path="/services">{() => <SimpleOperationsPage type="services" eyebrow="إدارة العيادة / services" title="الخدمات" desc="الخدمات التي تقدمها العيادة للمرضى." />}</Route>
    <Route path="/staff">{() => <SimpleOperationsPage type="staff" eyebrow="إدارة العيادة / staff" title="الفريق" desc="الأدوار والوصول إلى مساحة العمل." />}</Route>
    <Route path="/automation">{() => <SimpleOperationsPage type="automation" eyebrow="إدارة العيادة / automation" title="الأتمتة" desc="قواعد تعمل في الخلفية لتحافظ على إيقاع العيادة." />}</Route>
    <Route path="/templates">{() => <SimpleOperationsPage type="templates" eyebrow="إدارة العيادة / templates" title="القوالب" desc="رسائل جاهزة بنبرة عيادتك." />}</Route>
    <Route path="/reports">{() => <SimpleOperationsPage type="reports" eyebrow="إدارة العيادة / reports" title="التقارير" desc="إشارات الأداء التي تساعدك على اتخاذ القرار." />}</Route>
    <Route component={NotFound} />
  </Switch></AppShell></RoutedErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><PreferencesProvider><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}><Router /></WouterRouter><Toaster /></TooltipProvider></PreferencesProvider></QueryClientProvider>;
}

export default App;