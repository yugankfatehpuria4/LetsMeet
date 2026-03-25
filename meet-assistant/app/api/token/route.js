import { StreamClient } from "@stream-io/node-sdk";

const apikey = process.env.STREAM_API_KEY;
const apiSecret = process.env.STREAM_API_SECRET;

export async function POST(request) {
    try {
        let body = {};
        try {
            body = await request.json();
        } catch (e) {
            // Handle cases where the client sends an empty body
            body = {};
        }
        const { userId } = body;
        if(!apikey || !apiSecret) {
            return Response.json({error: "API key or secret not configured"}, {status: 500});
        }
        if(!userId) {
            return Response.json({ error: "userId is required" }, { status: 400 });
        }
        const serverClient = new StreamClient(apikey, apiSecret);
        const newUser = {
            id: userId,
            role: "admin",
            name: "User " + userId
        };
        await serverClient.upsertUsers([newUser]);
        const now = Math.floor(Date.now() / 1000);
        const validity = 60 * 60 * 24; // 30 days
        const token = serverClient.generateUserToken({
            user_id : userId,
            validity_in_seconds: validity,
            iat: now-60,
        });
        return Response.json({token}, {status: 200});
    } catch (error) {
        console.error("Error generating token:", error);
        return Response.json({error: "Failed to Generate Token"}, {status: 500});
    }
}