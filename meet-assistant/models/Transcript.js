import mongoose from 'mongoose';

const TranscriptSchema = new mongoose.Schema(
  {
    meeting_id: {
      type: String,
      required: true,
      index: true,
    },
    speaker: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Transcript =
  mongoose.models.Transcript ||
  mongoose.model('Transcript', TranscriptSchema);

export default Transcript;

