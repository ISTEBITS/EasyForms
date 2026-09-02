import { useState } from "react";
import {
  GripVertical,
  Trash2,
  Copy,
  MoreVertical,
  CircleDot,
  CheckSquare,
  Star,
  Calendar,
  Mail,
  Hash,
  Upload,
  Type,
  AlignLeft,
  List,
  Plus,
  X,
  SeparatorHorizontal,
  GitBranch,
  SlidersHorizontal,
  Grid3X3,
} from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { renderMarkdownPreview } from "@/lib/form-header-markdown";
import type {
  Question,
  QuestionType,
  QuestionOption,
  QuestionCondition,
  ConditionOperator,
} from "@/types/form";

const iconMap: Record<QuestionType, React.ElementType> = {
  short_text: Type,
  long_text: AlignLeft,
  multiple_choice: CircleDot,
  checkbox: CheckSquare,
  dropdown: List,
  rating: Star,
  date: Calendar,
  email: Mail,
  number: Hash,
  file_upload: Upload,
  section_break: SeparatorHorizontal,
  multiple_choice_grid: Grid3X3,
};

interface QuestionCardProps {
  question: Question;
  allQuestions?: Question[];
  isActive: boolean;
  onClick: () => void;
  onUpdate: (updates: Partial<Question>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

export function QuestionCard({
  question,
  allQuestions = [],
  isActive,
  onClick,
  onUpdate,
  onDelete,
  onDuplicate,
}: QuestionCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showConditioning, setShowConditioning] = useState(false);
  const Icon = iconMap[question.type];

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const otherQuestions = allQuestions.filter(
    (q) => q.id !== question.id && q.type !== "section_break"
  );

  const handleAddOption = () => {
    const newOption: QuestionOption = {
      id: `opt_${Date.now()}`,
      label: `Option ${(question.options?.length || 0) + 1}`,
      value: `option_${(question.options?.length || 0) + 1}`,
    };

    onUpdate({
      options: [...(question.options || []), newOption],
    });
  };

  const isSectionBreak = question.type === "section_break";

  const handleUpdateOption = (optionId: string, label: string) => {
    onUpdate({
      options: question.options?.map((opt) =>
        opt.id === optionId
          ? {
              ...opt,
              label,
              value: label.toLowerCase().replace(/\s+/g, "_"),
            }
          : opt
      ),
    });
  };

  const handleUpdateOptionGoto = (optionId: string, gotoQuestionId: string) => {
    onUpdate({
      options: question.options?.map((opt) =>
        opt.id === optionId
          ? { ...opt, gotoQuestionId: gotoQuestionId || undefined }
          : opt
      ),
    });
  };

  const handleDeleteOption = (optionId: string) => {
    onUpdate({
      options: question.options?.filter((opt) => opt.id !== optionId),
    });
  };

  const handleAddGridRow = () => {
    const currentRows = question.gridRows || ["Row 1", "Row 2"];
    onUpdate({
      gridRows: [...currentRows, `Row ${currentRows.length + 1}`],
    });
  };

  const handleUpdateGridRow = (index: number, value: string) => {
    const currentRows = [...(question.gridRows || ["Row 1", "Row 2"])];
    currentRows[index] = value;
    onUpdate({ gridRows: currentRows });
  };

  const handleDeleteGridRow = (index: number) => {
    const currentRows = (question.gridRows || ["Row 1", "Row 2"]).filter((_, i) => i !== index);
    onUpdate({ gridRows: currentRows });
  };

  const handleAddCondition = () => {
    const defaultTarget = otherQuestions[0]?.id || "";
    const newCond: QuestionCondition = {
      id: `cond_${Date.now()}`,
      fieldId: defaultTarget,
      operator: "equals",
      value: "",
      action: "show",
    };
    onUpdate({
      conditions: [...(question.conditions || []), newCond],
    });
  };

  const handleUpdateConditionRule = (
    condId: string,
    updates: Partial<QuestionCondition>
  ) => {
    onUpdate({
      conditions: question.conditions?.map((c) =>
        c.id === condId ? { ...c, ...updates } : c
      ),
    });
  };

  const handleDeleteConditionRule = (condId: string) => {
    onUpdate({
      conditions: question.conditions?.filter((c) => c.id !== condId),
    });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group ${isDragging ? "z-50 opacity-60 scale-[1.01]" : "z-0"}`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`relative overflow-hidden rounded-sm border bg-background transition-geist duration-150 ${
          isActive
            ? "border-accent-8 shadow-sm"
            : "border-border hover:border-accent-7 hover:shadow-xs"
        }`}
      >
        {/* Active Left Indicator Bar */}
        <div
          className={`absolute left-0 top-0 bottom-0 w-1 bg-geist-success transition-opacity duration-150 ${
            isActive ? "opacity-100" : "opacity-0 group-hover:opacity-40"
          }`}
        />

        <div className="p-5 sm:p-6 pl-6 sm:pl-7">
          <div className="mb-4 flex items-start gap-3">
            {/* Drag Handle */}
            <button
              ref={setActivatorNodeRef}
              type="button"
              {...attributes}
              {...listeners}
              className={`mt-1 rounded-xs p-1 transition-geist duration-150 touch-none cursor-grab active:cursor-grabbing ${
                isHovered || isActive
                  ? "bg-accent-1 text-accent-6 opacity-100"
                  : "text-accent-4 opacity-0 sm:opacity-0 group-hover:opacity-100"
              }`}
              onClick={(e) => e.stopPropagation()}
              aria-label="Drag to reorder question"
            >
              <GripVertical className="h-4 w-4" />
            </button>

            {/* Type Icon Badge */}
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-sm border border-border bg-accent-1 text-accent-6">
              <Icon className="h-4 w-4" />
            </div>

            {/* Question Title Input */}
            <div className="min-w-0 flex-1">
              <Input
                value={question.title}
                onChange={(e) => onUpdate({ title: e.target.value })}
                placeholder={
                  isSectionBreak ? "Untitled Section" : "Untitled Question"
                }
                className="border-0 border-b border-transparent bg-transparent px-0 text-base font-semibold text-foreground hover:border-border focus:border-accent-8 focus:ring-0 placeholder:text-accent-4"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {/* Actions Bar */}
            <div
              className={`flex items-center gap-2 transition-opacity duration-150 ${
                isHovered || isActive ? "opacity-100" : "opacity-0"
              }`}
            >
              {/* Logic / Conditioning Button */}
              {!isSectionBreak && (
                <Button
                  variant={showConditioning ? "secondary" : "ghost"}
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowConditioning(!showConditioning);
                  }}
                  className="h-8 rounded-xs px-2 text-sm font-medium text-accent-5 hover:bg-accent-1 hover:text-foreground"
                  title="Configure Conditioning & Logic Rules"
                >
                  <GitBranch className="h-3.5 w-3.5 sm:mr-1 text-geist-success" />
                  <span className="hidden sm:inline">Logic</span>
                  {(question.conditions?.length || 0) > 0 && (
                    <span className="ml-1 rounded-full bg-foreground px-1.5 py-0.2 text-sm font-sans text-background font-semibold">
                      {question.conditions?.length}
                    </span>
                  )}
                </Button>
              )}

              {/* Required Switch (Desktop) */}
              <div className="hidden items-center gap-2 rounded-sm border border-border bg-accent-1/50 px-2.5 py-1 sm:flex">
                <Switch
                  id={`required-${question.id}`}
                  checked={question.required}
                  onCheckedChange={(checked) => onUpdate({ required: checked })}
                  disabled={isSectionBreak}
                  onClick={(e) => e.stopPropagation()}
                />
                <Label
                  htmlFor={`required-${question.id}`}
                  className="cursor-pointer text-sm font-medium text-accent-5"
                  onClick={(e) => e.stopPropagation()}
                >
                  Required
                </Label>
              </div>

              {/* Menu Trigger */}
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => e.stopPropagation()}
                      className="h-8 w-8 rounded-xs border border-border bg-background text-accent-5 hover:bg-accent-1 hover:text-foreground"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  }
                />
                <DropdownMenuContent
                  align="end"
                  className="w-44 border-border bg-background text-foreground"
                >
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicate();
                    }}
                    className="cursor-pointer text-sm font-medium"
                  >
                    <Copy className="mr-2 h-3.5 w-3.5" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                    }}
                    variant="destructive"
                    className="cursor-pointer text-sm font-medium"
                  >
                    <Trash2 className="mr-2 h-3.5 w-3.5 text-geist-error" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Required Switch (Mobile) */}
          <div className="mb-4 ml-11 flex items-center gap-3 sm:hidden">
            <Switch
              id={`required-mobile-${question.id}`}
              checked={question.required}
              onCheckedChange={(checked) => onUpdate({ required: checked })}
              disabled={isSectionBreak}
              onClick={(e) => e.stopPropagation()}
            />
            <Label
              htmlFor={`required-mobile-${question.id}`}
              className="cursor-pointer text-sm text-accent-5 font-medium"
              onClick={(e) => e.stopPropagation()}
            >
              Required
            </Label>
          </div>

          {/* Question Description / Help Text & Placeholder */}
          {(isActive || question.description || isSectionBreak) && (
            <div className="mb-4 ml-11 space-y-2">
              {isActive ? (
                <>
                  <Textarea
                    value={question.description || ""}
                    onChange={(e) => onUpdate({ description: e.target.value })}
                    placeholder={
                      isSectionBreak
                        ? "Describe this section or page (Markdown supported)..."
                        : "Add help text for respondents (Markdown supported)..."
                    }
                    className="min-h-[38px] resize-none border-0 border-b border-transparent bg-transparent px-0 text-sm text-accent-5 hover:border-border focus:border-accent-8 focus:ring-0 placeholder:text-accent-4 font-sans"
                    rows={1}
                    onClick={(e) => e.stopPropagation()}
                  />

                  {/* Placeholder setting for input questions */}
                  {!isSectionBreak &&
                    question.type !== "rating" &&
                    question.type !== "file_upload" && (
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-sm font-sans font-semibold text-accent-5 shrink-0">
                          Placeholder:
                        </span>
                        <Input
                          value={question.placeholder || ""}
                          onChange={(e) => onUpdate({ placeholder: e.target.value })}
                          placeholder={`Custom placeholder for ${question.type.replace("_", " ")}...`}
                          className="h-7 border-border bg-background px-2 text-sm text-foreground placeholder:text-accent-4 hover:border-border focus:border-accent-8"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    )}
                </>
              ) : (
                question.description && (
                  <div
                    className="text-sm text-accent-5 leading-relaxed space-y-1"
                    dangerouslySetInnerHTML={{
                      __html: renderMarkdownPreview(question.description),
                    }}
                  />
                )
              )}
            </div>
          )}

          {/* Question Body Preview / Options Editing */}
          <div className="ml-11" onClick={(e) => e.stopPropagation()}>
            {question.type === "section_break" && (
              <div className="rounded-sm border border-dashed border-border bg-accent-1/50 px-4 py-3 text-sm text-accent-6">
                📄 A new section page break will occur here in the public form.
              </div>
            )}

            {(question.type === "short_text" ||
              question.type === "email" ||
              question.type === "number") && (
              <Input
                placeholder={question.placeholder || "Short answer text"}
                disabled
                className="h-9 cursor-not-allowed rounded-sm border-border bg-accent-1/60 text-sm text-accent-4"
              />
            )}

            {question.type === "long_text" && (
              <Textarea
                placeholder={question.placeholder || "Long answer text"}
                disabled
                className="min-h-[64px] cursor-not-allowed resize-none rounded-sm border-border bg-accent-1/60 text-sm text-accent-4"
              />
            )}

            {(question.type === "multiple_choice" ||
              question.type === "checkbox" ||
              question.type === "dropdown") && (
              <div className="space-y-2">
                {question.options?.map((option, index) => (
                  <div
                    key={option.id}
                    className="group/option flex items-center gap-2"
                  >
                    {question.type === "multiple_choice" && (
                      <CircleDot className="h-4 w-4 text-accent-4 flex-shrink-0" />
                    )}
                    {question.type === "checkbox" && (
                      <CheckSquare className="h-4 w-4 text-accent-4 flex-shrink-0" />
                    )}
                    {question.type === "dropdown" && (
                      <span className="w-4 text-center text-sm text-accent-4 flex-shrink-0 font-medium">
                        {index + 1}
                      </span>
                    )}
                    <Input
                      value={option.label}
                      onChange={(e) =>
                        handleUpdateOption(option.id, e.target.value)
                      }
                      className="h-8 border-0 border-b border-transparent bg-transparent px-0 text-sm font-medium text-foreground hover:border-border focus:border-accent-8 focus:ring-0"
                    />

                    {/* Option Go-To Target Selector (Google Forms Style) */}
                    {isActive && (question.type === "multiple_choice" || question.type === "dropdown") && (
                      <div className="flex items-center gap-1 shrink-0 ml-auto">
                        <GitBranch className="h-3 w-3 text-accent-4" />
                        <select
                          value={option.gotoQuestionId || ""}
                          onChange={(e) => handleUpdateOptionGoto(option.id, e.target.value)}
                          className="h-7 rounded-sm border border-border bg-background px-2 text-sm text-accent-5 hover:border-accent-8 focus:border-accent-8 outline-none font-sans"
                          onClick={(e) => e.stopPropagation()}
                          title="Go to section or question based on this answer"
                        >
                          <option value="">Next question</option>
                          {otherQuestions.map((q) => (
                            <option key={q.id} value={q.id}>
                              Go to: Q{allQuestions.indexOf(q) + 1} - {q.title.slice(0, 18)}
                            </option>
                          ))}
                          <option value="submit">Submit form</option>
                        </select>
                      </div>
                    )}

                    {question.options && question.options.length > 1 && (
                      <button
                        onClick={() => handleDeleteOption(option.id)}
                        className="rounded-xs p-1 text-accent-4 opacity-0 transition-opacity duration-150 group-hover/option:opacity-100 hover:bg-accent-1 hover:text-geist-error"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={handleAddOption}
                  className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-accent-5 transition-geist duration-150 hover:text-foreground"
                >
                  <Plus className="h-3.5 w-3.5 text-geist-success" />
                  Add option
                </button>
              </div>
            )}

            {question.type === "rating" && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {[...Array(question.maxRating || 5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < 3
                          ? "fill-foreground text-foreground"
                          : "text-accent-3"
                      }`}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-1 text-sm text-accent-5">
                  <span>Scale:</span>
                  <input
                    type="number"
                    value={question.maxRating || 5}
                    onChange={(e) =>
                      onUpdate({ maxRating: parseInt(e.target.value) || 5 })
                    }
                    className="h-7 w-12 rounded-sm border border-border bg-background px-1.5 text-center text-sm text-foreground focus:border-accent-8 focus:outline-none"
                    min={1}
                    max={10}
                  />
                </div>
              </div>
            )}

            {question.type === "date" && (
              <div className="flex h-9 items-center rounded-sm border border-border bg-accent-1/60 px-3 text-sm text-accent-4">
                <Calendar className="mr-2 h-3.5 w-3.5" />
                YYYY - MM - DD
              </div>
            )}

            {question.type === "file_upload" && (
              <div className="rounded-sm border border-dashed border-border bg-accent-1/40 p-4 text-center">
                <Upload className="mx-auto h-4 w-4 text-accent-4" />
                <p className="mt-1.5 text-sm text-accent-5 font-medium">
                  File Upload Field (Respondents can attach files)
                </p>
              </div>
            )}

            {question.type === "multiple_choice_grid" && (
              <div className="space-y-4 pt-1 font-sans">
                {/* 2-Column Side-by-Side Builder for Rows and Columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Rows Section */}
                  <div className="rounded-sm border border-border bg-accent-1/30 p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold text-foreground flex items-center gap-1.5 font-sans">
                        <span>Rows (Statements / Prompts)</span>
                      </Label>
                      <span className="text-xs text-accent-5">{(question.gridRows || []).length} rows</span>
                    </div>

                    <div className="space-y-2">
                      {(question.gridRows || ["Row 1", "Row 2"]).map((row, rIdx) => (
                        <div key={rIdx} className="group/row flex items-center gap-2">
                          <span className="text-xs font-mono text-accent-4 w-5 text-right shrink-0">{rIdx + 1}.</span>
                          <Input
                            value={row}
                            onChange={(e) => handleUpdateGridRow(rIdx, e.target.value)}
                            className="h-8 border-border bg-background text-sm font-medium text-foreground hover:border-accent-8 focus:border-accent-8 font-sans"
                            placeholder={`Row ${rIdx + 1}`}
                          />
                          {(question.gridRows || []).length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteGridRow(rIdx)}
                              className="p-1 text-accent-4 hover:text-red-400 opacity-60 group-hover/row:opacity-100 transition-opacity cursor-pointer shrink-0"
                              title="Remove row"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={handleAddGridRow}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-5 hover:text-foreground pt-1 cursor-pointer font-sans"
                      >
                        <Plus className="h-3.5 w-3.5 text-geist-success" />
                        Add row
                      </button>
                    </div>
                  </div>

                  {/* Columns Section */}
                  <div className="rounded-sm border border-border bg-accent-1/30 p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold text-foreground flex items-center gap-1.5 font-sans">
                        <span>Columns (Choices / Scale)</span>
                      </Label>
                      <span className="text-xs text-accent-5">{(question.options || []).length} columns</span>
                    </div>

                    <div className="space-y-2">
                      {(question.options || []).map((col, cIdx) => (
                        <div key={col.id} className="group/col flex items-center gap-2">
                          <CircleDot className="h-3.5 w-3.5 text-accent-4 shrink-0" />
                          <Input
                            value={col.label}
                            onChange={(e) => handleUpdateOption(col.id, e.target.value)}
                            className="h-8 border-border bg-background text-sm font-medium text-foreground hover:border-accent-8 focus:border-accent-8 font-sans"
                            placeholder={`Column ${cIdx + 1}`}
                          />
                          {(question.options || []).length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteOption(col.id)}
                              className="p-1 text-accent-4 hover:text-red-400 opacity-60 group-hover/col:opacity-100 transition-opacity cursor-pointer shrink-0"
                              title="Remove column"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={handleAddOption}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-5 hover:text-foreground pt-1 cursor-pointer font-sans"
                      >
                        <Plus className="h-3.5 w-3.5 text-geist-success" />
                        Add column
                      </button>
                    </div>
                  </div>
                </div>

                {/* Grid Live Preview */}
                <div className="rounded-sm border border-border bg-background p-3.5 overflow-x-auto hide-scrollbar w-full">
                  <p className="text-xs font-semibold text-accent-5 uppercase tracking-wider mb-2.5 font-sans">
                    Grid Preview
                  </p>
                  <table className="w-full border-collapse text-left text-sm font-sans min-w-full">
                    <thead>
                      <tr className="border-b border-border/80 bg-accent-1/20">
                        <th className="sticky left-0 z-10 bg-background py-2 px-3 font-medium text-accent-5 text-xs min-w-[130px] sm:min-w-[160px] border-r border-border/80 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.6)]">
                          Criteria / Prompts
                        </th>
                        {(question.options || []).map((col) => (
                          <th key={col.id} className="py-2 px-3 text-center font-medium text-foreground text-xs min-w-[80px] sm:min-w-[100px] border-l border-border/40 whitespace-nowrap">
                            {col.label || "Untitled"}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {(question.gridRows || ["Row 1", "Row 2"]).map((row, rIdx) => (
                        <tr key={rIdx} className="group/row hover:bg-accent-1/20 transition-colors">
                          <td className="sticky left-0 z-10 bg-background group-hover/row:bg-accent-1/20 py-2.5 px-3 text-foreground font-medium text-xs min-w-[130px] sm:min-w-[160px] border-r border-border/80 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.6)] transition-colors truncate">
                            {row || `Row ${rIdx + 1}`}
                          </td>
                          {(question.options || []).map((col) => (
                            <td key={col.id} className="py-2.5 px-3 text-center border-l border-border/40 min-w-[80px] sm:min-w-[100px]">
                              <div className="h-4 w-4 rounded-full border border-border/80 mx-auto" />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {/* Conditioning & Logic Rules Panel */}
            {showConditioning && (
              <div
                className="mt-5 rounded-sm border border-border bg-accent-1/50 p-4 space-y-3 animate-fade-in"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2.5">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 text-geist-success" />
                    <span className="text-sm font-semibold text-foreground font-sans">
                      Conditioning & Logic Rules
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-accent-5 font-sans uppercase font-semibold">
                      MATCH:
                    </span>
                    <select
                      value={question.logicOperator || "AND"}
                      onChange={(e) =>
                        onUpdate({
                          logicOperator: e.target.value as "AND" | "OR",
                        })
                      }
                      className="h-7 rounded-sm border border-border bg-background px-2 text-sm text-foreground outline-none font-sans"
                    >
                      <option value="AND">ALL Rules (AND)</option>
                      <option value="OR">ANY Rule (OR)</option>
                    </select>
                  </div>
                </div>

                {!question.conditions || question.conditions.length === 0 ? (
                  <p className="text-sm text-accent-5 font-sans py-1">
                    No visibility conditions set. Question will always be shown.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {question.conditions.map((rule) => (
                      <div
                        key={rule.id}
                        className="flex flex-wrap items-center gap-2 rounded-sm border border-border bg-background p-2.5 text-sm shadow-xs"
                      >
                        <select
                          value={rule.action}
                          onChange={(e) =>
                            handleUpdateConditionRule(rule.id, {
                              action: e.target.value as "show" | "hide",
                            })
                          }
                          className="h-7 rounded-sm border border-border bg-accent-1 px-2 text-sm text-foreground font-medium outline-none"
                        >
                          <option value="show">Show question if</option>
                          <option value="hide">Hide question if</option>
                        </select>

                        <select
                          value={rule.fieldId}
                          onChange={(e) =>
                            handleUpdateConditionRule(rule.id, {
                              fieldId: e.target.value,
                            })
                          }
                          className="h-7 max-w-[180px] truncate rounded-sm border border-border bg-background px-2 text-sm text-foreground outline-none font-sans"
                        >
                          <option value="" disabled>
                            Select target question...
                          </option>
                          {otherQuestions.map((q) => (
                            <option key={q.id} value={q.id}>
                              Q{allQuestions.indexOf(q) + 1}: {q.title}
                            </option>
                          ))}
                        </select>

                        <select
                          value={rule.operator}
                          onChange={(e) =>
                            handleUpdateConditionRule(rule.id, {
                              operator: e.target.value as ConditionOperator,
                            })
                          }
                          className="h-7 rounded-sm border border-border bg-background px-2 text-sm text-accent-5 outline-none font-sans"
                        >
                          <option value="equals">Equals</option>
                          <option value="not_equals">Does not equal</option>
                          <option value="contains">Contains</option>
                          <option value="greater_than">Greater than</option>
                          <option value="less_than">Less than</option>
                          <option value="is_filled">Is filled</option>
                          <option value="is_empty">Is empty</option>
                        </select>

                        {rule.operator !== "is_filled" &&
                          rule.operator !== "is_empty" && (
                            <Input
                              value={rule.value || ""}
                              onChange={(e) =>
                                handleUpdateConditionRule(rule.id, {
                                  value: e.target.value,
                                })
                              }
                              placeholder="Value to match..."
                              className="h-7 w-32 border border-border bg-background text-sm text-foreground placeholder:text-accent-4 focus:border-accent-8"
                            />
                          )}

                        <button
                          onClick={() => handleDeleteConditionRule(rule.id)}
                          className="ml-auto rounded-xs p-1 text-accent-4 hover:bg-accent-1 hover:text-geist-error transition-colors"
                          title="Remove rule"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={handleAddCondition}
                  disabled={otherQuestions.length === 0}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-geist-success transition-colors disabled:opacity-50"
                >
                  <Plus className="h-3.5 w-3.5 text-geist-success" />
                  <span>Add Condition Rule</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
