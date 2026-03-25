import { connectToDatabase } from "@/lib/mongodb";
import ActionItem from "@/models/ActionItem";

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
    const items = await ActionItem.find({ meeting_id }).sort({
      created_at: 1,
    });

    return Response.json({ ok: true, action_items: items }, { status: 200 });
  } catch (error) {
    console.error("Error fetching action items:", error);
    return Response.json(
      { ok: false, message: "Failed to fetch action items" },
      { status: 500 }
    );
  }
}
