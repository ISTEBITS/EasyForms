import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Table as TableIcon,
  BarChart3,
  Share2,
  Download,
  Upload,
  Plus,
  RefreshCw,
  Search,
  ChevronLeft,
  Check,
  Eye,
  LayoutGrid,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Form, ResponseStatus, UserFormAccess, CollaboratorPresence } from "@/types/form";

export type ViewMode = "sheet" | "analytics";
export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface ResponsesHeaderProps {
  form: Form;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  totalResponses: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: ResponseStatus | "all";
  onStatusFilterChange: (status: ResponseStatus | "all") => void;
  onAddRow: () => void;
  onImport: () => void;
  onExport: (format: "csv" | "json") => void;
  onOpenShare: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onBack: () => void;
  collaboratorCount: number;
  saveStatus?: SaveStatus;
  currentUserAccess?: UserFormAccess;
  onlineCollaborators?: CollaboratorPresence[];
  currentClientId?: string;
  currentUserEmail?: string;
  currentUserId?: string;
}

export const ResponsesHeader: React.FC<ResponsesHeaderProps> = ({
  form,
  viewMode,
  onViewModeChange,
  totalResponses,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onAddRow,
  onImport,
  onExport,
  onOpenShare,
  onRefresh,
  isRefreshing,
  onBack,
  collaboratorCount,
  saveStatus = "idle",
  currentUserAccess,
  onlineCollaborators = [],
  currentClientId,
  currentUserEmail,
  currentUserId,
}) => {
  const navigate = useNavigate();
  const isViewer = currentUserAccess ? !currentUserAccess.canEdit : false;
  const canManageCollaborators = currentUserAccess ? currentUserAccess.canManageCollaborators : true;

  // Deduplicate collaborators by user identity (email or userId)
  const uniqueCollaborators = React.useMemo(() => {
    const map = new Map<string, CollaboratorPresence>();
    for (const c of onlineCollaborators) {
      const key = (c.email || c.userId || c.clientId).toLowerCase();
      if (!map.has(key)) {
        map.set(key, { ...c });
      } else {
        const existing = map.get(key)!;
        if (c.activeCell) {
          existing.activeCell = c.activeCell;
        }
      }
    }
    return Array.from(map.values());
  }, [onlineCollaborators]);

  return (
    <header className="space-y-3 pb-3 border-b border-border font-sans">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <button
            onClick={onBack}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-border bg-background text-accent-5 hover:bg-accent-1 hover:text-foreground transition-colors cursor-pointer"
            title="Back"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="h-4 w-px bg-border flex-shrink-0 hidden sm:block" />

          {/* Segmented Form Navigation Pill [Builder | Responses] */}
          <div className="flex items-center rounded-sm bg-accent-1 border border-border p-0.5 shrink-0">
            <button
              type="button"
              onClick={() => navigate(`/editor/${form.id || form._id}${window.location.search || ""}`)}
              className="px-3 py-1 rounded-xs text-sm font-medium text-accent-5 hover:text-foreground hover:bg-accent-2/50 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Builder</span>
            </button>
            <button
              type="button"
              className="px-3 py-1 rounded-xs text-sm font-medium bg-background text-foreground shadow-xs flex items-center gap-1.5 transition-all"
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Responses</span>
            </button>
          </div>

          <div className="min-w-0 flex items-center gap-2">
            <h1 className="truncate text-sm sm:text-base font-semibold text-foreground font-sans tracking-tight max-w-xs sm:max-w-sm">
              {form.title || "Untitled Form"}
            </h1>
            <span className="hidden sm:inline-flex items-center rounded-sm border border-border bg-accent-1 px-2.5 py-0.5 text-sm font-sans text-accent-6">
              {totalResponses} {totalResponses === 1 ? "response" : "responses"}
            </span>

            {/* View-Only Badge for Viewers */}
            {isViewer && (
              <span className="inline-flex items-center gap-1 rounded-sm border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-sm font-medium text-amber-500 font-sans">
                <Eye className="h-3.5 w-3.5" />
                <span>View only</span>
              </span>
            )}

            {/* Google Sheets-style Auto-Save Status Indicator */}
            {!isViewer && saveStatus === "saving" && (
              <span className="hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 text-sm font-sans text-accent-5 animate-pulse">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <span>Saving...</span>
              </span>
            )}
            {!isViewer && saveStatus === "saved" && (
              <span className="hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 text-sm font-sans text-accent-5">
                <Check className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
                <span>All changes saved</span>
              </span>
            )}
            {!isViewer && saveStatus === "error" && (
              <span className="hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 text-sm font-sans text-red-500">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                <span>Failed to save</span>
              </span>
            )}
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Live Collaborator Avatars (Google Sheets style, 1 per user) */}
          {uniqueCollaborators.length > 0 && (
            <div className="flex items-center -space-x-1.5 overflow-hidden pl-1">
              {uniqueCollaborators.map((c) => {
                const isSelf =
                  (currentClientId && c.clientId === currentClientId) ||
                  (currentUserEmail && c.email && c.email.toLowerCase() === currentUserEmail.toLowerCase()) ||
                  (currentUserId && c.userId && c.userId === currentUserId);

                const initials = (c.name || c.email || "C")
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .substring(0, 2)
                  .toUpperCase();

                const activityDesc = c.activeCell
                  ? `Editing Row ${c.activeCell.rowIndex + 1}, Col ${c.activeCell.colIndex + 1}`
                  : "Viewing";

                return (
                  <TooltipProvider key={c.email || c.userId || c.clientId} delay={100}>
                    <Tooltip>
                      <TooltipTrigger>
                        <div
                          style={{ backgroundColor: c.color }}
                          className={`relative flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-white text-sm font-bold shadow-xs cursor-pointer select-none transition-transform hover:scale-110 hover:z-20 ${
                            isSelf ? "border-foreground ring-1 ring-background" : "border-background"
                          }`}
                        >
                          {initials}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-sm">
                        <div className="font-semibold">
                          {c.name} {isSelf ? "(You)" : ""} {c.email ? `(${c.email})` : ""}
                        </div>
                        <div className="text-accent-3 text-sm flex items-center gap-1 mt-0.5">
                          <span className="inline-block size-1.5 rounded-full" style={{ backgroundColor: c.color }} />
                          {activityDesc}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          )}

          {/* View Mode Toggle */}
          <div className="inline-flex items-center rounded-sm border border-border bg-accent-1/50 p-0.5">
            <button
              onClick={() => onViewModeChange("sheet")}
              className={`inline-flex items-center gap-1.5 rounded-xs px-2.5 py-1 text-sm font-medium transition-all ${viewMode === "sheet"
                  ? "bg-background text-foreground shadow-2xs"
                  : "text-accent-5 hover:text-foreground"
                }`}
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span>Sheet</span>
            </button>
            <button
              onClick={() => onViewModeChange("analytics")}
              className={`inline-flex items-center gap-1.5 rounded-xs px-2.5 py-1 text-sm font-medium transition-all ${viewMode === "analytics"
                  ? "bg-background text-foreground shadow-2xs"
                  : "text-accent-5 hover:text-foreground"
                }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span>Analytics</span>
            </button>
          </div>

          {/* Share / Collaborate (Only for owner/admin) */}
          {canManageCollaborators && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenShare}
              className="rounded-sm gap-1.5 font-sans h-8 text-sm"
            >
              <Share2 className="h-3.5 w-3.5 text-accent-6" />
              <span>Share</span>
              {collaboratorCount > 0 && (
                <span className="ml-1 inline-flex h-4 items-center justify-center rounded-xs bg-accent-2 px-1.5 text-sm font-sans text-foreground font-medium">
                  {collaboratorCount}
                </span>
              )}
            </Button>
          )}

          {/* Export / Import (Import only for editors/owners) */}
          <div className="flex items-center gap-1">
            {!isViewer && (
              <Button
                variant="outline"
                size="xs"
                onClick={onImport}
                className="rounded-sm gap-1.5 font-sans h-8"
                title="Import CSV Responses"
              >
                <Upload className="h-3.5 w-3.5 text-accent-5" />
                <span className="hidden sm:inline">Import</span>
              </Button>
            )}
            <div className="relative group">
              <Button
                variant="outline"
                size="xs"
                className="rounded-sm gap-1.5 font-sans h-8"
                onClick={() => onExport("csv")}
              >
                <Download className="h-3.5 w-3.5 text-accent-5" />
                <span>Export</span>
              </Button>
            </div>
          </div>

          {/* Add Row Manual Entry (Only for editors/owners) */}
          {!isViewer && (
            <Button
              size="xs"
              onClick={onAddRow}
              className="rounded-sm gap-1.5 bg-foreground text-background hover:bg-accent-7 font-sans h-8"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Add Row</span>
            </Button>
          )}

          {/* Refresh */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-8 w-8 rounded-sm text-accent-5 hover:text-foreground"
            title="Reload responses"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar for Sheet View */}
      {viewMode === "sheet" && (
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-accent-4" />
            <input
              type="text"
              placeholder="Search responses, emails, answers..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-8 w-full rounded-sm border border-border bg-background pl-8 pr-3 text-sm font-sans text-foreground placeholder:text-accent-4 focus:outline-none focus:ring-1 focus:ring-foreground"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 hide-scrollbar">
            {(["all", "unreviewed", "reviewed", "approved", "flagged"] as const).map((status) => (
              <button
                key={status}
                onClick={() => onStatusFilterChange(status)}
                className={`rounded-sm px-2.5 py-1 text-sm font-medium capitalize transition-colors ${statusFilter === status
                    ? "bg-foreground text-background"
                    : "border border-border bg-background text-accent-5 hover:bg-accent-1 hover:text-foreground"
                  }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};
