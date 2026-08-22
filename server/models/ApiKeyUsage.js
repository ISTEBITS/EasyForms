import mongoose from 'mongoose';

const apiKeyUsageSchema = new mongoose.Schema({
  apiKeyId: {
    type: String,
    default: null,
    index: true,
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null,
    index: true,
  },
  keyName: {
    type: String,
    default: null,
  },
  endpoint: {
    type: String,
    required: true,
  },
  method: {
    type: String,
    required: true,
    enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  },
  ip: {
    type: String,
    default: null,
  },
  userAgent: {
    type: String,
    default: null,
  },
  status: {
    type: Number,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// Auto-expire after 90 days
apiKeyUsageSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const ApiKeyUsage = mongoose.model('ApiKeyUsage', apiKeyUsageSchema);

export default ApiKeyUsage;
