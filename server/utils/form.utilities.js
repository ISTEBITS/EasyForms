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