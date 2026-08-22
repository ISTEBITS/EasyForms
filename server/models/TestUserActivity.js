import mongoose from "mongoose";

const TestUserActivitySchema = new mongoose.Schema({
  testUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TestUser",
    required: false,
    default: null,
    index: true,
  },
  email: { type: String, required: true, index: true },
  action: { type: String, required: true, index: true },
  formId: { type: mongoose.Schema.Types.ObjectId, ref: "Form", default: null },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now, index: true },
});

const TestUserActivity = mongoose.model("TestUserActivity", TestUserActivitySchema);

export default TestUserActivity;
