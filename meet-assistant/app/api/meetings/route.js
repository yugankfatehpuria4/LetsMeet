import { connectToDatabase } from "@/lib/mongodb";
import Meeting from "@/models/Meeting";
import AISummary from "@/models/AISummary";
import Transcript from "@/models/Transcript";
import ActionItem from "@/models/ActionItem";

export async function POST(request) {
  try {
    const body = await request.json();
    const { meeting_id, title, created_by, participant } = body;

    if (!meeting_id) {
      return Response.json(
        { ok: false, message: "meeting_id is required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    let meeting = await Meeting.findOne({ meeting_id });

    if (!meeting) {
      meeting = await Meeting.create({
        meeting_id,
        title: title || `Meeting ${meeting_id.slice(0, 8)}`,
        created_by: created_by || "Anonymous",
        participants: participant ? [participant] : [created_by || "Anonymous"],
        status: "active",
      });
    } else if (participant && !meeting.participants.includes(participant)) {
      meeting.participants.push(participant);
      await meeting.save();
    }

    return Response.json({ ok: true, meeting }, { status: 201 });
  } catch (error) {
    console.error("Error creating/updating meeting:", error);
    return Response.json(
      { ok: false, message: "Failed to process meeting record" },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const meeting_id = searchParams.get("meeting_id");

  try {
    await connectToDatabase();

    if (meeting_id) {
      const meeting = await Meeting.findOne({ meeting_id });
      if (!meeting) {
        return Response.json(
          { ok: false, message: "Meeting not found" },
          { status: 404 }
        );
      }
      const [summary, transcripts, actionItems] = await Promise.all([
        AISummary.findOne({ meeting_id }).sort({ created_at: -1 }),
        Transcript.find({ meeting_id }).sort({ timestamp: 1 }),
        ActionItem.find({ meeting_id }),
      ]);

      return Response.json(
        {
          ok: true,
          meeting,
          summary,
          transcripts,
          actionItems,
        },
        { status: 200 }
      );
    }

    // List recent meetings
    const meetings = await Meeting.find({}).sort({ created_at: -1 }).limit(20);

    // Enrich meetings with summary count & transcript count
    const enriched = await Promise.all(
      meetings.map(async (m) => {
        const [summary, transcriptCount, actionItemsCount] = await Promise.all([
          AISummary.findOne({ meeting_id: m.meeting_id }).select("summary action_items created_at"),
          Transcript.countDocuments({ meeting_id: m.meeting_id }),
          ActionItem.countDocuments({ meeting_id: m.meeting_id }),
        ]);

        return {
          ...m.toObject(),
          transcriptCount,
          actionItemsCount,
          hasSummary: !!summary,
          summarySnippet: summary ? summary.summary.slice(0, 150) + "..." : null,
        };
      })
    );

    return Response.json({ ok: true, meetings: enriched }, { status: 200 });
  } catch (error) {
    console.error("Error fetching meetings:", error);
    return Response.json(
      { ok: false, message: "Failed to fetch meetings" },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { meeting_id, status } = body;

    if (!meeting_id) {
      return Response.json(
        { ok: false, message: "meeting_id is required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const meeting = await Meeting.findOneAndUpdate(
      { meeting_id },
      { $set: { status: status || "ended" } },
      { new: true }
    );

    return Response.json({ ok: true, meeting }, { status: 200 });
  } catch (error) {
    console.error("Error updating meeting status:", error);
    return Response.json(
      { ok: false, message: "Failed to update meeting status" },
      { status: 500 }
    );
  }
}
