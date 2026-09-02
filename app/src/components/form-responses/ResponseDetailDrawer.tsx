import React, { useState } from "react";
import {
  X,
  User,
  Clock,
  MessageSquare,
  Send,
  Trash2,
  FileText,
  Edit2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FormResponse, Question, ResponseStatus } from "@/types/form";

interface ResponseDetailDrawerProps {
  response: FormResponse | null;
  questions: Question[];
  onClose: () => void;
  onUpdateAnswer: (responseId: string, questionId: string, value: unknown) => Promise<void>;
  onUpdateStatus: (responseId: string, status: ResponseStatus) => Promise<void>;
  onAddNote: (responseId: string, noteText: string) => Promise<void>;
  onDelete: (responseId: string) => Promise<void>;
}

export const ResponseDetailDrawer: React.FC<ResponseDetailDrawerProps> = ({
  response,
  questions,
  onClose,
  onUpdateAnswer,
  onUpdateStatus,
  onAddNote,
  onDelete,
}) => {
  const [newNote, setNewNote] = useState("");
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");

  if (!response) return null;

  const rowId = response.id || response._id || "";

  const handleStartEdit = (questionId: string, currentValue: unknown) => {
    setEditingQuestionId(questionId);
    setEditingValue(Array.isArray(currentValue) ? currentValue.join(", ") : String(currentValue ?? ""));
  };

  const handleSaveEdit = async (questionId: string) => {
    try {
      await onUpdateAnswer(rowId, questionId, editingValue);
      setEditingQuestionId(null);
    } catch {
      // handled in parent
    }
  };

  const handlePostNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    try {
      setIsSubmittingNote(true);
      await onAddNote(rowId, newNote.trim());
      setNewNote("");
    } finally {
      setIsSubmittingNote(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-background border-l border-border h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-accent-1/40">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-foreground font-sans truncate">
              Submission Details
            </h2>
            <p className="text-xs text-accent-5 font-mono">
              ID: {rowId.substring(0, 10)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => void onDelete(rowId)}
              className="flex h-8 w-8 items-center justify-center rounded-sm text-red-500 hover:bg-red-500/10 transition-colors"
              title="Delete Submission"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-sm text-accent-5 hover:bg-accent-2 hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Metadata Card */}
          <div className="rounded-md border border-border bg-accent-1/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-accent-5">Status</span>
              <select
                value={response.status || "unreviewed"}
                onChange={(e) => void onUpdateStatus(rowId, e.target.value as ResponseStatus)}
                className="rounded-sm border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-foreground cursor-pointer"
              >
                <option value="unreviewed">Unreviewed</option>
                <option value="reviewed">Reviewed</option>
                <option value="approved">Approved</option>
                <option value="flagged">Flagged</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs pt-1 border-t border-border/60">
              <div>
                <span className="text-accent-4 block font-mono uppercase text-[10px]">Respondent</span>
                <span className="text-foreground font-medium flex items-center gap-1 mt-0.5">
                  <User className="h-3 w-3 text-accent-5" />
                  <span className="truncate">{response.respondentEmail || "Anonymous"}</span>
                </span>
              </div>

              <div>
                <span className="text-accent-4 block font-mono uppercase text-[10px]">Submitted At</span>
                <span className="text-foreground font-mono flex items-center gap-1 mt-0.5">
                  <Clock className="h-3 w-3 text-accent-5" />
                  {new Date(response.submittedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Form Answers Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-accent-5 font-semibold">
              Recorded Answers
            </h3>

            <div className="space-y-2.5">
              {questions.map((question) => {
                const answer = response.answers?.find((a) => a.questionId === question.id);
                const rawVal = answer?.value;
                const isEditing = editingQuestionId === question.id;

                let displayVal = "No answer provided";
                if (rawVal !== undefined && rawVal !== null && rawVal !== "") {
                  if (Array.isArray(rawVal)) {
                    displayVal = rawVal.join(", ");
                  } else if (typeof rawVal === "object" && "name" in rawVal) {
                    displayVal = String((rawVal as { name: string }).name);
                  } else {
                    displayVal = String(rawVal);
                  }
                }

                return (
                  <div
                    key={question.id}
                    className="rounded-md border border-border bg-background p-3.5 space-y-1.5 shadow-2xs group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-accent-6 font-sans">
                        {question.title}
                      </span>
                      {!isEditing && (
                        <button
                          onClick={() => handleStartEdit(question.id, rawVal)}
                          className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[11px] text-accent-5 hover:text-foreground transition-opacity"
                        >
                          <Edit2 className="h-3 w-3" />
                          <span>Edit</span>
                        </button>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="text"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          className="flex-1 rounded-sm border border-foreground/60 bg-background px-2 py-1 text-xs text-foreground focus:outline-none ring-1 ring-foreground"
                          autoFocus
                        />
                        <Button
                          size="xs"
                          onClick={() => void handleSaveEdit(question.id)}
                          className="h-7 px-2.5 rounded-sm"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => setEditingQuestionId(null)}
                          className="h-7 px-2 rounded-sm"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : question.type === "file_upload" && typeof rawVal === "string" && rawVal.startsWith("http") ? (
                      <a
                        href={rawVal}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-accent-1 px-3 py-1.5 text-xs text-foreground hover:bg-accent-2 transition-colors"
                      >
                        <FileText className="h-3.5 w-3.5 text-accent-6" />
                        <span>Download / View Attachment</span>
                      </a>
                    ) : question.type === "multiple_choice_grid" && typeof rawVal === "object" && rawVal !== null ? (
                      <div className="rounded-sm border border-border/60 bg-accent-1/20 overflow-hidden mt-1 font-sans">
                        <table className="w-full text-xs text-left font-sans">
                          <thead className="bg-accent-1/50 border-b border-border/40 text-accent-5">
                            <tr>
                              <th className="py-1 px-2.5 font-medium">Criteria</th>
                              <th className="py-1 px-2.5 font-medium text-right">Selection</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/30">
                            {Object.entries(rawVal as Record<string, string>).map(([row, col]) => (
                              <tr key={row}>
                                <td className="py-1.5 px-2.5 text-accent-6">{row}</td>
                                <td className="py-1.5 px-2.5 text-foreground font-medium text-right">{col}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className={`text-xs ${rawVal ? "text-foreground font-medium" : "text-accent-4 italic font-sans"}`}>
                        {displayVal}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Collaborator Notes & Comments Thread */}
          <div className="space-y-3 pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-accent-5" />
                <h3 className="text-xs font-mono uppercase tracking-wider text-accent-5 font-semibold">
                  Internal Notes ({response.notes?.length || 0})
                </h3>
              </div>
            </div>

            {/* Notes List */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {(!response.notes || response.notes.length === 0) ? (
                <p className="text-xs text-accent-4 italic py-2">No notes added yet for this submission.</p>
              ) : (
                response.notes.map((note) => (
                  <div key={note.id} className="rounded-sm border border-border bg-accent-1/40 p-2.5 space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-accent-5">
                      <span className="font-medium text-foreground">{note.author}</span>
                      <span className="font-mono">{new Date(note.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-foreground font-sans leading-relaxed">{note.text}</p>
                  </div>
                ))
              )}
            </div>

            {/* Add Note Form */}
            <form onSubmit={handlePostNote} className="flex gap-2 pt-1">
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Leave an internal note..."
                className="flex-1 rounded-sm border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-accent-4 focus:outline-none focus:ring-1 focus:ring-foreground"
              />
              <Button
                type="submit"
                size="xs"
                disabled={isSubmittingNote || !newNote.trim()}
                className="rounded-sm h-8 px-3 gap-1 bg-foreground text-background hover:bg-accent-7"
              >
                <Send className="h-3 w-3" />
                <span>Post</span>
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
