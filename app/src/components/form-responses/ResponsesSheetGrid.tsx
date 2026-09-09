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
  FileSpreadsheet,
  FileCode,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  FormResponse,
  Question,
  ResponseStatus,
  Answer,
  CollaboratorPresence,
} from "@/types/form";
import {
  exportCandidateToPdf,
  exportCandidateToExcel,
  exportCandidateToDoc,
} from "@/utils/candidateExport";
import {
  StatusManagerModal,
  DEFAULT_STATUS_OPTIONS,
  STATUS_COLORS,
  type StatusOption,
} from "./StatusManagerModal";

interface ResponsesSheetGridProps {
  responses: FormResponse[];
  questions: Question[];
  formTitle?: string;
  selectedRowIds: string[];
  onSelectRow: (id: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onUpdateCell: (
    responseId: string,
    questionId: string,
    value: unknown
  ) => Promise<void>;
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
  onActiveCellChange?: (
    cell: {
      rowKey: string;
      rowIndex: number;
      colIndex: number;
      questionId?: string;
      isEditing?: boolean;
    } | null
  ) => void;
  statusOptions?: StatusOption[];
  onStatusOptionsChange?: (
    options: StatusOption[],
    renameMap?: Record<string, string>
  ) => void;
}

export const ResponsesSheetGrid: React.FC<ResponsesSheetGridProps> = ({
  responses,
  questions,
  formTitle = "Form Submission",
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
  statusOptions: statusOptionsProp,
  onStatusOptionsChange,
}) => {
  // Status Options with persistence
  const [localStatusOptions, setLocalStatusOptions] = useState<StatusOption[]>(
    () => {
      try {
        const saved = localStorage.getItem("easyforms_custom_statuses");
        if (saved) return JSON.parse(saved);
      } catch {
        // fallback
      }
      return DEFAULT_STATUS_OPTIONS;
    }
  );

  const statusOptions = statusOptionsProp || localStatusOptions;
  const [isStatusManagerOpen, setIsStatusManagerOpen] = useState(false);

  // Column Widths with local persistence
  const defaultWidths: Record<string, number> = {
    status: 140,
    submittedAt: 140,
    respondentEmail: 220,
    ...Object.fromEntries(questions.map((q) => [`q_${q.id}`, 220])),
  };

  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(
    () => {
      try {
        const saved = localStorage.getItem(`easyforms_col_widths_${formTitle}`);
        if (saved) return { ...defaultWidths, ...JSON.parse(saved) };
      } catch {
        // fallback
      }
      return defaultWidths;
    }
  );

  const resizingColumnRef = useRef<{
    colKey: string;
    startX: number;
    startWidth: number;
  } | null>(null);

  // Active Selected Cell (Single Click Emerald Selection)
  const [selectedCell, setSelectedCell] = useState<{
    rowKey: string;
    rowIndex: number;
    colIndex: number;
    questionId: string;
  } | null>(null);

  // Cell inline editing state (Double click / Enter / Typing)
  const [editingCell, setEditingCell] = useState<{
    rowKey: string; // row id or "empty_rowIndex"
    questionId: string; // question id or "__email__"
    rowIndex: number;
    colIndex: number; // 0 for email, 1..N for questions
    isNewRow: boolean;
    initialValue: string;
  } | null>(null);

  const [editValue, setEditValue] = useState<string>("");
  const [statusDropdownOpen, setStatusDropdownOpen] = useState<string | null>(
    null
  );
  const [activeMenuRowId, setActiveMenuRowId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const gridContainerRef = useRef<HTMLDivElement>(null);

  const allSelected =
    responses.length > 0 && selectedRowIds.length === responses.length;
  const isPartiallySelected = selectedRowIds.length > 0 && !allSelected;

  // Minimum grid rows to emulate full Google Sheets / Excel experience (only for editors)
  const minGridRows = Math.max(25, responses.length + 8);
  const emptyRowsCount = canEdit
    ? Math.max(0, minGridRows - responses.length)
    : 0;

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
      if (
        gridContainerRef.current &&
        !gridContainerRef.current.contains(e.target as Node)
      ) {
        setSelectedCell(null);
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

  const getStatusInfo = useCallback(
    (stValue: string) => {
      const valStr = String(stValue || "").trim();
      const match = statusOptions.find(
        (opt) =>
          opt.id.toLowerCase() === valStr.toLowerCase() ||
          opt.label.toLowerCase() === valStr.toLowerCase()
      );
      if (match) {
        const color = STATUS_COLORS[match.colorKey] || STATUS_COLORS.gray;
        return {
          id: match.label,
          label: match.label,
          bg: color.bg,
          text: color.text,
          border: color.border,
        };
      }
      return {
        id: valStr || "Unreviewed",
        label: valStr || "Unreviewed",
        bg: STATUS_COLORS.gray.bg,
        text: STATUS_COLORS.gray.text,
        border: STATUS_COLORS.gray.border,
      };
    },
    [statusOptions]
  );

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
    if (typeof raw === "object" && "name" in raw) {
      return String((raw as { name: string }).name);
    }
    if (typeof raw === "object") {
      return Object.entries(raw as Record<string, string>)
        .map(([k, v]) => `${k}: ${v}`)
        .join("; ");
    }
    return String(raw);
  };

  const getRemoteCollab = (
    rowKey: string,
    rowIndex: number,
    colIndex: number,
    questionId: string
  ): CollaboratorPresence | undefined => {
    return (
      remoteCursors[`${rowKey}_${colIndex}`] ||
      remoteCursors[`${rowIndex}_${colIndex}`] ||
      remoteCursors[`${rowKey}_${questionId}`]
    );
  };

  // Start editing a specific cell
  const startEditingCell = useCallback(
    (
      rowKey: string,
      questionId: string,
      initialVal: string,
      rowIndex: number,
      colIndex: number,
      isNewRow: boolean
    ) => {
      if (!canEdit) return;
      const remote = getRemoteCollab(rowKey, rowIndex, colIndex, questionId);
      if (remote) return; // Locked by another collaborator

      setEditValue(initialVal);
      setEditingCell({
        rowKey,
        questionId,
        rowIndex,
        colIndex,
        isNewRow,
        initialValue: initialVal,
      });
      setSelectedCell({ rowKey, rowIndex, colIndex, questionId });
      onActiveCellChange?.({
        rowKey,
        rowIndex,
        colIndex,
        questionId,
        isEditing: true,
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canEdit, onActiveCellChange, remoteCursors]
  );

  // Single click selection
  const handleCellClick = (
    rowKey: string,
    questionId: string,
    rowIndex: number,
    colIndex: number,
    isLocked: boolean
  ) => {
    if (isLocked) {
      setSelectedCell({ rowKey, rowIndex, colIndex, questionId });
      setEditingCell(null);
      return;
    }

    if (
      editingCell &&
      (editingCell.rowKey !== rowKey || editingCell.colIndex !== colIndex)
    ) {
      handleSaveCell();
    }

    setSelectedCell({ rowKey, rowIndex, colIndex, questionId });
    onActiveCellChange?.({
      rowKey,
      rowIndex,
      colIndex,
      questionId,
      isEditing: false,
    });
  };

  // Move selected cell on Arrow / Tab / Enter navigation
  const moveSelectedCell = (targetRowIdx: number, targetColIdx: number) => {
    const nextRowIdx = Math.max(0, Math.min(minGridRows - 1, targetRowIdx));
    const nextColIdx = Math.max(0, Math.min(columnCount - 1, targetColIdx));

    const isNextNew = nextRowIdx >= responses.length;
    const nextRowKey = !isNextNew
      ? responses[nextRowIdx].id || responses[nextRowIdx]._id || ""
      : `empty_${nextRowIdx}`;
    const nextQuestionId =
      nextColIdx === 0 ? "__email__" : questions[nextColIdx - 1]?.id || "";

    setSelectedCell({
      rowKey: nextRowKey,
      rowIndex: nextRowIdx,
      colIndex: nextColIdx,
      questionId: nextQuestionId,
    });

    onActiveCellChange?.({
      rowKey: nextRowKey,
      rowIndex: nextRowIdx,
      colIndex: nextColIdx,
      questionId: nextQuestionId,
      isEditing: false,
    });
  };

  // Commit and save cell edit without blocking user navigation
  const handleSaveCell = (nextMove?: "down" | "right" | "left") => {
    if (!editingCell) return;
    const cellToSave = editingCell;
    const { rowKey, questionId, rowIndex, colIndex, isNewRow, initialValue } =
      cellToSave;
    const currentVal = editValue;
    const trimmedVal = currentVal.trim();

    // 1. Calculate next target cell immediately & synchronously
    let nextTarget: {
      rowKey: string;
      questionId: string;
      initialVal: string;
      rowIndex: number;
      colIndex: number;
      isNewRow: boolean;
    } | null = null;

    if (nextMove === "down") {
      const nextRowIndex = rowIndex + 1;
      if (nextRowIndex < minGridRows) {
        const isNextNew = nextRowIndex >= responses.length;
        const nextRowKey = !isNextNew
          ? responses[nextRowIndex].id || responses[nextRowIndex]._id || ""
          : `empty_${nextRowIndex}`;
        const nextInitialVal = getCellValue(nextRowIndex, colIndex);
        nextTarget = {
          rowKey: nextRowKey,
          questionId,
          initialVal: nextInitialVal,
          rowIndex: nextRowIndex,
          colIndex,
          isNewRow: isNextNew,
        };
      }
    } else if (nextMove === "right") {
      const nextColIndex = (colIndex + 1) % columnCount;
      const nextQuestionId =
        nextColIndex === 0 ? "__email__" : questions[nextColIndex - 1].id;
      const nextInitialVal = getCellValue(rowIndex, nextColIndex);
      nextTarget = {
        rowKey,
        questionId: nextQuestionId,
        initialVal: nextInitialVal,
        rowIndex,
        colIndex: nextColIndex,
        isNewRow,
      };
    } else if (nextMove === "left") {
      const nextColIndex = (colIndex - 1 + columnCount) % columnCount;
      const nextQuestionId =
        nextColIndex === 0 ? "__email__" : questions[nextColIndex - 1].id;
      const nextInitialVal = getCellValue(rowIndex, nextColIndex);
      nextTarget = {
        rowKey,
        questionId: nextQuestionId,
        initialVal: nextInitialVal,
        rowIndex,
        colIndex: nextColIndex,
        isNewRow,
      };
    }

    // 2. Synchronously transition to the next cell immediately
    if (nextTarget) {
      setEditValue(nextTarget.initialVal);
      setEditingCell({
        rowKey: nextTarget.rowKey,
        questionId: nextTarget.questionId,
        rowIndex: nextTarget.rowIndex,
        colIndex: nextTarget.colIndex,
        isNewRow: nextTarget.isNewRow,
        initialValue: nextTarget.initialVal,
      });
      setSelectedCell({
        rowKey: nextTarget.rowKey,
        rowIndex: nextTarget.rowIndex,
        colIndex: nextTarget.colIndex,
        questionId: nextTarget.questionId,
      });
      onActiveCellChange?.({
        rowKey: nextTarget.rowKey,
        rowIndex: nextTarget.rowIndex,
        colIndex: nextTarget.colIndex,
        questionId: nextTarget.questionId,
        isEditing: true,
      });
    } else {
      setEditingCell(null);
      setSelectedCell({
        rowKey,
        rowIndex,
        colIndex,
        questionId,
      });
      onActiveCellChange?.({
        rowKey,
        rowIndex,
        colIndex,
        questionId,
        isEditing: false,
      });
    }

    // 3. Dispatch save operation in background without blocking UI
    if (isNewRow) {
      if (trimmedVal !== "" && onCreateRow) {
        const answers: Answer[] =
          questionId !== "__email__"
            ? [{ questionId, value: trimmedVal }]
            : [];
        const respondentEmail =
          questionId === "__email__" ? trimmedVal : undefined;

        onCreateRow({
          answers,
          respondentEmail,
          status: "Unreviewed",
        })
          .then((newRow) => {
            if (newRow && nextTarget && nextTarget.rowKey === rowKey) {
              const newId = newRow.id || newRow._id || "";
              setEditingCell((prev) =>
                prev && prev.rowKey === rowKey
                  ? { ...prev, rowKey: newId, isNewRow: false }
                  : prev
              );
            }
          })
          .catch((err) => {
            console.error("Failed to create row:", err);
          });
      }
    } else if (currentVal !== initialValue) {
      void onUpdateCell(rowKey, questionId, currentVal);
    }
  };

  const handleKeyDownInEditing = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSaveCell("down");
    } else if (e.key === "Tab") {
      e.preventDefault();
      handleSaveCell(e.shiftKey ? "left" : "right");
    } else if (e.key === "Escape") {
      setEditingCell(null);
      if (selectedCell) {
        onActiveCellChange?.({
          rowKey: selectedCell.rowKey,
          rowIndex: selectedCell.rowIndex,
          colIndex: selectedCell.colIndex,
          questionId: selectedCell.questionId,
          isEditing: false,
        });
      }
    }
  };

  const handleGridKeyDown = (e: React.KeyboardEvent) => {
    if (editingCell) return;
    if (!selectedCell) return;

    const { rowIndex, colIndex, rowKey, questionId } = selectedCell;
    const remote = getRemoteCollab(rowKey, rowIndex, colIndex, questionId);
    const isLocked = Boolean(remote);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      moveSelectedCell(rowIndex + 1, colIndex);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      moveSelectedCell(rowIndex - 1, colIndex);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      moveSelectedCell(rowIndex, colIndex + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      moveSelectedCell(rowIndex, colIndex - 1);
    } else if (e.key === "Tab") {
      e.preventDefault();
      moveSelectedCell(rowIndex, e.shiftKey ? colIndex - 1 : colIndex + 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (!isLocked && canEdit) {
        const initialVal = getCellValue(rowIndex, colIndex);
        const isNewRow = rowIndex >= responses.length;
        startEditingCell(
          rowKey,
          questionId,
          initialVal,
          rowIndex,
          colIndex,
          isNewRow
        );
      } else {
        moveSelectedCell(rowIndex + 1, colIndex);
      }
    } else if (e.key === "Escape") {
      setSelectedCell(null);
      onActiveCellChange?.(null);
    } else if (e.key === "F2") {
      e.preventDefault();
      if (!isLocked && canEdit) {
        const initialVal = getCellValue(rowIndex, colIndex);
        const isNewRow = rowIndex >= responses.length;
        startEditingCell(
          rowKey,
          questionId,
          initialVal,
          rowIndex,
          colIndex,
          isNewRow
        );
      }
    } else if (e.key === "Delete" || e.key === "Backspace") {
      if (!isLocked && canEdit && rowIndex < responses.length) {
        e.preventDefault();
        void onUpdateCell(rowKey, questionId, "");
      }
    } else if (
      canEdit &&
      !isLocked &&
      !e.ctrlKey &&
      !e.metaKey &&
      !e.altKey &&
      e.key.length === 1
    ) {
      // Direct typing starts editing with the typed letter!
      const isNewRow = rowIndex >= responses.length;
      startEditingCell(rowKey, questionId, e.key, rowIndex, colIndex, isNewRow);
    }
  };

  // Column Resizing Handler (Desktop Mouse & Mobile Touch Drag)
  const startColumnResize = (
    colKey: string,
    e: React.MouseEvent | React.TouchEvent
  ) => {
    e.stopPropagation();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const startWidth = columnWidths[colKey] || defaultWidths[colKey] || 180;
    resizingColumnRef.current = { colKey, startX: clientX, startWidth };

    const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
      if (!resizingColumnRef.current) return;
      const curX =
        "touches" in moveEvent
          ? moveEvent.touches[0].clientX
          : (moveEvent as MouseEvent).clientX;
      const deltaX = curX - resizingColumnRef.current.startX;
      const newWidth = Math.max(
        90,
        resizingColumnRef.current.startWidth + deltaX
      );

      setColumnWidths((prev) => ({
        ...prev,
        [colKey]: newWidth,
      }));
    };

    const handleEnd = () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
      resizingColumnRef.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";

      setColumnWidths((latest) => {
        try {
          localStorage.setItem(
            `easyforms_col_widths_${formTitle}`,
            JSON.stringify(latest)
          );
        } catch {}
        return latest;
      });
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchmove", handleMove);
    window.addEventListener("touchend", handleEnd);
  };

  const handleResetColumnWidth = (colKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const def = defaultWidths[colKey] || 180;
    setColumnWidths((prev) => {
      const updated = { ...prev, [colKey]: def };
      try {
        localStorage.setItem(
          `easyforms_col_widths_${formTitle}`,
          JSON.stringify(updated)
        );
      } catch {}
      return updated;
    });
  };

  const handleSaveStatusOptions = (
    newOptions: StatusOption[],
    renameMap?: Record<string, string>
  ) => {
    setLocalStatusOptions(newOptions);
    onStatusOptionsChange?.(newOptions, renameMap);
    try {
      localStorage.setItem(
        "easyforms_custom_statuses",
        JSON.stringify(newOptions)
      );
    } catch {
      // ignore
    }
  };

  return (
    <div
      ref={gridContainerRef}
      onKeyDown={handleGridKeyDown}
      tabIndex={0}
      className="relative space-y-2 font-sans outline-none"
    >
      {/* Floating Bulk Actions Bar */}
      {selectedRowIds.length > 0 && (
        <div className="sticky top-2 z-30 flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-foreground px-4 py-2 text-background shadow-lg transition-all animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {selectedRowIds.length} row{selectedRowIds.length > 1 ? "s" : ""}{" "}
              selected
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
                  onClick={() =>
                    void onBulkUpdateStatus(st.label as ResponseStatus)
                  }
                  className="rounded-xs px-2.5 py-1 text-sm font-medium capitalize text-background hover:bg-background/20 transition-colors cursor-pointer"
                >
                  Mark {st.label}
                </button>
              ))}
            </div>

            <Button
              size="sm"
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
          <table className="w-full border-collapse text-left font-sans text-sm table-fixed">
            {/* Header */}
            <thead className="sticky top-0 z-20 bg-accent-1 border-b border-border select-none">
              <tr>
                {/* Checkbox */}
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
                <th
                  style={{ width: `${columnWidths.status || 140}px` }}
                  className="relative px-3 py-2 font-medium uppercase tracking-wider text-accent-5 border-r border-border/80 group/th"
                >
                  <div className="flex items-center justify-between pr-2">
                    <span
                      onClick={() => onSort("status")}
                      className="cursor-pointer hover:text-foreground transition-colors flex items-center gap-1"
                    >
                      Status
                      {sortColumn === "status" &&
                        (sortDirection === "asc" ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        ))}
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

                  {/* Resizer Divider */}
                  <div
                    onMouseDown={(e) => startColumnResize("status", e)}
                    onTouchStart={(e) => startColumnResize("status", e)}
                    onDoubleClick={(e) => handleResetColumnWidth("status", e)}
                    className="absolute top-0 right-0 bottom-0 w-3 cursor-col-resize hover:bg-emerald-500/30 flex items-center justify-center transition-colors group-hover/th:bg-accent-2/50"
                    title="Drag to resize column (Double click to reset)"
                  >
                    <div className="h-4 w-[2px] bg-accent-4/40 group-hover/th:bg-emerald-500 rounded-full" />
                  </div>
                </th>

                {/* Date Column */}
                <th
                  style={{ width: `${columnWidths.submittedAt || 140}px` }}
                  className="relative px-3 py-2 font-medium uppercase tracking-wider text-accent-5 border-r border-border/80 group/th"
                >
                  <div
                    onClick={() => onSort("submittedAt")}
                    className="flex items-center justify-between pr-2 cursor-pointer hover:text-foreground transition-colors"
                  >
                    <span>Submitted</span>
                    {sortColumn === "submittedAt" &&
                      (sortDirection === "asc" ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      ))}
                  </div>

