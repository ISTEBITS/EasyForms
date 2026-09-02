import { useCallback, useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { ApiError, formsApi } from "@/api";
import type {
  Form,
  FormResponse,
  Question,
  Answer,
  ResponseStatus,
  CollaboratorRole,
} from "@/types/form";
import { useAuth } from "@/context/auth";
import {
  DASHBOARD_SCOPE_PARAM,
  isFormInDashboardScope,
  normalizeDashboardScope,
} from "@/lib/dashboard-scope";
import { ResponsesSkeleton } from "@/components/ui/skeleton-new";
import {
  ResponsesHeader,
  type ViewMode,
  ResponsesSheetGrid,
  ResponseDetailDrawer,
  ResponsesSummaryAnalytics,
  ResponsesShareModal,
  ManualResponseModal,
  ImportResponsesModal,
} from "@/components/form-responses";

export const FormResponses = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const selectedScope = normalizeDashboardScope(
    searchParams.get(DASHBOARD_SCOPE_PARAM),
  );
  const scopeSearch =
    isAdmin && selectedScope.startsWith("test:")
      ? `?${DASHBOARD_SCOPE_PARAM}=${encodeURIComponent(selectedScope)}`
      : "";

  const [form, setForm] = useState<Form | null>(null);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>("sheet");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ResponseStatus | "all">("all");
  const [sortColumn, setSortColumn] = useState<string | null>("submittedAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Selection state
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);

  // Modals / Drawer state
  const [selectedDetailResponse, setSelectedDetailResponse] = useState<FormResponse | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const fetchData = useCallback(
    async (showGlobalLoader = false) => {
      if (!id) {
        setError("Invalid form URL");
        setLoading(false);
        setRefreshing(false);
        return;
      }

      try {
        if (showGlobalLoader) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }
        const [formData, responsesData] = await Promise.all([
          formsApi.getByIdAdmin(id),
          formsApi.getResponses(id),
        ]);

        if (!isFormInDashboardScope(formData, isAdmin, selectedScope)) {
          setError("This form is outside the selected dashboard scope");
          setForm(null);
          setResponses([]);
          return;
        }

        setForm(formData);
        setResponses(responsesData);
      } catch (err: unknown) {
        const message =
          err instanceof ApiError ? err.message : "Failed to load responses";
        setError(message);

        if (err instanceof ApiError && err.status === 401) {
          navigate("/login");
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id, isAdmin, navigate, selectedScope],
  );

  useEffect(() => {
    void fetchData(true);
  }, [fetchData]);

  const questions = useMemo(
    () => (form?.questions ?? []).filter((q) => q.type !== "section_break"),
    [form?.questions],
  );

  // Filtered and sorted responses
  const processedResponses = useMemo(() => {
    let list = Array.isArray(responses) ? [...responses] : [];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((r) => {
        const emailMatch = r.respondentEmail?.toLowerCase().includes(q);
        const notesMatch = r.notes?.some((n) => n.text.toLowerCase().includes(q));
        const answersMatch = r.answers?.some((a) => {
          if (Array.isArray(a.value)) return a.value.some((v) => String(v).toLowerCase().includes(q));
          return String(a.value ?? "").toLowerCase().includes(q);
        });
        return emailMatch || notesMatch || answersMatch;
      });
    }

    // Status filter
    if (statusFilter !== "all") {
      list = list.filter((r) => (r.status || "unreviewed") === statusFilter);
    }

    // Sort
    if (sortColumn) {
      list.sort((a, b) => {
        let valA: unknown = "";
        let valB: unknown = "";

        if (sortColumn === "submittedAt") {
          valA = new Date(a.submittedAt).getTime();
          valB = new Date(b.submittedAt).getTime();
        } else if (sortColumn === "respondentEmail") {
          valA = a.respondentEmail || "";
          valB = b.respondentEmail || "";
        } else if (sortColumn === "status") {
          valA = a.status || "unreviewed";
          valB = b.status || "unreviewed";
        } else {
          // Question column
          const ansA = a.answers?.find((ans) => ans.questionId === sortColumn)?.value;
          const ansB = b.answers?.find((ans) => ans.questionId === sortColumn)?.value;
          valA = Array.isArray(ansA) ? ansA.join(", ") : (ansA ?? "");
          valB = Array.isArray(ansB) ? ansB.join(", ") : (ansB ?? "");
        }

        if (typeof valA === "number" && typeof valB === "number") {
          return sortDirection === "asc" ? valA - valB : valB - valA;
        }

        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();
        return sortDirection === "asc" ? strA.localeCompare(strB) : strB.localeCompare(strA);
      });
    }

    return list;
  }, [responses, searchQuery, statusFilter, sortColumn, sortDirection]);

  // Selection handlers
  const handleSelectRow = (rowId: string, selected: boolean) => {
    setSelectedRowIds((prev) =>
      selected ? [...prev, rowId] : prev.filter((id) => id !== rowId)
    );
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedRowIds(processedResponses.map((r) => r.id || r._id || ""));
    } else {
      setSelectedRowIds([]);
    }
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // Cell Update
  const handleUpdateCell = async (responseId: string, questionId: string, value: unknown) => {
    if (!form) return;
    try {
      const currentResponse = responses.find((r) => (r.id || r._id) === responseId);
      if (!currentResponse) return;

      if (questionId === "__email__") {
        const updated = await formsApi.updateResponse(form.id, responseId, {
          respondentEmail: String(value || "").trim(),
        });
        setResponses((prev) =>
          prev.map((r) => ((r.id || r._id) === responseId ? updated : r))
        );
        toast.success("Cell updated");
        return;
      }

      const existingAnswers = [...currentResponse.answers];
      const answerIndex = existingAnswers.findIndex((a) => a.questionId === questionId);

      if (answerIndex >= 0) {
        existingAnswers[answerIndex] = {
          ...existingAnswers[answerIndex],
          value: value as Answer["value"],
        };
      } else {
        existingAnswers.push({ questionId, value: value as Answer["value"] });
      }

      const updated = await formsApi.updateResponse(form.id, responseId, {
        answers: existingAnswers,
      });

      setResponses((prev) =>
        prev.map((r) => ((r.id || r._id) === responseId ? updated : r))
      );
      toast.success("Cell updated");
    } catch {
      toast.error("Failed to update cell");
    }
  };

  // Status Update
  const handleUpdateStatus = async (responseId: string, status: ResponseStatus) => {
    if (!form) return;
    try {
      const updated = await formsApi.updateResponse(form.id, responseId, { status });
      setResponses((prev) =>
        prev.map((r) => ((r.id || r._id) === responseId ? updated : r))
      );
      if (selectedDetailResponse && (selectedDetailResponse.id || selectedDetailResponse._id) === responseId) {
        setSelectedDetailResponse(updated);
      }
      toast.success(`Status set to ${status}`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  // Delete Single Row
  const handleDeleteRow = async (responseId: string) => {
    if (!form) return;
    try {
      await formsApi.deleteResponse(form.id, responseId);
      setResponses((prev) => prev.filter((r) => (r.id || r._id) !== responseId));
      setSelectedRowIds((prev) => prev.filter((id) => id !== responseId));
      if (selectedDetailResponse && (selectedDetailResponse.id || selectedDetailResponse._id) === responseId) {
        setSelectedDetailResponse(null);
      }
      toast.success("Response deleted");
    } catch {
      toast.error("Failed to delete response");
    }
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (!form || selectedRowIds.length === 0) return;
    try {
      await formsApi.bulkDeleteResponses(form.id, selectedRowIds);
      setResponses((prev) => prev.filter((r) => !selectedRowIds.includes(r.id || r._id || "")));
      setSelectedRowIds([]);
      toast.success("Selected responses deleted");
    } catch {
      toast.error("Failed to delete responses");
    }
  };

  // Bulk Status Update
  const handleBulkUpdateStatus = async (status: ResponseStatus) => {
    if (!form || selectedRowIds.length === 0) return;
    try {
      await formsApi.bulkUpdateResponseStatus(form.id, selectedRowIds, status);
      setResponses((prev) =>
        prev.map((r) =>
          selectedRowIds.includes(r.id || r._id || "") ? { ...r, status } : r
        )
      );
      toast.success(`Marked ${selectedRowIds.length} responses as ${status}`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  // Add Note on Response
  const handleAddNote = async (responseId: string, noteText: string) => {
    if (!form) return;
    try {
      const updated = await formsApi.updateResponse(form.id, responseId, { newNote: noteText });
      setResponses((prev) =>
        prev.map((r) => ((r.id || r._id) === responseId ? updated : r))
      );
      setSelectedDetailResponse(updated);
      toast.success("Note added");
    } catch {
      toast.error("Failed to add note");
    }
  };

  // Manual Row Insert
  const handleManualCreateResponse = async (data: {
    answers: Answer[];
    respondentEmail?: string;
    respondentName?: string;
    status: ResponseStatus;
  }) => {
    if (!form) return;
    try {
      const newResp = await formsApi.manualCreateResponse(form.id, data);
      setResponses((prev) => [newResp, ...prev]);
      toast.success("New response row added");
      return newResp;
    } catch {
      toast.error("Failed to create response");
    }
  };

  // CSV Import
  const handleImportRows = async (
    rows: Array<{ answers: Answer[]; respondentEmail?: string }>
  ) => {
    if (!form) return;
    for (const row of rows) {
      await formsApi.manualCreateResponse(form.id, {
        answers: row.answers,
        respondentEmail: row.respondentEmail,
        status: "reviewed",
      });
    }
    await fetchData(false);
  };

  // Collaborator Management
  const handleAddCollaborator = async (email: string, role: CollaboratorRole) => {
    if (!form) return;
    const updatedCollaborators = await formsApi.addCollaborator(form.id, email, role);
    setForm((prev) => prev ? { ...prev, collaborators: updatedCollaborators } : null);
  };

  const handleRemoveCollaborator = async (collaboratorId: string) => {
    if (!form) return;
    const updatedCollaborators = await formsApi.removeCollaborator(form.id, collaboratorId);
    setForm((prev) => prev ? { ...prev, collaborators: updatedCollaborators } : null);
    toast.success("Collaborator access removed");
  };

  const handleUpdateShareSettings = async (isPublic: boolean, permission: "viewer" | "editor") => {
    if (!form) return;
    const updatedShare = await formsApi.updateShareSettings(form.id, {
      isPublicShareEnabled: isPublic,
      publicPermission: permission,
    });
    setForm((prev) => prev ? { ...prev, shareSettings: updatedShare } : null);
    toast.success("Sharing settings updated");
  };

  // Export
  const handleExport = (format: "csv" | "json") => {
    if (!form || responses.length === 0) return;

    if (format === "json") {
      const jsonContent = JSON.stringify(responses, null, 2);
      const blob = new Blob([jsonContent], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${form.title}_responses.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Exported JSON");
      return;
    }

    // CSV Export
    const headers = [
      "ID",
      "Status",
      "Submission Date",
      "Respondent Email",
      ...questions.map((q: Question) => `"${q.title.replace(/"/g, '""')}"`),
    ];

    const rows = responses.map((response) => {
      const idStr = `"${response.id || response._id || ""}"`;
      const statusStr = `"${response.status || "unreviewed"}"`;
      const date = `"${new Date(response.submittedAt).toLocaleString()}"`;
      const email = `"${response.respondentEmail || "Anonymous"}"`;
      const answers = questions.map((q: Question) => {
        const answerObj = response.answers?.find((a: Answer) => a.questionId === q.id);
        let val = answerObj ? answerObj.value : "";
        if (Array.isArray(val)) val = val.join(", ");
        val = String(val ?? "").replace(/"/g, '""');
        return `"${val}"`;
      });

      return [idStr, statusStr, date, email, ...answers].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${form.title}_responses.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Exported CSV");
  };

  if (loading) {
    return <ResponsesSkeleton />;
  }

  if (error || !form) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <div className="w-full max-w-md rounded-md border border-border bg-background p-6 text-center shadow-xs">
          <h2 className="text-base font-semibold text-foreground font-sans">
            Failed to Load Responses
          </h2>
          <p className="mt-2 text-xs text-accent-5">{error || "Form not found"}</p>
          <button
            onClick={() => navigate(`/dashboard${scopeSearch}`)}
            className="mt-4 rounded-sm border border-border bg-accent-1 px-4 py-2 text-xs font-medium text-foreground transition-all hover:bg-accent-2 cursor-pointer font-sans"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[75vh] p-4 lg:p-6 space-y-4">
      {/* Header Toolbar */}
      <ResponsesHeader
        form={form}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        totalResponses={responses.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onAddRow={() => setIsManualModalOpen(true)}
        onImport={() => setIsImportModalOpen(true)}
        onExport={handleExport}
        onOpenShare={() => setIsShareModalOpen(true)}
        onRefresh={() => void fetchData(false)}
        isRefreshing={refreshing}
        onBack={() => navigate(`/dashboard${scopeSearch}`)}
        collaboratorCount={form.collaborators?.length || 0}
      />

      {/* Main View Area */}
      <main>
        {viewMode === "sheet" ? (
          <ResponsesSheetGrid
            responses={processedResponses}
            questions={questions}
            selectedRowIds={selectedRowIds}
            onSelectRow={handleSelectRow}
            onSelectAll={handleSelectAll}
            onUpdateCell={handleUpdateCell}
            onUpdateStatus={handleUpdateStatus}
            onDeleteRow={handleDeleteRow}
            onOpenDetail={setSelectedDetailResponse}
            onBulkDelete={handleBulkDelete}
            onBulkUpdateStatus={handleBulkUpdateStatus}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSort={handleSort}
            onAddRow={() => setIsManualModalOpen(true)}
            onCreateRow={handleManualCreateResponse}
          />
        ) : (
          <ResponsesSummaryAnalytics
            responses={responses}
            questions={questions}
          />
        )}
      </main>

      {/* Detail & Notes Inspector Drawer */}
      <ResponseDetailDrawer
        response={selectedDetailResponse}
        questions={questions}
        onClose={() => setSelectedDetailResponse(null)}
        onUpdateAnswer={handleUpdateCell}
        onUpdateStatus={handleUpdateStatus}
        onAddNote={handleAddNote}
        onDelete={handleDeleteRow}
      />

      {/* Collaboration / Share Modal */}
      <ResponsesShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        form={form}
        onAddCollaborator={handleAddCollaborator}
        onRemoveCollaborator={handleRemoveCollaborator}
        onUpdateShareSettings={handleUpdateShareSettings}
      />

      {/* Manual Row Entry Modal */}
      <ManualResponseModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        questions={questions}
        onSubmit={async (data) => {
          await handleManualCreateResponse(data);
        }}
      />

      {/* CSV Import Modal */}
      <ImportResponsesModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        questions={questions}
        onImportRows={handleImportRows}
      />
    </div>
  );
};

