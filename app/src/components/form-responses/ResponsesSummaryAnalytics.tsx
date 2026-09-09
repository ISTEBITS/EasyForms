import React, { useState } from "react";
import {
  FileText,
  Clock,
  Calendar,
  Users,
  CheckCircle2,
  Star,
  Layers,
} from "lucide-react";
import type { FormResponse, Question, Answer } from "@/types/form";

interface ResponsesSummaryAnalyticsProps {
  responses: FormResponse[];
  questions: Question[];
}

// Geist-compliant curated chromatic palette for chart slices
const CHART_COLORS = [
  "#0070f3", // Vercel Blue
  "#7928ca", // Violet
  "#50e3c2", // Cyan
  "#f5a623", // Amber
  "#10b981", // Emerald
  "#ff0080", // Pink
  "#6366f1", // Indigo
  "#f43f5e", // Rose
  "#14b8a6", // Teal
  "#8b5cf6", // Purple
  "#3b82f6", // Blue
  "#ec4899", // Magenta
];

interface SliceData {
  label: string;
  count: number;
  percentage: number;
  color: string;
}

/**
 * Interactive SVG Donut / Pie Chart Component
 */
const DonutPieChart: React.FC<{
  data: SliceData[];
  total: number;
  size?: number;
}> = ({ data, total, size = 180 }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (total === 0 || data.length === 0) {
    return (
      <div className="flex h-44 w-44 items-center justify-center rounded-full border border-dashed border-border bg-accent-1/20 text-sm text-accent-4 font-sans">
        No answers
      </div>
    );
  }

  const radius = 60;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercent = 0;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 160 160"
        className="transform -rotate-90 transition-transform duration-300"
      >
        {/* Background track */}
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-accent-1/60"
        />

        {data.map((slice, idx) => {
          if (slice.count === 0) return null;

          const strokeDashoffset = circumference - (accumulatedPercent / 100) * circumference;
          const strokeDasharray = `${(slice.percentage / 100) * circumference} ${circumference}`;
          accumulatedPercent += slice.percentage;

          const isHovered = hoveredIdx === idx;

          return (
            <circle
              key={slice.label + idx}
              cx="80"
              cy="80"
              r={radius}
              fill="transparent"
              stroke={slice.color}
              strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="cursor-pointer transition-all duration-200"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            />
          );
        })}
      </svg>

      {/* Center Metric */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
        {hoveredIdx !== null && data[hoveredIdx] ? (
          <div className="animate-in fade-in zoom-in-95 duration-150">
            <span className="block text-xl font-bold text-foreground font-sans">
              {data[hoveredIdx].percentage}%
            </span>
            <span className="block text-sm text-accent-5 font-sans truncate max-w-[100px]">
              {data[hoveredIdx].count} votes
            </span>
          </div>
        ) : (
          <div>
            <span className="block text-2xl font-bold text-foreground font-sans">
              {total}
            </span>
            <span className="block text-sm text-accent-5 font-sans">
              Responses
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

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

  const reviewedCount = responses.filter((r) => {
    const s = String(r.status || "Unreviewed").toLowerCase();
    return s !== "" && s !== "unreviewed";
  }).length;

  const reviewPercentage = total > 0 ? Math.round((reviewedCount / total) * 100) : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-sans">
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
              className="rounded-sm border border-border bg-background p-4 shadow-xs"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-accent-5 font-sans">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {questions.map((question, idx) => {
            const allAnswersForQ = responses
              .map((r) => r.answers?.find((a: Answer) => a.questionId === question.id)?.value)
              .filter((v) => v !== undefined && v !== null && v !== "");

            const answeredCount = allAnswersForQ.length;
            const answerRate = total > 0 ? Math.round((answeredCount / total) * 100) : 0;

            const isChoiceType =
              question.type === "multiple_choice" ||
              question.type === "dropdown" ||
              question.type === "checkbox";

            return (
              <div
                key={question.id}
                className="rounded-sm border border-border bg-background p-5 space-y-4 shadow-xs flex flex-col justify-between"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-3">
                  <div className="min-w-0">
                    <span className="inline-block text-sm font-semibold uppercase tracking-wider text-accent-5 font-sans">
                      Question {idx + 1} • {question.type.replace(/_/g, " ")}
                    </span>
                    <h3 className="text-base font-medium text-foreground font-sans truncate mt-1">
                      {question.title}
                    </h3>
                  </div>
                  <span className="shrink-0 rounded-xs bg-accent-1 px-2.5 py-1 text-sm font-medium text-accent-6 border border-border font-sans">
                    {answerRate}% answered ({answeredCount})
                  </span>
                </div>

                {/* 1. Choice Questions: Pie/Donut Chart & Breakdown Legend */}
                {isChoiceType && question.options && (
                  <div className="space-y-4 pt-1">
                    {(() => {
                      const sliceData: SliceData[] = question.options.map((opt, optIdx) => {
                        const count = allAnswersForQ.filter((val) => {
                          if (Array.isArray(val)) {
                            return val.includes(opt.value);
                          }
                          return String(val) === String(opt.value);
                        }).length;

                        const percentage =
                          answeredCount > 0 ? Math.round((count / answeredCount) * 100) : 0;

                        return {
                          label: opt.label,
                          count,
                          percentage,
                          color: CHART_COLORS[optIdx % CHART_COLORS.length],
                        };
                      });

                      return (
                        <div className="flex flex-col sm:flex-row items-center gap-6">
                          {/* Left: Donut / Pie Chart */}
                          <div className="shrink-0 flex items-center justify-center p-2">
                            <DonutPieChart data={sliceData} total={answeredCount} size={170} />
                          </div>

                          {/* Right: Legend Breakdown */}
                          <div className="flex-1 w-full space-y-2.5 max-h-56 overflow-y-auto pr-1">
                            {sliceData.map((slice) => (
                              <div
                                key={slice.label}
                                className="flex items-center justify-between gap-2 p-2 rounded-xs border border-border/60 bg-accent-1/20 hover:bg-accent-1/50 transition-colors"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span
                                    className="h-3 w-3 rounded-full shrink-0"
                                    style={{ backgroundColor: slice.color }}
                                  />
                                  <span className="text-sm font-medium text-foreground font-sans truncate">
                                    {slice.label}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-sm text-accent-5 font-sans">
                                    {slice.count} votes
                                  </span>
                                  <span className="rounded-xs bg-background px-2 py-0.5 text-sm font-semibold text-foreground border border-border">
                                    {slice.percentage}%
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* 2. Multiple Choice Grid Distribution Breakdown */}
                {question.type === "multiple_choice_grid" && (
                  <div className="space-y-4 pt-1">
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-accent-6">
                      <Layers className="h-4 w-4 text-accent-5" />
                      <span>Grid Row Selection Distribution:</span>
                    </div>

                    <div className="space-y-3.5">
                      {(() => {
                        const gridColumns = (question.options || []).map((opt) => opt.label || opt.value);

                        return (question.gridRows || []).map((rowName) => {
                          const rowSelections = allAnswersForQ
                            .map((ans) =>
                              typeof ans === "object" && ans !== null
                                ? (ans as Record<string, string>)[rowName]
                                : undefined
                            )
                            .filter(Boolean);

                          const rowTotal = rowSelections.length;

                          return (
                            <div
                              key={rowName}
                              className="rounded-sm border border-border bg-accent-1/20 p-3 space-y-2.5"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-foreground font-sans">
                                  {rowName}
                                </span>
                                <span className="text-sm text-accent-5 font-sans">
                                  {rowTotal} responses
                                </span>
                              </div>

                              {/* Segmented Stacked Bar Distribution */}
                              <div className="h-2.5 w-full rounded-xs bg-accent-2 overflow-hidden flex">
                                {gridColumns.map((colName, cIdx) => {
                                  const count = rowSelections.filter((v) => v === colName).length;
                                  const pct = rowTotal > 0 ? (count / rowTotal) * 100 : 0;
                                  if (pct === 0) return null;

                                  return (
                                    <div
                                      key={colName}
                                      title={`${colName}: ${count} (${Math.round(pct)}%)`}
                                      style={{
                                        width: `${pct}%`,
                                        backgroundColor: CHART_COLORS[cIdx % CHART_COLORS.length],
                                      }}
                                      className="h-full transition-all duration-300 first:rounded-l-xs last:rounded-r-xs"
                                    />
                                  );
                                })}
                              </div>

                              {/* Column Selection Badges */}
                              <div className="flex flex-wrap gap-2 pt-1">
                                {gridColumns.map((colName, cIdx) => {
                                  const count = rowSelections.filter((v) => v === colName).length;
                                  const pct = rowTotal > 0 ? Math.round((count / rowTotal) * 100) : 0;

                                  return (
                                    <div
                                      key={colName}
                                      className="inline-flex items-center gap-1.5 rounded-xs bg-background px-2.5 py-1 text-sm border border-border"
                                    >
                                      <span
                                        className="h-2.5 w-2.5 rounded-full"
                                        style={{
                                          backgroundColor: CHART_COLORS[cIdx % CHART_COLORS.length],
                                        }}
                                      />
                                      <span className="text-foreground font-medium">{colName}:</span>
                                      <span className="text-accent-5 font-semibold">
                                        {count} ({pct}%)
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                )}

                {/* 3. Number Inputs: Direct Clean Response List (No Min/Max/Sum Logic) */}
                {question.type === "number" && (
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between text-sm font-semibold text-accent-6">
                      <span>Submitted Values:</span>
                      <span className="text-accent-5 font-normal">
                        {allAnswersForQ.length} answers recorded
                      </span>
                    </div>

                    {allAnswersForQ.length === 0 ? (
                      <p className="text-sm text-accent-4 italic py-2">No responses recorded yet.</p>
                    ) : (
                      <div className="flex flex-col gap-2 max-h-44 overflow-y-auto pr-1">
                        {(() => {
                          // Group identical numbers to show frequencies cleanly
                          const countsMap = new Map<string, number>();
                          allAnswersForQ.forEach((v) => {
                            const key = String(v);
                            countsMap.set(key, (countsMap.get(key) || 0) + 1);
                          });

                          return Array.from(countsMap.entries()).map(([numVal, count]) => (
                            <div
                              key={numVal}
                              className="inline-flex items-center gap-2 rounded-sm border border-border bg-accent-1/40 px-3 py-1.5 text-sm font-sans"
                            >
                              <span className="text-foreground text-base">
                                {numVal}
                              </span>
                              {count > 1 && (
                                <span className="rounded-xs bg-background px-1.5 py-0.5 text-sm font-medium text-accent-6 border border-border">
                                  ×{count}
                                </span>
                              )}
                            </div>
                          ));
                        })()}
                      </div>
                    )}
                  </div>
                )}

                {/* 4. Rating Distribution */}
                {question.type === "rating" && (
                  <div className="space-y-3 pt-1">
                    {(() => {
                      const numValues = allAnswersForQ.map(Number).filter((n) => !isNaN(n));
                      const avg =
                        numValues.length > 0
                          ? (numValues.reduce((a, b) => a + b, 0) / numValues.length).toFixed(1)
                          : "0.0";

                      return (
                        <>
                          <div className="flex items-center gap-2 mb-2 p-2.5 rounded-sm bg-accent-1/30 border border-border">
                            <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
                            <span className="text-xl font-bold text-foreground font-sans">
                              {avg}
                            </span>
                            <span className="text-sm text-accent-5 font-sans">
                              average rating ({numValues.length} votes)
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            {[5, 4, 3, 2, 1].map((ratingNum) => {
                              const count = numValues.filter((v) => v === ratingNum).length;
                              const pct =
                                numValues.length > 0
                                  ? Math.round((count / numValues.length) * 100)
                                  : 0;
                              return (
                                <div key={ratingNum} className="flex items-center gap-3 text-sm">
                                  <span className="font-medium text-foreground w-4 text-center">
                                    {ratingNum}★
                                  </span>
                                  <div className="h-2 flex-1 rounded-xs bg-accent-2 overflow-hidden">
                                    <div
                                      className="h-full rounded-xs bg-amber-500"
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                  <span className="font-medium text-accent-5 w-12 text-right">
                                    {count} ({pct}%)
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}

                {/* 5. Text / Paragraph / Email / Date / File Responses */}
                {(question.type === "short_text" ||
                  question.type === "long_text" ||
                  question.type === "email" ||
                  question.type === "date" ||
                  question.type === "file_upload") && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-sm font-semibold text-accent-6">
                      <span>Submitted Responses:</span>
                      <span className="text-accent-5 font-normal">
                        {allAnswersForQ.length} answers
                      </span>
                    </div>

                    {allAnswersForQ.length === 0 ? (
                      <p className="text-sm text-accent-4 italic py-2">No responses recorded yet.</p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {allAnswersForQ.map((ans, aIdx) => (
                          <div
                            key={aIdx}
                            className="rounded-sm border border-border bg-accent-1/40 px-3 py-2 text-sm text-foreground font-sans leading-relaxed"
                          >
                            {String(ans)}
                          </div>
                        ))}
                      </div>
                    )}
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
