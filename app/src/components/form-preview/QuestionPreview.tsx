import { useRef, useState } from "react";
import { FileText, Loader, Star, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
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
      ? "p-4 sm:p-5"
      : previewDevice === "mobile"
        ? "p-4"
        : "p-5";

  return (
    <div
      className={`rounded-sm border border-border bg-background ${questionCardPaddingClass}`}
    >
      <div className="mb-4 flex items-start gap-3">
        <div className="inline-flex h-6 w-6 items-center justify-center rounded-sm bg-accent-2 text-xs text-accent-6">
          {index}
        </div>
        <div className="min-w-0">
          <Label className="text-sm font-medium text-foreground">
            <span dangerouslySetInnerHTML={{ __html: renderInlineMarkdownHtml(question.title) }} />
            {question.required && <span className="ml-1 text-error">*</span>}
          </Label>
          {question.description && (
            <div
              className="mt-1 text-xs text-accent-5 leading-relaxed space-y-1"
              dangerouslySetInnerHTML={{
                __html: renderMarkdownPreview(question.description),
              }}
            />
          )}
        </div>
      </div>

      <div className="space-y-3">
        {question.type === "short_text" && (
          <Input
            value={textValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder={question.placeholder || "Enter your response"}
            required={question.required}
            className="h-10 border-border bg-accent-1 text-foreground placeholder:text-accent-4"
          />
        )}

        {question.type === "long_text" && (
          <Textarea
            value={textValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder={question.placeholder || "Enter detailed response"}
            required={question.required}
            rows={4}
            className="resize-none border-border bg-accent-1 text-foreground placeholder:text-accent-4"
          />
        )}

        {question.type === "email" && (
          <Input
            type="email"
            value={textValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder={question.placeholder || "name@organization.com"}
            required={question.required}
            className="h-10 border-border bg-accent-1 text-foreground placeholder:text-accent-4"
          />
        )}

        {question.type === "number" && (
          <Input
            type="number"
            value={textValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder={question.placeholder || "0"}
            required={question.required}
            className="h-10 border-border bg-accent-1 text-foreground placeholder:text-accent-4"
          />
        )}

        {question.type === "date" && (
          <Input
            type="date"
            value={selectValue}
            onChange={(e) => onChange(e.target.value)}
            required={question.required}
            className="h-10 border-border bg-accent-1 text-foreground [color-scheme:dark]"
          />
        )}

        {question.type === "multiple_choice" && (
          <RadioGroup
            value={selectValue}
            onValueChange={onChange}
            className="space-y-2"
          >
            {question.options?.map((option) => (
              <label
                key={option.id}
                className="flex cursor-pointer items-center gap-3 rounded-sm border border-border bg-accent-1 p-3 transition-geist duration-150 hover:border-accent-8"
              >
                <RadioGroupItem
                  value={option.value}
                  id={option.id}
                />
                <span className="text-sm text-foreground">
                  {option.label}
                </span>
              </label>
            ))}
          </RadioGroup>
        )}

        {question.type === "checkbox" && (
          <div className="space-y-2">
            {question.options?.map((option) => (
              <label
                key={option.id}
                className="flex cursor-pointer items-center gap-3 rounded-sm border border-border bg-accent-1 p-3 transition-geist duration-150 hover:border-accent-8"
              >
                <Checkbox
                  id={option.id}
                  checked={checkboxValues.includes(option.value)}
                  onCheckedChange={(checked) => {
                    const currentValues = checkboxValues;
                    if (checked) {
                      onChange([...currentValues, option.value]);
                    } else {
                      onChange(
                        currentValues.filter((v) => v !== option.value),
                      );
                    }
                  }}
                />
                <span className="text-sm text-foreground">
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        )}

        {question.type === "dropdown" && (
          <Select value={selectValue} onValueChange={onChange}>
            <SelectTrigger className="h-10 w-full border-border bg-accent-1 text-foreground">
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent className="border-border bg-background text-foreground">
              {question.options?.map((option) => (
                <SelectItem key={option.id} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {question.type === "rating" && (
          <div className="flex items-center gap-1 py-1">
            {[...Array(question.maxRating || 5)].map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onChange(i + 1)}
                className="rounded-xs p-1 transition-geist duration-150"
              >
                <Star
                  className={`h-5 w-5 ${
                    ratingValue > i
                      ? "fill-foreground text-foreground"
                      : "text-accent-2"
                  }`}
                />
              </button>
            ))}
          </div>
        )}

        {question.type === "file_upload" && (
          <div className="space-y-3">
            {value ? (
              <div className="flex items-center justify-between rounded-sm border border-border bg-accent-1 p-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-border bg-accent-1">
                    <FileText className="h-4 w-4 text-accent-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm text-foreground">
                      {displayFileName || "Attached File"}
                    </p>
                    <p className="text-xs text-accent-4">
                      Ready for submission
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="rounded-xs p-1 text-accent-4 transition-geist duration-150 hover:text-error"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => !isDisabled && fileInputRef.current?.click()}
                className={`rounded-sm border-2 border-dashed p-6 text-center transition-geist duration-150 ${
                  isDisabled
                    ? "cursor-not-allowed border-accent-2 bg-accent-1/60 opacity-60"
                    : "cursor-pointer border-border bg-accent-1 hover:border-accent-8"
                }`}
              >
                {uploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader className="h-5 w-5 animate-spin text-accent-4" />
                    <p className="text-sm text-accent-5">Uploading...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload
                      className={`h-5 w-5 ${isDisabled ? "text-accent-3" : "text-accent-6"}`}
                    />
                    <p
                      className={`text-sm ${isDisabled ? "text-accent-3" : "text-accent-6"}`}
                    >
                      {isDisabled
                        ? "Authentication required to upload"
                        : "Click to upload file"}
                    </p>
                    <p className="text-xs text-accent-4">
                      PDF, DOC, PNG, JPG up to 5MB
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
