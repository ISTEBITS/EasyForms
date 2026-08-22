import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const apiKeySchema = new Schema({
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

const adminSchema = new Schema({
    username:{
        type: String,
        required: true,
        unique: true
    },
    password : {
        type: String,
        required: true
    },
    currentSessionId: {
        type: String,
        default: null
    },
    apiKeys: [apiKeySchema],
})

const Admin = mongoose.model('Admin',adminSchema);
export default Admin;
