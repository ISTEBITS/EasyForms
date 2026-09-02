import mongoose from 'mongoose';

const AnswerSchema = new mongoose.Schema({
  questionId: { type: String, required: true },
  value: mongoose.Schema.Types.Mixed,
});

const RespondentSchema = new mongoose.Schema({
  name: String,
  email: String,
});

const NoteSchema = new mongoose.Schema({
  id: { type: String, required: true },
  author: { type: String, default: "Collaborator" },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const ResponseSchema = new mongoose.Schema({
  formId: { type: mongoose.Schema.Types.ObjectId, ref: "Form", required: true },
  submittedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  respondentEmail: { type: String, default: null },
  status: {
    type: String,
    default: "unreviewed",
  },
  tags: { type: [String], default: [] },
  notes: { type: [NoteSchema], default: [] },
  editedBy: { type: String, default: null },
  answers: [AnswerSchema],
  respondent: RespondentSchema,
});

const Response = mongoose.model("Response", ResponseSchema);

export default Response;

