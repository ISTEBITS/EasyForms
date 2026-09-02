import React, { useState } from "react";
import { X, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Question, Answer, ResponseStatus } from "@/types/form";

interface ManualResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: Question[];
  onSubmit: (data: {
    answers: Answer[];
    respondentEmail?: string;
    respondentName?: string;
    status: ResponseStatus;
  }) => Promise<void>;
}

export const ManualResponseModal: React.FC<ManualResponseModalProps> = ({
  isOpen,
  onClose,
  questions,
  onSubmit,
}) => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<ResponseStatus>("reviewed");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAnswerChange = (questionId: string, val: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const formattedAnswers: Answer[] = Object.entries(answers).map(([qId, val]) => ({
        questionId: qId,
        value: val,
      }));

      await onSubmit({
        answers: formattedAnswers,
        respondentEmail: email.trim() || undefined,
        respondentName: name.trim() || undefined,
        status,
      });

      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-md border border-border bg-background shadow-xl p-5 space-y-4 animate-in zoom-in-95 duration-150 max-h-[88vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-accent-1 border border-border text-foreground">
              <Plus className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground font-sans">
                Insert New Response
              </h2>
              <p className="text-xs text-accent-5">Manually record a submission row</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-sm text-accent-5 hover:bg-accent-1 hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pr-1">
          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-xs font-mono uppercase text-accent-5 mb-1 font-medium">
                Respondent Name
              </label>
              <input
                type="text"
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-sm border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-accent-4 focus:outline-none focus:ring-1 focus:ring-foreground"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-accent-5 mb-1 font-medium">
                Respondent Email
              </label>
              <input
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-sm border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-accent-4 focus:outline-none focus:ring-1 focus:ring-foreground"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-accent-5 mb-1 font-medium">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ResponseStatus)}
                className="w-full rounded-sm border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground focus:outline-none cursor-pointer"
              >
                <option value="unreviewed">Unreviewed</option>
                <option value="reviewed">Reviewed</option>
                <option value="approved">Approved</option>
                <option value="flagged">Flagged</option>
              </select>
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-border">
            <label className="block text-xs font-mono uppercase text-accent-5 font-medium">
              Question Fields
            </label>

            {questions.map((q) => (
              <div key={q.id} className="space-y-1">
                <label className="block text-xs font-medium text-foreground font-sans">
                  {q.title} {q.required && <span className="text-red-500">*</span>}
                </label>

                {q.type === "multiple_choice" || q.type === "dropdown" ? (
                  <select
                    value={answers[q.id] || ""}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                    required={q.required}
                    className="w-full rounded-sm border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none cursor-pointer"
                  >
                    <option value="">Select an option</option>
                    {q.options?.map((opt) => (
                      <option key={opt.id} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={q.type === "number" ? "number" : q.type === "date" ? "date" : "text"}
                    value={answers[q.id] || ""}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                    placeholder={q.placeholder || "Enter value"}
                    required={q.required}
                    className="w-full rounded-sm border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-accent-4 focus:outline-none focus:ring-1 focus:ring-foreground"
                  />
                )}
              </div>
            ))}
          </div>

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
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="rounded-sm text-xs font-sans h-8 bg-foreground text-background hover:bg-accent-7"
            >
              {isSubmitting ? (
                <span className="inline-flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving...
                </span>
              ) : (
                "Insert Row"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
