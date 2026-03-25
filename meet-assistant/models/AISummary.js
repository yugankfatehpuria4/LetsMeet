import mongoose from 'mongoose';

const AISummarySchema = new mongoose.Schema(
  {
    meeting_id: {
      type: String,
      required: true,
      index: true,
    },
    summary: {
      type: String,
      required: true,
    },
    action_items: [
      {
        type: String,
      },
    ],
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

const AISummary =
  mongoose.models.AISummary ||
  mongoose.model('AISummary', AISummarySchema);

export default AISummary;

