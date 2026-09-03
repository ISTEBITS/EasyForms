import { useMemo, useState } from "react";
import type { ComponentType } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { FileText, MessageSquareText, Search, ArrowRight, BarChart2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useForms } from "@/hooks/useForms";
import type { Form } from "@/types/form";
import { useAuth } from "@/context/auth";
import {
  DASHBOARD_SCOPE_PARAM,
  filterFormsByDashboardScope,
  normalizeDashboardScope,
} from "@/lib/dashboard-scope";
import { EditorSkeleton, ResponsesSkeleton } from "@/components/ui/skeleton-new";
import { stripMarkdown } from "@/lib/form-header-markdown";

function FormCollectionLayout({
  title,
  description,
  icon: Icon,
  forms,
  loading,
  onOpen,
  isEditor = false,
}: {
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  forms: Form[];
  loading: boolean;
  onOpen: (form: Form) => void;
  isEditor?: boolean;
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(
    () =>
      forms.filter((form) =>
        form.title.toLowerCase().includes(query.toLowerCase()),
      ),
    [forms, query],
  );

  if (loading) {
    return isEditor ? <EditorSkeleton /> : <ResponsesSkeleton />;
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200 font-sans p-4">
      {/* Page Banner Header */}
      <div className="rounded-xs border border-zinc-800 bg-zinc-950/80 p-6 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xs border border-zinc-800 bg-zinc-900 text-white">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
            <p className="text-sm text-zinc-400 mt-0.5">{description}</p>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${title.toLowerCase()} forms`}
          className="h-10 rounded-xs border-zinc-800 bg-black pl-10 text-sm text-white placeholder:text-zinc-500 focus:border-zinc-700"
        />
      </div>

      {/* Grid of Forms */}
      {filtered.length === 0 ? (
        <div className="rounded-xs border border-border bg-background p-16 text-center text-sm text-accent-5">
          No matching forms found.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((form) => (
            <div
              key={form.id || form._id}
              className="group rounded-xs border border-border bg-background p-5 transition-all duration-200 hover:border-accent-7 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xs border border-border bg-accent-1 text-foreground">
                    <FileText className="h-4.5 w-4.5 text-foreground" />
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-sm font-semibold border ${form.isPublished
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                        : "border-border bg-accent-1 text-accent-6"
                      }`}
                  >
                    {form.isPublished ? "Published" : "Draft"}
                  </span>
                </div>

                <div>
                  <h3
                    onClick={() => onOpen(form)}
                    className="text-base font-bold text-foreground hover:text-white transition-colors cursor-pointer truncate"
                  >
                    {form.title || "Untitled Form"}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm text-accent-5 leading-relaxed">
                    {stripMarkdown(form.description || "") || "No description provided."}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-border flex flex-wrap items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 font-medium text-accent-5 text-sm">
                  <BarChart2 className="h-4 w-4 text-accent-4" />
                  <span>{form.responseCount || 0} responses</span>
                </span>

                <button
                  onClick={() => onOpen(form)}
                  className="flex items-center gap-1.5 text-sm font-semibold text-foreground hover:text-white transition-colors cursor-pointer"
                >
                  <span>Open {isEditor ? "Editor" : "Responses"}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function EditorFormsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { forms, loading } = useForms();
  const isAdmin = user?.role === "admin";
  const selectedScope = normalizeDashboardScope(
    searchParams.get(DASHBOARD_SCOPE_PARAM),
  );
  const scopedForms = useMemo(
    () => filterFormsByDashboardScope(forms, isAdmin, selectedScope),
    [forms, isAdmin, selectedScope],
  );

  return (
    <FormCollectionLayout
      title="Form Editor"
      description="Select a form to edit questions, logic, and settings."
      icon={FileText}
      forms={scopedForms}
      loading={loading}
      isEditor={true}
      onOpen={(form) => {
        navigate(`/editor/${form.id || form._id}${location.search || ""}`, {
          state: { form },
        });
      }}
    />
  );
}

export function ResponsesFormsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { forms, loading } = useForms();
  const isAdmin = user?.role === "admin";
  const selectedScope = normalizeDashboardScope(
    searchParams.get(DASHBOARD_SCOPE_PARAM),
  );
  const scopedForms = useMemo(
    () => filterFormsByDashboardScope(forms, isAdmin, selectedScope),
    [forms, isAdmin, selectedScope],
  );

  return (
    <FormCollectionLayout
      title="Form Responses"
      description="Select a form to inspect submission analytics and exported data."
      icon={MessageSquareText}
      forms={scopedForms}
      loading={loading}
      isEditor={false}
      onOpen={(form) => {
        navigate(
          `/form/${form.id || form._id}/responses${location.search || ""}`,
        );
      }}
    />
  );
}
