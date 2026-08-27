import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen, Check, Copy, Edit3, Hash, Plus, RefreshCw, Search, Tag, Trash2, X
} from "lucide-react";
import { toast } from "sonner";
import { usePreferences } from "@/lib/preferences";
import { WorkspacePage, WorkspacePageHeader } from "@/components/workspace-page";

type TemplateCategory = "appointments" | "general" | "follow_up" | "no_show" | "billing";

type Template = {
  id: string;
  title: string;
  content: string;
  category: TemplateCategory;
  shortcut?: string;
  usageCount?: number;
};

// Fetch from API; fallback to built-in starters if endpoint not available
async function getTemplates(signal?: AbortSignal): Promise<Template[]> {
  try {
    const res = await fetch("/api/templates", { credentials: "include", signal });
    if (res.ok) {
      const data = await res.json().catch(() => null);
      if (Array.isArray(data)) return data as Template[];
    }
  } catch { /* ignore */ }

  // Built-in starter templates
  return [
    { id: "t1", title: "تأكيد الحجز", content: "السلام عليكم {{patient_name}}، تم تأكيد موعدك في {{clinic_name}} بتاريخ {{appointment_time}}. نتطلع لخدمتك.", category: "appointments", shortcut: "/confirm", usageCount: 47 },
    { id: "t2", title: "تذكير الموعد", content: "تذكير: لديك موعد غداً في {{clinic_name}}. يرجى الحضور قبل 10 دقائق.", category: "appointments", shortcut: "/remind", usageCount: 31 },
    { id: "t3", title: "إلغاء الموعد", content: "نعتذر {{patient_name}}، اضطررنا لإلغاء موعدك. سنتواصل معك لتحديد وقت بديل في أقرب وقت.", category: "appointments", shortcut: "/cancel", usageCount: 12 },
    { id: "t4", title: "ردّ متابعة", content: "نتمنى لك الصحة والعافية {{patient_name}}. هل لديك أي تساؤلات حول حالتك؟ نحن هنا لمساعدتك.", category: "follow_up", shortcut: "/followup", usageCount: 28 },
    { id: "t5", title: "ترحيب عام", content: "أهلاً وسهلاً! كيف يمكننا مساعدتك اليوم؟ 😊", category: "general", shortcut: "/hello", usageCount: 85 },
    { id: "t6", title: "أوقات الدوام", content: "نعمل من الأحد إلى الخميس من 8 صباحاً حتى 8 مساءً، وأيام الجمعة والسبت من 10 صباحاً حتى 4 مساءً.", category: "general", shortcut: "/hours", usageCount: 63 },
    { id: "t7", title: "عدم حضور", content: "لاحظنا غياب {{patient_name}} عن موعده اليوم. هل أنت بخير؟ يمكننا إعادة الحجز في أي وقت يناسبك.", category: "no_show", shortcut: "/noshow", usageCount: 9 },
    { id: "t8", title: "استفسار الفاتورة", content: "شكراً لتواصلك بشأن الفاتورة. سيتواصل معك فريقنا المالي خلال 24 ساعة لتوضيح التفاصيل.", category: "billing", shortcut: "/billing", usageCount: 5 },
  ];
}

async function saveTemplate(template: Partial<Template> & { id?: string }): Promise<Template> {
  const method = template.id ? "PATCH" : "POST";
  const url = template.id ? `/api/templates/${encodeURIComponent(template.id)}` : "/api/templates";
  const res = await fetch(url, {
    method, credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(template),
  });
  if (res.ok) return res.json() as Promise<Template>;
  // Optimistic: return back as-is
  return { id: template.id ?? `local-${Date.now()}`, title: template.title ?? "", content: template.content ?? "", category: template.category ?? "general" };
}

async function deleteTemplate(id: string): Promise<void> {
  await fetch(`/api/templates/${encodeURIComponent(id)}`, { method: "DELETE", credentials: "include" });
}

