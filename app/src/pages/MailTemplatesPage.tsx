import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Mail,
  Plus,
  Search,
  Send,
  Eye,
  Edit3,
  Trash2,
  RefreshCw,
  Check,
  Code2,
  FileCode2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import {
  mailApi,
  type MailTemplate,
  type MailerStatus,
  type CreateMailTemplatePayload,
} from "@/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const DEFAULT_VARIABLES: Record<string, { key: string; description: string; sample: string }[]> = {
  invitation: [
    { key: "formTitle", description: "Title of the form", sample: "Customer Satisfaction Survey" },
    { key: "role", description: "Role assigned (viewer, editor, admin)", sample: "editor" },
    { key: "inviterName", description: "Name of the person inviting", sample: "Sarah Connor" },
    { key: "inviterEmail", description: "Email of the person inviting", sample: "sarah@example.com" },
    { key: "accessUrl", description: "Direct response sheet URL", sample: "https://easyforms.istebits.com/form/123/responses" },
  ],
  submission_receipt: [
    { key: "name", description: "Name of the respondent", sample: "Jane Doe" },
    { key: "email", description: "Email of the respondent", sample: "jane@example.com" },
    { key: "formTitle", description: "Title of the submitted form", sample: "Event Registration 2026" },
    { key: "submittedAt", description: "Formatted submission date & time", sample: "Sep 3, 2026, 3:00 PM" },
  ],
  notification: [
    { key: "name", description: "Name of recipient", sample: "Alex" },
    { key: "formTitle", description: "Title of the form", sample: "Quarterly Review" },
    { key: "message", description: "Notification message", sample: "Your request has been approved." },
  ],
  custom: [
    { key: "name", description: "Recipient name", sample: "User" },
    { key: "formTitle", description: "Form name", sample: "Project Intake" },
  ],
};

