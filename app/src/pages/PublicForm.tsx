import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { AlertCircle, Loader2 } from "lucide-react";
import { FormPreview } from "@/components/form-preview";
import { useForms } from "@/hooks/useForms";
import { ApiError, formsApi } from "@/api";
import type { Form, FormResponse } from "@/types/form";
import { validateSubmissionPayload } from "@/lib/form-validation";

export function PublicForm() {
  const { formId } = useParams<{ formId: string }>();
  const { submitResponse } = useForms({ autoFetch: false });
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadForm = useCallback(async () => {
    if (!formId) return;
    try {
      setLoading(true);
      setError(null);
      const foundForm = await formsApi.getPublic(formId);
      if (foundForm) {
        if (foundForm.isPublished) {
          setForm(foundForm);
        } else {
          setError("This form is currently unavailable or unpublished.");
        }
      } else {
        setError("Form not found");
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Unable to connect to form service");
      }
    } finally {
      setLoading(false);
    }
  }, [formId]);

  useEffect(() => {
    if (formId) {
      loadForm();
      return;
    }
    setError("Invalid form identifier");
    setLoading(false);
  }, [formId, loadForm]);

  const handleSubmit = async (
    answers: Record<string, unknown>,
    googleToken?: string,
  ) => {
    if (!form) return;
    const resolvedId = form.id || form._id;
    if (!resolvedId) return;

    const validation = validateSubmissionPayload(form, answers, googleToken);
    if (!validation.isValid) {
      const firstIssue = validation.issues[0];
      throw new Error(
        firstIssue
          ? `${firstIssue.questionTitle}: ${firstIssue.message}`
          : "Please complete all required fields",
      );
    }

    const responseData: FormResponse["answers"] = Object.entries(answers).map(
      ([questionId, value]) => ({
        questionId,
        value: value as FormResponse["answers"][number]["value"],
      }),
    );

    const response = await submitResponse(resolvedId, {
      answers: responseData,
      googleToken,
    });

    if (!response) {
      throw new Error("Failed to submit response");
    }
  };

  if (loading) {
    return (
      <div className="relative min-h-screen bg-background text-foreground flex items-center justify-center p-4 selection:bg-foreground selection:text-background font-sans">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.1),rgba(0,0,0,0))]" />

        <div className="flex flex-col items-center gap-3 rounded-md border border-border bg-background/80 backdrop-blur-md px-8 py-6 shadow-xs">
          <Loader2 className="h-5 w-5 animate-spin text-accent-6" />
          <span className="text-xs text-accent-5 font-sans">Loading form...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative min-h-screen flex items-center justify-center p-4 bg-background text-foreground selection:bg-foreground selection:text-background font-sans">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(238,0,0,0.08),rgba(0,0,0,0))]" />

        <div className="w-full max-w-md rounded-md border border-border bg-background p-8 text-center shadow-xs space-y-4">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-sm border border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400">
            <AlertCircle className="h-5 w-5" />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-base font-semibold tracking-tight text-foreground font-sans">
              {error}
            </h1>
            <p className="text-xs text-accent-5 leading-relaxed font-sans">
              The form you are attempting to access is currently unavailable, unpublished, or has expired.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex h-9 items-center justify-center rounded-sm border border-border bg-accent-1 px-4 text-xs font-medium text-foreground transition-all hover:bg-accent-2 active:scale-98 cursor-pointer font-sans"
            >
              Try Again
            </button>
            <Link
              to="/"
              className="inline-flex h-9 items-center justify-center rounded-sm bg-foreground px-4 text-xs font-medium text-background transition-all hover:bg-accent-7 active:scale-98 font-sans"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!form) return null;

  return (
    <div className="relative min-h-screen bg-background text-foreground selection:bg-foreground selection:text-background font-sans">

      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.08),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.12),rgba(0,0,0,0))]" />

      {/* Main Centered Form Container */}
      <main className="relative z-10 mx-auto w-full max-w-2xl xl:max-w-3xl px-4 py-4 sm:px-6 sm:py-16">
        <FormPreview form={form} onSubmit={handleSubmit} />
      </main>
    </div>
  );
}
