import mongoose from "mongoose";

const variableDescriptorSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    description: { type: String, default: "" },
    sample: { type: String, default: "" },
  },
  { _id: false }
);

const mailTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    category: {
      type: String,
      enum: ["invitation", "submission_receipt", "notification", "custom"],
      default: "custom",
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
    },
    variables: [variableDescriptorSchema],
    isDefault: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: String,
      default: "system",
    },
    updatedBy: {
      type: String,
      default: "system",
    },
  },
  {
    timestamps: true,
  }
);

// Helpful index for category lookups
mailTemplateSchema.index({ category: 1, isActive: 1 });

const MailTemplate = mongoose.model("MailTemplate", mailTemplateSchema);

export default MailTemplate;