const STARTER_TEMPLATES = [
  {
    name: "Modern Dark (Vercel Style)",
    body: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0a; color: #ffffff; border: 1px solid #262626; border-radius: 8px; padding: 32px; max-width: 540px; margin: 0 auto;">
  <div style="border-bottom: 1px solid #262626; padding-bottom: 16px; margin-bottom: 24px;">
    <span style="font-size: 16px; font-weight: 700; color: #ffffff; letter-spacing: -0.02em;">EasyForms</span>
  </div>
  <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #ffffff;">Hello {{name}},</h2>
  <p style="color: #a3a3a3; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
    This is an update regarding your form <strong style="color: #ffffff;">"{{formTitle}}"</strong>.
  </p>
  <div style="background: #171717; border: 1px solid #262626; border-radius: 6px; padding: 16px; margin-bottom: 24px;">
    <p style="color: #d4d4d8; font-size: 14px; line-height: 1.5; margin: 0;">
      Your submission has been processed securely.
    </p>
  </div>
  <p style="color: #737373; font-size: 13px; margin: 24px 0 0 0; border-top: 1px solid #262626; padding-top: 16px;">
    Best regards,<br><strong style="color: #a3a3a3;">The EasyForms Team</strong>
  </p>
</div>`,
  },
  {
    name: "Clean Light (Minimalist White)",
    body: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #ffffff; color: #18181b; border: 1px solid #e4e4e7; border-radius: 8px; padding: 32px; max-width: 540px; margin: 0 auto;">
  <div style="border-bottom: 1px solid #f4f4f5; padding-bottom: 16px; margin-bottom: 24px;">
    <span style="font-size: 16px; font-weight: 700; color: #09090b; letter-spacing: -0.02em;">EasyForms</span>
  </div>
  <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #09090b;">Hello {{name}},</h2>
  <p style="color: #52525b; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
    Thank you for your submission to <strong style="color: #18181b;">"{{formTitle}}"</strong>.
  </p>
  <div style="background: #f4f4f5; border-radius: 6px; padding: 16px; margin-bottom: 24px;">
    <p style="color: #3f3f46; font-size: 14px; margin: 0;">We have received your response.</p>
  </div>
  <p style="color: #71717a; font-size: 13px; margin: 24px 0 0 0; border-top: 1px solid #f4f4f5; padding-top: 16px;">
    Best regards,<br><strong style="color: #3f3f46;">The EasyForms Team</strong>
  </p>
</div>`,
  },
  {
    name: "Collaborator Invitation",
    body: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0a; color: #ffffff; border: 1px solid #262626; border-radius: 8px; padding: 32px; max-width: 540px; margin: 0 auto;">
  <div style="border-bottom: 1px solid #262626; padding-bottom: 16px; margin-bottom: 24px;">
    <span style="font-size: 16px; font-weight: 700; color: #ffffff; letter-spacing: -0.02em;">EasyForms</span>
  </div>
  <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #ffffff;">Collaboration Invitation</h2>
  <p style="color: #a3a3a3; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
    <strong style="color: #ffffff;">{{inviterName}}</strong> has invited you to collaborate on <strong style="color: #ffffff;">"{{formTitle}}"</strong>.
  </p>
  <div style="background: #171717; border: 1px solid #262626; border-radius: 6px; padding: 16px; margin-bottom: 24px;">
    <span style="color: #a3a3a3; font-size: 13px;">Assigned Role:</span>
    <div style="color: #0070f3; font-size: 15px; font-weight: 700; text-transform: uppercase; margin-top: 4px;">{{role}}</div>
  </div>
  <a href="{{accessUrl}}" style="display: inline-block; background-color: #ffffff; color: #000000; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 6px;">
    Open Response Sheet &rarr;
  </a>
  <p style="color: #737373; font-size: 12px; margin-top: 32px; border-top: 1px solid #262626; padding-top: 16px;">
    If you were not expecting this invitation, you can safely ignore this email.
  </p>
</div>`,
  },
  {
    name: "Submission Receipt",
    body: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0a; color: #ffffff; border: 1px solid #262626; border-radius: 8px; padding: 32px; max-width: 540px; margin: 0 auto;">
  <div style="border-bottom: 1px solid #262626; padding-bottom: 16px; margin-bottom: 24px;">
    <span style="font-size: 16px; font-weight: 700; color: #ffffff; letter-spacing: -0.02em;">EasyForms</span>
  </div>
  <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #ffffff;">Response Received</h2>
  <p style="color: #a3a3a3; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
    Hi <strong style="color: #ffffff;">{{name}}</strong>, thank you for completing <strong style="color: #ffffff;">"{{formTitle}}"</strong>.
  </p>
  <div style="background: #171717; border: 1px solid #262626; border-radius: 6px; padding: 14px 18px; margin: 20px 0;">
    <span style="color: #a3a3a3; font-size: 13px;">Submitted On:</span>
    <div style="color: #ffffff; font-size: 14px; font-weight: 600; margin-top: 4px;">{{submittedAt}}</div>
  </div>
  <p style="color: #737373; font-size: 13px; margin: 24px 0 0 0; border-top: 1px solid #262626; padding-top: 16px;">
    Best regards,<br><strong style="color: #a3a3a3;">The EasyForms Team</strong>
  </p>
</div>`,
  },
];

function applyTokensToHtml(htmlString: string, tokens: Record<string, string>): string {
  let output = htmlString || "";
  for (const [key, value] of Object.entries(tokens)) {
    const pattern = new RegExp(`{{\\s*${key}\\s*}}`, "g");
    output = output.replace(pattern, value || "");
  }
  return output;
}

type StudioTab = "edit" | "preview" | "test";

