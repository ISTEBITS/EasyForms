import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { AlertCircle, Loader } from "lucide-react";
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
      const foundForm = await formsApi.getById(formId);
      if (foundForm) {
        if (foundForm.isPublished) {
          setForm(foundForm);
        } else {
          setError("This form is currently unavailable");
        }
      } else {
        setError("Form not found");
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Connection failed");
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
    if (!form || !formId) return;

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

    const response = await submitResponse(formId, {
      answers: responseData,
      googleToken,
    });

    if (!response) {
      throw new Error("Failed to submit response");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="rounded-sm border border-border bg-accent-1 px-5 py-4 text-sm text-accent-5">
          <span className="inline-flex items-center gap-2">
            <Loader className="h-4 w-4 animate-spin" />
            Loading form
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md rounded-sm border border-border bg-background p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-sm border border-border bg-accent-1">
            <AlertCircle className="h-6 w-6 text-accent-6" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">{error}</h2>
          <p className="mt-2 text-sm text-accent-5">
            Unable to access the requested form. Please verify the URL or
            contact the administrator.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 inline-flex h-10 items-center justify-center rounded-sm border border-border bg-accent-1 px-4 text-sm text-foreground transition-geist duration-150 hover:bg-accent-2"
          >
            Try Again
          </button>
          <p className="mt-5 text-xs font-sans uppercase text-accent-4">
            Ref: {formId ? formId.substring(0, 8).toUpperCase() : "NULL"}
          </p>
        </div>
      </div>
    );
  }

  if (!form) return null;

  return (
    <div className="min-h-screen px-3 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto w-full max-w-[940px]">
        <div className="relative">
          <FormPreview form={form} onSubmit={handleSubmit} />
        </div>
      </div>
    </div>
  );
}
