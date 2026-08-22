import { useRef } from "react";
import {
  Eye,
  Copy,
  Image,
  Building2,
  Sparkles,
  Mail,
  CalendarClock,
  Link2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { Form } from "@/types/form";
import { MarkdownEditor } from "./MarkdownEditor";

interface SettingsContentProps {
  form: Form;
  isTestUser: boolean;
  onUpdateSettings: (updates: Partial<Form["settings"]>) => void;
  onSlugChange: (value: string) => void;
  onSlugBlur: () => void;
  onUploadThemeAsset: (
    target: "logoUrl" | "bannerUrl",
    file: File,
  ) => Promise<void>;
  isThemeAssetUploading: boolean;
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

export const SettingsContent = ({
  form,
  isTestUser,
  onUpdateSettings,
  onSlugChange,
  onSlugBlur,
  onUploadThemeAsset,
  isThemeAssetUploading,
}: SettingsContentProps) => {
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const backgroundInputRef = useRef<HTMLInputElement | null>(null);
  const bannerImageUrl =
    form.settings.theme.bannerUrl || form.settings.theme.backgroundImageUrl;
  const bannerPositionX =
    typeof form.settings.theme.bannerPositionX === "number"
      ? form.settings.theme.bannerPositionX
      : 50;
  const bannerPositionY =
    typeof form.settings.theme.bannerPositionY === "number"
      ? form.settings.theme.bannerPositionY
      : 50;
  const emailNotification = form.settings.emailNotification || {
    enabled: false,
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

  const insertTokenToSubject = (token: string) => {
    onUpdateSettings({
      emailNotification: {
        ...emailNotification,
        subject: `${emailNotification.subject || ""}${token}`,
      },
    });
  };

  const applyEmailTemplate = (template: "simple" | "professional") => {
    const next =
      template === "simple"
        ? {
            subject: "Thanks for submitting {{formTitle}}",
            message:
              "Hi {{name}},\n\nThanks for your response to **{{formTitle}}**.\nWe recorded your submission on {{submittedAt}}.\n\nWe appreciate your time.",
          }
        : {
            subject: "Submission confirmed: {{formTitle}}",
            message:
              "Hi {{name}},\n\nYour submission for **{{formTitle}}** has been received.\n\n- Submission time: {{submittedAt}}\n- Status: Confirmed\n\nIf this was not you, please contact support.\n\nRegards,\nEasy Forms Team",
          };

    onUpdateSettings({
      emailNotification: {
        ...emailNotification,
        ...next,
      },
    });
  };

  return (
    <div className="space-y-6 p-2">
      <div className="space-y-4">
        {/* Public Slug */}
        <div className="rounded-sm border border-border bg-accent-1 p-3">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm border border-border bg-accent-1">
              <Link2 className="h-4 w-4 text-accent-7" />
            </div>
            <div>
              <Label className="text-sm font-medium text-foreground">
                Public Slug
              </Label>
              <p className="text-xs text-accent-5">
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
          <p className="mt-2 text-xs text-accent-5">
            Allowed: letters, numbers, and hyphens. Duplicate slugs are
            auto-adjusted.
          </p>
        </div>

        {/* Branding */}
        <div className="rounded-sm border border-border bg-accent-1 p-3">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm border border-border bg-accent-1">
              <Building2 className="h-4 w-4 text-accent-7" />
            </div>
            <div>
              <Label className="text-sm font-medium text-foreground">
                Branding
              </Label>
              <p className="text-xs text-accent-5">
                Logo, hero background, and labels
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <Input
              value={form.settings.theme.brandName || ""}
              onChange={(e) =>
                onUpdateSettings({
                  theme: {
                    ...form.settings.theme,
                    brandName: e.target.value,
                  },
                })
              }
              placeholder="Brand name (optional)"
              className="h-9 border-border bg-background text-foreground text-sm"
            />
            <Input
              value={form.settings.theme.brandTagline || ""}
              onChange={(e) =>
                onUpdateSettings({
                  theme: {
                    ...form.settings.theme,
                    brandTagline: e.target.value,
                  },
                })
              }
              placeholder="Brand tagline (optional)"
              className="h-9 border-border bg-background text-foreground text-sm"
            />
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                disabled={isThemeAssetUploading || isTestUser}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-sm border border-border bg-background px-3 text-xs text-foreground transition-geist duration-150 hover:bg-accent-1 disabled:cursor-not-allowed disabled:opacity-60 md:text-sm"
              >
                <Sparkles className="h-4 w-4" />
                {form.settings.theme.logoUrl ? "Replace Logo" : "Upload Logo"}
              </button>
              <button
                type="button"
                onClick={() => backgroundInputRef.current?.click()}
                disabled={isThemeAssetUploading || isTestUser}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-sm border border-border bg-background px-3 text-xs text-foreground transition-geist duration-150 hover:bg-accent-1 disabled:cursor-not-allowed disabled:opacity-60 md:text-sm"
              >
                <Image className="h-4 w-4" />
                {form.settings.theme.bannerUrl ||
                form.settings.theme.backgroundImageUrl
                  ? "Replace Banner Image"
                  : "Upload Banner Image"}
              </button>
            </div>
            <p className="text-xs text-accent-5">
              {isTestUser
                ? "Branding assets are fixed for test users."
                : "Banner image appears at the top of the public form."}
            </p>
            {bannerImageUrl && (
              <div className="space-y-3 rounded-sm border border-border bg-background p-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium text-foreground">
                    Horizontal Position
                  </Label>
                  <span className="text-xs text-accent-5">
                    {bannerPositionX}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={bannerPositionX}
                  onChange={(e) =>
                    onUpdateSettings({
                      theme: {
                        ...form.settings.theme,
                        bannerPositionX: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full accent-foreground"
                />

                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium text-foreground">
                    Vertical Position
                  </Label>
                  <span className="text-xs text-accent-5">
                    {bannerPositionY}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={bannerPositionY}
                  onChange={(e) =>
                    onUpdateSettings({
                      theme: {
                        ...form.settings.theme,
                        bannerPositionY: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full accent-foreground"
                />

                <button
                  type="button"
                  onClick={() =>
                    onUpdateSettings({
                      theme: {
                        ...form.settings.theme,
                        bannerPositionX: 50,
                        bannerPositionY: 50,
                      },
                    })
                  }
                  className="inline-flex h-8 items-center justify-center rounded-sm border border-border bg-accent-1 px-3 text-xs text-foreground transition-geist duration-150 hover:bg-accent-2"
                >
                  Reset Banner Position
                </button>
              </div>
            )}
            {(form.settings.theme.logoUrl ||
              form.settings.theme.bannerUrl ||
              form.settings.theme.backgroundImageUrl) && (
              <div className="space-y-2">
                {form.settings.theme.logoUrl && (
                  <p className="truncate text-xs text-accent-5">
                    Logo: {form.settings.theme.logoUrl}
                  </p>
                )}
                {(form.settings.theme.bannerUrl ||
                  form.settings.theme.backgroundImageUrl) && (
                  <p className="truncate text-xs text-accent-5">
                    Banner:{" "}
                    {form.settings.theme.bannerUrl ||
                      form.settings.theme.backgroundImageUrl}
                  </p>
                )}
              </div>
            )}
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  void onUploadThemeAsset("logoUrl", file);
                }
                e.target.value = "";
              }}
            />
            <input
              ref={backgroundInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  void onUploadThemeAsset("bannerUrl", file);
                }
                e.target.value = "";
              }}
            />
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center justify-between rounded-sm border border-border bg-accent-1 p-3">
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
              <p className="text-xs text-accent-5">Show completion progress</p>
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
        <div className="flex items-center justify-between rounded-sm border border-border bg-accent-1 p-3">
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
              <p className="text-xs text-accent-5">
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
        <div className="space-y-3 rounded-sm border border-border bg-accent-1 p-3">
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
                <p className="text-xs text-accent-5">
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
        <div className="space-y-3 rounded-sm border border-border bg-accent-1 p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <Label
                htmlFor="max-responses"
                className="cursor-pointer text-sm font-medium text-foreground"
              >
                Max Responses
              </Label>
              <p className="text-xs text-accent-5">
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
              className="h-9 border-border bg-background text-foreground"
            />
          )}
        </div>
      </div>

      {/* Confirmation Message */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-foreground">
          Confirmation Message
        </Label>
        <Textarea
          value={form.settings.confirmationMessage}
          onChange={(e) =>
            onUpdateSettings({ confirmationMessage: e.target.value })
          }
          placeholder="Thank you for your response!"
          className="min-h-[100px] resize-none rounded-sm border-border bg-accent-1 text-foreground placeholder:text-accent-4 focus:border-accent-8 focus:ring-0 text-sm"
        />
      </div>

      {/* Form Closed Message */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-foreground">
          Form Closed Message
        </Label>
        <Textarea
          value={form.settings.closedMessage || ""}
          onChange={(e) => onUpdateSettings({ closedMessage: e.target.value })}
          placeholder="This form is no longer accepting responses."
          className="min-h-[100px] resize-none rounded-sm border-border bg-accent-1 text-foreground placeholder:text-accent-4 focus:border-accent-8 focus:ring-0 text-sm"
        />
      </div>

      {/* Email Receipt */}
      <div className="space-y-4 rounded-sm border border-border bg-accent-1 p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm border border-border bg-accent-1">
              <Mail className="h-4 w-4 text-accent-7" />
            </div>
            <div>
              <Label
                htmlFor="submission-email-receipt"
                className="cursor-pointer text-sm font-medium text-foreground"
              >
                Email Receipt
              </Label>
              <p className="text-xs text-accent-5">
                Send a custom email after successful submission
              </p>
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
          <p className="text-xs text-accent-5">
            Email receipts are disabled for test users.
          </p>
        )}

        {emailNotification.enabled && !isTestUser && (
          <div className="space-y-3 border-t border-border pt-3">
            <Input
              value={emailNotification.subject}
              onChange={(e) =>
                onUpdateSettings({
                  emailNotification: {
                    ...emailNotification,
                    subject: e.target.value,
                  },
                })
              }
              placeholder="Email subject"
              className="h-9 border-border bg-background text-foreground text-xs md:text-md"
            />

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => insertTokenToSubject(" {{formTitle}}")}
                className="rounded-sm border border-border bg-background px-2 py-1 text-xs text-foreground transition-geist duration-150 hover:bg-accent-1"
              >
                + form title
              </button>
              <button
                type="button"
                onClick={() => insertTokenToSubject(" {{submittedAt}}")}
                className="rounded-sm border border-border bg-background px-2 py-1 text-xs text-foreground transition-geist duration-150 hover:bg-accent-1"
              >
                + date/time
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => applyEmailTemplate("simple")}
                className="rounded-sm border border-border bg-background px-2 py-1 text-xs text-foreground transition-geist duration-150 hover:bg-accent-1"
              >
                Use Simple Template
              </button>
              <button
                type="button"
                onClick={() => applyEmailTemplate("professional")}
                className="rounded-sm border border-border bg-background px-2 py-1 text-xs text-foreground transition-geist duration-150 hover:bg-accent-1"
              >
                Use Professional Template
              </button>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium text-accent-5">Email Body Content</Label>
              <MarkdownEditor
                value={emailNotification.message || ""}
                onChange={(message) =>
                  onUpdateSettings({
                    emailNotification: {
                      ...emailNotification,
                      message,
                    },
                  })
                }
                placeholder="Write custom email message in Markdown..."
                minHeight="min-h-[140px]"
                tokens={[
                  { label: "Name", token: "{{name}}" },
                  { label: "Form Title", token: "{{formTitle}}" },
                  { label: "Date/Time", token: "{{submittedAt}}" },
                ]}
              />
            </div>
            <p className="text-xs md:text-md text-accent-5">
              Variables: {"{{name}}"}, {"{{formTitle}}"}, {"{{submittedAt}}"}.
              {" {{email}}"} still works for backward compatibility. Message
              supports markdown (lists, bold, links, headings).
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
