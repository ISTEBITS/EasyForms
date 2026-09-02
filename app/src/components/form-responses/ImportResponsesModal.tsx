import React, { useState, useRef } from "react";
import { X, Upload, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Question, Answer } from "@/types/form";

interface ImportResponsesModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: Question[];
  onImportRows: (rows: Array<{ answers: Answer[]; respondentEmail?: string }>) => Promise<void>;
}

export const ImportResponsesModal: React.FC<ImportResponsesModalProps> = ({
  isOpen,
  onClose,
  questions,
  onImportRows,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [emailColumn, setEmailColumn] = useState<string>("");
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text
        .split(/\r\n|\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      if (lines.length === 0) {
        toast.error("Empty CSV file");
        return;
      }

      // Parse headers
      const headers = lines[0].split(",").map((h) => h.replace(/^["']|["']$/g, "").trim());
      setCsvHeaders(headers);

      // Parse rows
      const rows = lines.slice(1).map((line) => {
        return line.split(",").map((cell) => cell.replace(/^["']|["']$/g, "").trim());
      });
      setCsvRows(rows);

      // Auto-match headers to question titles or 'email'
      const autoMap: Record<string, string> = {};
      questions.forEach((q) => {
        const matchingHeader = headers.find(
          (h) => h.toLowerCase() === q.title.toLowerCase() || h.toLowerCase().includes(q.title.toLowerCase())
        );
        if (matchingHeader) {
          autoMap[q.id] = matchingHeader;
        }
      });
      setColumnMapping(autoMap);

      const emailHeader = headers.find((h) => h.toLowerCase().includes("email") || h.toLowerCase().includes("respondent"));
      if (emailHeader) setEmailColumn(emailHeader);
    };

    reader.readAsText(selected);
  };

  const handleExecuteImport = async () => {
    if (csvRows.length === 0) {
      toast.error("No data rows found in file");
      return;
    }

    try {
      setIsImporting(true);
      const emailColIdx = csvHeaders.indexOf(emailColumn);

      const payload = csvRows.map((row) => {
        const answers: Answer[] = [];
        questions.forEach((q) => {
          const headerName = columnMapping[q.id];
          if (headerName) {
            const colIdx = csvHeaders.indexOf(headerName);
            if (colIdx >= 0 && row[colIdx] !== undefined) {
              answers.push({
                questionId: q.id,
                value: row[colIdx],
              });
            }
          }
        });

        const respondentEmail = emailColIdx >= 0 ? row[emailColIdx] : undefined;
        return { answers, respondentEmail };
      });

      await onImportRows(payload);
      toast.success(`Successfully imported ${payload.length} responses`);
      onClose();
    } catch {
      toast.error("Failed to import responses");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-md border border-border bg-background shadow-xl p-5 space-y-4 animate-in zoom-in-95 duration-150 max-h-[88vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-accent-1 border border-border text-foreground">
              <Upload className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground font-sans">
                Import CSV Responses
              </h2>
              <p className="text-xs text-accent-5">Upload and map response records</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-sm text-accent-5 hover:bg-accent-1 hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* File Dropzone / Column Mapping */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {!file ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="rounded-md border-2 border-dashed border-border bg-accent-1/20 p-8 text-center hover:border-foreground/40 hover:bg-accent-1/50 transition-colors cursor-pointer"
            >
              <FileText className="h-8 w-8 text-accent-4 mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">Click to upload CSV file</p>
              <p className="text-xs text-accent-5 mt-1">Accepts standard .csv formatted responses</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-sm border border-border bg-accent-1/40 p-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="h-4 w-4 text-accent-6 shrink-0" />
                  <span className="text-xs font-medium text-foreground truncate">{file.name}</span>
                  <span className="text-xs font-mono text-accent-5">({csvRows.length} rows)</span>
                </div>
                <button
                  onClick={() => {
                    setFile(null);
                    setCsvHeaders([]);
                    setCsvRows([]);
                  }}
                  className="text-xs text-accent-5 hover:text-foreground underline cursor-pointer"
                >
                  Change
                </button>
              </div>

              {/* Column Mapping Header */}
              <div className="space-y-3">
                <h3 className="text-xs font-mono uppercase tracking-wider text-accent-5 font-semibold">
                  Map CSV Columns to Form Fields
                </h3>

                {/* Email Column */}
                <div className="flex items-center justify-between text-xs gap-3">
                  <span className="text-foreground font-medium w-1/2 truncate">Respondent Email</span>
                  <select
                    value={emailColumn}
                    onChange={(e) => setEmailColumn(e.target.value)}
                    className="w-1/2 rounded-sm border border-border bg-background px-2.5 py-1 text-xs text-foreground focus:outline-none cursor-pointer"
                  >
                    <option value="">-- Ignore / Anonymous --</option>
                    {csvHeaders.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Question Mapping */}
                {questions.map((q) => (
                  <div key={q.id} className="flex items-center justify-between text-xs gap-3">
                    <span className="text-foreground font-medium w-1/2 truncate">{q.title}</span>
                    <select
                      value={columnMapping[q.id] || ""}
                      onChange={(e) =>
                        setColumnMapping((prev) => ({ ...prev, [q.id]: e.target.value }))
                      }
                      className="w-1/2 rounded-sm border border-border bg-background px-2.5 py-1 text-xs text-foreground focus:outline-none cursor-pointer"
                    >
                      <option value="">-- Skip Question --</option>
                      {csvHeaders.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="rounded-sm text-xs font-sans h-8"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!file || csvRows.length === 0 || isImporting}
            onClick={handleExecuteImport}
            className="rounded-sm text-xs font-sans h-8 bg-foreground text-background hover:bg-accent-7"
          >
            {isImporting ? (
              <span className="inline-flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Importing...
              </span>
            ) : (
              `Import ${csvRows.length} Rows`
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
