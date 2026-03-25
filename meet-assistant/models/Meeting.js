import mongoose from 'mongoose';

const MeetingSchema = new mongoose.Schema(
  {
    meeting_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    created_by: {
      type: String,
      required: true,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
    participants: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

const Meeting =
  mongoose.models.Meeting || mongoose.model('Meeting', MeetingSchema);

export default Meeting;

