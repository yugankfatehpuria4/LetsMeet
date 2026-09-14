import { connectToDatabase } from "@/lib/mongodb";

export async function GET() {
  try {
    const startTime = Date.now();
    await connectToDatabase();
    const dbLatencyMs = Date.now() - startTime;

    return Response.json(
      {
        status: "healthy",
        service: "letsmeet-api",
        timestamp: new Date().toISOString(),
        database: {
          status: "connected",
          latencyMs: dbLatencyMs,
        },
        uptime: process.uptime(),
      },
      { status: 200 }
    );
  } catch (error) {
    return Response.json(
      {
        status: "unhealthy",
        service: "letsmeet-api",
        timestamp: new Date().toISOString(),
        database: {
          status: "disconnected",
          error: error.message,
        },
      },
      { status: 503 }
    );
  }
}
