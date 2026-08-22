import Form from "../models/Form.js";
import Response from "../models/Response.js";
import TestUserActivity from "../models/TestUserActivity.js";
import Webhook from "../models/Webhook.js";
import sanitize from "mongo-sanitize";
import { verifyGoogleIdentity } from "../utils/googleAuth.js";
import { getMailStatus, sendSubmissionReceipt } from "../utils/mailer.js";
import {
  isValidObjectId,
  getAutoCloseReason,
  syncFormPublicationState,
  getClosedMessage,
  getClosedCode,
} from "../utils/form.utilities.js";
import { dispatchWebhookEvent } from "../utils/webhookSigning.js";

const TEST_USER_DEFAULT_LOGO_URL =
  process.env.TEST_USER_DEFAULT_LOGO_URL || "/logo.svg";
const TEST_USER_DEFAULT_BANNER_URL =
  process.env.TEST_USER_DEFAULT_BANNER_URL || "/default-banner.svg";

function isTestUserSession(req) {
  return req.user?.role === "test_user";
}

function isAdminSession(req) {
  return req.user?.role === "admin";
}

function getSessionEmail(req) {
  return String(req.user?.email || req.user?.sub || "")
    .trim()
    .toLowerCase();
}

function getSessionTestUserId(req) {
  return String(req.user?.testUserId || "").trim();
}

function containsFileUploadQuestion(questions) {
  return Array.isArray(questions)
    ? questions.some((question) => question?.type === "file_upload")
    : false;
}

function enforceTestUserRestrictions(payload, { forceSettings = false } = {}) {
  const nextPayload = { ...payload };

  if (containsFileUploadQuestion(nextPayload.questions)) {
    throw new Error("Test users cannot add file upload fields");
  }

  if (forceSettings || nextPayload.settings) {
    const nextSettings =
      nextPayload.settings && typeof nextPayload.settings === "object"
        ? { ...nextPayload.settings }
        : {};

    const nextTheme =
      nextSettings.theme && typeof nextSettings.theme === "object"
        ? { ...nextSettings.theme }
        : {};

    nextTheme.logoUrl = TEST_USER_DEFAULT_LOGO_URL;
    nextTheme.bannerUrl = TEST_USER_DEFAULT_BANNER_URL;
    nextTheme.backgroundImageUrl = TEST_USER_DEFAULT_BANNER_URL;
    nextSettings.theme = nextTheme;

    const nextEmailNotification =
      nextSettings.emailNotification &&
      typeof nextSettings.emailNotification === "object"
        ? { ...nextSettings.emailNotification }
        : {};
    nextEmailNotification.enabled = false;
    nextSettings.emailNotification = nextEmailNotification;

    nextPayload.settings = nextSettings;
  }
  nextPayload.isTestUserForm = true;

  return nextPayload;
}

async function createTestUserActivity(req, action, formId = null, metadata = {}) {
  if (!isTestUserSession(req)) return;
  const testUserId = getSessionTestUserId(req);
  const email = getSessionEmail(req);
  if (!testUserId || !email) return;

  try {
    await TestUserActivity.create({
      testUserId,
      email,
      action,
      formId,
      metadata,
    });
  } catch (error) {
    console.error("Failed to create test user activity:", error.message);
  }
}

async function dispatchWebhookForForm(formId, event) {
  try {
    const webhooks = await Webhook.find({
      events: event.type,
      isActive: true,
    }).lean();
    for (const webhook of webhooks) {
      dispatchWebhookEvent(webhook, event);
    }
  } catch (error) {
    console.error('Webhook lookup failed:', error.message);
  }
}

