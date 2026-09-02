import { useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Shield,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { checkSubmissionStatus } from "@/api";
import {
  validateFormAnswers,
  validateSubmissionPayload,
} from "@/lib/form-validation";
import type { Answer } from "@/types/form";
import { GoogleVerification } from "@/components/form-builder/GoogleVerification";
import { PreviewHeader } from "../form-preview/PreviewHeader";
import { QuestionPreview } from "../form-preview/QuestionPreview";
import {
  AlreadyRespondedState,
  SubmittedState,
} from "../form-preview/SubmissionStates";
import type { FormPreviewProps } from "../form-preview/types";
import { buildPages, getPreviewClasses } from "../form-preview/utils";

export function FormPreview({
  form,
  previewDevice = "auto",
  onSubmit,
}: FormPreviewProps) {
  const [answers, setAnswers] = useState<Record<string, Answer["value"]>>({});
  const [submitted, setSubmitted] = useState(false);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [displayEmail, setDisplayEmail] = useState<string | null>(null);
  const [alreadyResponded, setAlreadyResponded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [verificationResetKey, setVerificationResetKey] = useState(0);
  const nextNavigationGuardUntilRef = useRef(0);

  const pages = useMemo(() => buildPages(form.questions), [form.questions]);
  const activePage = pages[activePageIndex] || { id: "page-1", questions: [] };
  const answerableQuestions = form.questions.filter(
    (q) => q.type !== "section_break",
  );
  const answeredCount = answerableQuestions.filter((q) => {
    const value = answers[q.id];
    return !(
      value === undefined ||
      value === null ||
      value === "" ||
      (Array.isArray(value) && value.length === 0)
    );
  }).length;

  const progress =
    answerableQuestions.length > 0
      ? (answeredCount / answerableQuestions.length) * 100
      : 0;
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

  const {
    previewShellClass,
    bannerHeightClass,
    headerPaddingClass,
  } = getPreviewClasses(previewDevice);

  const handleVerification = async (token: string, email: string) => {
    try {
      const hasSubmitted = await checkSubmissionStatus(form.id, email);
      if (hasSubmitted && !form.settings.allowMultipleResponses) {
        setAlreadyResponded(true);
      } else {
        setGoogleToken(token);
        setDisplayEmail(email);
        toast.success("Identity verified", {
          icon: <Shield className="h-4 w-4" />,
        });
      }
    } catch {
      toast.error("Unable to verify submission status");
    }
  };

  const handleAnswerChange = (questionId: string, value: Answer["value"]) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSwitchAccount = () => {
    setGoogleToken(null);
    setDisplayEmail(null);
    setAlreadyResponded(false);
    setVerificationResetKey((prev) => prev + 1);
  };

  const validateQuestions = (questionIds: string[]) => {
    const scopedValidation = validateFormAnswers(form, answers, questionIds);
    if (scopedValidation.isValid) return true;

    const firstIssue = scopedValidation.issues[0];
    if (firstIssue) {
      toast.error(`${firstIssue.questionTitle}: ${firstIssue.message}`, {
        icon: <AlertCircle className="h-4 w-4" />,
      });
    }

    return false;
  };

  const handleNextPage = () => {
    if (!validateQuestions(activePage.questions.map((q) => q.id))) return;
    nextNavigationGuardUntilRef.current = Date.now() + 500;
    setActivePageIndex((prev) => Math.min(prev + 1, pages.length - 1));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;
    if (Date.now() < nextNavigationGuardUntilRef.current) return;
    if (activePageIndex < pages.length - 1) {
      handleNextPage();
      return;
    }

    const validation = validateSubmissionPayload(form, answers, googleToken);
    if (!validation.isValid) {
      const firstIssue = validation.issues[0];
      if (firstIssue) {
        toast.error(`${firstIssue.questionTitle}: ${firstIssue.message}`, {
          icon: <AlertCircle className="h-4 w-4" />,
        });
      }
      return;
    }

    try {
      setIsSubmitting(true);
      if (onSubmit) {
        await onSubmit(answers, googleToken ?? undefined);
      }
      setSubmitted(true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to submit response";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <SubmittedState confirmationMessage={form.settings.confirmationMessage} />
    );
  }

  if (alreadyResponded && !form.settings.allowMultipleResponses) {
    return (
      <AlreadyRespondedState
        displayEmail={displayEmail}
        onSwitchAccount={handleSwitchAccount}
      />
    );
  }

  return (
    <div className={`${previewShellClass} font-sans`}>
      <form onSubmit={handleSubmit} className="relative space-y-6">
        {/* Form Header Card */}
        <PreviewHeader
          form={form}
          activePageIndex={activePageIndex}
          pages={pages}
          answers={answers}
          onSelectPage={(index) => setActivePageIndex(index)}
          bannerImageUrl={bannerImageUrl}
          bannerPositionX={bannerPositionX}
          bannerPositionY={bannerPositionY}
          bannerHeightClass={bannerHeightClass}
          headerPaddingClass={headerPaddingClass}
        />

        {/* Real-time Progress Bar */}
        {form.settings.showProgressBar && answerableQuestions.length > 0 && (
          <div className="rounded-md border border-border bg-background p-4 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-sm font-sans text-accent-5">
              <span>Completion Progress</span>
              <span className="font-medium text-foreground">
                {answeredCount} of {answerableQuestions.length} ({Math.round(progress)}%)
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-xs bg-accent-2">
              <div
                className="h-full rounded-sm bg-foreground transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Google Verification if required */}
        {form.settings.limitOneResponse && !googleToken && (
          <GoogleVerification
            key={`google-verification-${verificationResetKey}`}
            onVerified={handleVerification}
          />
        )}

        {googleToken && (
          <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-background p-3.5 shadow-xs font-sans">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border border-border bg-accent-1 text-foreground">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate font-sans">
                  Verified Identity
                </p>
                <p className="text-sm text-accent-5 truncate font-sans">{displayEmail}</p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleSwitchAccount}
              size="xs"
              className="rounded-sm text-sm font-sans shrink-0 h-7 border-border cursor-pointer"
            >
              Switch
            </Button>
          </div>
        )}

        {/* Active Page Header (if titled) */}
        {(activePage.title || activePage.description) && (
          <div className="rounded-md border border-border bg-accent-1/40 p-4 sm:p-5 font-sans">
            {activePage.title && (
              <h3 className="text-base font-semibold text-foreground tracking-tight font-sans">
                {activePage.title}
              </h3>
            )}
            {activePage.description && (
              <p className="mt-1 text-sm text-accent-5 leading-relaxed font-sans">
                {activePage.description}
              </p>
            )}
          </div>
        )}

        {/* Sequential Questions Stack */}
        <div className="space-y-4">
          {activePage.questions.map((question, index) => (
            <QuestionPreview
              key={question.id}
              question={question}
              value={answers[question.id]}
              answers={answers}
              onChange={(value) => handleAnswerChange(question.id, value)}
              index={index + 1}
              previewDevice={previewDevice}
              setUploading={setIsUploading}
              uploading={isUploading}
              googleToken={googleToken}
              requiresVerification={form.settings.limitOneResponse}
            />
          ))}
        </div>

        {/* Bottom Navigation & Action Bar */}
        {answerableQuestions.length > 0 && (
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-border mt-8 font-sans">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setActivePageIndex((prev) => Math.max(prev - 1, 0))
              }
              disabled={activePageIndex === 0 || isSubmitting}
              className="rounded-sm px-4 h-9 text-sm font-medium font-sans border-border cursor-pointer"
            >
              <ChevronLeft className="mr-1 h-3.5 w-3.5" />
              Back
            </Button>

            {activePageIndex < pages.length - 1 ? (
              <Button
                type="button"
                onClick={handleNextPage}
                disabled={isUploading || isSubmitting}
                className="rounded-sm px-5 h-9 text-sm font-medium bg-foreground text-background hover:bg-accent-7 font-sans cursor-pointer"
              >
                <span>Continue</span>
                <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={
                  (form.settings.limitOneResponse && !googleToken) ||
                  isUploading ||
                  isSubmitting
                }
                className="rounded-sm px-5 h-9 text-sm font-medium bg-foreground text-background hover:bg-accent-7 shadow-xs font-sans cursor-pointer"
              >
                {isSubmitting ? (
                  <span className="inline-flex items-center gap-2 font-sans">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Submitting...
                  </span>
                ) : isUploading ? (
                  <span className="inline-flex items-center gap-2 font-sans">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Uploading...
                  </span>
                ) : form.settings.limitOneResponse && !googleToken ? (
                  <span className="inline-flex items-center gap-2 font-sans">
                    <Shield className="h-3.5 w-3.5" />
                    Verify to Submit
                  </span>
                ) : (
                  "Submit Response"
                )}
              </Button>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