const categoryLabels: Record<TemplateCategory, { ar: string; en: string; color: string }> = {
  appointments: { ar: "المواعيد", en: "Appointments", color: "bg-[#dcecf5] text-[#22617d] dark:bg-[#143242] dark:text-[#8cc3dd]" },
  general: { ar: "عام", en: "General", color: "bg-[#f1f1f4] text-[#666] dark:bg-[#1e2a30] dark:text-[#a8bfc9]" },
  follow_up: { ar: "المتابعات", en: "Follow-ups", color: "bg-[#d9f0e8] text-[#176b58] dark:bg-[#123528] dark:text-[#7fd0b4]" },
  no_show: { ar: "عدم الحضور", en: "No-shows", color: "bg-[#f8dfdc] text-[#a64036] dark:bg-[#3d1f1b] dark:text-[#eb9a90]" },
  billing: { ar: "الفوترة", en: "Billing", color: "bg-[#fff0d8] text-[#9a6513] dark:bg-[#3a2c14] dark:text-[#e0b46a]" },
};

type EditorState = { mode: "new" | "edit"; template: Partial<Template> };

const VARIABLE_HINTS = ["{{patient_name}}", "{{clinic_name}}", "{{appointment_time}}", "{{doctor_name}}", "{{booking_number}}"];

