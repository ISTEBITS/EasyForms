import mongoose from 'mongoose';

const QuestionOptionSchema = new mongoose.Schema({
  id: String,
  label: String,
  value: String,
  gotoQuestionId: String,
});

const QuestionConditionSchema = new mongoose.Schema({
  id: String,
  fieldId: String,
  operator: {
    type: String,
    enum: ["equals", "not_equals", "contains", "greater_than", "less_than", "is_filled", "is_empty"],
    default: "equals",
  },
  value: String,
  action: {
    type: String,
    enum: ["show", "hide"],
    default: "show",
  },
});

const QuestionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: {
    type: String,
    required: true,
    enum: [
      "short_text",
      "long_text",
      "multiple_choice",
      "checkbox",
      "dropdown",
      "rating",
      "date",
      "email",
      "number",
      "file_upload",
      "section_break",
      "multiple_choice_grid",
    ],
  },
  title: { type: String, required: true },
  description: String,
  required: { type: Boolean, default: false },
  options: [QuestionOptionSchema],
  gridRows: { type: [String], default: [] },
  placeholder: String,
  conditions: [QuestionConditionSchema],
  logicOperator: { type: String, enum: ["AND", "OR"], default: "AND" },
  maxLength: Number,
  minRating: Number,
  maxRating: Number,
  allowMultiple: Boolean,
  acceptFileTypes: String,
  maxFileSize: Number,
});

const FormThemeSchema = new mongoose.Schema({
  primaryColor: { type: String, default: "#0070f3" },
  backgroundColor: { type: String, default: "" },
  fontFamily: { type: String, default: "Geist Sans" },
  logoUrl: { type: String, default: "" },
  bannerUrl: { type: String, default: "" },
  backgroundImageUrl: { type: String, default: "" },
  bannerPositionX: { type: Number, default: 50 },
  bannerPositionY: { type: Number, default: 50 },
  brandName: { type: String, default: "" },
  brandTagline: { type: String, default: "" },
});

const FormSettingsSchema = new mongoose.Schema({
  allowMultipleResponses: { type: Boolean, default: false },
  requireLogin: { type: Boolean, default: false },
  showProgressBar: { type: Boolean, default: true },
  confirmationMessage: {
    type: String,
    default: "Thank you for your response!",
  },
  responseDeadlineAt: {
    type: Date,
    default: null,
  },
  maxResponses: {
    type: Number,
    default: null,
    min: 1,
  },
  closedMessage: {
    type: String,
    default: "This form is no longer accepting responses.",
  },
  emailNotification: {
    enabled: { type: Boolean, default: false },
    subject: {
      type: String,
      default: "Your response to {{formTitle}} was received",
    },
    message: {
      type: String,
      default:
        'Hi {{email}},\n\nThank you for completing "{{formTitle}}". We have recorded your submission on {{submittedAt}}.',
    },
  },
  limitOneResponse: { 
    type: Boolean, 
    default: false 
  },
  redirectUrl: String,
  theme: FormThemeSchema,
});

function slugifyTitle(value = "") {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const CollaboratorSchema = new mongoose.Schema({
  email: { type: String, required: true },
  role: { type: String, enum: ["viewer", "editor", "admin"], default: "viewer" },
  addedAt: { type: Date, default: Date.now },
});

const ShareSettingsSchema = new mongoose.Schema({
  isPublicShareEnabled: { type: Boolean, default: false },
  shareToken: { type: String, default: null },
  publicPermission: { type: String, enum: ["viewer", "editor"], default: "viewer" },
});

const FormSchema = new mongoose.Schema({
  title: { type: String, required: true, default: "Untitled Form" },
  description: { type: String, default: "" },
  slug: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  questions: [QuestionSchema],
  settings: FormSettingsSchema,
  isPublished: { type: Boolean, default: false },
  responseCount: { type: Number, default: 0 },
  isTestUserForm: { type: Boolean, default: false, index: true },
  collaborators: { type: [CollaboratorSchema], default: [] },
  shareSettings: {
    type: ShareSettingsSchema,
    default: () => ({
      isPublicShareEnabled: false,
      shareToken: null,
      publicPermission: "viewer",
    }),
  },
  owner: {
    role: { type: String, enum: ["admin", "test_user"], default: "admin" },
    adminUsername: { type: String, default: null },
    testUserId: { type: mongoose.Schema.Types.ObjectId, ref: "TestUser", default: null },
    email: { type: String, default: null },
  },
});

FormSchema.pre("save", async function () {
  this.updatedAt = Date.now();

  if (!this.slug) {
    const baseSlug = slugifyTitle(this.title) || "untitled-form";
    let nextSlug = baseSlug;
    let suffix = 1;

    while (
      await this.constructor.exists({
        _id: { $ne: this._id },
        slug: nextSlug,
      })
    ) {
      nextSlug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    this.slug = nextSlug;
  }
});

const Form = mongoose.model("Form", FormSchema);

export default Form;
