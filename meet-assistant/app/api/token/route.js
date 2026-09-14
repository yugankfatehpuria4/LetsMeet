import { StreamClient } from "@stream-io/node-sdk";

const apiKey = process.env.STREAM_API_KEY || process.env.NEXT_PUBLIC_STREAM_API_KEY;
const apiSecret = process.env.STREAM_API_SECRET || process.env.STREAM_SECRET_KEY;

export async function POST(request) {
    try {
        let body = {};
        try {
            body = await request.json();
        } catch (e) {
            body = {};
        }

        let { userId, name, role } = body;

        if (!apiKey || !apiSecret) {
            return Response.json(
                { error: "Stream API credentials are not properly configured" },
                { status: 500 }
            );
        }

        if (!userId || typeof userId !== "string") {
            return Response.json(
                { error: "Valid userId string is required" },
                { status: 400 }
            );
        }

        // Sanitize userId for Stream compatibility (lowercase alphanumeric and hyphens/underscores)
        const sanitizedUserId = userId
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9_@-]/g, "-")
            .slice(0, 64) || "user-" + Date.now();

        const serverClient = new StreamClient(apiKey, apiSecret);
        
        const userRole = role === "admin" ? "admin" : "user";
        const displayName = name ? String(name).trim() : `User ${sanitizedUserId}`;

        const newUser = {
            id: sanitizedUserId,
            role: userRole,
            name: displayName,
        };

        await serverClient.upsertUsers([newUser]);

        const now = Math.floor(Date.now() / 1000);
        const validity = 60 * 60 * 24; // 24 hours

        const token = serverClient.generateUserToken({
            user_id: sanitizedUserId,
            validity_in_seconds: validity,
            iat: now - 60,
        });

        return Response.json(
            { token, userId: sanitizedUserId },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error generating Stream token:", error);
        return Response.json(
            { error: "Failed to generate video token" },
            { status: 500 }
        );
    }
}