export function MailTemplatesPage() {
  const [templates, setTemplates] = useState<MailTemplate[]>([]);
  const [, setStatus] = useState<MailerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<StudioTab>("edit");

  // Edit / Create State
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [editForm, setEditForm] = useState<CreateMailTemplatePayload>({
    name: "",
    slug: "",
    category: "custom",
    subject: "",
    body: STARTER_TEMPLATES[0].body,
    variables: [],
    isActive: true,
  });
  const [isSaving, setIsSaving] = useState(false);

  // Test Email State
  const [testEmail, setTestEmail] = useState("");
  const [testVariables, setTestVariables] = useState<Record<string, string>>({});
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchData = useCallback(async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true);
      const [statusRes, templatesRes] = await Promise.all([
        mailApi.getStatus().catch(() => null),
        mailApi.listTemplates().catch(() => []),
      ]);
      setStatus(statusRes);
      setTemplates(templatesRes);

      if (templatesRes.length > 0 && !selectedId && !isCreatingNew) {
        const first = templatesRes[0];
        setSelectedId(first._id || first.id || null);
        setEditForm({
          name: first.name,
          slug: first.slug,
          category: first.category,
          subject: first.subject,
          body: first.body,
          variables: first.variables || DEFAULT_VARIABLES[first.category] || [],
          isActive: first.isActive,
        });
      }

      if (showToast) toast.success("Email configuration reloaded");
    } catch {
      toast.error("Failed to load mail service data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedId, isCreatingNew]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const filteredTemplates = useMemo(() => {
    return templates.filter((tpl) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        tpl.name.toLowerCase().includes(q) ||
        tpl.slug.toLowerCase().includes(q) ||
        tpl.subject.toLowerCase().includes(q)
      );
    });
  }, [templates, searchQuery]);

  const activeTemplate = useMemo(() => {
    if (isCreatingNew) return null;
    return templates.find((t) => (t._id || t.id) === selectedId) || templates[0] || null;
  }, [templates, selectedId, isCreatingNew]);

  // When active template changes, sync form
  const handleSelectTemplate = (template: MailTemplate) => {
    setIsCreatingNew(false);
    setSelectedId(template._id || template.id || null);
    setEditForm({
      name: template.name,
      slug: template.slug,
      category: template.category,
      subject: template.subject,
      body: template.body,
      variables: template.variables || DEFAULT_VARIABLES[template.category] || [],
      isActive: template.isActive,
    });

    // Populate test variables
    const initialVars: Record<string, string> = {};
    const vars = template.variables || DEFAULT_VARIABLES[template.category] || [];
    for (const v of vars) {
      initialVars[v.key] = v.sample || `Sample ${v.key}`;
    }
    setTestVariables(initialVars);
  };

  const handleStartCreate = () => {
    setIsCreatingNew(true);
    setSelectedId(null);
    setActiveTab("edit");
    setEditForm({
      name: "",
      slug: "",
      category: "custom",
      subject: "",
      body: STARTER_TEMPLATES[0].body,
      variables: DEFAULT_VARIABLES.custom,
      isActive: true,
    });
  };

  const handleSaveTemplate = async () => {
    if (!editForm.name.trim() || !editForm.subject.trim() || !editForm.body.trim()) {
      toast.error("Name, Subject, and HTML Body are required");
      return;
    }

    try {
      setIsSaving(true);
      if (isCreatingNew) {
        const created = await mailApi.createTemplate(editForm);
        toast.success("HTML email template created successfully");
        setIsCreatingNew(false);
        setSelectedId(created._id || created.id || null);
      } else if (activeTemplate) {
        await mailApi.updateTemplate(activeTemplate._id || activeTemplate.id!, {
          name: editForm.name,
          category: editForm.category,
          subject: editForm.subject,
          body: editForm.body,
          variables: editForm.variables,
          isActive: editForm.isActive,
        });
        toast.success("HTML email template saved successfully");
      }
      await fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save template";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTemplate = async (template: MailTemplate) => {
    if (template.isDefault) {
      toast.error("System default templates cannot be deleted");
      return;
    }
    if (!confirm(`Are you sure you want to delete "${template.name}"?`)) return;

    try {
      await mailApi.deleteTemplate(template._id || template.id!);
      toast.success("Template deleted successfully");
      setSelectedId(null);
      await fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete template";
      toast.error(msg);
    }
  };

  // Instant Live Preview (0ms latency HTML interpolation)
  const livePreviewHtml = useMemo(() => {
    const sampleVars: Record<string, string> = {};
    const vars = editForm.variables || DEFAULT_VARIABLES[editForm.category || "custom"] || [];
    for (const v of vars) {
      sampleVars[v.key] = v.sample || `[${v.key}]`;
    }

    const html = applyTokensToHtml(editForm.body || "", sampleVars);
    if (/<html[\s>]/i.test(html) || /<!DOCTYPE\s+html/i.test(html)) {
      return html;
    }

    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${editForm.subject || "Preview"}</title>
  </head>
  <body style="margin: 0; padding: 32px 16px; background-color: #000000; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    ${html}
  </body>
</html>`;
  }, [editForm.body, editForm.subject, editForm.variables, editForm.category]);

  const handleSendTest = async () => {
    if (!testEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmail)) {
      toast.error("Please enter a valid recipient email address");
      return;
    }

    try {
      setIsSendingTest(true);
      await mailApi.sendTestEmail({
        to: testEmail,
        templateSlug: isCreatingNew ? undefined : activeTemplate?.slug,
        customSubject: isCreatingNew ? editForm.subject : undefined,
        customBody: isCreatingNew ? editForm.body : undefined,
        variables: testVariables,
      });
      toast.success(`Test email dispatched to ${testEmail}!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send test email";
      toast.error(msg);
    } finally {
      setIsSendingTest(false);
    }
  };

  const insertToken = (key: string) => {
    const token = `{{${key}}}`;
    setEditForm((prev) => ({
      ...prev,
      body: prev.body + ` ${token}`,
    }));
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const loadStarterTemplate = (starterBody: string) => {
    setEditForm((prev) => ({
      ...prev,
      body: starterBody,
    }));
    toast.success("Starter HTML template loaded into editor");
  };

  return (
    <div className="space-y-6 font-sans p-4 max-w-7xl mx-auto">
      {/* Top Page Header */}
      <div className="flex flex-wrap items-center justify-between rounded-xs border border-zinc-800 bg-zinc-950/80 p-6 shadow-sm gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm border border-border bg-accent-1 text-foreground">
              <Mail className="h-4 w-4" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground font-sans">
              Mailer Service
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void fetchData(true)}
            disabled={refreshing}
            className="gap-1.5 text-sm font-medium h-9"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleStartCreate}
            className="gap-1.5 text-sm font-medium h-9"
          >
            <Plus className="h-4 w-4" />
            <span>New Template</span>
          </Button>
        </div>
      </div>

      {/* Mobile Template Selector (< md screens) */}
      <div className="md:hidden rounded-sm border border-border bg-background p-3 space-y-2">
        <Label className="text-sm font-medium text-foreground">Select Active Template</Label>
        <select
          value={isCreatingNew ? "new" : selectedId || ""}
          onChange={(e) => {
            if (e.target.value === "new") {
              handleStartCreate();
            } else {
              const tpl = templates.find((t) => (t._id || t.id) === e.target.value);
              if (tpl) handleSelectTemplate(tpl);
            }
          }}
          className="w-full h-10 rounded-sm border border-border bg-accent-1 px-3 text-sm text-foreground focus:outline-none"
        >
          {isCreatingNew && <option value="new">+ Creating New Template</option>}
          {templates.map((t) => (
            <option key={t._id || t.id} value={t._id || t.id}>
              {t.name} ({t.category})
            </option>
          ))}
        </select>
      </div>

      {/* MASTER-DETAIL TWO-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Minimalist Template List (Desktop) */}
        <aside className="hidden md:flex md:col-span-4 lg:col-span-4 flex-col rounded-sm border border-border bg-background overflow-hidden">
          <div className="p-3 border-b border-border bg-accent-1/40">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-accent-4" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search templates..."
                className="pl-8 h-8 text-sm bg-background"
              />
            </div>
          </div>

          <div className="divide-y divide-border max-h-[calc(100vh-20rem)] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-sm text-accent-5">Loading templates...</div>
            ) : filteredTemplates.length === 0 ? (
              <div className="p-8 text-center text-sm text-accent-5">No templates match.</div>
            ) : (
              filteredTemplates.map((template) => {
                const isSelected = !isCreatingNew && (template._id || template.id) === selectedId;
                return (
                  <div
                    key={template._id || template.id}
                    onClick={() => handleSelectTemplate(template)}
                    className={`p-3.5 transition-all duration-150 cursor-pointer flex items-center justify-between gap-2 ${
                      isSelected
                        ? "bg-accent-1 border-l-2 border-l-foreground text-foreground"
                        : "hover:bg-accent-1/50 text-accent-5 hover:text-foreground"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className={`text-sm truncate font-sans ${isSelected ? "font-semibold text-foreground" : "font-medium"}`}>
                          {template.name}
                        </h4>
                        {template.isDefault && (
                          <span className="rounded-xs bg-purple-500/10 border border-purple-500/30 px-1.5 py-0.2 text-sm text-purple-400">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-accent-5 truncate mt-0.5">
                        {template.subject}
                      </p>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <button
                            type="button"
                            onClick={(e) => e.stopPropagation()}
                            className="h-7 w-7 flex items-center justify-center rounded-xs text-accent-5 hover:text-foreground hover:bg-accent-2 transition-colors"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                        }
                      />
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem onClick={() => handleSelectTemplate(template)}>
                          <Edit3 className="mr-2 h-3.5 w-3.5" />
                          <span>Edit HTML</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            handleSelectTemplate(template);
                            setActiveTab("preview");
                          }}
                        >
                          <Eye className="mr-2 h-3.5 w-3.5" />
                          <span>Preview</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            handleSelectTemplate(template);
                            setActiveTab("test");
                          }}
                        >
                          <Send className="mr-2 h-3.5 w-3.5" />
                          <span>Send Test</span>
                        </DropdownMenuItem>
                        {!template.isDefault && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => handleDeleteTemplate(template)}
                            >
                              <Trash2 className="mr-2 h-3.5 w-3.5" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* RIGHT COLUMN: HTML Studio & Actions */}
        <main className="md:col-span-8 lg:col-span-8 rounded-sm border border-border bg-background overflow-hidden">
          {/* Studio Tab Header */}
          <div className="flex flex-wrap items-center justify-between border-b border-border bg-accent-1/30 px-4 py-3 gap-3">
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-foreground truncate font-sans">
                {isCreatingNew ? "Create New HTML Template" : editForm.name || "Untitled Template"}
              </h3>
            </div>

            {/* Segmented Mode Tabs: [ HTML Editor | Preview | Test ] */}
            <div className="flex items-center rounded-sm bg-accent-1 border border-border p-0.5 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab("edit")}
                className={`px-3 py-1 rounded-xs text-sm font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "edit"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-accent-5 hover:text-foreground"
                }`}
              >
                <Code2 className="h-3.5 w-3.5" />
                <span>HTML Editor</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("preview")}
                className={`px-3 py-1 rounded-xs text-sm font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "preview"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-accent-5 hover:text-foreground"
                }`}
              >
                <Eye className="h-3.5 w-3.5" />
                <span>Live Preview</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("test")}
                className={`px-3 py-1 rounded-xs text-sm font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "test"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-accent-5 hover:text-foreground"
                }`}
              >
                <Send className="h-3.5 w-3.5" />
                <span>Test Send</span>
              </button>
            </div>
          </div>

          {/* TAB 1: HTML CODE EDITOR */}
          {activeTab === "edit" && (
            <div className="p-5 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-foreground">Template Name *</Label>
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Collaborator Invitation"
                    className="text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-foreground">Category</Label>
                  <select
                    value={editForm.category}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        category: e.target.value as CreateMailTemplatePayload["category"],
                      }))
                    }
                    className="w-full h-9 rounded-sm border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
                  >
                    <option value="invitation">Invitation</option>
                    <option value="submission_receipt">Submission Receipt</option>
                    <option value="notification">Notification</option>
                    <option value="custom">Custom Broadcast</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-foreground">Subject Line *</Label>
                <Input
                  value={editForm.subject}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, subject: e.target.value }))}
                  placeholder="e.g. You have been invited to collaborate on {{formTitle}}"
                  className="text-sm"
                />
              </div>

              {/* Dynamic Tokens Toolbar */}
              <div className="space-y-2 rounded-sm border border-border bg-accent-1/40 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                    <span>Dynamic Tokens</span>
                  </span>
                  <span className="text-accent-5">Click to insert token into HTML</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(editForm.variables && editForm.variables.length > 0
                    ? editForm.variables
                    : DEFAULT_VARIABLES[editForm.category || "custom"] || []
                  ).map((v) => (
                    <button
                      key={v.key}
                      type="button"
                      onClick={() => insertToken(v.key)}
                      className="inline-flex items-center gap-1 rounded-xs border border-border bg-background px-2 py-1 text-sm font-mono text-foreground hover:bg-accent-2 transition-colors cursor-pointer"
                      title={v.description}
                    >
                      <span>{`{{${v.key}}}`}</span>
                      {copiedKey === v.key ? (
                        <Check className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <Plus className="h-3 w-3 text-accent-5" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* HTML Code Editor with Starter Layout Switcher */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                    <FileCode2 className="h-4 w-4 text-accent-6" />
                    <span>HTML Template Content *</span>
                  </Label>

                  {/* Starter Templates Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <button
                          type="button"
                          className="text-sm text-accent-5 hover:text-foreground underline cursor-pointer"
                        >
                          Load Starter HTML Template
                        </button>
                      }
                    />
                    <DropdownMenuContent align="end" className="w-56">
                      {STARTER_TEMPLATES.map((starter) => (
                        <DropdownMenuItem
                          key={starter.name}
                          onClick={() => loadStarterTemplate(starter.body)}
                        >
                          <span>{starter.name}</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <Textarea
                  value={editForm.body}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, body: e.target.value }))}
                  rows={14}
                  placeholder="<!DOCTYPE html><html><body>...write email HTML with {{tokens}}...</body></html>"
                  className="font-mono text-sm leading-relaxed bg-zinc-950 border-zinc-800 text-zinc-100"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between">
                <div>
                  {isCreatingNew && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setIsCreatingNew(false);
                        if (templates.length > 0) handleSelectTemplate(templates[0]);
                      }}
                      className="text-sm"
                    >
                      Cancel
                    </Button>
                  )}
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveTemplate}
                  disabled={isSaving}
                  className="gap-1.5 text-sm font-medium"
                >
                  <Check className="h-4 w-4" />
                  <span>{isSaving ? "Saving..." : isCreatingNew ? "Create Template" : "Save Changes"}</span>
                </Button>
              </div>
            </div>
          )}

          {/* TAB 2: LIVE HTML PREVIEW */}
          {activeTab === "preview" && (
            <div className="p-5 space-y-4">
              <div className="rounded-sm border border-border bg-accent-1/50 p-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-foreground">
                  <span className="text-accent-5 font-normal">Subject:</span> {editForm.subject || "No Subject"}
                </p>
                <span className="text-sm text-emerald-400 flex items-center gap-1">
                  <Check className="h-3 w-3" /> Live HTML Render
                </span>
              </div>

              <div className="rounded-sm border border-border overflow-hidden bg-black shadow-inner">
                <iframe
                  title="Live Email Preview"
                  srcDoc={livePreviewHtml}
                  className="w-full h-[520px] border-0 bg-black"
                />
              </div>
            </div>
          )}

          {/* TAB 3: TEST DISPATCH */}
          {activeTab === "test" && (
            <div className="p-5 space-y-5 max-w-xl">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-foreground">Recipient Email Address *</Label>
                <Input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="text-sm"
                />
              </div>

              {/* Sample Variables */}
              <div className="space-y-2.5 border-t border-border pt-4">
                <Label className="text-sm font-semibold text-foreground">Custom Variable Values</Label>
                <div className="space-y-2">
                  {(editForm.variables || DEFAULT_VARIABLES[editForm.category || "custom"] || []).map((v) => (
                    <div key={v.key} className="grid grid-cols-3 items-center gap-2">
                      <span className="text-sm font-mono text-accent-5 truncate">{`{{${v.key}}}`}</span>
                      <Input
                        value={testVariables[v.key] || ""}
                        onChange={(e) =>
                          setTestVariables((prev) => ({ ...prev, [v.key]: e.target.value }))
                        }
                        placeholder={v.description}
                        className="col-span-2 h-8 text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSendTest}
                  disabled={isSendingTest}
                  className="gap-1.5 text-sm font-medium"
                >
                  <Send className="h-4 w-4" />
                  <span>{isSendingTest ? "Sending Test Email..." : "Dispatch Test Email"}</span>
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
