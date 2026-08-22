import mongoose from "mongoose";

const apiKeySchema = new mongoose.Schema({
  name: { type: String, required: true },
  keyHash: { type: String, required: true },
  keyPrefix: { type: String, required: true },
  scopes: {
    type: [String],
    default: ['read:forms', 'write:responses'],
    enum: ['read:forms', 'write:responses', 'write:forms', 'read:responses'],
  },
  lastUsedAt: { type: Date, default: null },
  expiresAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

const TestUserSchema = new mongoose.Schema({
  googleSub: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true, index: true },
  name: { type: String, default: "" },
  picture: { type: String, default: "" },
  apiKeys: [apiKeySchema],
  createdAt: { type: Date, default: Date.now },
  lastLoginAt: { type: Date, default: Date.now },
});

const TestUser = mongoose.model("TestUser", TestUserSchema);

export default TestUser;
