import mongoose from 'mongoose';

const ActionItemSchema = new mongoose.Schema(
  {
    meeting_id: {
      type: String,
      required: true,
      index: true,
    },
    task: {
      type: String,
      required: true,
    },
    assigned_to: {
      type: String,
      default: '',
    },
    deadline: {
      type: String,
      default: '',
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

const ActionItem =
  mongoose.models.ActionItem ||
  mongoose.model('ActionItem', ActionItemSchema);

export default ActionItem;
