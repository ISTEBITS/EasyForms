import { useState, useCallback, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  Eye,
  Save,
  Share2,
  Settings as SettingsIcon,
  ChevronLeft,
  Plus,
  Monitor,
  Smartphone,
  Download,
  Loader,
  Palette,
  Layers,
  LayoutGrid,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { QuestionTypesPanel } from "../form-editor/QuestionTypesPanel";
import { QuestionCard } from "../form-editor/QuestionCard";
import { FormPreview } from "@/components/form-preview";
import { SettingsContent } from "../form-editor/SettingsContent";
import { DesignPanel } from "../form-editor/DesignPanel";
import { CodePanel } from "../form-editor/CodePanel";
import { SdkPanel } from "../form-editor/SdkPanel";
import { MarkdownEditor } from "./MarkdownEditor";
import { useForms } from "@/hooks/useForms";
import { uploadFile } from "@/api";
import { useAuth } from "@/context/auth";
import type { Form, Question, QuestionType, FormTheme } from "@/types/form";
import { DEFAULT_QUESTION } from "@/types/form";
import { generateId } from "@/utils/id";
import { toast } from "sonner";

interface FormEditorProps {
  form: Form;
  onBack: () => void;
}

const formatSlugTyping = (value: string) =>
  value
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-");

const cleanSlug = (value: string) =>
  formatSlugTyping(value).replace(/^-+|-+$/g, "");

const ensureUniqueSlug = (
  desiredSlug: string | undefined,
  allForms: Form[],
  currentFormId: string,
) => {
  const normalized = cleanSlug(desiredSlug || "");
  if (!normalized) return undefined;

  const usedSlugs = new Set(
    allForms
      .filter((item) => (item._id || item.id) !== currentFormId)
      .map((item) => cleanSlug(item.slug || ""))
      .filter(Boolean),
  );

  if (!usedSlugs.has(normalized)) return normalized;

  let suffix = 1;
  let candidate = `${normalized}-${suffix}`;
  while (usedSlugs.has(candidate)) {
    suffix += 1;
    candidate = `${normalized}-${suffix}`;
  }
  return candidate;
};

export function FormEditor({ form: initialForm, onBack }: FormEditorProps) {
  const [form, setForm] = useState<Form>(initialForm);
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  const [activeLeftTab, setActiveLeftTab] = useState<
    "fields" | "settings" | "code" | "sdk"
  >("fields");
  const [showRightDesign, setShowRightDesign] = useState(true);
  const [showShareDialog, setShowShareDialog] = useState(false);

  // Mobile Sheet States
  const [mobileSheet, setMobileSheet] = useState<
    "fields" | "settings" | "design" | "code" | null
  >(null);

  const [previewMode, setPreviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isQrGenerating, setIsQrGenerating] = useState(false);
  const [isThemeAssetUploading, setIsThemeAssetUploading] = useState(false);
  const [devicePreview, setDevicePreview] = useState<"desktop" | "mobile">(
    "desktop",
  );
  const { forms, updateForm } = useForms();
  const { user } = useAuth();
  const isTestUser = user?.role === "test_user";
  const isViewer = initialForm.currentUserAccess ? !initialForm.currentUserAccess.canEdit : false;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 120,
        tolerance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const updateFormState = useCallback(
    (updater: (prev: Form) => Form) => {
      if (isViewer) return;
      setForm((prev) => {
        const next = updater(prev);
        setIsDirty(true);
        return next;
      });
    },
    [isViewer],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        updateFormState((prev) => {
          const oldIndex = prev.questions.findIndex((q) => q.id === active.id);
          const newIndex = prev.questions.findIndex((q) => q.id === over.id);
          return {
            ...prev,
            questions: arrayMove(prev.questions, oldIndex, newIndex),
          };
        });
      }
    },
    [updateFormState],
  );

  const handleAddQuestion = useCallback(
    (type: QuestionType) => {
      if (isTestUser && type === "file_upload") {
        toast.error("Test users cannot add file upload fields");
        return;
      }
      const questionId = generateId();
      updateFormState((prev) => {
        const sectionCount = prev.questions.filter(
          (q) => q.type === "section_break",
        ).length;
        const newQuestion: Question = {
          ...DEFAULT_QUESTION,
          id: questionId,
          type,
          title:
            type === "section_break"
              ? `Section ${sectionCount + 1}`
              : `Untitled ${type.replace(/_/g, " ")} question`,
          required:
            type === "section_break" ? false : DEFAULT_QUESTION.required,
        };
        if (type === "rating") newQuestion.maxRating = 5;
        if (type === "multiple_choice_grid") {
          newQuestion.gridRows = ["Row 1", "Row 2", "Row 3"];
          newQuestion.options = [
            { id: generateId(), label: "Column 1", value: "Column 1" },
            { id: generateId(), label: "Column 2", value: "Column 2" },
            { id: generateId(), label: "Column 3", value: "Column 3" },
          ];
        }

        return {
          ...prev,
          questions: [...prev.questions, newQuestion],
        };
      });
      setActiveQuestionId(questionId);
      toast.success("Question added");
      setMobileSheet(null);
    },
    [isTestUser, updateFormState],
  );

  const handleUpdateQuestion = useCallback(
    (questionId: string, updates: Partial<Question>) => {
      updateFormState((prev) => ({
        ...prev,
        questions: prev.questions.map((q) =>
          q.id === questionId ? { ...q, ...updates } : q,
        ),
      }));
    },
    [updateFormState],
  );

  const handleDeleteQuestion = useCallback(
    (questionId: string) => {
      updateFormState((prev) => ({
        ...prev,
        questions: prev.questions.filter((q) => q.id !== questionId),
      }));
      if (activeQuestionId === questionId) setActiveQuestionId(null);
      toast.success("Question removed");
    },
    [activeQuestionId, updateFormState],
  );

  const handleDuplicateQuestion = useCallback(
    (questionId: string) => {
      updateFormState((prev) => {
        const question = prev.questions.find((q) => q.id === questionId);
        if (!question) return prev;
        const newQuestion: Question = {
          ...question,
          id: generateId(),
          title: `${question.title} (Copy)`,
        };
        const index = prev.questions.findIndex((q) => q.id === questionId);
        const newQuestions = [...prev.questions];
        newQuestions.splice(index + 1, 0, newQuestion);
        return { ...prev, questions: newQuestions };
      });
      toast.success("Question duplicated");
    },
    [updateFormState],
  );

  const handleUpdateSettings = useCallback(
    (updates: Partial<Form["settings"]>) => {
      updateFormState((prev) => ({
        ...prev,
        settings: {
          ...prev.settings,
          ...updates,
          theme: {
            ...prev.settings.theme,
            ...(updates.theme || {}),
          },
        },
      }));
    },
    [updateFormState],
  );

  const handleUpdateTheme = useCallback(
    (updates: Partial<FormTheme>) => {
      updateFormState((prev) => ({
        ...prev,
        settings: {
          ...prev.settings,
          theme: {
            ...prev.settings.theme,
            ...updates,
          },
        },
      }));
    },
    [updateFormState],
  );

  const handleUploadThemeAsset = useCallback(
    async (target: "logoUrl" | "bannerUrl", file: File) => {
      if (isThemeAssetUploading) return;
      setIsThemeAssetUploading(true);
      try {
        const uploaded = await uploadFile(file);
        updateFormState((prev) => ({
          ...prev,
          settings: {
            ...prev.settings,
            theme: {
              ...prev.settings.theme,
              [target]: uploaded.url,
              ...(target === "bannerUrl"
                ? {
                  backgroundImageUrl: uploaded.url,
                  bannerPositionX:
                    typeof prev.settings.theme.bannerPositionX === "number"
                      ? prev.settings.theme.bannerPositionX
                      : 50,
                  bannerPositionY:
                    typeof prev.settings.theme.bannerPositionY === "number"
                      ? prev.settings.theme.bannerPositionY
                      : 50,
                }
                : {}),
            },
          },
        }));
        toast.success(
          target === "logoUrl"
            ? "Logo uploaded successfully"
            : "Banner uploaded successfully",
        );
      } catch {
        toast.error("Failed to upload image");
      } finally {
        setIsThemeAssetUploading(false);
      }
    },
    [isThemeAssetUploading, isTestUser, updateFormState],
  );

  const handleSave = useCallback(async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const formId = form._id || form.id;
      const uniqueSlug = ensureUniqueSlug(form.slug, forms, formId);
      if ((form.slug || "") !== (uniqueSlug || "")) {
        toast.info(`Slug is already used. Updated to "${uniqueSlug}"`);
      }
      const nextForm = isTestUser
        ? {
          ...form,
          slug: uniqueSlug,
          settings: {
            ...form.settings,
            emailNotification: {
              ...form.settings.emailNotification,
              enabled: false,
            },
            theme: {
              ...form.settings.theme,
              logoUrl: "/logo.svg",
              bannerUrl: "/default-banner.svg",
              backgroundImageUrl: "/default-banner.svg",
            },
          },
        }
        : {
          ...form,
          slug: uniqueSlug,
        };

      await updateForm(formId, nextForm);
      setIsDirty(false);
      toast.success("Form saved successfully");
    } catch {
      toast.error("Failed to save form");
    } finally {
      setIsSaving(false);
    }
  }, [form, forms, updateForm, isSaving, isTestUser]);

  // Keyboard Shortcuts listener (Cmd+S / Ctrl+S to Save, Cmd+P / Ctrl+P to Preview)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "p") {
        e.preventDefault();
        setPreviewMode((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave]);

  const shareUrl = `${window.location.origin}/form/${form.slug || form._id || form.id}`;

  const handleDownloadQrCode = useCallback(async () => {
    if (isQrGenerating) return;
    setIsQrGenerating(true);
    try {
      const qrImageUrl = `https://quickchart.io/qr?text=${encodeURIComponent(shareUrl)}&size=1024&margin=2&format=png`;
      const response = await fetch(qrImageUrl);
      if (!response.ok) throw new Error("Failed to generate QR code");

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const safeTitle = form.title
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      const filename = `${safeTitle || "form"}-qr-code.png`;

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);

      toast.success("QR code downloaded");
    } catch {
      toast.error("Failed to download QR code");
    } finally {
      setIsQrGenerating(false);
    }
  }, [shareUrl, form.title, isQrGenerating]);

  // Real-time canvas inline background style
  const canvasBgStyle = form.settings.theme.backgroundImageUrl
    ? {
      backgroundImage: `url(${form.settings.theme.backgroundImageUrl})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    }
    : form.settings.theme.backgroundColor &&
      form.settings.theme.backgroundColor !== "#ffffff" &&
      form.settings.theme.backgroundColor !== "#fafafa" &&
      form.settings.theme.backgroundColor !== ""
    ? {
      backgroundColor: form.settings.theme.backgroundColor,
    }
    : undefined;

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full flex-col overflow-hidden bg-background text-foreground font-sans pb-14 lg:pb-0 relative">
      {/* Responsive Top Navbar Header */}
      <header className="sticky top-0 z-30 shrink-0 border-b border-border bg-background/80 backdrop-blur-md px-2">
        <div className="flex h-14 items-center justify-between gap-2 sm:gap-4">
          {/* Left Side: Back Button & Form Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="h-8 w-8 text-accent-5 hover:bg-accent-1 hover:text-foreground flex-shrink-0 bg-accent-2"
              title="Back to Forms"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="h-4 w-px bg-border flex-shrink-0 hidden sm:block" />

            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Input
                value={form.title}
                disabled={isViewer}
                onChange={(e) =>
                  updateFormState((prev) => ({ ...prev, title: e.target.value }))
                }
                className="h-8 border-0 border-b border-transparent bg-transparent px-1 font-semibold text-xs sm:text-base text-foreground hover:border-border focus:border-accent-8 focus:ring-0 placeholder:text-accent-4 max-w-sm truncate disabled:opacity-80"
                placeholder="Untitled Form"
              />

              {/* View Only Badge for Viewers */}
              {isViewer ? (
                <span className="inline-flex items-center gap-1 rounded-sm border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-500 font-sans shrink-0">
                  <Eye className="h-3 w-3" />
                  <span>View only</span>
                </span>
              ) : (
                /* Status Indicator */
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent-1/60 border border-border text-xs font-mono text-accent-5 flex-shrink-0">
                  <div
                    className={`h-2 w-2 rounded-full ${isSaving
                        ? "bg-accent-4 animate-pulse"
                        : isDirty
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      }`}
                  />
                  <span>
                    {isSaving ? "Saving..." : isDirty ? "Unsaved" : "Saved"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Actions Bar */}
          <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
            {/* Publish Toggle */}
            <div className="flex items-center gap-1.5 rounded-xs border border-border bg-accent-1/50 px-2 py-1">
              <div
                className={`h-2 w-2 rounded-full ${form.isPublished ? "bg-green-900" : "bg-red-900"
                  }`}
              />
              <span className="hidden sm:inline text-xs font-medium text-accent-6">
                {form.isPublished ? "Published" : "Draft"}
              </span>
              <Switch
                checked={form.isPublished}
                disabled={isViewer}
                onCheckedChange={(checked) =>
                  updateFormState((prev) => ({ ...prev, isPublished: checked }))
                }
                className="scale-75 bg-gray-100"
              />
            </div>

            {/* Toggle Design Inspector Panel (Desktop) */}
            <Button
              variant={showRightDesign ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setShowRightDesign(!showRightDesign)}
              className="h-8 rounded-xs text-xs font-medium px-2.5 hidden lg:flex"
              title="Toggle Live Design Panel"
            >
              <Palette className="h-3.5 w-3.5 sm:mr-1 text-geist-success" />
              <span>Design</span>
            </Button>

            {/* Share Button */}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowShareDialog(true)}
              className="h-8 rounded-xs text-xs font-medium px-2.5 sm:px-3"
            >
              <Share2 className="h-3.5 w-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">Share</span>
            </Button>

            {/* Edit / Preview Mode (Desktop) */}
            <div className="hidden lg:flex items-center rounded-xs bg-accent-1 border border-border p-0.5">
              <button
                type="button"
                onClick={() => setPreviewMode(false)}
                className={`px-2.5 py-1 rounded-xs text-xs font-medium transition-geist duration-150 flex items-center gap-1.5 ${!previewMode
                    ? "bg-accent-2 text-foreground shadow-xs"
                    : "text-accent-5 hover:text-foreground"
                  }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>Edit</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode(true)}
                className={`px-2.5 py-1 rounded-xs text-xs font-medium transition-geist duration-150 flex items-center gap-1.5 ${previewMode
                    ? "bg-accent-2 text-foreground shadow-xs"
                    : "text-accent-5 hover:text-foreground"
                  }`}
              >
                <Eye className="h-3.5 w-3.5" />
                <span>Preview</span>
              </button>
            </div>

            {/* Save Button */}
            {!isViewer && (
              <Button
                onClick={handleSave}
                size="sm"
                disabled={isSaving}
                variant="default"
                className="h-8 rounded-xs font-medium text-xs px-2.5 sm:px-4"
              >
                {isSaving ? (
                  <>
                    <Loader className="h-3.5 w-3.5 sm:mr-1.5 animate-spin" />
                    <span className="hidden sm:inline">Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5 sm:mr-1.5" />
                    <span className="hidden sm:inline">Save</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* RESPONSIVE STUDIO LAYOUT */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* LEFT COLUMN PANEL (Desktop 30% Width): Fields | Settings | Code | SDK */}
        <div className="hidden lg:flex w-full lg:w-[30%] flex-shrink-0 border-r border-border bg-background flex-col h-full overflow-hidden">
          {/* Left Panel Tabs Header */}
          <div className="relative border-b border-border bg-accent-1/30 px-3 pt-2 flex items-center gap-4 overflow-x-auto hide-scrollbar">
            <button
              type="button"
              onClick={() => setActiveLeftTab("fields")}
              className={`pb-2.5 text-xs font-semibold transition-geist duration-150 relative flex items-center gap-1 flex-shrink-0 ${activeLeftTab === "fields"
                  ? "text-foreground"
                  : "text-accent-5 hover:text-foreground"
                }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Fields
              {activeLeftTab === "fields" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-geist-success rounded-t-sm" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveLeftTab("settings")}
              className={`pb-2.5 text-xs font-semibold transition-geist duration-150 relative flex items-center gap-1 flex-shrink-0 ${activeLeftTab === "settings"
                  ? "text-foreground"
                  : "text-accent-5 hover:text-foreground"
                }`}
            >
              <SettingsIcon className="h-3.5 w-3.5" />
              Settings
              {activeLeftTab === "settings" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-geist-success rounded-t-sm" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveLeftTab("sdk")}
              className={`pb-2.5 text-xs font-semibold transition-geist duration-150 relative flex items-center gap-1 flex-shrink-0 ${activeLeftTab === "sdk"
                  ? "text-foreground"
                  : "text-accent-5 hover:text-foreground"
                }`}
            >
              <Layers className="h-3.5 w-3.5" />
              SDK
              {activeLeftTab === "sdk" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-geist-success rounded-t-sm" />
              )}
            </button>
          </div>

          {/* Scrollable Content for Left Panel */}
          <div className="flex-1 overflow-y-auto hide-scrollbar">
            {activeLeftTab === "fields" && (
              <QuestionTypesPanel
                onAddQuestion={handleAddQuestion}
                disabledTypes={isTestUser ? ["file_upload"] : []}
                disabledReason="Test users cannot use file upload fields"
              />
            )}

            {activeLeftTab === "settings" && (
              <SettingsContent
                form={form}
                isTestUser={isTestUser}
                onUpdateSettings={handleUpdateSettings}
                onSlugChange={(value) =>
                  updateFormState((prev) => ({
                    ...prev,
                    slug: formatSlugTyping(value),
                  }))
                }
                onSlugBlur={() =>
                  updateFormState((prev) => {
                    const formId = prev._id || prev.id;
                    const uniqueSlug = ensureUniqueSlug(
                      prev.slug,
                      forms,
                      formId,
                    );
                    if ((prev.slug || "") !== (uniqueSlug || "")) {
                      toast.info(
                        `Slug is already used. Updated to "${uniqueSlug}"`,
                      );
                    }
                    return {
                      ...prev,
                      slug: uniqueSlug,
                    };
                  })
                }
                onUploadThemeAsset={handleUploadThemeAsset}
                isThemeAssetUploading={isThemeAssetUploading}
              />
            )}

            {activeLeftTab === "sdk" && <SdkPanel form={form} />}
          </div>
        </div>

        {/* CENTER CANVAS PANEL (Direct Live View on Mobile & Desktop) */}
        <div
          className={`flex-1 bg-background hide-scrollbar overflow-y-auto p-3 sm:p-4 flex flex-col transition-all duration-200 ${showRightDesign ? "lg:w-[45%]" : "lg:w-[70%]"
            }`}
          style={canvasBgStyle}
        >
          {previewMode ? (
            /* PREVIEW MODE CONTAINER */
            <div className="w-full flex flex-col items-center">
              <div className="flex items-center justify-center gap-2 mb-6">
                <div className="flex bg-accent-1/80 backdrop-blur-md rounded-xs p-1 border border-border">
                  <button
                    onClick={() => setDevicePreview("desktop")}
                    className={`px-3 py-1.5 rounded-xs transition-geist duration-150 text-xs font-medium flex items-center gap-1.5 ${devicePreview === "desktop"
                        ? "bg-accent-2 text-foreground shadow-xs"
                        : "text-accent-5 hover:text-foreground"
                      }`}
                  >
                    <Monitor className="h-3.5 w-3.5" />
                    <span>Desktop</span>
                  </button>
                  <button
                    onClick={() => setDevicePreview("mobile")}
                    className={`px-3 py-1.5 rounded-xs transition-geist duration-150 text-xs font-medium flex items-center gap-1.5 ${devicePreview === "mobile"
                        ? "bg-accent-2 text-foreground shadow-xs"
                        : "text-accent-5 hover:text-foreground"
                      }`}
                  >
                    <Smartphone className="h-3.5 w-3.5" />
                    <span>Mobile</span>
                  </button>
                </div>
              </div>

              <div
                className={`w-full transition-all duration-300 ${devicePreview === "mobile" ? "max-w-[375px]" : "max-w-2xl"
                  }`}
              >
                <div className="overflow-x-hidden p-2 sm:p-4">
                  <FormPreview form={form} previewDevice={devicePreview} />
                </div>
              </div>
            </div>
          ) : (
            /* LIVE CANVAS CONTAINER */
            <div className="max-w-2xl mx-auto w-full space-y-4 sm:space-y-6">
              {/* Form Title & Intro Description Card */}
              <div className="rounded-xs border border-border bg-background p-4 sm:p-6 space-y-4 shadow-sm transition-geist duration-150 hover:border-accent-7">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-accent-5">
                    Form Title
                  </Label>
                  <Input
                    value={form.title}
                    onChange={(e) =>
                      updateFormState((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder="Enter form title..."
                    className="text-base sm:text-lg font-bold border-0 border-b border-transparent bg-transparent px-0 text-foreground hover:border-border focus:border-accent-8 focus:ring-0 placeholder:text-accent-4"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-accent-5">
                    Form Description 
                  </Label>
                  <MarkdownEditor
                    value={form.description || ""}
                    onChange={(description) =>
                      updateFormState((prev) => ({ ...prev, description }))
                    }
                    placeholder="Write form intro using Markdown..."
                    minHeight="min-h-[80px]"
                    rows={3}
                  />
                </div>
              </div>

              {/* Questions Canvas List */}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={form.questions.map((q) => q.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3 sm:space-y-4">
                    {form.questions.map((question) => (
                      <QuestionCard
                        key={question.id}
                        question={question}
                        allQuestions={form.questions}
                        isActive={activeQuestionId === question.id}
                        onClick={() => setActiveQuestionId(question.id)}
                        onUpdate={(updates) =>
                          handleUpdateQuestion(question.id, updates)
                        }
                        onDelete={() => handleDeleteQuestion(question.id)}
                        onDuplicate={() =>
                          handleDuplicateQuestion(question.id)
                        }
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              {/* Empty Canvas State */}
              {form.questions.length === 0 && (
                <div className="text-center py-12 px-4 bg-accent-1/60 border border-dashed border-border rounded-xs backdrop-blur-xs">
                  <div className="w-10 h-10 mx-auto mb-2 rounded-xs bg-accent-1 border border-border flex items-center justify-center">
                    <Plus className="h-5 w-5 text-accent-4" />
                  </div>
                  <p className="text-xs font-medium text-foreground mb-1">
                    Start building your form
                  </p>
                  <p className="text-xs text-accent-5 max-w-sm mx-auto">
                    Tap &quot;+ Fields&quot; on the bottom dock to add questions.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN PANEL (Desktop Design Panel 25%) */}
        {showRightDesign && (
          <div className="hidden lg:flex w-full lg:w-[25%] flex-shrink-0 border-l border-border bg-background flex-col h-full overflow-hidden hide-scrollbar">
            <DesignPanel
              theme={form.settings.theme}
              onUpdateTheme={handleUpdateTheme}
              onUploadThemeAsset={handleUploadThemeAsset}
              isUploading={isThemeAssetUploading}
              isTestUser={isTestUser}
            />
          </div>
        )}
      </main>

      {/* MOBILE FLOATING BOTTOM NAVIGATION DOCK (lg:hidden) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-border p-2 grid grid-cols-5 gap-1.5 shadow-lg safe-area-pb">
        <button
          type="button"
          onClick={() => setMobileSheet("fields")}
          className={`flex flex-col items-center justify-center py-2 px-1 rounded-sm transition-all text-xs font-medium ${mobileSheet === "fields"
              ? "bg-accent-2 text-foreground font-semibold border border-border"
              : "text-accent-5 hover:text-foreground border border-transparent hover:bg-accent-1"
            }`}
        >
          <Plus className="h-4.5 w-4.5 text-geist-success mb-1" />
          <span className="leading-tight">Fields</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileSheet("settings")}
          className={`flex flex-col items-center justify-center py-2 px-1 rounded-sm transition-all text-xs font-medium ${mobileSheet === "settings"
              ? "bg-accent-2 text-foreground font-semibold border border-border"
              : "text-accent-5 hover:text-foreground border border-transparent hover:bg-accent-1"
            }`}
        >
          <SettingsIcon className="h-4.5 w-4.5 mb-1" />
          <span className="leading-tight">Settings</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileSheet("design")}
          className={`flex flex-col items-center justify-center py-2 px-1 rounded-sm transition-all text-xs font-medium ${mobileSheet === "design"
              ? "bg-accent-2 text-foreground font-semibold border border-border"
              : "text-accent-5 hover:text-foreground border border-transparent hover:bg-accent-1"
            }`}
        >
          <Palette className="h-4.5 w-4.5 text-accent-6 mb-1" />
          <span className="leading-tight">Design</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileSheet("code")}
          className={`flex flex-col items-center justify-center py-2 px-1 rounded-sm transition-all text-xs font-medium ${mobileSheet === "code"
              ? "bg-accent-2 text-foreground font-semibold border border-border"
              : "text-accent-5 hover:text-foreground border border-transparent hover:bg-accent-1"
            }`}
        >
          <Layers className="h-4.5 w-4.5 mb-1" />
          <span className="leading-tight">Code</span>
        </button>

        <button
          type="button"
          onClick={() => setPreviewMode(!previewMode)}
          className={`flex flex-col items-center justify-center py-2 px-1 rounded-sm transition-all text-xs font-medium ${previewMode
              ? "bg-accent-2 text-foreground font-semibold border border-border"
              : "text-accent-5 hover:text-foreground border border-transparent hover:bg-accent-1"
            }`}
        >
          <Eye className="h-4.5 w-4.5 mb-1 text-accent-6" />
          <span className="leading-tight">{previewMode ? "Edit" : "Preview"}</span>
        </button>
      </div>

      {/* MOBILE BOTTOM SHEETS FOR INSPECTORS */}
      {/* 1. Fields Sheet */}
      <Sheet
        open={mobileSheet === "fields"}
        onOpenChange={(open) => !open && setMobileSheet(null)}
      >
        <SheetContent
          side="bottom"
          className="h-[75vh] max-h-[80vh] bg-background border-border p-0 rounded-t-lg flex flex-col"
        >
          <div className="p-4 flex flex-col h-full overflow-hidden">
            <SheetHeader className="mb-3 text-left">
              <SheetTitle className="text-sm font-bold text-foreground">
                Select Field to Add
              </SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto">
              <QuestionTypesPanel
                onAddQuestion={handleAddQuestion}
                disabledTypes={isTestUser ? ["file_upload"] : []}
                disabledReason="Test users cannot use file upload fields"
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* 2. Settings Sheet */}
      <Sheet
        open={mobileSheet === "settings"}
        onOpenChange={(open) => !open && setMobileSheet(null)}
      >
        <SheetContent
          side="bottom"
          className="h-[80vh] max-h-[85vh] bg-background border-border p-0 rounded-t-lg flex flex-col"
        >
          <div className="p-4 flex flex-col h-full overflow-hidden">
            <SheetHeader className="mb-3 text-left">
              <SheetTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <SettingsIcon className="h-4 w-4 text-accent-7" />
                Form Settings
              </SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto">
              <SettingsContent
                form={form}
                isTestUser={isTestUser}
                onUpdateSettings={handleUpdateSettings}
                onSlugChange={(value) =>
                  updateFormState((prev) => ({
                    ...prev,
                    slug: formatSlugTyping(value),
                  }))
                }
                onSlugBlur={() =>
                  updateFormState((prev) => {
                    const formId = prev._id || prev.id;
                    const uniqueSlug = ensureUniqueSlug(
                      prev.slug,
                      forms,
                      formId,
                    );
                    return {
                      ...prev,
                      slug: uniqueSlug,
                    };
                  })
                }
                onUploadThemeAsset={handleUploadThemeAsset}
                isThemeAssetUploading={isThemeAssetUploading}
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* 3. Design Theme Sheet */}
      <Sheet
        open={mobileSheet === "design"}
        onOpenChange={(open) => !open && setMobileSheet(null)}
      >
        <SheetContent
          side="bottom"
          className="h-[80vh] max-h-[85vh] bg-background border-border p-0 rounded-t-lg flex flex-col"
        >
          <div className="p-4 flex flex-col h-full overflow-hidden">
            <SheetHeader className="mb-3 text-left">
              <SheetTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <Palette className="h-4 w-4 text-geist-success" />
                Live Theme Inspector
              </SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto">
              <DesignPanel
                theme={form.settings.theme}
                onUpdateTheme={handleUpdateTheme}
                onUploadThemeAsset={handleUploadThemeAsset}
                isUploading={isThemeAssetUploading}
                isTestUser={isTestUser}
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* 4. Code & SDK Sheet */}
      <Sheet
        open={mobileSheet === "code"}
        onOpenChange={(open) => !open && setMobileSheet(null)}
      >
        <SheetContent
          side="bottom"
          className="h-[80vh] max-h-[85vh] bg-background border-border p-0 rounded-t-lg flex flex-col"
        >
          <div className="p-4 flex flex-col h-full overflow-hidden">
            <SheetHeader className="mb-3 text-left">
              <SheetTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <Layers className="h-4 w-4 text-geist-success" />
                Code & SDK Integration
              </SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto space-y-6">
              <CodePanel form={form} />
              <div className="border-t border-border pt-4">
                <SdkPanel form={form} />
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent
          showCloseButton
          className="bg-background border-border text-foreground max-w-[90vw] sm:max-w-md rounded-xs"
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Share2 className="h-4 w-4 text-accent-7" />
              Share Form
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-3">
  
            <div className="p-3 rounded-xs bg-accent-1/60 border border-border flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div
                    className={`h-2 w-2 rounded-full ${form.isPublished ? "bg-green-900" : "bg-red-900"
                      }`}
                  />
                  <span className="text-xs font-medium text-foreground">
                    {form.isPublished ? "Published & Live" : "Draft (Private)"}
                  </span>
                </div>
                <p className="text-xs text-accent-5 mt-0.5">
                  {form.isPublished
                    ? "Form accepts responses at public link"
                    : "Publish form to accept public submissions"}
                </p>
              </div>
              <Switch
                checked={form.isPublished}
                onCheckedChange={(checked) =>
                  updateFormState((prev) => ({ ...prev, isPublished: checked }))
                }
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="secondary"
                className="rounded-xs flex-1 text-sm"
                onClick={() => window.open(shareUrl, "_blank")}
              >
                <Eye className="h-3.5 w-3.5 mr-1.5" />
                Open Form
              </Button>
              <Button
                variant="secondary"
                className="rounded-xs flex-1 text-xs"
                onClick={handleDownloadQrCode}
                disabled={isQrGenerating}
              >
                {isQrGenerating ? (
                  <Loader className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                )}
                QR Code
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
