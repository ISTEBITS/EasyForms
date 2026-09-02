import { useRef, useState } from "react";
import { FileText, Loader2, Star, Upload, X, Check } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { uploadFile } from "@/api";
import { renderMarkdownPreview, renderInlineMarkdownHtml } from "@/lib/form-header-markdown";
import { isQuestionVisible } from "@/lib/condition-evaluator";
import type { Answer, Question } from "@/types/form";
import type { PreviewDevice } from "./types";
import { cn } from "@/lib/utils";

interface QuestionPreviewProps {
  question: Question;
  value: Answer["value"];
  answers?: Record<string, unknown>;
  onChange: (value: Answer["value"]) => void;
  index: number;
  previewDevice: PreviewDevice;
  setUploading: React.Dispatch<React.SetStateAction<boolean>>;
  uploading: boolean;
  googleToken: string | null;
  requiresVerification: boolean;
}

export function QuestionPreview({
  question,
  value,
  answers,
  onChange,
  index,
  previewDevice,
  setUploading,
  uploading,
  googleToken,
  requiresVerification,
}: QuestionPreviewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localFileName, setLocalFileName] = useState<string | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  if (answers && !isQuestionVisible(question, answers)) {
    return null;
  }

  const handleFileSelect = async (file: File | undefined) => {
    if (!file) return;
    try {
      setUploading(true);
      const response = await uploadFile(file);
      onChange(response.url);
      setLocalFileName(file.name);
      toast.success("File uploaded successfully");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Upload failed";
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLocalFileName(null);
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const displayFileName =
    localFileName ||
    (typeof value === "string" ? value.split("/").pop() : null);
  const isDisabled = uploading || (requiresVerification && !googleToken);
  const textValue =
    typeof value === "string" || typeof value === "number"
      ? String(value)
      : "";
  const selectValue = typeof value === "string" ? value : "";
  const checkboxValues = Array.isArray(value)
    ? value.filter((v): v is string => typeof v === "string")
    : [];
  const ratingValue = typeof value === "number" ? value : Number(value) || 0;
  const questionCardPaddingClass =
    previewDevice === "auto"
      ? "p-5 sm:p-6"
      : previewDevice === "mobile"
        ? "p-4"
        : "p-6";

  return (
    <div
      className={`group/card rounded-md border border-border bg-background shadow-xs transition-all duration-150 focus-within:border-foreground/70 font-sans ${questionCardPaddingClass}`}
    >
      {/* Question Header: Question number always shown without tick replacement */}
      <div className="mb-4 flex items-start justify-between gap-3.5">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-xs font-sans text-xs font-semibold border border-border bg-accent-1 text-accent-7 mt-0.5">
            {index}
          </div>

          <div className="min-w-0 flex-1">
            <Label className="text-sm font-semibold text-foreground tracking-tight block leading-snug font-sans">
              <span dangerouslySetInnerHTML={{ __html: renderInlineMarkdownHtml(question.title) }} />
              {question.required && (
                <span className="ml-1 text-red-400/70 font-bold" title="Required field">*</span>
              )}
            </Label>
            {question.description && (
              <div
                className="mt-1.5 text-xs text-accent-5 leading-relaxed space-y-1 font-sans"
                dangerouslySetInnerHTML={{
                  __html: renderMarkdownPreview(question.description),
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Input Controls with blackish background and NO blue on-focus borders */}
      <div className="space-y-3 pt-1">
        {question.type === "short_text" && (
          <Input
            value={textValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder={question.placeholder || "Type your answer here..."}
            required={question.required}
            className="h-10 rounded-sm border-[#262626] bg-[#0c0c0c] text-foreground text-sm font-sans placeholder:text-accent-4 focus:bg-black focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:border-foreground focus:border-foreground transition-all"
          />
        )}

        {question.type === "long_text" && (
          <Textarea
            value={textValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder={question.placeholder || "Type your detailed response..."}
            required={question.required}
            rows={4}
            className="resize-y min-h-[96px] rounded-sm border-[#262626] bg-[#0c0c0c] text-foreground text-sm font-sans placeholder:text-accent-4 focus:bg-black focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:border-foreground focus:border-foreground transition-all"
          />
        )}

        {question.type === "email" && (
          <Input
            type="email"
            value={textValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder={question.placeholder || "name@company.com"}
            required={question.required}
            className="h-10 rounded-sm border-[#262626] bg-[#0c0c0c] text-foreground text-sm font-sans placeholder:text-accent-4 focus:bg-black focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:border-foreground focus:border-foreground transition-all"
          />
        )}

        {question.type === "number" && (
          <Input
            type="number"
            value={textValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder={question.placeholder || "0"}
            required={question.required}
            className="h-10 rounded-sm border-[#262626] bg-[#0c0c0c] text-foreground text-sm font-sans placeholder:text-accent-4 focus:bg-black focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:border-foreground focus:border-foreground transition-all"
          />
        )}

        {question.type === "date" && (
          <Input
            type="date"
            value={selectValue}
            onChange={(e) => onChange(e.target.value)}
            required={question.required}
            className="h-10 rounded-sm border-[#262626] bg-[#0c0c0c] text-foreground text-sm font-sans focus:bg-black focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:border-foreground focus:border-foreground transition-all"
          />
        )}

        {question.type === "multiple_choice" && (
          <RadioGroup
            value={selectValue}
            onValueChange={onChange}
            className="space-y-2"
          >
            {question.options?.map((option) => {
              const isSelected = selectValue === option.value;
              return (
                <label
                  key={option.id}
                  className={`flex cursor-pointer items-center justify-between gap-3 rounded-sm border p-3.5 transition-all duration-150 ${isSelected
                      ? "border-foreground bg-accent-1 text-foreground shadow-2xs"
                      : "border-[#262626] bg-[#0c0c0c] hover:border-accent-5 hover:bg-[#141414] text-accent-7"
                    }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <RadioGroupItem
                      value={option.value}
                      id={option.id}
                      className={cn("border-[#444] text-foreground focus:ring-0 focus:outline-none", isSelected && "bg-foreground text-foreground")}
                    />
                    <span className="text-sm font-medium text-foreground font-sans truncate">
                      {option.label}
                    </span>
                  </div>
                </label>
              );
            })}
          </RadioGroup>
        )}

        {question.type === "checkbox" && (
          <div className="space-y-2">
            {question.options?.map((option) => {
              const isChecked = checkboxValues.includes(option.value);

              return (
                <label
                  key={option.id}
                  onClick={() => {
                    const currentValues = checkboxValues;
                    if (isChecked) {
                      onChange(currentValues.filter((v) => v !== option.value));
                    } else {
                      onChange([...currentValues, option.value]);
                    }
                  }}
                  className={`flex cursor-pointer items-center justify-between gap-3 rounded-sm border p-3.5 transition-all duration-150 ${isChecked
                      ? "border-foreground bg-accent-1 text-foreground shadow-2xs"
                      : "border-[#262626] bg-[#0c0c0c] hover:border-accent-5 hover:bg-[#141414] text-accent-7"
                    }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-xs border transition-colors ${isChecked
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-background"
                        }`}
                    >
                      {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                    <span className="text-sm font-medium text-foreground font-sans truncate">
                      {option.label}
                    </span>
                  </div>
                </label>
              );
            })}
          </div>
        )}

        {question.type === "dropdown" && (
          <Select value={selectValue} onValueChange={onChange}>
            <SelectTrigger className="h-10 w-full rounded-sm border-[#262626] bg-[#0c0c0c] text-foreground text-sm font-sans focus:bg-black focus:outline-none focus:ring-0 focus:border-foreground transition-all">
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent className="rounded-sm border-border bg-[#0c0c0c] text-foreground shadow-md">
              {question.options?.map((option) => (
                <SelectItem key={option.id} value={option.value} className="rounded-xs text-sm font-sans">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {question.type === "rating" && (
          <div className="space-y-2 py-1">
            <div className="flex items-center gap-2">
              {[...Array(question.maxRating || 5)].map((_, i) => {
                const starIndex = i + 1;
                const isLit = (hoverRating !== null ? hoverRating : ratingValue) >= starIndex;

                return (
                  <button
                    key={i}
                    type="button"
                    onMouseEnter={() => setHoverRating(starIndex)}
                    onMouseLeave={() => setHoverRating(null)}
                    onClick={() => onChange(starIndex)}
                    className="rounded-sm p-2 transition-all duration-150 hover:bg-accent-1 active:scale-95 cursor-pointer"
                  >
                    <Star
                      className={`h-6 w-6 transition-all duration-150 ${isLit
                          ? "fill-foreground text-foreground scale-105"
                          : "text-accent-3 fill-transparent hover:text-accent-5"
                        }`}
                    />
                  </button>
                );
              })}
            </div>

            {ratingValue > 0 && (
              <p className="text-xs text-accent-5 font-sans">
                Rating selected: <span className="font-semibold text-foreground">{ratingValue}</span> / {question.maxRating || 5}
              </p>
            )}
          </div>
        )}

        {question.type === "file_upload" && (
          <div className="space-y-3">
            {value ? (
              <div className="flex items-center justify-between rounded-sm border border-[#262626] bg-[#0c0c0c] p-3.5 shadow-2xs">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-border bg-background shrink-0">
                    <FileText className="h-4.5 w-4.5 text-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground font-sans">
                      {displayFileName || "Attached File"}
                    </p>
                    <p className="text-xs text-emerald-500 font-sans flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      <span>Ready for submission</span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="rounded-xs p-1.5 text-accent-5 transition-colors hover:bg-accent-2 hover:text-foreground cursor-pointer"
                  title="Remove file"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => !isDisabled && fileInputRef.current?.click()}
                className={`rounded-md border border-dashed p-6 text-center transition-all duration-150 ${isDisabled
                    ? "cursor-not-allowed border-[#262626] bg-[#0c0c0c]/40 opacity-60"
                    : "cursor-pointer border-[#262626] bg-[#0c0c0c] hover:border-foreground/50 hover:bg-[#121212] active:scale-[0.99]"
                  }`}
              >
                {uploading ? (
                  <div className="flex flex-col items-center gap-2 py-2">
                    <Loader2 className="h-6 w-6 animate-spin text-foreground" />
                    <p className="text-sm font-medium text-foreground font-sans">Uploading attachment...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-sm border border-border bg-background shadow-2xs">
                      <Upload
                        className={`h-4.5 w-4.5 ${isDisabled ? "text-accent-3" : "text-foreground"}`}
                      />
                    </div>
                    <p
                      className={`text-sm font-medium font-sans ${isDisabled ? "text-accent-4" : "text-foreground"}`}
                    >
                      {isDisabled
                        ? "Authentication required to upload"
                        : "Click or drag files here to upload"}
                    </p>
                    <p className="text-xs text-accent-5 font-sans">
                      Supports files up to 10MB
                    </p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept={question.acceptFileTypes || "*/*"}
                  onChange={(e) => handleFileSelect(e.target.files?.[0])}
                  disabled={isDisabled}
                  required={question.required && !value}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
