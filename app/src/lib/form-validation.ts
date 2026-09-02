import type { Form, Question } from "@/types/form";

export type SubmissionAnswers = Record<string, unknown>;

export interface ValidationIssue {
  questionId: string;
  questionTitle: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function isEmptyValue(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value as object).length === 0;
  return false;
}

function isValidDateString(value: string): boolean {
  if (!DATE_REGEX.test(value)) return false;
  const [yearPart, monthPart, dayPart] = value.split("-");
  const year = Number(yearPart);
  const month = Number(monthPart);
  const day = Number(dayPart);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return false;
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function getOptionValues(question: Question): Set<string> {
  return new Set((question.options || []).map((option) => option.value));
}

export function validateQuestionAnswer(
  question: Question,
  value: unknown,
): string | null {
  if (question.type === "section_break") return null;

  if (question.required && isEmptyValue(value)) {
    return "This field is required";
  }

  if (isEmptyValue(value)) return null;

  switch (question.type) {
    case "short_text":
    case "long_text": {
      if (typeof value !== "string") return "Invalid text value";
      if (question.maxLength && value.length > question.maxLength) {
        return `Maximum ${question.maxLength} characters allowed`;
      }
      return null;
    }
    case "email": {
      if (typeof value !== "string") return "Invalid email value";
      if (!EMAIL_REGEX.test(value.trim())) return "Enter a valid email address";
      if (question.maxLength && value.length > question.maxLength) {
        return `Maximum ${question.maxLength} characters allowed`;
      }
      return null;
    }
    case "number": {
      const numericValue =
        typeof value === "number" ? value : Number(String(value).trim());
      if (!Number.isFinite(numericValue)) return "Enter a valid number";
      return null;
    }
    case "date": {
      if (typeof value !== "string") return "Invalid date value";
      if (!isValidDateString(value)) return "Enter a valid date";
      return null;
    }
    case "multiple_choice":
    case "dropdown": {
      if (typeof value !== "string") return "Invalid selection";
      const options = getOptionValues(question);
      if (!options.has(value)) return "Select a valid option";
      return null;
    }
    case "checkbox": {
      if (!Array.isArray(value)) return "Invalid selection";
      if (!value.every((entry) => typeof entry === "string")) {
        return "Invalid selection";
      }
      const options = getOptionValues(question);
      const hasInvalidOption = value.some((entry) => !options.has(entry));
      if (hasInvalidOption) return "One or more selected options are invalid";
      return null;
    }
    case "rating": {
      const min = question.minRating ?? 1;
      const max = question.maxRating ?? 5;
      const ratingValue =
        typeof value === "number" ? value : Number(String(value).trim());
      if (!Number.isInteger(ratingValue)) return "Rating must be a whole number";
      if (ratingValue < min || ratingValue > max) {
        return `Rating must be between ${min} and ${max}`;
      }
      return null;
    }
    case "file_upload": {
      if (typeof value !== "string" || value.trim() === "") {
        return "Please upload a file";
      }
      return null;
    }
    case "multiple_choice_grid": {
      if (typeof value !== "object" || value === null || Array.isArray(value)) {
        return "Invalid grid response";
      }
      const gridMap = value as Record<string, string>;
      const rows = question.gridRows || [];
      const options = getOptionValues(question);

      if (question.required) {
        const missingRow = rows.find((r) => !gridMap[r] || !options.has(gridMap[r]));
        if (missingRow) {
          return `Please select an option for "${missingRow}"`;
        }
      }
      return null;
    }
    default:
      return null;
  }
}

export function validateFormAnswers(
  form: Form,
  answers: SubmissionAnswers,
  questionScope?: string[],
): ValidationResult {
  const allowedIds = questionScope ? new Set(questionScope) : null;
  const issues: ValidationIssue[] = [];

  for (const question of form.questions) {
    if (question.type === "section_break") continue;
    if (allowedIds && !allowedIds.has(question.id)) continue;

    const message = validateQuestionAnswer(question, answers[question.id]);
    if (message) {
      issues.push({
        questionId: question.id,
        questionTitle: question.title,
        message,
      });
    }
  }

  return { isValid: issues.length === 0, issues };
}

export function validateSubmissionPayload(
  form: Form,
  answers: SubmissionAnswers,
  googleToken?: string | null,
): ValidationResult {
  const result = validateFormAnswers(form, answers);

  if (form.settings.limitOneResponse && (!googleToken || googleToken.trim() === "")) {
    result.issues.push({
      questionId: "googleToken",
      questionTitle: "Authentication",
      message: "Authentication required before submitting",
    });
  }

  return { isValid: result.issues.length === 0, issues: result.issues };
}
