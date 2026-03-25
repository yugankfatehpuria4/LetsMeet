import { connectToDatabase } from "@/lib/mongodb";
import Transcript from "@/models/Transcript";

export async function POST(request) {
  try {
    const body = await request.json();
    const { meeting_id, speaker, text, timestamp } = body;

    if (!meeting_id || !text) {
      return Response.json(
        { ok: false, message: "meeting_id and text are required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    await Transcript.create({
      meeting_id,
      speaker: speaker || "Unknown",
      text,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
    });

    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Error saving transcript:", error);
    return Response.json(
      { ok: false, message: "Failed to save transcript" },
      { status: 500 }
    );
  }
}