export default function TemplatesPage() {
  const queryClient = useQueryClient();
  const { language } = usePreferences();
  const en = language === "en";

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<TemplateCategory | "all">("all");
  const [editor, setEditor] = useState<EditorState | null>(null);

  const query = useQuery({
    queryKey: ["templates"],
    queryFn: ({ signal }) => getTemplates(signal),
    staleTime: 60_000,
  });

  const saveMutation = useMutation({
    mutationFn: saveTemplate,
    onSuccess: (saved) => {
      queryClient.setQueryData<Template[]>(["templates"], (old) => {
        if (!old) return [saved];
        const idx = old.findIndex(t => t.id === saved.id);
        if (idx >= 0) { const updated = [...old]; updated[idx] = saved; return updated; }
        return [saved, ...old];
      });
      setEditor(null);
      toast.success(en ? "Template saved" : "تم حفظ القالب");
    },
    onError: () => toast.error(en ? "Could not save template" : "تعذر حفظ القالب"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTemplate,
    onSuccess: (_, id) => {
      queryClient.setQueryData<Template[]>(["templates"], (old) => old?.filter(t => t.id !== id));
      toast.success(en ? "Template deleted" : "تم حذف القالب");
    },
  });

  const templates = query.data ?? [];

  const filtered = useMemo(() => templates.filter(t => {
    if (categoryFilter !== "all" && t.category !== categoryFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return t.title.toLowerCase().includes(q) || t.content.toLowerCase().includes(q) || (t.shortcut ?? "").toLowerCase().includes(q);
    }
    return true;
  }), [templates, categoryFilter, searchQuery]);

  const openNew = () => setEditor({ mode: "new", template: { category: "general", title: "", content: "" } });
  const openEdit = (t: Template) => setEditor({ mode: "edit", template: { ...t } });
  const closeEditor = () => setEditor(null);
  const setField = (field: keyof Template, value: string) => setEditor(prev => prev ? { ...prev, template: { ...prev.template, [field]: value } } : prev);

  const handleSave = () => {
    if (!editor) return;
    if (!editor.template.title?.trim()) { toast.error(en ? "Title is required" : "العنوان مطلوب"); return; }
    if (!editor.template.content?.trim()) { toast.error(en ? "Content is required" : "المحتوى مطلوب"); return; }
    saveMutation.mutate(editor.template);
  };

  const handleDelete = (t: Template) => {
    if (window.confirm(en ? `Delete "${t.title}"?` : `حذف "${t.title}"؟`)) {
      deleteMutation.mutate(t.id);
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard?.writeText(content).then(() => toast.success(en ? "Copied to clipboard" : "تم النسخ")).catch(() => toast.info(content));
  };

  return (
    <WorkspacePage>
      <WorkspacePageHeader
        eyebrow={en ? "Automation / Templates" : "الأتمتة / القوالب"}
        title={en ? "Saved Replies & Templates" : "القوالب والردود الجاهزة"}
        description={en
          ? `${templates.length} templates across all categories · use / shortcuts in the inbox`
          : `${templates.length} قالب عبر جميع التصنيفات · استخدم اختصارات / في صندوق الوارد`}
        action={
          <button className="primary-button" onClick={openNew} data-testid="button-new-template">
            <Plus size={16} /> {en ? "New template" : "قالب جديد"}
          </button>
        }
      />

      {/* Search + Category filter */}
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative min-w-48 flex-1">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8ca2ad] dark:text-[#7e939e]" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={en ? "Search templates..." : "ابحث في القوالب..."}
            className="input-field pr-9"
            data-testid="input-templates-search"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setCategoryFilter("all")}
            className={`rounded-full border px-3 py-1.5 text-[11px] font-bold transition ${categoryFilter === "all" ? "border-[#9fc0ca] bg-[#e6f4ee] text-[#2c7a5d] dark:border-[#1e3a4d] dark:bg-[#123528] dark:text-[#7fd0b4]" : "border-[#dbe5ea] bg-white text-[#66808e] dark:border-[#1e3a4d] dark:bg-[#122434] dark:text-[#7e939e]"}`}
          >{en ? "All" : "الكل"}</button>
          {(Object.keys(categoryLabels) as TemplateCategory[]).map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`rounded-full border px-3 py-1.5 text-[11px] font-bold transition ${categoryFilter === cat ? categoryLabels[cat].color + " border-transparent" : "border-[#dbe5ea] bg-white text-[#66808e] dark:border-[#1e3a4d] dark:bg-[#122434] dark:text-[#7e939e]"}`}
              data-testid={`filter-cat-${cat}`}
            >
              {en ? categoryLabels[cat].en : categoryLabels[cat].ar}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {query.isLoading && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton h-36 rounded-2xl" />)}
        </div>
      )}

      {/* Grid */}
      {!query.isLoading && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 animate-rise">
          {filtered.map(template => (
            <div key={template.id} className="surface group relative flex flex-col rounded-2xl p-4" data-testid={`template-card-${template.id}`}>
              {/* Header */}
              <div className="mb-2 flex items-start gap-2">
                <BookOpen size={15} className="mt-0.5 shrink-0 text-[#578b9d] dark:text-[#8cc3dd]" />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-bold text-[#28495b] dark:text-[#dbe7ee]">{template.title}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold ${categoryLabels[template.category]?.color ?? ""}`}>
                      {en ? categoryLabels[template.category]?.en : categoryLabels[template.category]?.ar}
                    </span>
                    {template.shortcut && (
                      <span className="flex items-center gap-0.5 rounded-md bg-[#f1f7f7] px-1.5 py-0.5 text-[9px] font-mono font-bold text-[#347b98] dark:bg-[#10222f] dark:text-[#8cc3dd]">
                        <Hash size={9} />{template.shortcut.replace("/", "")}
                      </span>
                    )}
                    {typeof template.usageCount === "number" && (
                      <span className="text-[9px] text-[#a0adb3] dark:text-[#4a6475]">{template.usageCount}× {en ? "used" : "استخدام"}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Content preview */}
              <p className="flex-1 rounded-xl bg-[#f8fbfc] p-3 text-[11px] leading-6 text-[#527080] dark:bg-[#10222f] dark:text-[#a8bfc9]" style={{ minHeight: "60px" }}>
                {template.content.slice(0, 140)}{template.content.length > 140 ? "…" : ""}
              </p>

              {/* Actions */}
              <div className="mt-3 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  className="flex items-center gap-1 rounded-lg border border-[#dbe5ea] px-2.5 py-1.5 text-[10px] font-bold text-[#66808e] transition hover:border-[#9fc0ca] hover:text-[#22617d] dark:border-[#1e3a4d] dark:text-[#7e939e]"
                  onClick={() => handleCopy(template.content)}
                  data-testid={`btn-copy-${template.id}`}
                >
                  <Copy size={11} /> {en ? "Copy" : "نسخ"}
                </button>
                <button
                  className="flex items-center gap-1 rounded-lg border border-[#dbe5ea] px-2.5 py-1.5 text-[10px] font-bold text-[#66808e] transition hover:border-[#9fc0ca] hover:text-[#22617d] dark:border-[#1e3a4d] dark:text-[#7e939e]"
                  onClick={() => openEdit(template)}
                  data-testid={`btn-edit-${template.id}`}
                >
                  <Edit3 size={11} /> {en ? "Edit" : "تعديل"}
                </button>
                <button
                  className="ms-auto flex items-center gap-1 rounded-lg border border-[#edbab5] px-2.5 py-1.5 text-[10px] font-bold text-[#a64036] transition hover:bg-[#fff7f6] dark:border-[#5a2a25] dark:text-[#eb9a90]"
                  onClick={() => handleDelete(template)}
                  data-testid={`btn-delete-${template.id}`}
                >
                  <Trash2 size={11} /> {en ? "Delete" : "حذف"}
                </button>
              </div>
            </div>
          ))}

          {/* Empty state */}
          {filtered.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
              <Tag size={28} className="mb-3 text-[#a8bfc9] dark:text-[#4a6475]" />
              <p className="text-sm font-bold text-[#527080] dark:text-[#a8bfc9]">{en ? "No templates found" : "لا توجد قوالب مطابقة"}</p>
              <button className="primary-button mt-4" onClick={openNew}><Plus size={15} /> {en ? "Create template" : "إنشاء قالب"}</button>
            </div>
          )}
        </div>
      )}

      {/* Editor Modal */}
      {editor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1824]/50 p-4" onClick={closeEditor}>
          <div className="surface w-full max-w-lg space-y-4 rounded-2xl p-6" dir="rtl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold dark:text-[#e2ecf1]">
                {editor.mode === "new" ? (en ? "New Template" : "قالب جديد") : (en ? "Edit Template" : "تعديل القالب")}
              </h2>
              <button onClick={closeEditor} aria-label={en ? "Close" : "إغلاق"}><X size={18} /></button>
            </div>

            <div className="space-y-3">
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-[#527080] dark:text-[#a8bfc9]">{en ? "Title *" : "العنوان *"}</span>
                <input
                  value={editor.template.title ?? ""}
                  onChange={e => setField("title", e.target.value)}
                  placeholder={en ? "e.g. Appointment confirmation" : "مثال: تأكيد الحجز"}
                  className="input-field w-full"
                  data-testid="input-template-title"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-[#527080] dark:text-[#a8bfc9]">{en ? "Category" : "التصنيف"}</span>
                <select
                  value={editor.template.category ?? "general"}
                  onChange={e => setField("category", e.target.value)}
                  className="input-field w-full"
                  data-testid="select-template-category"
                >
                  {(Object.keys(categoryLabels) as TemplateCategory[]).map(cat => (
                    <option key={cat} value={cat}>{en ? categoryLabels[cat].en : categoryLabels[cat].ar}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-[#527080] dark:text-[#a8bfc9]">{en ? "Shortcut (optional)" : "الاختصار (اختياري)"}</span>
                <input
                  value={editor.template.shortcut ?? ""}
                  onChange={e => setField("shortcut", e.target.value)}
                  placeholder="/confirm"
                  className="input-field w-full font-mono"
                  data-testid="input-template-shortcut"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-[#527080] dark:text-[#a8bfc9]">{en ? "Message content *" : "محتوى الرسالة *"}</span>
                <textarea
                  value={editor.template.content ?? ""}
                  onChange={e => setField("content", e.target.value)}
                  rows={5}
                  placeholder={en ? "Write your reply template..." : "اكتب قالب ردك هنا..."}
                  className="input-field min-h-24 w-full"
                  data-testid="textarea-template-content"
                />
                {/* Variable hints */}
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {VARIABLE_HINTS.map(v => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setField("content", (editor.template.content ?? "") + v)}
                      className="rounded-md bg-[#f1f7f7] px-2 py-0.5 font-mono text-[10px] text-[#347b98] transition hover:bg-[#dcecf5] dark:bg-[#10222f] dark:text-[#8cc3dd]"
                    >{v}</button>
                  ))}
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button className="quiet-button" onClick={closeEditor}>{en ? "Cancel" : "إلغاء"}</button>
              <button
                className="primary-button"
                onClick={handleSave}
                disabled={saveMutation.isPending}
                data-testid="button-save-template"
              >
                <Check size={15} /> {saveMutation.isPending ? (en ? "Saving..." : "جارٍ الحفظ...") : (en ? "Save template" : "حفظ القالب")}
              </button>
            </div>
          </div>
        </div>
      )}
    </WorkspacePage>
  );
}
