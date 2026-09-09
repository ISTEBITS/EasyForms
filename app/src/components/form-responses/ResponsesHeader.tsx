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
  Eye,
  LayoutGrid,
  FileSpreadsheet,
  ChevronDown,
  ExternalLink,
  Settings,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Form, UserFormAccess, CollaboratorPresence, GoogleSheetIntegration } from "@/types/form";
import {
  DEFAULT_STATUS_OPTIONS,
  STATUS_COLORS,
  type StatusOption,
} from "./StatusManagerModal";

export type ViewMode = "sheet" | "analytics";
export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface ResponsesHeaderProps {
  form: Form;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  totalResponses: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: any) => void;
  statusOptions?: StatusOption[];
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
  onOpenGoogleSheetModal: () => void;
  onSyncGoogleSheet: () => void;
  isSyncingGoogleSheet: boolean;
  googleSheetConfig?: GoogleSheetIntegration;
}

export const ResponsesHeader: React.FC<ResponsesHeaderProps> = ({
  form,
  viewMode,
  onViewModeChange,
  totalResponses: _totalResponses,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  statusOptions = DEFAULT_STATUS_OPTIONS,
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
  onOpenGoogleSheetModal,
  onSyncGoogleSheet,
  isSyncingGoogleSheet,
  googleSheetConfig,
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
    <header className="sticky top-14 z-30 -mx-4 lg:-mx-6 px-4 lg:px-6 py-3 bg-background border-b border-border font-sans space-y-3 shadow-2xs">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between gap-3">
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


            {/* View-Only Badge for Viewers */}
            {isViewer && (
              <span className="inline-flex items-center gap-1 rounded-sm border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-sm font-medium text-amber-500 font-sans py-1">
                <Eye className="h-3.5 w-3.5" />
              </span>
            )}

            {/* Google Sheets-style Auto-Save Status Indicator */}
            {!isViewer && saveStatus === "idle" && (
              <span className="hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 text-sm font-sans text-accent-5 max-w-15">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>saved</span>
              </span>
            )}

            {!isViewer && saveStatus === "saving" && (
              <span className="hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 text-sm font-sans text-accent-5 animate-pulse max-w-15">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <span>Saving...</span>
              </span>
            )}
            {!isViewer && saveStatus === "saved" && (
              <span className="hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 text-sm font-sans text-accent-5 max-w-15">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>saved</span>
              </span>
            )}
            {!isViewer && saveStatus === "error" && (
              <span className="hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 text-sm font-sans text-red-500 max-w-15">
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
                          className={`relative flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-white text-sm font-bold shadow-xs cursor-pointer select-none transition-transform hover:scale-110 hover:z-20 ${isSelf ? "border-foreground ring-1 ring-background" : "border-background"
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
              {collaboratorCount > 0 && (
                <span className="ml-1 inline-flex h-4 items-center justify-center rounded-xs bg-accent-2 px-1.5 text-sm font-sans text-foreground font-medium">
                  {collaboratorCount}
                </span>
              )}
            </Button>
          )}

          {/* Google Sheets Sync Integration (Connect or Sync) */}
          {!isViewer && (
            <div className="flex items-center gap-1">
              {!googleSheetConfig?.connected ? (
                /* Disconnected state: Sheet logo + "Google" */
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onOpenGoogleSheetModal}
                  className="rounded-sm gap-1.5 font-sans h-8 text-sm hover:border-emerald-500/50 hover:bg-emerald-500/5"
                  title="Connect Google Sheet"
                >
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Google</span>
                </Button>
              ) : (
                /* Connected state: transforms into "Sync" with spin loading */
                <div className="flex items-center rounded-sm border border-border bg-background p-0.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onSyncGoogleSheet}
                    disabled={isSyncingGoogleSheet}
                    className="rounded-xs gap-1.5 font-sans h-7 text-sm px-2.5 hover:bg-accent-1"
                    title={
                      googleSheetConfig.lastSyncedAt
                        ? `Last synced: ${new Date(googleSheetConfig.lastSyncedAt).toLocaleTimeString()}`
                        : "Sync responses to Google Sheet"
                    }
                  >
                    <RefreshCw
                      className={`h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 ${isSyncingGoogleSheet ? "animate-spin" : ""
                        }`}
                    />
                    <span>{isSyncingGoogleSheet ? "Syncing..." : "Sync"}</span>
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <button
                          type="button"
                          className="flex h-7 w-5 items-center justify-center rounded-xs text-accent-5 hover:bg-accent-1 hover:text-foreground transition-colors cursor-pointer"
                          title="Google Sheet Settings"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                      }
                    />
                    <DropdownMenuContent align="end" className="w-52">
                      {googleSheetConfig.sheetUrl && (
                        <DropdownMenuItem
                          onClick={() => window.open(googleSheetConfig.sheetUrl, "_blank", "noopener,noreferrer")}
                        >
                          <ExternalLink className="mr-2 h-4 w-4 text-emerald-500" />
                          <span>Open Google Sheet</span>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={onOpenGoogleSheetModal}>
                        <Settings className="mr-2 h-4 w-4 text-accent-6" />
                        <span>Sheet & Sync Settings</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          )}

          {/* Export / Import (Import only for editors/owners) */}
          <div className="flex items-center gap-1">
            {!isViewer && (
              <Button
                variant="outline"
                size="sm"
                onClick={onImport}
                className="rounded-sm gap-1.5 font-sans h-8 text-sm"
                title="Import CSV Responses"
              >
                <Upload className="h-3.5 w-3.5 text-accent-5" />
              </Button>
            )}
            <div className="relative group">
              <Button
                variant="outline"
                size="sm"
                className="rounded-sm gap-1.5 font-sans h-8 text-sm"
                onClick={() => onExport("csv")}
              >
                <Download className="h-3.5 w-3.5 text-accent-5" />
              </Button>
            </div>
          </div>

          {/* Add Row Manual Entry (Only for editors/owners) */}
          {!isViewer && (
            <Button
              size="sm"
              onClick={onAddRow}
              className="rounded-sm gap-1.5 bg-foreground text-background hover:bg-accent-7 font-sans h-8 text-sm"
            >
              <Plus className="h-3.5 w-3.5" />
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

          {/* Dynamic Status Filter Dropdown */}
          <div className="flex items-center gap-2">
            <Select
              value={statusFilter}
              onValueChange={(val) => onStatusFilterChange(val || "all")}
            >
              <SelectTrigger className="h-8 min-w-[160px] text-sm font-sans bg-background border-border gap-2">
                <Filter className="h-3.5 w-3.5 text-accent-5 shrink-0" />
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent className="bg-background text-sm font-sans border-border">
                <SelectItem value="all" className="cursor-pointer text-sm font-sans">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-accent-4" />
                    <span>All Statuses</span>
                  </span>
                </SelectItem>
                {statusOptions.map((opt) => {
                  const colorConfig = STATUS_COLORS[opt.colorKey] || STATUS_COLORS.gray;
                  return (
                    <SelectItem key={opt.id} value={opt.id} className="cursor-pointer text-sm font-sans">
                      <span className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${colorConfig.previewBg}`} />
                        <span>{opt.label}</span>
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </header>
  );
};
