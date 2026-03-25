import { connectToDatabase } from "@/lib/mongodb";

export async function GET() {
  try {
    await connectToDatabase();
    return Response.json(
      { ok: true, message: "Connected to MongoDB successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("MongoDB connection error:", error);
    return Response.json(
      {
        ok: false,
        message: "Failed to connect to MongoDB.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

