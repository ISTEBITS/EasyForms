import React from "react";
import {
  FileText,
  Clock,
  Calendar,
  Users,
  CheckCircle2,
  Star,
} from "lucide-react";
import type { FormResponse, Question, Answer } from "@/types/form";

interface ResponsesSummaryAnalyticsProps {
  responses: FormResponse[];
  questions: Question[];
}

export const ResponsesSummaryAnalytics: React.FC<ResponsesSummaryAnalyticsProps> = ({
  responses,
  questions,
}) => {
  const total = responses.length;

  const todayCount = responses.filter((r) => {
    const d = new Date(r.submittedAt);
    const n = new Date();
    return d.toDateString() === n.toDateString();
  }).length;

  const thisWeekCount = responses.filter((r) => {
    const d = new Date(r.submittedAt);
    const n = new Date();
    return d >= new Date(n.getTime() - 7 * 24 * 60 * 60 * 1000);
  }).length;

  const uniqueEmailsCount = new Set(responses.map((r) => r.respondentEmail).filter(Boolean)).size;

  const reviewedCount = responses.filter(
    (r) => r.status === "reviewed" || r.status === "approved"
  ).length;

  const reviewPercentage = total > 0 ? Math.round((reviewedCount / total) * 100) : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          { label: "Total Submissions", value: total, icon: FileText },
          { label: "Submitted Today", value: todayCount, icon: Clock },
          { label: "This Week", value: thisWeekCount, icon: Calendar },
          { label: "Unique Users", value: uniqueEmailsCount, icon: Users },
          { label: "Reviewed", value: `${reviewPercentage}%`, icon: CheckCircle2 },
        ].map((metric) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.label}
              className="rounded-md border border-border bg-background p-4 shadow-xs"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-sans uppercase tracking-wider text-accent-5">
                  {metric.label}
                </span>
                <Icon className="h-4 w-4 text-accent-4" />
              </div>
              <p className="text-2xl font-semibold text-foreground font-sans">
                {metric.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Question Summaries */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground font-sans">
            Question-by-Question Breakdown ({questions.length})
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {questions.map((question, idx) => {
            const allAnswersForQ = responses
              .map((r) => r.answers?.find((a: Answer) => a.questionId === question.id)?.value)
              .filter((v) => v !== undefined && v !== null && v !== "");

            const answeredCount = allAnswersForQ.length;
            const answerRate = total > 0 ? Math.round((answeredCount / total) * 100) : 0;

            return (
              <div
                key={question.id}
                className="rounded-md border border-border bg-background p-4 space-y-3 shadow-xs"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-2.5">
                  <div className="min-w-0">
                    <span className="inline-block font-sans text-[10px] font-semibold uppercase text-accent-5">
                      Question {idx + 1} • {question.type.replace("_", " ")}
                    </span>
                    <h3 className="text-sm font-medium text-foreground font-sans truncate mt-0.5">
                      {question.title}
                    </h3>
                  </div>
                  <span className="shrink-0 rounded-xs bg-accent-1 px-2 py-0.5 text-sm font-sans text-accent-6 border border-border">
                    {answerRate}% answered
                  </span>
                </div>

                {/* Option Distribution for Choice / Dropdown / Checkbox */}
                {(question.type === "multiple_choice" ||
                  question.type === "dropdown" ||
                  question.type === "checkbox") && question.options && (
                  <div className="space-y-2 pt-1">
                    {question.options.map((opt) => {
                      const count = allAnswersForQ.filter((val) => {
                        if (Array.isArray(val)) {
                          return val.includes(opt.value);
                        }
                        return String(val) === String(opt.value);
                      }).length;

                      const pct = answeredCount > 0 ? Math.round((count / answeredCount) * 100) : 0;

                      return (
                        <div key={opt.id} className="space-y-1 text-sm">
                          <div className="flex items-center justify-between text-foreground">
                            <span className="truncate max-w-[200px]">{opt.label}</span>
                            <span className="font-sans text-accent-5">
                              {count} ({pct}%)
                            </span>
                          </div>
                          <div className="h-1.5 w-full rounded-xs bg-accent-2 overflow-hidden">
                            <div
                              className="h-full rounded-xs bg-foreground transition-all duration-300"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Rating Distribution */}
                {question.type === "rating" && (
                  <div className="space-y-2 pt-1">
                    {(() => {
                      const numValues = allAnswersForQ.map(Number).filter((n) => !isNaN(n));
                      const avg =
                        numValues.length > 0
                          ? (numValues.reduce((a, b) => a + b, 0) / numValues.length).toFixed(1)
                          : "0.0";

                      return (
                        <>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex items-center text-amber-500">
                              <Star className="h-5 w-5 fill-current" />
                            </div>
                            <span className="text-xl font-semibold text-foreground font-sans">
                              {avg}
                            </span>
                            <span className="text-sm text-accent-5">
                              average rating ({numValues.length} votes)
                            </span>
                          </div>

                          {[5, 4, 3, 2, 1].map((ratingNum) => {
                            const count = numValues.filter((v) => v === ratingNum).length;
                            const pct =
                              numValues.length > 0 ? Math.round((count / numValues.length) * 100) : 0;
                            return (
                              <div key={ratingNum} className="flex items-center gap-2 text-sm">
                                <span className="font-sans text-accent-5 w-3">{ratingNum}</span>
                                <div className="h-1.5 flex-1 rounded-xs bg-accent-2 overflow-hidden">
                                  <div
                                    className="h-full rounded-xs bg-foreground"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <span className="font-sans text-accent-5 w-8 text-right">{count}</span>
                              </div>
                            );
                          })}
                        </>
                      );
                    })()}
                  </div>
                )}

                {/* Number Summary */}
                {question.type === "number" && (
                  <div className="space-y-2 pt-1 text-sm">
                    {(() => {
                      const numValues = allAnswersForQ.map(Number).filter((n) => !isNaN(n));
                      const sum = numValues.reduce((a, b) => a + b, 0);
                      const avg = numValues.length > 0 ? (sum / numValues.length).toFixed(2) : 0;
                      const min = numValues.length > 0 ? Math.min(...numValues) : 0;
                      const max = numValues.length > 0 ? Math.max(...numValues) : 0;

                      return (
                        <div className="grid grid-cols-4 gap-2 bg-accent-1/40 p-2.5 rounded-sm text-center">
                          <div>
                            <span className="block text-[10px] uppercase font-sans text-accent-5">Avg</span>
                            <span className="font-semibold text-foreground text-sm">{avg}</span>
                          </div>
                          <div>
                            <span className="block text-[10px] uppercase font-sans text-accent-5">Sum</span>
                            <span className="font-semibold text-foreground text-sm">{sum}</span>
                          </div>
                          <div>
                            <span className="block text-[10px] uppercase font-sans text-accent-5">Min</span>
                            <span className="font-semibold text-foreground text-sm">{min}</span>
                          </div>
                          <div>
                            <span className="block text-[10px] uppercase font-sans text-accent-5">Max</span>
                            <span className="font-semibold text-foreground text-sm">{max}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Text / Paragraph / Email Recent Responses */}
                {(question.type === "short_text" ||
                  question.type === "long_text" ||
                  question.type === "email" ||
                  question.type === "date" ||
                  question.type === "file_upload") && (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {allAnswersForQ.map((ans, aIdx) => (
                      <div
                        key={aIdx}
                        className="rounded-xs bg-accent-1/50 px-2.5 py-1.5 text-sm text-foreground font-sans truncate"
                      >
                        {String(ans)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
