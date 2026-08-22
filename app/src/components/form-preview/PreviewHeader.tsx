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
  bannerImageUrl,
  bannerPositionX,
  bannerPositionY,
  bannerHeightClass,
  headerPaddingClass,
}: PreviewHeaderProps) {
  return (
    <div className="overflow-hidden rounded-sm border border-border bg-background">
      {bannerImageUrl && (
        <div className={bannerHeightClass}>
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
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {form.settings.theme.logoUrl && (
              <img
                src={form.settings.theme.logoUrl}
                alt="Brand logo"
                className="h-10 w-10 rounded-sm object-cover ring-1 ring-border"
              />
            )}
            <div>
              {(form.settings.theme.brandName ||
                form.settings.theme.brandTagline) && (
                <>
                  <p className="text-xs uppercase tracking-[0.2em] text-accent-6">
                    {form.settings.theme.brandName || "Brand"}
                  </p>
                  {form.settings.theme.brandTagline && (
                    <p className="text-xs text-accent-5">
                      {form.settings.theme.brandTagline}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="rounded-sm border border-border bg-accent-1 px-3 py-1 text-xs text-accent-6">
            Page {activePageIndex + 1} of {Math.max(pages.length, 1)}
          </div>
        </div>
        {pages.length > 1 && (
          <div className="mb-5 overflow-x-auto pb-1">
            <div className="flex min-w-max items-center gap-2">
              {pages.map((page, index) => (
                <div key={page.id} className="flex items-center gap-2">
                  <div
                    className={`group relative flex min-w-[140px] items-center gap-2 rounded-sm border px-3 py-2 text-left transition-geist duration-150 ${
                      index === activePageIndex
                        ? "border-accent-8 bg-accent-2"
                        : index < activePageIndex
                          ? "border-accent-2 bg-accent-1"
                          : "border-border bg-accent-1/40"
                    }`}
                  >
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-sm text-[11px] font-semibold ${
                        index === activePageIndex
                          ? "bg-foreground text-background"
                          : index < activePageIndex
                            ? "bg-accent-3 text-accent-7"
                            : "bg-accent-2 text-accent-4"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <p
                        className={`truncate text-[10px] uppercase tracking-[0.14em] ${
                          index === activePageIndex
                            ? "text-accent-7"
                            : index < activePageIndex
                              ? "text-accent-5"
                              : "text-accent-4"
                        }`}
                      >
                        Step {index + 1}
                      </p>
                      <p
                        className={`truncate text-xs ${
                          index === activePageIndex
                            ? "text-foreground"
                            : index < activePageIndex
                              ? "text-accent-6"
                              : "text-accent-5"
                        }`}
                      >
                        {page.title || "Untitled section"}
                      </p>
                    </div>
                  </div>
                  {index < pages.length - 1 && (
                    <div className="h-px w-5 shrink-0 bg-border" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        <div
          className="space-y-3 leading-relaxed text-foreground"
          dangerouslySetInnerHTML={{
            __html: renderMarkdownPreview(
              formHeaderMarkdownSource(
                form.title,
                form.description,
                "Add a description to help respondents understand the purpose of this form...",
              ),
            ),
          }}
        />
      </div>
    </div>
  );
}