export async function handleGetAllForms(req, res) {
  try {
    const query = isAdminSession(req)
      ? {}
      : { "owner.testUserId": getSessionTestUserId(req) };
    const forms = await Form.find(query).sort({ createdAt: -1 });

    const formIds = forms.map((form) => form._id);
    const responseCounts = await Response.aggregate([
      { $match: { formId: { $in: formIds } } },
      { $group: { _id: "$formId", count: { $sum: 1 } } },
    ]);
    const countMap = new Map(
      responseCounts.map((item) => [String(item._id), Number(item.count) || 0]),
    );

    const countSyncOps = [];
    forms.forEach((form) => {
      const actualCount = countMap.get(String(form._id)) || 0;
      if (Number(form.responseCount || 0) !== actualCount) {
        countSyncOps.push({
          updateOne: {
            filter: { _id: form._id },
            update: { $set: { responseCount: actualCount } },
          },
        });
      }
      form.responseCount = actualCount;
    });

    if (countSyncOps.length > 0) {
      await Form.bulkWrite(countSyncOps);
    }

    await Promise.all(forms.map((form) => syncFormPublicationState(form)));
    res.json(forms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function handleGetPublicForm(req, res) {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid form id", code: "INVALID_FORM_ID" });
    }

    const form = await Form.findById(req.params.id);
    if (!form) {
      return res.status(404).json({ message: "Form not found", code: "FORM_NOT_FOUND" });
    }
    await syncFormPublicationState(form);
    if (!form.isPublished) {
      const reason = getAutoCloseReason(form);
      return res.status(403).json({
        message: getClosedMessage(form, reason),
        code: getClosedCode(reason),
        reason: reason || "unpublished",
      });
    }
    res.json(form);
  } catch (error) {
    res.status(500).json({ message: error.message, code: "SERVER_ERROR" });
  }
}

function escapeRegex(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function handleGetPublicFormBySlug(req, res) {
  try {
    const rawSlug = String(req.params.slug || "").trim();
    const form = await Form.findOne({
      slug: { $regex: `^${escapeRegex(rawSlug)}$`, $options: "i" },
    });
    if (!form) {
      return res.status(404).json({ message: "Form not found", code: "FORM_NOT_FOUND" });
    }
    await syncFormPublicationState(form);
    if (!form.isPublished) {
      const reason = getAutoCloseReason(form);
      return res.status(403).json({
        message: getClosedMessage(form, reason),
        code: getClosedCode(reason),
        reason: reason || "unpublished",
      });
    }
    res.json(form);
  } catch (error) {
    res.status(500).json({ message: error.message, code: "SERVER_ERROR" });
  }
}

export async function handleGetSingleForm(req, res) {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid form id" });
    }

    const query = isAdminSession(req)
      ? { _id: req.params.id }
      : { _id: req.params.id, "owner.testUserId": getSessionTestUserId(req) };

    const form = await Form.findOne(query);
    if (!form) {
      return res.status(404).json({ message: "Form not found" });
    }
    await syncFormPublicationState(form);
    res.json(form);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function handleCreateNewForm(req, res) {
  try {
    let cleanBody = sanitize(req.body);
    const isTestUser = isTestUserSession(req);

    if (isTestUser) {
      const testUserId = getSessionTestUserId(req);
      const existingCount = await Form.countDocuments({
        "owner.testUserId": testUserId,
      });
      if (existingCount >= 1) {
        return res
          .status(403)
          .json({ message: "Test users can create only one form" });
      }

      cleanBody = enforceTestUserRestrictions(cleanBody, { forceSettings: true });
      cleanBody.owner = {
        role: "test_user",
        testUserId,
        adminUsername: null,
        email: getSessionEmail(req),
      };
    } else {
      cleanBody.owner = {
        role: "admin",
        adminUsername: String(req.user?.sub || "admin"),
        testUserId: null,
        email: null,
      };
      cleanBody.isTestUserForm = false;
    }

    const form = new Form(cleanBody);
    const savedForm = await form.save();
    await syncFormPublicationState(savedForm);
    await createTestUserActivity(req, "form.create", savedForm._id, {
      title: savedForm.title,
    });

    res.status(201).json(savedForm);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

export async function handleUpdateForm(req, res) {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid form id" });
    }

    let cleanBody = sanitize(req.body);

    if (isTestUserSession(req)) {
      cleanBody = enforceTestUserRestrictions(cleanBody);
    }

    const filter = isAdminSession(req)
      ? { _id: req.params.id }
      : { _id: req.params.id, "owner.testUserId": getSessionTestUserId(req) };
    const form = await Form.findOneAndUpdate(filter, cleanBody, {
      new: true,
      runValidators: true,
    });
    if (!form) {
      return res.status(404).json({ message: "Form not found" });
    }
    if (isTestUserSession(req)) {
      form.settings = {
        ...form.settings,
        emailNotification: {
          ...form.settings.emailNotification,
          enabled: false,
        },
        theme: {
          ...form.settings.theme,
          logoUrl: TEST_USER_DEFAULT_LOGO_URL,
          bannerUrl: TEST_USER_DEFAULT_BANNER_URL,
          backgroundImageUrl: TEST_USER_DEFAULT_BANNER_URL,
        },
      };
      await form.save();
    }
    await syncFormPublicationState(form);
    await createTestUserActivity(req, "form.update", form._id, {
      title: form.title,
    });

    res.json(form);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

export async function handleDeleteForm(req, res) {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid form id" });
    }

    const filter = isAdminSession(req)
      ? { _id: req.params.id }
      : { _id: req.params.id, "owner.testUserId": getSessionTestUserId(req) };

    const form = await Form.findOneAndDelete(filter);
    if (!form) {
      return res.status(404).json({ message: "Form not found" });
    }
    await Response.deleteMany({ formId: req.params.id });
    await createTestUserActivity(req, "form.delete", form._id, {
      title: form.title,
    });

    res.json({ message: "Form deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function handleGetResponseForAForm(req, res) {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid form id" });
    }

    const filter = isAdminSession(req)
      ? { _id: req.params.id }
      : { _id: req.params.id, "owner.testUserId": getSessionTestUserId(req) };

    const form = await Form.findOne(filter).select("_id");
    if (!form) {
      return res.status(404).json({ message: "Form not found" });
    }

    const responses = await Response.find({ formId: req.params.id }).sort({
      submittedAt: -1,
    });
    await createTestUserActivity(req, "form.responses.view", req.params.id);

    res.json(responses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function handleSubmitAResponse(req, res) {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid form id", code: "INVALID_FORM_ID" });
    }

    const form = await Form.findById(req.params.id);
    let verifiedEmail = null;
    let verifiedName = null;
    if (!form) {
      return res.status(404).json({ message: "Form not found", code: "FORM_NOT_FOUND" });
    }
    await syncFormPublicationState(form);
    if (!form.isPublished) {
      const reason = getAutoCloseReason(form);
      return res.status(403).json({
        message: getClosedMessage(form, reason),
        code: getClosedCode(reason),
        reason: reason || "unpublished",
      });
    }

    // Google auth is OPTIONAL — gated by form.settings.requireLogin
    if (req.body.googleToken) {
      // Google token provided — verify it
      const identity = await verifyGoogleIdentity(req.body.googleToken);
      verifiedEmail = identity?.email || null;
      verifiedName = identity?.name || null;
      if (!verifiedEmail) {
        return res.status(401).json({ message: "Invalid Google token", code: "INVALID_GOOGLE_TOKEN" });
      }
    } else if (form.settings?.requireLogin) {
      // requireLogin is true but no googleToken provided
      return res.status(401).json({ message: "Google Sign In Required", code: "GOOGLE_AUTH_REQUIRED" });
    }
    // If no googleToken and requireLogin is false → anonymous submission allowed
    // Use provided respondent info if available
    if (!verifiedEmail && req.body.respondent?.email) {
      verifiedEmail = String(req.body.respondent.email).trim().toLowerCase() || null;
    }
    if (!verifiedName && req.body.respondent?.name) {
      verifiedName = String(req.body.respondent.name).trim() || null;
    }

    if (!Array.isArray(req.body.answers)) {
      return res.status(400).json({ message: "Answers must be an array", code: "INVALID_PAYLOAD" });
    }

    // Dedup check only when respondentEmail is available
    if (verifiedEmail) {
      const exists = await Response.findOne({
        formId: req.params.id,
        respondentEmail: String(verifiedEmail).trim().toLowerCase(),
      });

      if (exists && !form.settings.allowMultipleResponses) {
        return res
          .status(409)
          .json({ message: "You have already submitted this form.", code: "DUPLICATE_RESPONSE" });
      }
    }

    const respondentEmailValue = verifiedEmail
      ? String(verifiedEmail).trim().toLowerCase()
      : null;

    const response = new Response({
      formId: req.params.id,
      answers: sanitize(req.body.answers),
      respondentEmail: respondentEmailValue,
      respondent: {
        name: verifiedName || (verifiedEmail ? String(verifiedEmail).split("@")[0] : "Anonymous"),
        email: respondentEmailValue,
      },
    });

    await response.save();
    await Form.updateOne({ _id: form._id }, { $inc: { responseCount: 1 } });

    // Dispatch webhooks for form.submitted event (fire-and-forget)
    dispatchWebhookForForm(form._id, {
      type: 'form.submitted',
      data: {
        formId: String(form._id),
        formTitle: form.title,
        responseId: String(response._id),
        respondentEmail: respondentEmailValue,
        submittedAt: response.submittedAt,
        answerCount: response.answers.length,
      },
    }).catch(err => {
      console.error('Webhook dispatch error:', err.message);
    });

    const refreshedForm = await Form.findById(form._id);
    if (refreshedForm) {
      await syncFormPublicationState(refreshedForm);
      form.responseCount = refreshedForm.responseCount;
      form.isPublished = refreshedForm.isPublished;
    }

    const emailSettings = form.settings?.emailNotification;
    const shouldSendReceipt = Boolean(
      emailSettings?.enabled &&
        verifiedEmail &&
        typeof verifiedEmail === "string" &&
        verifiedEmail.trim(),
    );

    if (shouldSendReceipt) {
      try {
        const receiptResult = await sendSubmissionReceipt({
          to: String(verifiedEmail).trim().toLowerCase(),
          name: verifiedName || String(verifiedEmail).split("@")[0],
          formTitle: form.title,
          submittedAt: response.submittedAt,
          subjectTemplate: emailSettings?.subject,
          messageTemplate: emailSettings?.message,
        });
        if (!receiptResult?.sent) {
          console.warn(
            `Submission receipt skipped for form ${String(form._id)}: ${receiptResult?.reason || "unknown_reason"}`,
          );
        }
      } catch (mailError) {
        console.error(
          "Failed to send submission receipt:",
          mailError?.message || mailError,
        );
      }
    }

    res.status(201).json(response);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

export async function handleCheckStatus(req, res) {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid form id" });
    }

    const form = await Form.findById(req.params.id).select(
      "isPublished responseCount settings.responseDeadlineAt settings.maxResponses",
    );
    if (!form) {
      return res.json({ submitted: false });
    }
    await syncFormPublicationState(form);
    if (!form.isPublished) {
      return res.json({ submitted: false });
    }

    const cleanQuery = sanitize(req.query);
    const email = String(cleanQuery.email || "").trim().toLowerCase();
    const formID = String(req.params.id);
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const response = await Response.findOne({
      formId: formID,
      respondentEmail: email,
    });
    return res.json({ submitted: !!response });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
}

export async function handleGetMailStatus(req, res) {
  try {
    return res.json(getMailStatus());
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to read mail configuration status" });
  }
}

export async function handleGetTestUserActivities(req, res) {
  try {
    if (!isAdminSession(req)) {
      return res.status(403).json({ message: "Admin access required" });
    }

    const rawLimit = Number(req.query?.limit);
    const limit = Number.isFinite(rawLimit)
      ? Math.min(Math.max(rawLimit, 1), 200)
      : 100;

    const activities = await TestUserActivity.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    return res.json(activities);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}
