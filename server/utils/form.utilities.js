import mongoose from "mongoose";

export function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function parseResponseDeadline(form) {
  const rawValue = form?.settings?.responseDeadlineAt;
  if (!rawValue) return null;
  const deadline = new Date(rawValue);
  return Number.isNaN(deadline.getTime()) ? null : deadline;
}

function parseMaxResponses(form) {
  const rawValue = form?.settings?.maxResponses;
  if (rawValue === null || rawValue === undefined || rawValue === "") {
    return null;
  }
  const parsed = Number(rawValue);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return null;
  }
  return parsed;
}

export function getAutoCloseReason(form) {
  if (!form) return null;

  const deadline = parseResponseDeadline(form);
  if (deadline && deadline.getTime() <= Date.now()) {
    return "deadline";
  }

  const maxResponses = parseMaxResponses(form);
  if (
    maxResponses !== null &&
    Number(form.responseCount || 0) >= maxResponses
  ) {
    return "max_responses";
  }

  return null;
}

export function getClosedMessage(form, reason) {
  const customMessage =
    typeof form?.settings?.closedMessage === "string"
      ? form.settings.closedMessage.trim()
      : "";
  if (customMessage) return customMessage;

  if (reason === "deadline") {
    return "This form is closed because the response deadline has passed.";
  }
  if (reason === "max_responses") {
    return "This form is closed because the maximum number of responses has been reached.";
  }

  return "Form is not accepting responses";
}

export function getClosedCode(reason) {
  if (reason === "deadline") return "FORM_DEADLINE_EXPIRED";
  if (reason === "max_responses") return "FORM_RESPONSE_LIMIT_REACHED";
  return "FORM_INACTIVE";
}

export async function syncFormPublicationState(form) {
  if (!form || !form.isPublished) return false;
  const closeReason = getAutoCloseReason(form);
  if (!closeReason) return false;

  form.isPublished = false;
  await form.save();
  return true;
}

// Submission Date format 
export function formatSubmissionDate(dateValue, timeZone, clientSubmittedAt) {
  if (clientSubmittedAt && typeof clientSubmittedAt === "string" && clientSubmittedAt.trim()) {
    return clientSubmittedAt.trim();
  }
  if (!dateValue) return "";
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return String(dateValue);

  if (timeZone && typeof timeZone === "string") {
    try {
      return d.toLocaleString("en-US", {
        timeZone,
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        hour12: true,
      });
    } catch {
      // Ignore invalid timeZone error
    }
  }

  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: true,
  });
}

// Response Formatter
export function formatAnswerForSpreadsheet(ans) {
  if (!ans || ans.value === null || ans.value === undefined) return "";
  const val = ans.value;
  if (Array.isArray(val)) {
    return val
      .map((item) => (typeof item === "object" && item !== null ? JSON.stringify(item) : String(item)))
      .join(", ");
  }
  if (typeof val === "object" && val !== null) {
    if (typeof val.url === "string" && val.url) return val.url;
    if (typeof val.name === "string" && val.name) return val.name;
    const entries = Object.entries(val);
    if (entries.length === 0) return "";
    return entries.map(([row, col]) => `${row}: ${col}`).join("; ");
  }
  return String(val);
}
