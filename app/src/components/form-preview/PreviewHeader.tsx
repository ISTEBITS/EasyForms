import { Check } from "lucide-react";
import {
  formHeaderMarkdownSource,
  renderMarkdownPreview,
} from "@/lib/form-header-markdown";
import type { Form } from "@/types/form";
import type { FormPage } from "./types";

interface PreviewHeaderProps {
  form: Form;
  activePageIndex: number;
  pages: FormPage[];
  answers?: Record<string, unknown>;
  onSelectPage?: (index: number) => void;
  bannerImageUrl?: string;
  bannerPositionX: number;
  bannerPositionY: number;
  bannerHeightClass: string;
  headerPaddingClass: string;
}

export function PreviewHeader({
  form,
  activePageIndex,
  pages,
  answers = {},
  onSelectPage,
  bannerImageUrl,
  bannerPositionX,
  bannerPositionY,
  bannerHeightClass,
  headerPaddingClass,
}: PreviewHeaderProps) {
  const brandName = form.settings?.theme?.brandName?.trim();
  const brandTagline = form.settings?.theme?.brandTagline?.trim();
  const logoUrl = form.settings?.theme?.logoUrl?.trim();
  const hasBranding = Boolean(logoUrl || brandName || brandTagline);

  // Function to evaluate if a section/page is completed
  const isPageCompleted = (page: FormPage) => {
    const pageQuestions = page.questions.filter((q) => q.type !== "section_break");
    if (pageQuestions.length === 0) return true;

    const requiredQuestions = pageQuestions.filter((q) => q.required);
    if (requiredQuestions.length > 0) {
      return requiredQuestions.every((q) => {
        const val = answers[q.id];
        return (
          val !== undefined &&
          val !== null &&
          val !== "" &&
          (!Array.isArray(val) || val.length > 0)
        );
      });
    }

    return pageQuestions.some((q) => {
      const val = answers[q.id];
      return (
        val !== undefined &&
        val !== null &&
        val !== "" &&
        (!Array.isArray(val) || val.length > 0)
      );
    });
  };

  return (
    <div className="overflow-hidden rounded-md border border-border bg-background shadow-xs transition-colors font-sans">
      {bannerImageUrl && (
        <div className={`${bannerHeightClass} overflow-hidden bg-accent-1 relative border-b border-border`}>
          <img
            src={bannerImageUrl}
            alt="Form banner"
            className="h-full w-full object-cover"
            style={{
              objectPosition: `${bannerPositionX}% ${bannerPositionY}%`,
            }}
          />
        </div>
      )}

      <div className={headerPaddingClass}>
        {/* Brand Logo & Header Bar (Only rendered if user entered custom branding) */}
        {hasBranding && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
            <div className="flex items-center gap-3 min-w-0">
              {logoUrl && (
                <img
                  src={logoUrl}
                  alt={brandName || "Brand logo"}
                  className="h-9 w-auto max-w-[140px] max-h-9 shrink-0 rounded-sm object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              )}
              {(brandName || brandTagline) && (
                <div className="min-w-0">
                  {brandName && (
                    <p className="text-xs font-semibold uppercase tracking-wider text-accent-6 font-sans truncate">
                      {brandName}
                    </p>
                  )}
                  {brandTagline && (
                    <p className="text-xs text-accent-5 truncate mt-0.5 font-sans">
                      {brandTagline}
                    </p>
                  )}
                </div>
              )}
            </div>

            {pages.length > 1 && (
              <div className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-accent-1/60 px-2.5 py-1 text-xs font-sans text-accent-6 font-medium">
                <span>Section</span>
                <span className="font-semibold text-foreground">{activePageIndex + 1}</span>
                <span>of</span>
                <span>{Math.max(pages.length, 1)}</span>
              </div>
            )}
          </div>
        )}

        {/* Multi-Step Timeline with Completed Section Indicators */}
        {pages.length > 1 && (
          <div className="mb-5 overflow-x-auto pb-1 hide-scrollbar">
            <div className="flex min-w-max items-center gap-2">
              {pages.map((page, index) => {
                const isActive = index === activePageIndex;
                const isCompleted = isPageCompleted(page);

                return (
                  <div key={page.id} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectPage && onSelectPage(index)}
                      className={`flex items-center gap-2 rounded-sm border px-3 py-1.5 text-xs font-sans transition-all duration-150 cursor-pointer ${
                        isActive
                          ? "border-foreground bg-accent-2 font-semibold text-foreground shadow-xs ring-1 ring-foreground/20"
                          : isCompleted
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/15"
                          : "border-border bg-accent-1/40 text-accent-5 hover:border-accent-5 hover:text-foreground"
                      }`}
                    >
                      <span
                        className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center text-xs font-bold font-sans ${
                          isActive
                            ? "px-1 rounded-full bg-foreground text-background"
                            : isCompleted
                            ? "bg-emerald-500 text-black"
                            : "px-1 rounded-full bg-accent-2 text-accent-6"
                        }`}
                      >
                        {isCompleted && !isActive ? (
                          <Check className="h-3 w-3 stroke-[3]" />
                        ) : (
                          index + 1
                        )}
                      </span>
                      <span className="truncate max-w-[140px]">
                        {page.title || `Section ${index + 1}`}
                      </span>
                    </button>

                    {index < pages.length - 1 && (
                      <div
                        className={`h-px w-3 shrink-0 ${
                          isCompleted ? "bg-emerald-500/40" : "bg-border"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Form Title & Description */}
        <div
          className="space-y-2.5 leading-relaxed text-foreground font-sans prose-sm max-w-none"
          dangerouslySetInnerHTML={{
            __html: renderMarkdownPreview(
              formHeaderMarkdownSource(
                form.title,
                form.description,
                "Please fill out the requested information below.",
              ),
            ),
          }}
        />
      </div>
    </div>
  );
}
