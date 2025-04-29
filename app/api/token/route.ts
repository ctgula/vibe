import { NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";

// Add node runtime for better Vercel compatibility
export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const url = process.env.LIVEKIT_URL;
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    // Check for missing environment variables
    if (!url || !apiKey || !apiSecret) {
      console.error("Missing LiveKit environment variables", { 
        hasUrl: !!url, 
        hasApiKey: !!apiKey, 
        hasApiSecret: !!apiSecret 
      });
      return NextResponse.json(
        { error: "Server configuration error - missing LiveKit variables" }, 
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const roomName = searchParams.get("room");
    const identity = searchParams.get("identity");

    if (!roomName || !identity) {
      return NextResponse.json({ error: "Missing room or identity" }, { status: 400 });
    }

    const at = new AccessToken(apiKey, apiSecret, {
      identity,
    });

    at.addGrant({ roomJoin: true, room: roomName, canPublish: true, canSubscribe: true });

    const token = await at.toJwt();

    return NextResponse.json({ token });
  } catch (error) {
    console.error("Error generating LiveKit token:", error);
    return NextResponse.json(
      { error: "Failed to generate token" }, 
      { status: 500 }
    );
  }
}
