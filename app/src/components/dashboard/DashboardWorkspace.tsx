import {
  Activity,
  BarChart2,
  Edit3,
  FileText,
  LayoutGrid,
  List,
  MoreVertical,
  PieChart,
  Share2,
  Trash2,
  TrendingUp,
  Eye,
  Plus,
  Users,
} from "lucide-react";
import { useMemo } from "react";
import type { Form } from "@/types/form";
import type { TestUserActivity } from "@/api";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { stripMarkdown } from "@/lib/form-header-markdown";

type DashboardTab = "overview" | "forms" | "responses";
type ViewMode = "grid" | "list";

interface DashboardWorkspaceProps {
  forms: Form[];
  filteredForms: Form[];
  activeTab?: DashboardTab;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onCreateClick: () => void;
  onEditForm: (form: Form) => void;
  onViewResponses: (form: Form) => void;
  onDeleteForm: (formId: string) => void;
  onShareForm: (form: Form) => void;
  activities?: TestUserActivity[];
  disableCreate?: boolean;
  dashboardTitle?: string;
  dashboardDescription?: string;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact" }).format(value);
}

export function DashboardWorkspace({
  forms,
  filteredForms,
  viewMode,
  onViewModeChange,
  onCreateClick,
  onEditForm,
  onViewResponses,
  onDeleteForm,
  onShareForm,
  disableCreate = false,
  dashboardTitle = "Dashboard",
  dashboardDescription = "Manage and track all forms in one place.",
}: DashboardWorkspaceProps) {
  const analytics = useMemo(() => {
    const totalForms = forms.length;
    const totalResponses = forms.reduce(
      (acc, form) => acc + (form.responseCount || 0),
      0,
    );
    const publishedForms = forms.filter((form) => form.isPublished).length;
    const drafts = totalForms - publishedForms;
    const avgResponsesPerForm = totalForms ? totalResponses / totalForms : 0;
    const publishRate = totalForms ? (publishedForms / totalForms) * 100 : 0;
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentlyUpdated = forms.filter(
      (form) => new Date(form.updatedAt).getTime() >= sevenDaysAgo,
    ).length;

    return {
      totalForms,
      totalResponses,
      publishedForms,
      drafts,
      avgResponsesPerForm,
      publishRate,
      recentlyUpdated,
    };
  }, [forms]);

  return (
    <div className="space-y-6 font-sans">
      {/* Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-sm border border-border bg-background p-5">
          <div className="flex items-center justify-between text-xs font-sans font-medium text-accent-5">
            <span>TOTAL SUBMISSIONS</span>
            <BarChart2 className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-2 text-3xl font-bold tracking-tight text-foreground font-sans">
            {formatCompactNumber(analytics.totalResponses)}
          </p>
          <p className="mt-1.5 text-xs text-accent-5">
            Across {analytics.totalForms} active form{analytics.totalForms === 1 ? "" : "s"}
          </p>
        </div>

        <div className="rounded-sm border border-border bg-background p-5">
          <div className="flex items-center justify-between text-xs font-sans font-medium text-accent-5">
            <span>AVG SUBMISSIONS</span>
            <TrendingUp className="h-4 w-4 text-blue-400" />
          </div>
          <p className="mt-2 text-3xl font-bold tracking-tight text-foreground font-sans">
            {analytics.avgResponsesPerForm.toFixed(1)}
          </p>
          <p className="mt-1.5 text-xs text-accent-5">Average responses per form</p>
        </div>

        <div className="rounded-sm border border-border bg-background p-5">
          <div className="flex items-center justify-between text-xs font-sans font-medium text-accent-5">
            <span>PUBLISH RATE</span>
            <PieChart className="h-4 w-4 text-purple-400" />
          </div>
          <p className="mt-2 text-3xl font-bold tracking-tight text-foreground font-sans">
            {analytics.publishRate.toFixed(0)}%
          </p>
          <p className="mt-1.5 text-xs text-accent-5">
            {analytics.publishedForms} published, {analytics.drafts} draft{analytics.drafts === 1 ? "" : "s"}
          </p>
        </div>

        <div className="rounded-sm border border-border bg-background p-5">
          <div className="flex items-center justify-between text-xs font-sans font-medium text-accent-5">
            <span>ACTIVE THIS WEEK</span>
            <Activity className="h-4 w-4 text-amber-400" />
          </div>
          <p className="mt-2 text-3xl font-bold tracking-tight text-foreground font-sans">
            {analytics.recentlyUpdated}
          </p>
          <p className="mt-1.5 text-xs text-accent-5">Updated in last 7 days</p>
        </div>
      </div>

      {/* Main Forms Container */}
      <div className="rounded-sm border border-border bg-background overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
          <div>
            <h3 className="text-base font-semibold text-foreground tracking-tight font-sans">
              {dashboardTitle} Forms
            </h3>
            <p className="text-xs text-accent-5 mt-0.5 font-sans">{dashboardDescription}</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-sm border border-border bg-accent-1 p-0.5">
              <button
                type="button"
                onClick={() => onViewModeChange("grid")}
                className={`rounded-xs p-1.5 transition-all ${
                  viewMode === "grid"
                    ? "bg-background text-foreground border border-border"
                    : "text-accent-5 hover:text-foreground"
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange("list")}
                className={`rounded-xs p-1.5 transition-all ${
                  viewMode === "list"
                    ? "bg-background text-foreground border border-border"
                    : "text-accent-5 hover:text-foreground"
                }`}
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
            <Button
              disabled={disableCreate}
              onClick={onCreateClick}
              variant="primary"
              size="sm"
              className="gap-1.5 font-medium"
            >
              <Plus className="h-4 w-4" />
              <span>New Form</span>
            </Button>
          </div>
        </div>

        {/* Forms Rendering */}
        {filteredForms.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-sm border border-border bg-accent-1">
              <FileText className="h-5 w-5 text-accent-5" />
            </div>
            <h4 className="text-sm font-semibold text-foreground font-sans">No forms found</h4>
            <p className="text-xs text-accent-5 max-w-sm mx-auto font-sans">
              Create a new form to start collecting responses or embedding via SDK.
            </p>
          </div>
        ) : (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3"
                : "divide-y divide-border"
            }
          >
            {filteredForms.map((form) => (
              <div
                key={form.id || form._id}
                onClick={() => onEditForm(form)}
                className={
                  viewMode === "grid"
                    ? "group cursor-pointer rounded-sm border border-border bg-background p-5 transition-all duration-150 hover:border-accent-7 flex flex-col justify-between"
                    : "group cursor-pointer flex items-center justify-between p-4 transition-all duration-150 hover:bg-accent-1"
                }
              >
                {viewMode === "grid" ? (
                  <>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex h-8 w-8 items-center justify-center rounded-sm border border-border bg-accent-1 text-foreground">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="flex items-center gap-1.5">
                          {form.collaborators && form.collaborators.length > 0 && (
                            <span
                              className="inline-flex items-center gap-1 rounded-sm border border-border bg-accent-1 px-2 py-0.5 text-xs font-sans text-accent-6"
                              title={`${form.collaborators.length} collaborators`}
                            >
                              <Users className="h-3 w-3" />
                              <span>{form.collaborators.length}</span>
                            </span>
                          )}
                          <span
                            className={`px-2.5 py-0.5 font-sans text-xs uppercase font-semibold border rounded-sm ${
                              form.isPublished
                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                                : "border-border bg-accent-1 text-accent-6"
                            }`}
                          >
                            {form.isPublished ? "Published" : "Draft"}
                          </span>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-foreground group-hover:text-white transition-colors truncate font-sans">
                          {form.title}
                        </h4>
                        <p className="mt-1 line-clamp-2 text-xs text-accent-5 leading-relaxed font-sans">
                          {stripMarkdown(form.description || "") || "No description provided."}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between pt-3 border-t border-border text-xs text-accent-5">
                      <span className="flex items-center gap-1.5 font-sans text-xs">
                        <BarChart2 className="h-3.5 w-3.5 text-accent-4" />
                        {form.responseCount || 0} responses
                      </span>

                      <div className="flex items-center gap-2">
                        <span className="font-sans text-xs">
                          {formatDate(form.updatedAt)}
                        </span>

                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <button
                                type="button"
                                onClick={(e) => e.stopPropagation()}
                                className="rounded-xs p-1 text-accent-5 hover:bg-accent-1 hover:text-foreground transition-colors outline-none"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </button>
                            }
                          />
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditForm(form);
                              }}
                            >
                              <Edit3 className="mr-2 h-3.5 w-3.5" />
                              <span>Edit Form</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                onViewResponses(form);
                              }}
                            >
                              <Eye className="mr-2 h-3.5 w-3.5" />
                              <span>View Responses</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                onShareForm(form);
                              }}
                            >
                              <Share2 className="mr-2 h-3.5 w-3.5" />
                              <span>Copy Link / SDK Code</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteForm(form._id || form.id);
                              }}
                            >
                              <Trash2 className="mr-2 h-3.5 w-3.5" />
                              <span>Delete Form</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-border bg-accent-1 text-foreground">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-foreground truncate font-sans">
                          {form.title}
                        </h4>
                        <p className="text-xs text-accent-5 truncate mt-0.5 font-sans">
                          {stripMarkdown(form.description || "") || "No description provided."}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-5 text-xs shrink-0 font-sans">
                      {form.collaborators && form.collaborators.length > 0 && (
                        <span
                          className="inline-flex items-center gap-1 rounded-sm border border-border bg-accent-1 px-2 py-0.5 text-xs font-sans text-accent-6"
                          title={`${form.collaborators.length} collaborators`}
                        >
                          <Users className="h-3 w-3" />
                          <span>{form.collaborators.length}</span>
                        </span>
                      )}
                      <span
                        className={`px-2.5 py-0.5 font-sans text-xs uppercase font-semibold border rounded-sm ${
                          form.isPublished
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                            : "border-border bg-accent-1 text-accent-6"
                        }`}
                      >
                        {form.isPublished ? "Published" : "Draft"}
                      </span>
                      <span className="font-sans text-xs text-accent-6">
                        {form.responseCount || 0} responses
                      </span>

                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <button
                              type="button"
                              onClick={(e) => e.stopPropagation()}
                              className="rounded-xs p-1 text-accent-5 hover:bg-accent-1 hover:text-foreground transition-colors outline-none"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          }
                        />
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditForm(form);
                            }}
                          >
                            <Edit3 className="mr-2 h-3.5 w-3.5" />
                            <span>Edit Form</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewResponses(form);
                            }}
                          >
                            <Eye className="mr-2 h-3.5 w-3.5" />
                            <span>View Responses</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              onShareForm(form);
                            }}
                          >
                            <Share2 className="mr-2 h-3.5 w-3.5" />
                            <span>Copy Link / SDK Code</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteForm(form._id || form.id);
                            }}
                          >
                            <Trash2 className="mr-2 h-3.5 w-3.5" />
                            <span>Delete Form</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
