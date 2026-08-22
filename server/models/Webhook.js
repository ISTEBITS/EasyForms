import mongoose from 'mongoose';

const webhookSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true,
    index: true,
  },
  url: {
    type: String,
    required: true,
  },
  secret: {
    type: String,
    required: true,
  },
  events: {
    type: [String],
    default: ['form.submitted'],
    enum: ['form.submitted', 'form.published', 'form.unpublished'],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Webhook = mongoose.model('Webhook', webhookSchema);

export default Webhook;