                  {/* Resizer Divider */}
                  <div
                    onMouseDown={(e) => startColumnResize("submittedAt", e)}
                    onTouchStart={(e) => startColumnResize("submittedAt", e)}
                    onDoubleClick={(e) =>
                      handleResetColumnWidth("submittedAt", e)
                    }
                    className="absolute top-0 right-0 bottom-0 w-3 cursor-col-resize hover:bg-emerald-500/30 flex items-center justify-center transition-colors group-hover/th:bg-accent-2/50"
                    title="Drag to resize column (Double click to reset)"
                  >
                    <div className="h-4 w-[2px] bg-accent-4/40 group-hover/th:bg-emerald-500 rounded-full" />
                  </div>
                </th>

                {/* Respondent Email */}
                <th
                  style={{ width: `${columnWidths.respondentEmail || 220}px` }}
                  className="relative px-3 py-2 font-medium uppercase tracking-wider text-accent-5 border-r border-border/80 group/th"
                >
                  <div
                    onClick={() => onSort("respondentEmail")}
                    className="flex items-center justify-between pr-2 cursor-pointer hover:text-foreground transition-colors"
                  >
                    <span>Respondent</span>
                    {sortColumn === "respondentEmail" &&
                      (sortDirection === "asc" ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      ))}
                  </div>

                  {/* Resizer Divider */}
                  <div
                    onMouseDown={(e) => startColumnResize("respondentEmail", e)}
                    onTouchStart={(e) =>
                      startColumnResize("respondentEmail", e)
                    }
                    onDoubleClick={(e) =>
                      handleResetColumnWidth("respondentEmail", e)
                    }
                    className="absolute top-0 right-0 bottom-0 w-3 cursor-col-resize hover:bg-emerald-500/30 flex items-center justify-center transition-colors group-hover/th:bg-accent-2/50"
                    title="Drag to resize column (Double click to reset)"
                  >
                    <div className="h-4 w-[2px] bg-accent-4/40 group-hover/th:bg-emerald-500 rounded-full" />
                  </div>
                </th>

                {/* Question Columns */}
                {questions.map((q) => {
                  const colKey = `q_${q.id}`;
                  const colWidth = columnWidths[colKey] || 220;

                  return (
                    <th
                      key={q.id}
                      style={{ width: `${colWidth}px` }}
                      className="relative px-3.5 py-2 font-medium uppercase tracking-wider text-accent-5 border-r border-border/80 group/th"
                      title={q.title}
                    >
                      <div
                        onClick={() => onSort(q.id)}
                        className="flex items-center justify-between gap-1.5 pr-2 cursor-pointer hover:text-foreground transition-colors"
                      >
                        <span className="truncate font-sans">{q.title}</span>
                        {sortColumn === q.id &&
                          (sortDirection === "asc" ? (
                            <ChevronUp className="h-3 w-3 shrink-0" />
                          ) : (
                            <ChevronDown className="h-3 w-3 shrink-0" />
                          ))}
                      </div>

                      {/* Resizer Divider */}
                      <div
                        onMouseDown={(e) => startColumnResize(colKey, e)}
                        onTouchStart={(e) => startColumnResize(colKey, e)}
                        onDoubleClick={(e) =>
                          handleResetColumnWidth(colKey, e)
                        }
                        className="absolute top-0 right-0 bottom-0 w-3 cursor-col-resize hover:bg-emerald-500/30 flex items-center justify-center transition-colors group-hover/th:bg-accent-2/50"
                        title="Drag to resize column (Double click to reset)"
                      >
                        <div className="h-4 w-[2px] bg-accent-4/40 group-hover/th:bg-emerald-500 rounded-full" />
                      </div>
                    </th>
                  );
                })}

                {/* Row Action Menu */}
                {canEdit && (
                  <th className="w-12 px-2 py-2 text-center font-medium text-accent-5">
                    Action
                  </th>
                )}
              </tr>
            </thead>

            {/* Body with Google Sheets cell selection & inline editing */}
            <tbody className="divide-y divide-border bg-background">
              {/* Existing Filled Rows */}
              {responses.map((response, rowIndex) => {
                const rowId = response.id || response._id || "";
                const isSelected = selectedRowIds.includes(rowId);
                const statusInfo = getStatusInfo(
                  response.status || "unreviewed"
                );
                const hasNotes = response.notes && response.notes.length > 0;

                const isEditingEmail =
                  editingCell?.rowKey === rowId &&
                  editingCell?.questionId === "__email__";
                const isSelectedEmail =
                  selectedCell?.rowKey === rowId &&
                  selectedCell?.colIndex === 0;
                const remoteEmailCollab = getRemoteCollab(
                  rowId,
                  rowIndex,
                  0,
                  "__email__"
                );
                const isEmailLocked = Boolean(remoteEmailCollab);

                return (
                  <tr
                    key={rowId}
                    className={`group transition-colors ${
                      isSelected ? "bg-accent-1/90" : "hover:bg-accent-1/30"
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
                        <span className="opacity-0" />
                      )}
                    </td>

                    {/* Row Index # */}
                    <td className="px-2 py-1.5 text-center font-sans text-sm text-accent-4 border-r border-border/60 align-top">
                      {rowIndex + 1}
                    </td>

                    {/* Status Dropdown */}
                    <td className="px-2 py-1 border-r border-border/60 relative align-top">
                      <div className="relative inline-block w-full">
                        <button
                          type="button"
                          disabled={!canEdit}
                          onClick={() => {
                            if (canEdit)
                              setStatusDropdownOpen(
                                statusDropdownOpen === rowId ? null : rowId
                              );
                          }}
                          className={`inline-flex w-full items-center justify-between gap-1.5 rounded-sm border px-2 py-0.5 text-sm font-medium transition-all ${statusInfo.bg} ${canEdit ? "hover:opacity-85 cursor-pointer" : "cursor-default opacity-90"}`}
                        >
                          <span className="truncate">{statusInfo.label}</span>
                          {canEdit && (
                            <ChevronDown className="h-3 w-3 opacity-60 shrink-0" />
                          )}
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
                                  const color =
                                    STATUS_COLORS[stOpt.colorKey] ||
                                    STATUS_COLORS.gray;
                                  const currentStatus = String(
                                    response.status || ""
                                  )
                                    .trim()
                                    .toLowerCase();
                                  const isCurrent =
                                    currentStatus ===
                                      stOpt.id.toLowerCase() ||
                                    currentStatus ===
                                      stOpt.label.toLowerCase();

                                  return (
                                    <button
                                      key={stOpt.id}
                                      onClick={() => {
                                        void onUpdateStatus(
                                          rowId,
                                          stOpt.label as ResponseStatus
                                        );
                                        setStatusDropdownOpen(null);
                                      }}
                                      className={`flex w-full items-center justify-between gap-2 rounded-xs px-2 py-1.5 text-sm text-left transition-colors hover:bg-accent-1 cursor-pointer ${
                                        isCurrent
                                          ? "font-semibold text-foreground bg-accent-1/60"
                                          : "text-accent-6"
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        <div
                                          className={`h-2.5 w-2.5 rounded-full ${color.previewBg} shrink-0`}
                                        />
                                        <span className="truncate">
                                          {stOpt.label}
                                        </span>
                                      </div>
                                      {isCurrent && (
                                        <Check className="h-3 w-3 text-foreground shrink-0" />
                                      )}
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
                                  className="flex w-full items-center gap-1.5 rounded-xs px-2 py-1 text-sm text-accent-5 hover:text-foreground hover:bg-accent-1 text-left cursor-pointer"
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
                      {new Date(response.submittedAt).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </td>

                    {/* Respondent Email - Single-Click Emerald Selection & Double-Click Edit with Collaboration Lock */}
                    <td
                      onClick={() =>
                        handleCellClick(
                          rowId,
                          "__email__",
                          rowIndex,
                          0,
                          isEmailLocked
                        )
                      }
                      onDoubleClick={() => {
                        if (!isEditingEmail) {
                          startEditingCell(
                            rowId,
                            "__email__",
                            response.respondentEmail || "",
                            rowIndex,
                            0,
                            false
                          );
                        }
                      }}
                      style={
                        remoteEmailCollab
                          ? {
                              outline: `2px solid ${remoteEmailCollab.color}`,
                              outlineOffset: "-1px",
                            }
                          : undefined
                      }
                      className={`px-3 py-2 border-r border-border/60 text-sm font-sans break-words align-top relative transition-colors ${
                        isEditingEmail
                          ? "ring-2 ring-emerald-500 bg-background z-20 p-0 shadow-md"
                          : isSelectedEmail
                            ? "ring-2 ring-emerald-500 dark:ring-emerald-400 bg-emerald-500/5 dark:bg-emerald-500/10 z-10 shadow-xs"
                            : isEmailLocked
                              ? "bg-accent-2/20 cursor-not-allowed"
                              : "hover:bg-accent-2/40 cursor-cell"
                      }`}
                      title={
                        remoteEmailCollab
                          ? `Locked by ${remoteEmailCollab.name}`
                          : "Click to select, double click or type to edit"
                      }
                    >
                      {/* Remote Collaborator Lock Badge */}
                      {remoteEmailCollab && (
                        <div
                          style={{ backgroundColor: remoteEmailCollab.color }}
                          className="absolute -top-2.5 right-1 z-30 flex items-center gap-1 px-1.5 py-0.5 rounded-xs text-[10px] font-semibold text-white shadow-xs pointer-events-none whitespace-nowrap animate-in fade-in zoom-in-95 duration-100"
                        >
                          <Lock className="h-2.5 w-2.5" />
                          <span>{remoteEmailCollab.name}</span>
                        </div>
                      )}

                      {/* Google Sheets Active Cell Emerald Fill Handle */}
                      {isSelectedEmail && !isEditingEmail && !isEmailLocked && (
                        <div className="absolute -bottom-1 -right-1 h-2 w-2 rounded-[1px] bg-emerald-500 border border-white dark:border-neutral-900 shadow-xs pointer-events-none z-20" />
                      )}

                      {isEditingEmail ? (
                        <textarea
                          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                          rows={Math.max(
                            1,
                            Math.min(5, editValue.split("\n").length)
                          )}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => void handleSaveCell()}
                          onKeyDown={handleKeyDownInEditing}
                          placeholder="Type email..."
                          className="h-full min-h-[36px] w-full bg-background px-3 py-1.5 text-sm text-foreground outline-none font-sans resize-none rounded-none"
                        />
                      ) : (
                        <div className="flex items-start gap-1.5 min-w-0">
                          {response.respondentEmail ? (
                            <span className="break-words font-medium text-foreground">
                              {response.respondentEmail}
                            </span>
                          ) : (
                            <span className="opacity-0" />
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

                    {/* Question Answer Cells */}
                    {questions.map((q, qIdx) => {
                      const colIndex = qIdx + 1;
                      const answer = response.answers?.find(
                        (a: Answer) => a.questionId === q.id
                      );
                      const rawVal = answer?.value;
                      const isEditingThisCell =
                        editingCell?.rowKey === rowId &&
                        editingCell?.questionId === q.id;
                      const isSelectedThisCell =
                        selectedCell?.rowKey === rowId &&
                        selectedCell?.colIndex === colIndex;

                      const remoteCollab = getRemoteCollab(
                        rowId,
                        rowIndex,
                        colIndex,
                        q.id
                      );
                      const isCellLocked = Boolean(remoteCollab);

                      let displayVal = "";
                      if (
                        rawVal !== undefined &&
                        rawVal !== null &&
                        rawVal !== ""
                      ) {
                        if (Array.isArray(rawVal)) {
                          displayVal = rawVal.join(", ");
                        } else if (
                          typeof rawVal === "object" &&
                          "name" in rawVal
                        ) {
                          displayVal = String((rawVal as { name: string }).name);
                        } else if (typeof rawVal === "object") {
                          displayVal = Object.entries(
                            rawVal as Record<string, string>
                          )
                            .map(([r, c]) => `${r}: ${c}`)
                            .join("; ");
                        } else {
                          displayVal = String(rawVal);
                        }
                      }

                      return (
                        <td
                          key={q.id}
                          onClick={() =>
                            handleCellClick(
                              rowId,
                              q.id,
                              rowIndex,
                              colIndex,
                              isCellLocked
                            )
                          }
                          onDoubleClick={() => {
                            if (!isEditingThisCell) {
                              startEditingCell(
                                rowId,
                                q.id,
                                displayVal,
                                rowIndex,
                                colIndex,
                                false
                              );
                            }
                          }}
                          style={
                            remoteCollab
                              ? {
                                  outline: `2px solid ${remoteCollab.color}`,
                                  outlineOffset: "-1px",
                                }
                              : undefined
                          }
                          className={`px-3 py-2 border-r border-border/60 text-sm text-foreground font-sans break-words align-top whitespace-normal relative transition-colors ${
                            isEditingThisCell
                              ? "ring-2 ring-emerald-500 bg-background z-20 p-0 shadow-md"
                              : isSelectedThisCell
                                ? "ring-2 ring-emerald-500 dark:ring-emerald-400 bg-emerald-500/5 dark:bg-emerald-500/10 z-10 shadow-xs"
                                : isCellLocked
                                  ? "bg-accent-2/20 cursor-not-allowed"
                                  : "hover:bg-accent-2/40 cursor-cell"
                          }`}
                          title={
                            remoteCollab
                              ? `Locked by ${remoteCollab.name}`
                              : displayVal || "Click to select, double click or type to edit"
                          }
                        >
                          {/* Remote Collaborator Lock Badge */}
                          {remoteCollab && (
                            <div
                              style={{ backgroundColor: remoteCollab.color }}
                              className="absolute -top-2.5 right-1 z-30 flex items-center gap-1 px-1.5 py-0.5 rounded-xs text-[10px] font-semibold text-white shadow-xs pointer-events-none whitespace-nowrap animate-in fade-in zoom-in-95 duration-100"
                            >
                              <Lock className="h-2.5 w-2.5" />
                              <span>{remoteCollab.name}</span>
                            </div>
                          )}

                          {/* Google Sheets Active Cell Emerald Fill Handle */}
                          {isSelectedThisCell &&
                            !isEditingThisCell &&
                            !isCellLocked && (
                              <div className="absolute -bottom-1 -right-1 h-2 w-2 rounded-[1px] bg-emerald-500 border border-white dark:border-neutral-900 shadow-xs pointer-events-none z-20" />
                            )}

                          {isEditingThisCell ? (
                            <textarea
                              ref={
                                inputRef as React.RefObject<HTMLTextAreaElement>
                              }
                              rows={Math.max(
                                1,
                                Math.min(6, editValue.split("\n").length)
                              )}
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={() => void handleSaveCell()}
                              onKeyDown={handleKeyDownInEditing}
                              placeholder="Type answer..."
                              className="h-full min-h-[36px] w-full bg-background px-3 py-1.5 text-sm text-foreground outline-none font-sans resize-none rounded-none"
                            />
                          ) : q.type === "file_upload" &&
                            typeof rawVal === "string" &&
                            rawVal.startsWith("http") ? (
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
                            <span className="break-words whitespace-pre-wrap">
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
                          onClick={() =>
                            setActiveMenuRowId(
                              activeMenuRowId === rowId ? null : rowId
                            )
                          }
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
                            <div className="absolute right-0 top-full z-40 mt-1 w-44 rounded-sm border border-border bg-background p-1 shadow-lg animate-in fade-in zoom-in-95 duration-100">
                              <button
                                onClick={() => {
                                  onOpenDetail(response);
                                  setActiveMenuRowId(null);
                                }}
                                className="flex w-full items-center gap-2 rounded-xs px-2.5 py-1.5 text-sm text-foreground hover:bg-accent-1 text-left cursor-pointer"
                              >
                                <Eye className="h-3.5 w-3.5 text-accent-5" />
                                <span>Inspect Response</span>
                              </button>

                              <div className="my-1 border-t border-border" />

                              <div className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-accent-4">
                                Export Candidate
                              </div>

                              <button
                                onClick={() => {
                                  exportCandidateToPdf(
                                    response,
                                    questions,
                                    formTitle
                                  );
                                  setActiveMenuRowId(null);
                                }}
                                className="flex w-full items-center gap-2 rounded-xs px-2.5 py-1.5 text-sm text-foreground hover:bg-accent-1 text-left cursor-pointer"
                              >
                                <FileCode className="h-3.5 w-3.5 text-red-500" />
                                <span>PDF Document</span>
                              </button>

                              <button
                                onClick={() => {
                                  exportCandidateToExcel(
                                    response,
                                    questions,
                                    formTitle
                                  );
                                  setActiveMenuRowId(null);
                                }}
                                className="flex w-full items-center gap-2 rounded-xs px-2.5 py-1.5 text-sm text-foreground hover:bg-accent-1 text-left cursor-pointer"
                              >
                                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-500" />
                                <span>Excel (.xlsx)</span>
                              </button>

                              <button
                                onClick={() => {
                                  exportCandidateToDoc(
                                    response,
                                    questions,
                                    formTitle
                                  );
                                  setActiveMenuRowId(null);
                                }}
                                className="flex w-full items-center gap-2 rounded-xs px-2.5 py-1.5 text-sm text-foreground hover:bg-accent-1 text-left cursor-pointer"
                              >
                                <FileText className="h-3.5 w-3.5 text-blue-500" />
                                <span>Word Document</span>
                              </button>

                              <div className="my-1 border-t border-border" />

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
                      </td>
                    )}
                  </tr>
                );
              })}

              {/* Empty Grid Placeholder Rows with Direct Google Sheets Inline Entry */}
              {Array.from({ length: emptyRowsCount }).map((_, idx) => {
                const rowIndex = responses.length + idx;
                const rowKey = `empty_${rowIndex}`;
                const isEditingEmail =
                  editingCell?.rowKey === rowKey &&
                  editingCell?.questionId === "__email__";
                const isSelectedEmail =
                  selectedCell?.rowKey === rowKey &&
                  selectedCell?.colIndex === 0;
                const remoteEmailCollab = getRemoteCollab(
                  rowKey,
                  rowIndex,
                  0,
                  "__email__"
                );
                const isEmailLocked = Boolean(remoteEmailCollab);

                return (
                  <tr
                    key={rowKey}
                    className="hover:bg-accent-1/20 transition-colors"
                  >
                    <td className="px-3 py-1.5 text-center border-r border-border/40 text-accent-4/30 text-sm">
                      <span className="opacity-0" />
                    </td>
                    <td className="px-2 py-1.5 text-center font-sans text-sm text-accent-4/40 border-r border-border/40">
                      {rowIndex + 1}
                    </td>
                    <td className="px-2 py-1.5 border-r border-border/40 text-sm" />
                    <td className="px-3 py-1.5 border-r border-border/40 text-sm" />

                    {/* Placeholder Email Cell */}
                    <td
                      onClick={() =>
                        handleCellClick(
                          rowKey,
                          "__email__",
                          rowIndex,
                          0,
                          isEmailLocked
                        )
                      }
                      onDoubleClick={() => {
                        if (!isEditingEmail) {
                          startEditingCell(
                            rowKey,
                            "__email__",
                            "",
                            rowIndex,
                            0,
                            true
                          );
                        }
                      }}
                      style={
                        remoteEmailCollab
                          ? {
                              outline: `2px solid ${remoteEmailCollab.color}`,
                              outlineOffset: "-1px",
                            }
                          : undefined
                      }
                      className={`px-3 py-1.5 border-r border-border/40 text-sm align-top relative transition-colors ${
                        isEditingEmail
                          ? "ring-2 ring-emerald-500 bg-background z-20 p-0 shadow-md"
                          : isSelectedEmail
                            ? "ring-2 ring-emerald-500 dark:ring-emerald-400 bg-emerald-500/5 dark:bg-emerald-500/10 z-10 shadow-xs"
                            : isEmailLocked
                              ? "bg-accent-2/20 cursor-not-allowed"
                              : "hover:bg-accent-2/30 cursor-cell"
                      }`}
                      title={
                        remoteEmailCollab
                          ? `Locked by ${remoteEmailCollab.name}`
                          : "Click to select, double click or type to create row"
                      }
                    >
                      {remoteEmailCollab && (
                        <div
                          style={{ backgroundColor: remoteEmailCollab.color }}
                          className="absolute -top-2.5 right-1 z-30 flex items-center gap-1 px-1.5 py-0.5 rounded-xs text-[10px] font-semibold text-white shadow-xs pointer-events-none whitespace-nowrap animate-in fade-in zoom-in-95 duration-100"
                        >
                          <Lock className="h-2.5 w-2.5" />
                          <span>{remoteEmailCollab.name}</span>
                        </div>
                      )}

                      {isSelectedEmail && !isEditingEmail && !isEmailLocked && (
                        <div className="absolute -bottom-1 -right-1 h-2 w-2 rounded-[1px] bg-emerald-500 border border-white dark:border-neutral-900 shadow-xs pointer-events-none z-20" />
                      )}

                      {isEditingEmail ? (
                        <textarea
                          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                          rows={1}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => void handleSaveCell()}
                          onKeyDown={handleKeyDownInEditing}
                          placeholder="Type email & press Enter..."
                          className="h-full min-h-[32px] w-full bg-background px-3 py-1.5 text-sm text-foreground outline-none font-sans resize-none rounded-none"
                        />
                      ) : (
                        <span className="opacity-0 min-h-[20px] inline-block" />
                      )}
                    </td>

                    {/* Placeholder Question Cells */}
                    {questions.map((q, qIdx) => {
                      const colIndex = qIdx + 1;
                      const isEditingThis =
                        editingCell?.rowKey === rowKey &&
                        editingCell?.questionId === q.id;
                      const isSelectedThis =
                        selectedCell?.rowKey === rowKey &&
                        selectedCell?.colIndex === colIndex;
                      const remoteCollab = getRemoteCollab(
                        rowKey,
                        rowIndex,
                        colIndex,
                        q.id
                      );
                      const isCellLocked = Boolean(remoteCollab);

                      return (
                        <td
                          key={q.id}
                          onClick={() =>
                            handleCellClick(
                              rowKey,
                              q.id,
                              rowIndex,
                              colIndex,
                              isCellLocked
                            )
                          }
                          onDoubleClick={() => {
                            if (!isEditingThis) {
                              startEditingCell(
                                rowKey,
                                q.id,
                                "",
                                rowIndex,
                                colIndex,
                                true
                              );
                            }
                          }}
                          style={
                            remoteCollab
                              ? {
                                  outline: `2px solid ${remoteCollab.color}`,
                                  outlineOffset: "-1px",
                                }
                              : undefined
                          }
                          className={`px-3 py-1.5 border-r border-border/40 text-sm align-top relative transition-colors ${
                            isEditingThis
                              ? "ring-2 ring-emerald-500 bg-background z-20 p-0 shadow-md"
                              : isSelectedThis
                                ? "ring-2 ring-emerald-500 dark:ring-emerald-400 bg-emerald-500/5 dark:bg-emerald-500/10 z-10 shadow-xs"
                                : isCellLocked
                                  ? "bg-accent-2/20 cursor-not-allowed"
                                  : "hover:bg-accent-2/30 cursor-cell"
                          }`}
                          title={
                            remoteCollab
                              ? `Locked by ${remoteCollab.name}`
                              : "Click to select, double click or type to create row"
                          }
                        >
                          {remoteCollab && (
                            <div
                              style={{ backgroundColor: remoteCollab.color }}
                              className="absolute -top-2.5 right-1 z-30 flex items-center gap-1 px-1.5 py-0.5 rounded-xs text-[10px] font-semibold text-white shadow-xs pointer-events-none whitespace-nowrap animate-in fade-in zoom-in-95 duration-100"
                            >
                              <Lock className="h-2.5 w-2.5" />
                              <span>{remoteCollab.name}</span>
                            </div>
                          )}

                          {isSelectedThis &&
                            !isEditingThis &&
                            !isCellLocked && (
                              <div className="absolute -bottom-1 -right-1 h-2 w-2 rounded-[1px] bg-emerald-500 border border-white dark:border-neutral-900 shadow-xs pointer-events-none z-20" />
                            )}

                          {isEditingThis ? (
                            <textarea
                              ref={
                                inputRef as React.RefObject<HTMLTextAreaElement>
                              }
                              rows={1}
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={() => void handleSaveCell()}
                              onKeyDown={handleKeyDownInEditing}
                              placeholder="Type answer & press Enter..."
                              className="h-full min-h-[32px] w-full bg-background px-3 py-1.5 text-sm text-foreground outline-none font-sans resize-none rounded-none"
                            />
                          ) : (
                            <span className="opacity-0 min-h-[20px] inline-block" />
                          )}
                        </td>
                      );
                    })}

                    {canEdit && <td className="px-2 py-1 text-center" />}
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
