import { useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Loader,
  Shield,
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
    questionGridClass,
  } = getPreviewClasses(previewDevice);

  const handleVerification = async (token: string, email: string) => {
    try {
      const hasSubmitted = await checkSubmissionStatus(form.id, email);
      if (hasSubmitted && !form.settings.allowMultipleResponses) {
        setAlreadyResponded(true);
      } else {
        setGoogleToken(token);
        setDisplayEmail(email);
        toast.success("Authentication successful", {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        error instanceof Error ? error.message : "Failed to submit form";
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
    <div className={previewShellClass}>
      <form onSubmit={handleSubmit} className="relative space-y-6">
        {(form.isTestUserForm || form.owner?.role === "test_user") && (
          <div className="pointer-events-none absolute right-3 top-3 z-30 rounded-sm border border-border bg-accent-1 px-2.5 py-1 text-xs font-mono font-semibold uppercase tracking-wider text-accent-5">
            POWERED BY EASYFORMS
          </div>
        )}

        <PreviewHeader
          form={form}
          activePageIndex={activePageIndex}
          pages={pages}
          bannerImageUrl={bannerImageUrl}
          bannerPositionX={bannerPositionX}
          bannerPositionY={bannerPositionY}
          bannerHeightClass={bannerHeightClass}
          headerPaddingClass={headerPaddingClass}
        />

        {form.settings.showProgressBar && answerableQuestions.length > 0 && (
          <div className="rounded-sm border border-border bg-accent-1/60 p-4">
            <div className="mb-2 flex items-center justify-between text-xs text-accent-5">
              <span>Completion</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-accent-2">
              <div
                className="h-full rounded-full bg-foreground transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {form.settings.limitOneResponse && !googleToken && (
          <GoogleVerification
            key={`google-verification-${verificationResetKey}`}
            onVerified={handleVerification}
          />
        )}

        {googleToken && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-border bg-accent-1 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-sm border border-border bg-accent-1">
                <Shield className="h-4 w-4 text-accent-7" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Identity Verified
                </p>
                <p className="text-xs text-accent-5">{displayEmail}</p>
              </div>
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={handleSwitchAccount}
              size="sm"
            >
              Switch Account
            </Button>
          </div>
        )}

        {(activePage.title || activePage.description) && (
          <div className="rounded-sm border border-border bg-accent-1/60 p-4">
            {activePage.title && (
              <h3 className="text-base font-semibold text-foreground">
                {activePage.title}
              </h3>
            )}
            {activePage.description && (
              <p className="mt-1 text-sm text-accent-5">
                {activePage.description}
              </p>
            )}
          </div>
        )}

        <div className={questionGridClass}>
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

        {answerableQuestions.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                setActivePageIndex((prev) => Math.max(prev - 1, 0))
              }
              disabled={activePageIndex === 0 || isSubmitting}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            {activePageIndex < pages.length - 1 ? (
              <Button
                type="button"
                onClick={handleNextPage}
                disabled={isUploading || isSubmitting}
                variant="default"
              >
                Next Section
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={
                  (form.settings.limitOneResponse && !googleToken) ||
                  isUploading ||
                  isSubmitting
                }
                variant="default"
              >
                {isSubmitting ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader className="h-4 w-4 animate-spin" />
                    Submitting...
                  </span>
                ) : isUploading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader className="h-4 w-4 animate-spin" />
                    Processing Upload...
                  </span>
                ) : form.settings.limitOneResponse && !googleToken ? (
                  <span className="inline-flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Verify Identity to Continue
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
