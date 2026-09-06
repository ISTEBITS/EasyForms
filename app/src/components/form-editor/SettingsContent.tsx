import { useState, useEffect, useMemo } from "react";
import {
  Eye,
  Copy,
  Mail,
  CalendarClock,
  Link2,
  FileCode,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { mailApi, type MailTemplate } from "@/api";
import type { Form } from "@/types/form";

interface SettingsContentProps {
  form: Form;
  isTestUser: boolean;
  onUpdateSettings: (updates: Partial<Form["settings"]>) => void;
  onSlugChange: (value: string) => void;
  onSlugBlur: () => void;
  onUploadThemeAsset?: (
    target: "logoUrl" | "bannerUrl" | "backgroundImageUrl",
    file: File,
  ) => Promise<void>;
  onRemoveThemeAsset?: (
    target: "logoUrl" | "bannerUrl" | "backgroundImageUrl",
  ) => void;
  onSelectThemeAsset?: (
    target: "logoUrl" | "bannerUrl" | "backgroundImageUrl",
    url: string,
  ) => void;
  isThemeAssetUploading?: boolean;
  uploadingTarget?: "logoUrl" | "bannerUrl" | "backgroundImageUrl" | null;
}

const toLocalDateInputValue = (value?: string | null): string => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toLocalTimeInputValue = (value?: string | null): string => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

const toIsoFromLocalDateTime = (
  dateValue: string,
  timeValue: string,
): string | null => {
  if (!dateValue || !timeValue) return null;
  const [yearPart, monthPart, dayPart] = dateValue.split("-").map(Number);
  const [hourPart, minutePart] = timeValue.split(":").map(Number);
  if (
    !Number.isInteger(yearPart) ||
    !Number.isInteger(monthPart) ||
    !Number.isInteger(dayPart) ||
    !Number.isInteger(hourPart) ||
    !Number.isInteger(minutePart)
  ) {
    return null;
  }

  const localDateTime = new Date(
    yearPart,
    monthPart - 1,
    dayPart,
    hourPart,
    minutePart,
    0,
    0,
  );
  if (Number.isNaN(localDateTime.getTime())) return null;
  return localDateTime.toISOString();
};

function applyTokensToHtml(htmlString: string, tokens: Record<string, string>): string {
  let output = htmlString || "";
  for (const [key, value] of Object.entries(tokens)) {
    const pattern = new RegExp(`{{\\s*${key}\\s*}}`, "g");
    output = output.replace(pattern, value || "");
  }
  return output;
}

export const SettingsContent = ({
  form,
  isTestUser,
  onUpdateSettings,
  onSlugChange,
  onSlugBlur,
}: SettingsContentProps) => {
  // Mail Templates from Dedicated Mail Service
  const [mailTemplates, setMailTemplates] = useState<MailTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<MailTemplate | null>(null);

  useEffect(() => {
    let active = true;
    const fetchTemplates = async () => {
      try {
        setLoadingTemplates(true);
        const list = await mailApi.listTemplates();
        if (active) setMailTemplates(list);
      } catch (err) {
        console.warn("Could not fetch mail templates:", err);
      } finally {
        if (active) setLoadingTemplates(false);
      }
    };
    void fetchTemplates();
    return () => {
      active = false;
    };
  }, []);

  const emailNotification = form.settings.emailNotification || {
    enabled: false,
    templateSlug: "submission-receipt",
    useCustomTemplate: false,
    subject: "Your response to {{formTitle}} was received",
    message:
      'Hi {{name}},\n\nThank you for completing "{{formTitle}}". We have recorded your submission on {{submittedAt}}.',
  };

  const responseDeadlineAt = form.settings.responseDeadlineAt;
  const deadlineDateValue = toLocalDateInputValue(responseDeadlineAt);
  const deadlineTimeValue = toLocalTimeInputValue(responseDeadlineAt);
  const hasResponseDeadline = Boolean(responseDeadlineAt);
  const maxResponsesValue =
    typeof form.settings.maxResponses === "number" &&
    form.settings.maxResponses > 0
      ? form.settings.maxResponses
      : null;
  const hasMaxResponsesLimit = maxResponsesValue !== null;

  // Find active mail service template
  const activeSelectedTemplate = useMemo(() => {
    const slug = emailNotification.templateSlug || "submission-receipt";
    return (
      mailTemplates.find((t) => t.slug === slug) ||
      mailTemplates.find((t) => t.category === "submission_receipt") ||
      mailTemplates[0] ||
      null
    );
  }, [mailTemplates, emailNotification.templateSlug]);

  const handleSelectMailTemplate = (slug: string) => {
    const tpl = mailTemplates.find((t) => t.slug === slug);
    onUpdateSettings({
      emailNotification: {
        ...emailNotification,
        useCustomTemplate: false,
        templateSlug: slug,
        subject: tpl?.subject || emailNotification.subject,
      },
    });
  };

  const handleOpenPreview = (tpl: MailTemplate) => {
    setPreviewTemplate(tpl);
    setIsPreviewModalOpen(true);
  };

  // Live rendered HTML for Preview Modal
  const previewHtml = useMemo(() => {
    if (!previewTemplate) return "";
    const sampleVars: Record<string, string> = {
      name: "Jane Smith",
      email: "jane.smith@example.com",
      formTitle: form.title || "Customer Survey",
      submittedAt: new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }),
      role: "Editor",
      inviterName: "Alex",
    };

    const rendered = applyTokensToHtml(previewTemplate.body, sampleVars);
    if (/<html[\s>]/i.test(rendered) || /<!DOCTYPE\s+html/i.test(rendered)) {
      return rendered;
    }

    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${previewTemplate.subject || "Email Preview"}</title>
  </head>
  <body style="margin: 0; padding: 24px 16px; background-color: #000000; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    ${rendered}
  </body>
</html>`;
  }, [previewTemplate, form.title]);

  return (
    <div className="space-y-6 p-2 font-sans">
      <div className="space-y-4">
        {/* Public Slug */}
        <div className="rounded-sm border border-border bg-accent-1 p-3.5">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm border border-border bg-accent-1">
              <Link2 className="h-4 w-4 text-accent-7" />
            </div>
            <div>
              <Label className="text-sm font-medium text-foreground">
                Public Slug
              </Label>
              <p className="text-sm text-accent-5">
                Custom URL segment for your published form
              </p>
            </div>
          </div>
          <Input
            value={form.slug || ""}
            onChange={(e) => onSlugChange(e.target.value)}
            onBlur={onSlugBlur}
            placeholder="custom-url-slug (optional)"
            className="h-9 border-border bg-background text-foreground font-sans text-sm"
          />
          <p className="mt-2 text-sm text-accent-5">
            Allowed: letters, numbers, and hyphens. Duplicate slugs are auto-adjusted.
          </p>
        </div>



        {/* Progress Bar */}
        <div className="flex items-center justify-between rounded-sm border border-border bg-accent-1 p-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm border border-border bg-accent-1">
              <Eye className="h-4 w-4 text-accent-7" />
            </div>
            <div>
              <Label
                htmlFor="progress-bar"
                className="cursor-pointer text-sm font-medium text-foreground"
              >
                Progress Bar
              </Label>
              <p className="text-sm text-accent-5">Show completion progress</p>
            </div>
          </div>
          <Switch
            id="progress-bar"
            checked={form.settings.showProgressBar}
            onCheckedChange={(checked) =>
              onUpdateSettings({ showProgressBar: checked })
            }
          />
        </div>

        {/* Multiple Responses */}
        <div className="flex items-center justify-between rounded-sm border border-border bg-accent-1 p-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm border border-border bg-accent-1">
              <Copy className="h-4 w-4 text-accent-7" />
            </div>
            <div>
              <Label
                htmlFor="multiple-responses"
                className="cursor-pointer text-sm font-medium text-foreground"
              >
                Multiple Responses
              </Label>
              <p className="text-sm text-accent-5">
                Allow users to submit multiple times
              </p>
            </div>
          </div>
          <Switch
            id="multiple-responses"
            checked={form.settings.allowMultipleResponses}
            onCheckedChange={(checked) =>
              onUpdateSettings({ allowMultipleResponses: checked })
            }
          />
        </div>

        {/* Response Deadline */}
        <div className="space-y-3 rounded-sm border border-border bg-accent-1 p-3.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-sm border border-border bg-accent-1">
                <CalendarClock className="h-4 w-4 text-accent-7" />
              </div>
              <div>
                <Label
                  htmlFor="response-deadline"
                  className="cursor-pointer text-sm font-medium text-foreground"
                >
                  Response Deadline
                </Label>
                <p className="text-sm text-accent-5">
                  Stop submissions automatically at a date and time
                </p>
              </div>
            </div>
            <Switch
              id="response-deadline"
              checked={hasResponseDeadline}
              onCheckedChange={(checked) => {
                if (!checked) {
                  onUpdateSettings({ responseDeadlineAt: null });
                  return;
                }
                if (deadlineDateValue && deadlineTimeValue) {
                  onUpdateSettings({ responseDeadlineAt });
                  return;
                }
                const now = new Date();
                now.setMinutes(now.getMinutes() + 30);
                onUpdateSettings({ responseDeadlineAt: now.toISOString() });
              }}
            />
          </div>

          {hasResponseDeadline && (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Input
                type="date"
                value={deadlineDateValue}
                onChange={(e) => {
                  const nextIso = toIsoFromLocalDateTime(
                    e.target.value,
                    deadlineTimeValue || "23:59",
                  );
                  if (!nextIso) return;
                  onUpdateSettings({ responseDeadlineAt: nextIso });
                }}
                className="h-9 border-border bg-background text-foreground [color-scheme:dark]"
              />
              <Input
                type="time"
                value={deadlineTimeValue}
                onChange={(e) => {
                  const nextIso = toIsoFromLocalDateTime(
                    deadlineDateValue ||
                      toLocalDateInputValue(new Date().toISOString()),
                    e.target.value,
                  );
                  if (!nextIso) return;
                  onUpdateSettings({ responseDeadlineAt: nextIso });
                }}
                className="h-9 border-border bg-background text-foreground [color-scheme:dark]"
              />
            </div>
          )}
        </div>

        {/* Max Responses */}
        <div className="space-y-3 rounded-sm border border-border bg-accent-1 p-3.5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <Label
                htmlFor="max-responses"
                className="cursor-pointer text-sm font-medium text-foreground"
              >
                Max Responses
              </Label>
              <p className="text-sm text-accent-5">
                Auto-close after reaching a response count
              </p>
            </div>
            <Switch
              id="max-responses"
              checked={hasMaxResponsesLimit}
              onCheckedChange={(checked) =>
                onUpdateSettings({
                  maxResponses: checked ? maxResponsesValue || 100 : null,
                })
              }
            />
          </div>

          {hasMaxResponsesLimit && (
            <Input
              type="number"
              min={1}
              step={1}
              value={String(maxResponsesValue)}
              onChange={(e) => {
                const nextValue = Number(e.target.value);
                if (!Number.isInteger(nextValue) || nextValue < 1) {
                  onUpdateSettings({ maxResponses: null });
                  return;
                }
                onUpdateSettings({ maxResponses: nextValue });
              }}
              placeholder="Maximum responses"
              className="h-9 border-border bg-background text-foreground text-sm"
            />
          )}
        </div>
      </div>

      {/* Confirmation Message */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-foreground">
          Confirmation Message
        </Label>
        <Textarea
          value={form.settings.confirmationMessage}
          onChange={(e) =>
            onUpdateSettings({ confirmationMessage: e.target.value })
          }
          placeholder="Thank you for your response!"
          className="min-h-[100px] resize-none rounded-sm border-border bg-accent-1 text-foreground placeholder:text-accent-4 focus:border-accent-8 focus:ring-0 text-sm font-sans"
        />
      </div>

      {/* Form Closed Message */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-foreground">
          Form Closed Message
        </Label>
        <Textarea
          value={form.settings.closedMessage || ""}
          onChange={(e) => onUpdateSettings({ closedMessage: e.target.value })}
          placeholder="This form is no longer accepting responses."
          className="min-h-[100px] resize-none rounded-sm border-border bg-accent-1 text-foreground placeholder:text-accent-4 focus:border-accent-8 focus:ring-0 text-sm font-sans"
        />
      </div>

      {/* Email Receipt (Connected to Dedicated Mail Service) */}
      <div className="space-y-4 rounded-sm border border-border bg-accent-1 p-3.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm border border-border bg-accent-1">
              <Mail className="h-4 w-4 text-accent-7" />
            </div>
            <div>
              <Label
                htmlFor="submission-email-receipt"
                className="cursor-pointer text-sm font-semibold text-foreground"
              >
                Email Notifications
              </Label>
            </div>
          </div>
          <Switch
            id="submission-email-receipt"
            checked={isTestUser ? false : emailNotification.enabled}
            disabled={isTestUser}
            onCheckedChange={(checked) =>
              onUpdateSettings({
                emailNotification: {
                  ...emailNotification,
                  enabled: checked,
                },
              })
            }
          />
        </div>

        {isTestUser && (
          <p className="text-sm text-accent-5">
            Email receipts are disabled for test users.
          </p>
        )}

        {emailNotification.enabled && !isTestUser && (
          <div className="space-y-4 border-t border-border pt-4">
            {/* Template Selector Dropdown */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <FileCode className="h-4 w-4 text-accent-6" />
                  <span>Choose Email Template</span>
                </Label>
              </div>

              <Select
                value={emailNotification.templateSlug || "submission-receipt"}
                onValueChange={(val) => handleSelectMailTemplate(val || "submission-receipt")}
              >
                <SelectTrigger className="w-full text-sm font-sans h-10">
                  <SelectValue placeholder="Select an email template..." />
                </SelectTrigger>
                <SelectContent className="text-sm font-sans">
                  <SelectGroup>
                    <SelectLabel className="text-sm font-semibold">Designed Mail Service Templates</SelectLabel>
                    {loadingTemplates ? (
                      <SelectItem value="__loading__" disabled className="text-sm font-sans">
                        Loading templates...
                      </SelectItem>
                    ) : (
                      mailTemplates.map((tpl) => (
                        <SelectItem key={tpl.slug} value={tpl.slug} className="text-sm font-sans">
                          {tpl.name} ({tpl.category.replace(/_/g, " ")}) {tpl.isDefault ? "• Default" : ""}
                        </SelectItem>
                      ))
                    )}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {/* Template Information & Preview Card */}
            {activeSelectedTemplate && (
              <div className="space-y-3 rounded-sm border border-border bg-background p-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-sm font-semibold text-foreground font-sans">
                      {activeSelectedTemplate.name}
                    </span>
                    <span className="ml-2 inline-flex items-center rounded-xs border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 text-sm font-medium text-purple-400 capitalize">
                      {activeSelectedTemplate.category.replace(/_/g, " ")}
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenPreview(activeSelectedTemplate)}
                    className="gap-1.5 text-sm font-sans h-8"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Live HTML Preview</span>
                  </Button>
                </div>

                <div className="space-y-1">
                  <Label className="text-sm font-medium text-accent-5">Default Subject</Label>
                  <p className="text-sm font-medium text-foreground bg-accent-1 p-2 rounded-sm border border-border">
                    {activeSelectedTemplate.subject}
                  </p>
                </div>

                {/* Tokens pill list */}
                {activeSelectedTemplate.variables && activeSelectedTemplate.variables.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <Label className="text-sm font-medium text-accent-5">Dynamic Tokens Available:</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {activeSelectedTemplate.variables.map((v) => (
                        <span
                          key={v.key}
                          className="inline-flex items-center rounded-xs border border-border bg-accent-1 px-2 py-0.5 text-sm font-sans text-foreground"
                          title={v.description}
                        >
                          {`{{${v.key}}}`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Live Email HTML Preview Dialog */}
      <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
        <DialogContent className="max-w-4xl h-[80vh] sm:max-h-[90vh] overflow-y-auto p-6 font-sans bg-background hide-scrollbar">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base font-bold text-foreground font-sans flex items-center gap-2">
              <Mail className="h-4 w-4 text-accent-6" />
              <span>{previewTemplate?.name || "Email Preview"}</span>
            </DialogTitle>
            {previewTemplate?.subject && (
              <p className="text-sm text-accent-5 font-sans">
                Subject: <span className="text-foreground font-medium">{previewTemplate.subject}</span>
              </p>
            )}
          </DialogHeader>

          <div className="mt-3 rounded-sm border border-border overflow-hidden bg-black shadow-inner">
            <iframe
              title="Template HTML Preview"
              srcDoc={previewHtml}
              className="w-full h-[200px] md:h-[300px] lg:h-[400px] border-0 bg-black hide-scrollbar"
            />
          </div>

          <div className="flex justify-end pt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPreviewModalOpen(false)}
              className="text-sm font-sans"
            >
              Close Preview
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
