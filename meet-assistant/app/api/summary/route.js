import { connectToDatabase } from "@/lib/mongodb";
import Transcript from "@/models/Transcript";
import AISummary from "@/models/AISummary";
import ActionItem from "@/models/ActionItem";
import { generateMeetingSummary, extractActionItems } from "@/lib/gemini";

export async function POST(request) {
  try {
    const body = await request.json();
    const { meeting_id } = body;

    if (!meeting_id) {
      return Response.json(
        { ok: false, message: "meeting_id is required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const transcripts = await Transcript.find({ meeting_id }).sort({
      timestamp: 1,
    });

    if (!transcripts.length) {
      return Response.json(
        { ok: false, message: "No transcripts found for this meeting" },
        { status: 404 }
      );
    }

    const transcriptText = transcripts
      .map((t) => `[${t.speaker}] ${t.text}`)
      .join("\n");

    const [aiSummary, extractedItems] = await Promise.all([
      generateMeetingSummary(transcriptText),
      extractActionItems(transcriptText),
    ]);

    const document = await AISummary.create({
      meeting_id,
      summary: (aiSummary.key_points || []).join("\n"),
      action_items: aiSummary.action_items || [],
    });

    if (extractedItems.length > 0) {
      await ActionItem.insertMany(
        extractedItems.map((item) => ({
          meeting_id,
          task: item.task,
          assigned_to: item.assigned_to,
          deadline: item.deadline,
        }))
      );
    }

    return Response.json(
      { ok: true, summary: document },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error generating summary:", error);
    return Response.json(
      { ok: false, message: "Failed to generate summary" },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const meeting_id = searchParams.get("meeting_id");

  if (!meeting_id) {
    return Response.json(
      { ok: false, message: "meeting_id is required" },
      { status: 400 }
    );
  }

  try {
    await connectToDatabase();
    const summary = await AISummary.findOne({ meeting_id }).sort({
      created_at: -1,
    });

    if (!summary) {
      return Response.json(
        { ok: false, message: "No summary found" },
        { status: 404 }
      );
    }

    return Response.json({ ok: true, summary }, { status: 200 });
  } catch (error) {
    console.error("Error fetching summary:", error);
    return Response.json(
      { ok: false, message: "Failed to fetch summary" },
      { status: 500 }
    );
  }
}

