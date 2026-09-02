import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  ChevronUp,
  ChevronDown,
  MoreHorizontal,
  Trash2,
  Eye,
  FileText,
  MessageSquare,
  Settings,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FormResponse, Question, ResponseStatus, Answer, CollaboratorPresence } from "@/types/form";
import {
  StatusManagerModal,
  DEFAULT_STATUS_OPTIONS,
  STATUS_COLORS,
  type StatusOption,
} from "./StatusManagerModal";

interface ResponsesSheetGridProps {
  responses: FormResponse[];
  questions: Question[];
  selectedRowIds: string[];
  onSelectRow: (id: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onUpdateCell: (responseId: string, questionId: string, value: unknown) => Promise<void>;
  onUpdateStatus: (responseId: string, status: ResponseStatus) => Promise<void>;
  onDeleteRow: (responseId: string) => Promise<void>;
  onOpenDetail: (response: FormResponse) => void;
  onBulkDelete: () => Promise<void>;
  onBulkUpdateStatus: (status: ResponseStatus) => Promise<void>;
  sortColumn: string | null;
  sortDirection: "asc" | "desc";
  onSort: (column: string) => void;
  onAddRow?: () => void;
  onCreateRow?: (data: {
    answers: Answer[];
    respondentEmail?: string;
    status: ResponseStatus;
  }) => Promise<FormResponse | undefined>;
  canEdit?: boolean;
  remoteCursors?: Record<string, CollaboratorPresence>;
  onActiveCellChange?: (cell: { rowKey: string; rowIndex: number; colIndex: number; questionId?: string } | null) => void;
}

export const ResponsesSheetGrid: React.FC<ResponsesSheetGridProps> = ({
  responses,
  questions,
  selectedRowIds,
  onSelectRow,
  onSelectAll,
  onUpdateCell,
  onUpdateStatus,
  onDeleteRow,
  onOpenDetail,
  onBulkDelete,
  onBulkUpdateStatus,
  sortColumn,
  sortDirection,
  onSort,
  onCreateRow,
  canEdit = true,
  remoteCursors = {},
  onActiveCellChange,
}) => {
  // Status Options with persistence
  const [statusOptions, setStatusOptions] = useState<StatusOption[]>(() => {
    try {
      const saved = localStorage.getItem("easyforms_custom_statuses");
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_STATUS_OPTIONS;
  });
  const [isStatusManagerOpen, setIsStatusManagerOpen] = useState(false);

  // Cell inline editing state
  const [editingCell, setEditingCell] = useState<{
    rowKey: string; // row id or "empty_rowIndex"
    questionId: string; // question id or "__email__"
    rowIndex: number;
    colIndex: number; // 0 for email, 1..N for questions
    isNewRow: boolean;
    initialValue: string;
  } | null>(null);

  const [editValue, setEditValue] = useState<string>("");
  const [activeCell, setActiveCell] = useState<{ rowIndex: number; colIndex: number } | null>(null);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState<string | null>(null);
  const [activeMenuRowId, setActiveMenuRowId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const gridContainerRef = useRef<HTMLDivElement>(null);

  const allSelected = responses.length > 0 && selectedRowIds.length === responses.length;
  const isPartiallySelected = selectedRowIds.length > 0 && !allSelected;

  // Minimum grid rows to emulate full Google Sheets / Excel experience (only for editors)
  const minGridRows = Math.max(25, responses.length + 8);
  const emptyRowsCount = canEdit ? Math.max(0, minGridRows - responses.length) : 0;

  // Column definitions for cell navigation: [Email, ...questions]
  const columnCount = 1 + questions.length;

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  // Click outside and window blur listener to clear active cursor presence
  useEffect(() => {
    const handleDocumentMouseDown = (e: MouseEvent) => {
      if (gridContainerRef.current && !gridContainerRef.current.contains(e.target as Node)) {
        setActiveCell(null);
        setEditingCell(null);
        onActiveCellChange?.(null);
      }
    };

    const handleWindowBlur = () => {
      onActiveCellChange?.(null);
    };

    document.addEventListener("mousedown", handleDocumentMouseDown);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      document.removeEventListener("mousedown", handleDocumentMouseDown);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [onActiveCellChange]);

  const handleSaveStatusOptions = (newOptions: StatusOption[]) => {
    setStatusOptions(newOptions);
    try {
      localStorage.setItem("easyforms_custom_statuses", JSON.stringify(newOptions));
    } catch {
      // ignore
    }
  };

  const getStatusInfo = useCallback(
    (stValue: string) => {
      const match = statusOptions.find(
        (opt) =>
          opt.id === stValue ||
          opt.label.toLowerCase() === (stValue || "").toLowerCase()
      );
      if (match) {
        const color = STATUS_COLORS[match.colorKey] || STATUS_COLORS.gray;
        return {
          id: match.id,
          label: match.label,
          bg: color.bg,
          text: color.text,
          border: color.border,
        };
      }
      return {
        id: stValue || "unreviewed",
        label: stValue || "Unreviewed",
        bg: STATUS_COLORS.gray.bg,
        text: STATUS_COLORS.gray.text,
        border: STATUS_COLORS.gray.border,
      };
    },
    [statusOptions]
  );

  // Start editing a specific cell
  const startEditingCell = useCallback(
    (rowKey: string, questionId: string, initialVal: string, rowIndex: number, colIndex: number, isNewRow: boolean) => {
      if (!canEdit) return;
      setEditValue(initialVal);
      setEditingCell({
        rowKey,
        questionId,
        rowIndex,
        colIndex,
        isNewRow,
        initialValue: initialVal,
      });
      setActiveCell({ rowIndex, colIndex });
      onActiveCellChange?.({ rowKey, rowIndex, colIndex, questionId });
    },
    [canEdit, onActiveCellChange]
  );

  const handleSelectActiveCell = useCallback(
    (rowKey: string, questionId: string, rowIndex: number, colIndex: number) => {
      setActiveCell({ rowIndex, colIndex });
      onActiveCellChange?.({ rowKey, rowIndex, colIndex, questionId });
    },
    [onActiveCellChange]
  );

  // Commit and save cell edit
  const handleSaveCell = async (nextMove?: "down" | "right" | "left") => {
    if (!editingCell) return;
    const cellToSave = editingCell;
    const { rowKey, questionId, rowIndex, colIndex, isNewRow, initialValue } = cellToSave;
    const currentVal = editValue;
    const trimmedVal = currentVal.trim();

    // Clear editingCell immediately so onBlur does not trigger a duplicate save
    setEditingCell(null);

    try {
      if (isNewRow) {
        if (trimmedVal !== "" && onCreateRow) {
          const answers: Answer[] =
            questionId !== "__email__"
              ? [{ questionId, value: trimmedVal }]
              : [];
          const respondentEmail =
            questionId === "__email__" ? trimmedVal : undefined;

          await onCreateRow({
            answers,
            respondentEmail,
            status: "unreviewed",
          });
        }
      } else if (currentVal !== initialValue) {
        // Only trigger database call if the cell value actually changed
        await onUpdateCell(rowKey, questionId, currentVal);
      }
    } finally {
      // Handle Google Sheet navigation (Tab / Enter)
      if (nextMove === "down") {
        const nextRowIndex = rowIndex + 1;
        if (nextRowIndex < minGridRows) {
          const nextRowKey =
            nextRowIndex < responses.length
              ? (responses[nextRowIndex].id || responses[nextRowIndex]._id || "")
              : `empty_${nextRowIndex}`;
          const isNextNew = nextRowIndex >= responses.length;
          const nextInitialVal = getCellValue(nextRowIndex, colIndex);
          startEditingCell(nextRowKey, questionId, nextInitialVal, nextRowIndex, colIndex, isNextNew);
        }
      } else if (nextMove === "right") {
        const nextColIndex = (colIndex + 1) % columnCount;
        const nextQuestionId = nextColIndex === 0 ? "__email__" : questions[nextColIndex - 1].id;
        const nextInitialVal = getCellValue(rowIndex, nextColIndex);
        startEditingCell(rowKey, nextQuestionId, nextInitialVal, rowIndex, nextColIndex, isNewRow);
      } else if (nextMove === "left") {
        const nextColIndex = (colIndex - 1 + columnCount) % columnCount;
        const nextQuestionId = nextColIndex === 0 ? "__email__" : questions[nextColIndex - 1].id;
        const nextInitialVal = getCellValue(rowIndex, nextColIndex);
        startEditingCell(rowKey, nextQuestionId, nextInitialVal, rowIndex, nextColIndex, isNewRow);
      }
    }
  };

  const getCellValue = (rIdx: number, cIdx: number): string => {
    if (rIdx >= responses.length) return "";
    const resp = responses[rIdx];
    if (cIdx === 0) return resp.respondentEmail || "";
    const q = questions[cIdx - 1];
    if (!q) return "";
    const ans = resp.answers?.find((a) => a.questionId === q.id);
    const raw = ans?.value;
    if (raw === undefined || raw === null) return "";
    if (Array.isArray(raw)) return raw.join(", ");
    if (typeof raw === "object") {
      return Object.entries(raw as Record<string, string>).map(([k, v]) => `${k}: ${v}`).join("; ");
    }
    return String(raw);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSaveCell("down");
    } else if (e.key === "Tab") {
      e.preventDefault();
      void handleSaveCell(e.shiftKey ? "left" : "right");
    } else if (e.key === "Escape") {
      setEditingCell(null);
      setActiveCell(null);
      onActiveCellChange?.(null);
    }
  };

  return (
    <div ref={gridContainerRef} className="relative space-y-2 font-sans">
      {/* Floating Bulk Actions Bar */}
      {selectedRowIds.length > 0 && (
        <div className="sticky top-2 z-30 flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-foreground px-4 py-2 text-background shadow-lg transition-all animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {selectedRowIds.length} row{selectedRowIds.length > 1 ? "s" : ""} selected
            </span>
            <button
              onClick={() => onSelectAll(false)}
              className="text-sm text-accent-3 hover:text-background underline ml-2 cursor-pointer"
            >
              Deselect all
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-background/10 rounded-sm p-0.5">
              {statusOptions.slice(0, 4).map((st) => (
                <button
                  key={st.id}
                  onClick={() => void onBulkUpdateStatus(st.id as ResponseStatus)}
                  className="rounded-xs px-2.5 py-1 text-sm font-medium capitalize text-background hover:bg-background/20 transition-colors cursor-pointer"
                >
                  Mark {st.label}
                </button>
              ))}
            </div>

            <Button
              size="xs"
              variant="destructive"
              onClick={() => void onBulkDelete()}
              className="rounded-sm gap-1.5 h-7 text-sm cursor-pointer"
            >
              <Trash2 className="h-3 w-3" />
              <span>Delete</span>
            </Button>
          </div>
        </div>
      )}

      {/* Spreadsheet Table Container with Screen Min-Height */}
      <div className="overflow-hidden rounded-xs border border-border bg-background shadow-xs min-h-[calc(100vh-13.5rem)] flex flex-col">
        <div className="overflow-x-auto min-h-[calc(100vh-14rem)] flex-1 hide-scrollbar select-none">
          <table className="w-full border-collapse text-left font-sans text-sm">
            {/* Header */}
            <thead className="sticky top-0 z-20 bg-accent-1 border-b border-border select-none">
              <tr>
                {/* Checkbox and Row Index */}
                <th className="w-12 px-3 py-2 text-center border-r border-border/80">
                  <div className="flex items-center justify-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = isPartiallySelected;
                      }}
                      onChange={(e) => onSelectAll(e.target.checked)}
                      className="h-3.5 w-3.5 rounded-xs border-border text-foreground accent-foreground cursor-pointer"
                    />
                  </div>
                </th>

                {/* Index # */}
                <th className="w-10 px-2 py-2 text-center font-sans font-medium text-accent-5 border-r border-border/80">
                  #
                </th>

                {/* Status Column */}
                <th className="w-36 px-3 py-2 font-medium uppercase tracking-wider text-accent-5 border-r border-border/80">
                  <div className="flex items-center justify-between">
                    <span
                      onClick={() => onSort("status")}
                      className="cursor-pointer hover:text-foreground transition-colors flex items-center gap-1"
                    >
                      Status
                      {sortColumn === "status" && (
                        sortDirection === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsStatusManagerOpen(true)}
                      className="p-1 rounded-xs hover:bg-accent-2 text-accent-4 hover:text-foreground transition-colors cursor-pointer"
                      title="Manage Status Values & Colors"
                    >
                      <Settings className="h-3 w-3" />
                    </button>
                  </div>
                </th>

                {/* Date Column */}
                <th
                  onClick={() => onSort("submittedAt")}
                  className="w-36 px-3 py-2 font-medium uppercase tracking-wider text-accent-5 border-r border-border/80 cursor-pointer hover:bg-accent-2/60 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span>Submitted</span>
                    {sortColumn === "submittedAt" && (
                      sortDirection === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                    )}
                  </div>
                </th>

                {/* Respondent Email */}
                <th
                  onClick={() => onSort("respondentEmail")}
                  className="w-56 min-w-[180px] px-3 py-2 font-medium uppercase tracking-wider text-accent-5 border-r border-border/80 cursor-pointer hover:bg-accent-2/60 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span>Respondent</span>
                    {sortColumn === "respondentEmail" && (
                      sortDirection === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                    )}
                  </div>
                </th>

                {/* Question Columns */}
                {questions.map((q) => (
                  <th
                    key={q.id}
                    onClick={() => onSort(q.id)}
                    className="min-w-[180px] px-3.5 py-2 font-medium uppercase tracking-wider text-accent-5 border-r border-border/80 cursor-pointer hover:bg-accent-2/60 transition-colors"
                    title={q.title}
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="break-words font-sans">{q.title}</span>
                      {sortColumn === q.id && (
                        sortDirection === "asc" ? <ChevronUp className="h-3 w-3 shrink-0" /> : <ChevronDown className="h-3 w-3 shrink-0" />
                      )}
                    </div>
                  </th>
                ))}

                {/* Row Action Menu */}
                {canEdit && (
                  <th className="w-12 px-2 py-2 text-center font-medium text-accent-5">
                    Action
                  </th>
                )}
              </tr>
            </thead>

            {/* Body with Google Sheets direct cell editing */}
            <tbody className="divide-y divide-border bg-background">
              {/* Existing Filled Rows */}
              {responses.map((response, rowIndex) => {
                const rowId = response.id || response._id || "";
                const isSelected = selectedRowIds.includes(rowId);
                const statusInfo = getStatusInfo(response.status || "unreviewed");
                const hasNotes = response.notes && response.notes.length > 0;

                const isEditingEmail =
                  editingCell?.rowKey === rowId && editingCell?.questionId === "__email__";

                return (
                  <tr
                    key={rowId}
                    className={`group transition-colors ${isSelected ? "bg-accent-1/90" : "hover:bg-accent-1/30"
                      }`}
                  >
                    {/* Checkbox */}
                    <td className="px-3 py-1.5 text-center border-r border-border/60 align-top">
                      {canEdit ? (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => onSelectRow(rowId, e.target.checked)}
                          className="h-3.5 w-3.5 rounded-xs border-border text-foreground accent-foreground cursor-pointer"
                        />
                      ) : (
                        <span className="text-accent-4/40 text-xs">—</span>
                      )}
                    </td>

                    {/* Row Index # */}
                    <td className="px-2 py-1.5 text-center font-sans text-xs text-accent-4 border-r border-border/60 align-top">
                      {rowIndex + 1}
                    </td>

                    {/* Status Simple Dropdown-style Button (No icon) */}
                    <td className="px-2 py-1 border-r border-border/60 relative align-top">
                      <div className="relative inline-block w-full">
                        <button
                          type="button"
                          disabled={!canEdit}
                          onClick={() => {
                            if (canEdit) setStatusDropdownOpen(statusDropdownOpen === rowId ? null : rowId);
                          }}
                          className={`inline-flex w-full items-center justify-between gap-1.5 rounded-sm border px-2 py-0.5 text-xs font-medium transition-all ${statusInfo.bg} ${canEdit ? "hover:opacity-85 cursor-pointer" : "cursor-default opacity-90"}`}
                        >
                          <span className="truncate">{statusInfo.label}</span>
                          {canEdit && <ChevronDown className="h-3 w-3 opacity-60 shrink-0" />}
                        </button>

                        {canEdit && statusDropdownOpen === rowId && (
                          <>
                            <div
                              className="fixed inset-0 z-30"
                              onClick={() => setStatusDropdownOpen(null)}
                            />
                            <div className="absolute left-0 top-full z-40 mt-1 min-w-[160px] rounded-sm border border-border bg-background p-1 shadow-lg animate-in fade-in zoom-in-95 duration-100">
                              <div className="space-y-0.5 max-h-48 overflow-y-auto hide-scrollbar">
                                {statusOptions.map((stOpt) => {
                                  const color = STATUS_COLORS[stOpt.colorKey] || STATUS_COLORS.gray;
                                  const isCurrent = (response.status || "unreviewed") === stOpt.id;

                                  return (
                                    <button
                                      key={stOpt.id}
                                      onClick={() => {
                                        void onUpdateStatus(rowId, stOpt.id as ResponseStatus);
                                        setStatusDropdownOpen(null);
                                      }}
                                      className={`flex w-full items-center justify-between gap-2 rounded-xs px-2 py-1.5 text-xs text-left transition-colors hover:bg-accent-1 cursor-pointer ${isCurrent ? "font-semibold text-foreground bg-accent-1/60" : "text-accent-6"
                                        }`}
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        <div className={`h-2.5 w-2.5 rounded-full ${color.previewBg} shrink-0`} />
                                        <span className="truncate">{stOpt.label}</span>
                                      </div>
                                      {isCurrent && <Check className="h-3 w-3 text-foreground shrink-0" />}
                                    </button>
                                  );
                                })}
                              </div>

                              <div className="border-t border-border mt-1 pt-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setStatusDropdownOpen(null);
                                    setIsStatusManagerOpen(true);
                                  }}
                                  className="flex w-full items-center gap-1.5 rounded-xs px-2 py-1 text-xs text-accent-5 hover:text-foreground hover:bg-accent-1 text-left cursor-pointer"
                                >
                                  <Settings className="h-3 w-3" />
                                  <span>Manage / Add Statuses...</span>
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-3 py-1.5 text-sm font-sans text-accent-5 border-r border-border/60 whitespace-nowrap align-top">
                      {new Date(response.submittedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>

                    {/* Respondent Email - Inline Editable Cell with Real-Time Remote Cursor */}
                    {(() => {
                      const remoteCollab =
                        remoteCursors[`${rowId}_0`] ||
                        remoteCursors[`${rowIndex}_0`] ||
                        remoteCursors[`${rowId}___email__`];

                      return (
                        <td
                          onClick={() => {
                            if (!isEditingEmail) {
                              if (canEdit) {
                                startEditingCell(rowId, "__email__", response.respondentEmail || "", rowIndex, 0, false);
                              } else {
                                handleSelectActiveCell(rowId, "__email__", rowIndex, 0);
                              }
                            }
                          }}
                          style={
                            remoteCollab
                              ? { outline: `2px solid ${remoteCollab.color}`, outlineOffset: "-1px" }
                              : undefined
                          }
                          className={`px-3 py-2 border-r border-border/60 text-sm font-sans break-words min-w-[180px] align-top ${canEdit ? "cursor-text" : "cursor-default"} relative transition-colors ${isEditingEmail
                              ? "ring-2 ring-foreground bg-background z-20 p-0"
                              : activeCell?.rowIndex === rowIndex && activeCell?.colIndex === 0
                                ? "ring-1 ring-foreground/60 bg-accent-1/50"
                                : "hover:bg-accent-2/40"
                            }`}
                        >
                          {remoteCollab && (
                            <div
                              style={{ backgroundColor: remoteCollab.color }}
                              className="absolute -top-2.5 right-1 z-30 flex items-center px-1.5 py-0.5 rounded-xs text-[10px] font-semibold text-white shadow-xs pointer-events-none whitespace-nowrap animate-in fade-in zoom-in-95 duration-100"
                            >
                              {remoteCollab.name}
                            </div>
                          )}

                          {isEditingEmail ? (
                            <textarea
                              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                              rows={Math.max(1, Math.min(5, editValue.split("\n").length))}
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={() => void handleSaveCell()}
                              onKeyDown={handleKeyDown}
                              placeholder="Type email..."
                              className="h-full min-h-[36px] w-full bg-background px-3 py-1.5 text-sm text-foreground outline-none font-sans resize-none rounded-none"
                            />
                          ) : (
                            <div className="flex items-start gap-1.5 min-w-0">
                              {response.respondentEmail ? (
                                <span className="break-words font-medium text-foreground">{response.respondentEmail}</span>
                              ) : (
                                <span className="text-accent-4 italic font-sans text-xs">Anonymous</span>
                              )}
                              {hasNotes && (
                                <span
                                  title={`${response.notes?.length} notes`}
                                  className="inline-flex items-center text-accent-5 shrink-0 mt-0.5"
                                >
                                  <MessageSquare className="h-3 w-3" />
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })()}

                    {/* Question Answer Cells with Real-Time Remote Cursors */}
                    {questions.map((q, qIdx) => {
                      const colIndex = qIdx + 1;
                      const answer = response.answers?.find((a: Answer) => a.questionId === q.id);
                      const rawVal = answer?.value;
                      const isEditingThisCell =
                        editingCell?.rowKey === rowId && editingCell?.questionId === q.id;
                      const remoteCollab =
                        remoteCursors[`${rowId}_${colIndex}`] ||
                        remoteCursors[`${rowIndex}_${colIndex}`] ||
                        remoteCursors[`${rowId}_${q.id}`];

                      let displayVal = "-";
                      if (rawVal !== undefined && rawVal !== null && rawVal !== "") {
                        if (Array.isArray(rawVal)) {
                          displayVal = rawVal.join(", ");
                        } else if (typeof rawVal === "object" && "name" in rawVal) {
                          displayVal = String((rawVal as { name: string }).name);
                        } else if (typeof rawVal === "object") {
                          displayVal = Object.entries(rawVal as Record<string, string>)
                            .map(([r, c]) => `${r}: ${c}`)
                            .join("; ");
                        } else {
                          displayVal = String(rawVal);
                        }
                      }

                      return (
                        <td
                          key={q.id}
                          onClick={() => {
                            if (!isEditingThisCell) {
                              const cellInitial = displayVal !== "-" ? displayVal : "";
                              if (canEdit) {
                                startEditingCell(rowId, q.id, cellInitial, rowIndex, colIndex, false);
                              } else {
                                handleSelectActiveCell(rowId, q.id, rowIndex, colIndex);
                              }
                            }
                          }}
                          style={
                            remoteCollab
                              ? { outline: `2px solid ${remoteCollab.color}`, outlineOffset: "-1px" }
                              : undefined
                          }
                          className={`px-3 py-2 border-r border-border/60 text-sm text-foreground font-sans break-words min-w-[200px] align-top whitespace-normal ${canEdit ? "cursor-text" : "cursor-default"} relative transition-colors ${isEditingThisCell
                              ? "ring-2 ring-foreground bg-background z-20 p-0"
                              : activeCell?.rowIndex === rowIndex && activeCell?.colIndex === colIndex
                                ? "ring-1 ring-foreground/60 bg-accent-1/50"
                                : "hover:bg-accent-2/40"
                            }`}
                          title={displayVal !== "-" ? displayVal : canEdit ? "Click to edit" : undefined}
                        >
                          {remoteCollab && (
                            <div
                              style={{ backgroundColor: remoteCollab.color }}
                              className="absolute -top-2.5 right-1 z-30 flex items-center px-1.5 py-0.5 rounded-xs text-[10px] font-semibold text-white shadow-xs pointer-events-none whitespace-nowrap animate-in fade-in zoom-in-95 duration-100"
                            >
                              {remoteCollab.name}
                            </div>
                          )}

                          {isEditingThisCell ? (
                            <textarea
                              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                              rows={Math.max(1, Math.min(6, editValue.split("\n").length))}
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={() => void handleSaveCell()}
                              onKeyDown={handleKeyDown}
                              placeholder="Type answer..."
                              className="h-full min-h-[36px] w-full bg-background px-3 py-1.5 text-sm text-foreground outline-none font-sans resize-none rounded-none"
                            />
                          ) : q.type === "file_upload" && typeof rawVal === "string" && rawVal.startsWith("http") ? (
                            <a
                              href={rawVal}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-foreground underline hover:text-accent-7"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <FileText className="h-3 w-3 shrink-0" />
                              <span className="break-words">View file</span>
                            </a>
                          ) : (
                            <span className={`break-words whitespace-pre-wrap ${displayVal === "-" ? "text-accent-4 font-sans" : ""}`}>
                              {displayVal}
                            </span>
                          )}
                        </td>
                      );
                    })}

                    {/* Row Action Menu */}
                    {canEdit && (
                    <td className="px-2 py-1 text-center relative align-top">
                      <button
                        type="button"
                        onClick={() => setActiveMenuRowId(activeMenuRowId === rowId ? null : rowId)}
                        className="flex h-6 w-6 items-center justify-center rounded-xs text-accent-5 hover:bg-accent-2 hover:text-foreground mx-auto cursor-pointer"
                      >
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </button>

                      {activeMenuRowId === rowId && canEdit && (
                        <>
                          <div
                            className="fixed inset-0 z-30"
                            onClick={() => setActiveMenuRowId(null)}
                          />
                          <div className="absolute right-2 top-full z-40 mt-1 min-w-[140px] rounded-sm border border-border bg-background p-1 shadow-lg">
                            <button
                              onClick={() => {
                                onOpenDetail(response);
                                setActiveMenuRowId(null);
                              }}
                              className="flex w-full items-center gap-2 rounded-xs px-2.5 py-1.5 text-sm text-accent-6 hover:bg-accent-1 hover:text-foreground text-left cursor-pointer"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>Inspect Row</span>
                            </button>
                              <button
                                onClick={() => {
                                  void onDeleteRow(rowId);
                                  setActiveMenuRowId(null);
                                }}
                                className="flex w-full items-center gap-2 rounded-xs px-2.5 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-500/10 text-left cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>Delete Row</span>
                              </button>
                          </div>
                        </>
                      )}
                    </td>)}
                  </tr>
                );
              })}

              {/* Empty Grid Placeholder Rows with Direct Google Sheets Inline Entry */}
              {Array.from({ length: emptyRowsCount }).map((_, idx) => {
                const rowIndex = responses.length + idx;
                const rowKey = `empty_${rowIndex}`;
                const isEditingEmail =
                  editingCell?.rowKey === rowKey && editingCell?.questionId === "__email__";
                const remoteEmailCollab =
                  remoteCursors[`${rowKey}_0`] ||
                  remoteCursors[`${rowIndex}_0`];

                return (
                  <tr
                    key={rowKey}
                    className="group border-b border-border/40 hover:bg-accent-1/20 transition-colors"
                  >
                    {/* Checkbox Placeholder */}
                    <td className="px-3 py-1 text-center border-r border-border/40">
                      <div className="h-3.5 w-3.5 rounded-xs border border-border/60 mx-auto opacity-30 group-hover:opacity-60 transition-opacity" />
                    </td>

                    {/* Row Index # */}
                    <td className="px-2 py-1 text-center font-sans text-xs text-accent-4/60 border-r border-border/40">
                      {rowIndex + 1}
                    </td>

                    {/* Empty Status */}
                    <td className="px-2 py-1 border-r border-border/40 text-accent-4/40 text-xs">
                      —
                    </td>

                    {/* Empty Date */}
                    <td className="px-3 py-1 border-r border-border/40 text-accent-4/40 text-xs">
                      —
                    </td>

                    {/* Empty Respondent Email - Direct Inline Editable Cell */}
                    <td
                      onClick={() => {
                        if (!isEditingEmail) {
                          startEditingCell(rowKey, "__email__", "", rowIndex, 0, true);
                        }
                      }}
                      style={
                        remoteEmailCollab
                          ? { outline: `2px solid ${remoteEmailCollab.color}`, outlineOffset: "-1px" }
                          : undefined
                      }
                      className={`px-3 py-2 border-r border-border/40 text-sm font-sans text-accent-4/60 break-words min-w-[180px] align-top cursor-text relative transition-colors ${isEditingEmail
                          ? "ring-2 ring-foreground bg-background z-20 p-0"
                          : activeCell?.rowIndex === rowIndex && activeCell?.colIndex === 0
                            ? "ring-1 ring-foreground/60 bg-accent-1/40"
                            : "hover:bg-accent-1/50"
                        }`}
                    >
                      {remoteEmailCollab && (
                        <div
                          style={{ backgroundColor: remoteEmailCollab.color }}
                          className="absolute -top-2.5 right-1 z-30 flex items-center px-1.5 py-0.5 rounded-xs text-[10px] font-semibold text-white shadow-xs pointer-events-none whitespace-nowrap animate-in fade-in zoom-in-95 duration-100"
                        >
                          {remoteEmailCollab.name}
                        </div>
                      )}

                      {isEditingEmail ? (
                        <textarea
                          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                          rows={Math.max(1, Math.min(5, editValue.split("\n").length))}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => void handleSaveCell()}
                          onKeyDown={handleKeyDown}
                          placeholder="Type email..."
                          className="h-full min-h-[36px] w-full px-3 py-1.5 bg-background text-sm text-foreground outline-none font-sans resize-none rounded-none"
                        />
                      ) : (
                        <span className="opacity-0 group-hover:opacity-60 transition-opacity text-xs">
                        </span>
                      )}
                    </td>

                    {/* Empty Question Cells - Direct Inline Editable Cells */}
                    {questions.map((q, qIdx) => {
                      const colIndex = qIdx + 1;
                      const isEditingThisCell =
                        editingCell?.rowKey === rowKey && editingCell?.questionId === q.id;
                      const remoteQuestionCollab =
                        remoteCursors[`${rowKey}_${colIndex}`] ||
                        remoteCursors[`${rowIndex}_${colIndex}`] ||
                        remoteCursors[`${rowKey}_${q.id}`];

                      return (
                        <td
                          key={`empty-${rowIndex}-${q.id}`}
                          onClick={() => {
                            if (!isEditingThisCell) {
                              startEditingCell(rowKey, q.id, "", rowIndex, colIndex, true);
                            }
                          }}
                          style={
                            remoteQuestionCollab
                              ? { outline: `2px solid ${remoteQuestionCollab.color}`, outlineOffset: "-1px" }
                              : undefined
                          }
                          className={`px-3 py-2 border-r border-border/40 text-sm font-sans text-accent-4/40 break-words min-w-[200px] align-top cursor-text relative transition-colors ${isEditingThisCell
                              ? "ring-2 ring-foreground bg-background z-20 p-0"
                              : activeCell?.rowIndex === rowIndex && activeCell?.colIndex === colIndex
                                ? "ring-1 ring-foreground/60 bg-accent-1/40"
                                : "hover:bg-accent-1/50"
                            }`}
                        >
                          {remoteQuestionCollab && (
                            <div
                              style={{ backgroundColor: remoteQuestionCollab.color }}
                              className="absolute -top-2.5 right-1 z-30 flex items-center px-1.5 py-0.5 rounded-xs text-[10px] font-semibold text-white shadow-xs pointer-events-none whitespace-nowrap animate-in fade-in zoom-in-95 duration-100"
                            >
                              {remoteQuestionCollab.name}
                            </div>
                          )}

                          {isEditingThisCell ? (
                            <textarea
                              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                              rows={Math.max(1, Math.min(6, editValue.split("\n").length))}
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={() => void handleSaveCell()}
                              onKeyDown={handleKeyDown}
                              placeholder="Type answer..."
                              className="h-full min-h-[36px] w-full bg-background px-3 py-1.5 text-sm text-foreground outline-none font-sans resize-none rounded-none"
                            />
                          ) : (
                            <span className="opacity-0 group-hover:opacity-40 transition-opacity text-xs">
                            </span>
                          )}
                        </td>
                      );
                    })}

                    {/* Empty Action */}
                    <td className="px-2 py-1 text-center text-accent-4/40 text-xs">
                      —
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status Manager Modal */}
      <StatusManagerModal
        isOpen={isStatusManagerOpen}
        onClose={() => setIsStatusManagerOpen(false)}
        statusOptions={statusOptions}
        onSaveOptions={handleSaveStatusOptions}
      />
    </div>
  );
};
