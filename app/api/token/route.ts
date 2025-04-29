import { NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";

// Add node runtime for better Vercel compatibility
export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    // Check for required environment variables
    const url = process.env.LIVEKIT_URL;
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    // Create a mock token if environment variables are missing
    // This prevents errors in development/testing scenarios
    if (!url || !apiKey || !apiSecret) {
      console.warn("Missing LiveKit environment variables - using mock token");
      
      // Extract parameters for logging/debugging
      const { searchParams } = new URL(req.url);
      const roomName = searchParams.get("room");
      const identity = searchParams.get("identity");
      
      console.log(`Mock token requested for room: ${roomName}, identity: ${identity}`);
      
      // Return a mock token that won't work but prevents frontend errors
      return NextResponse.json({ 
        token: "MOCK_TOKEN_MISSING_ENV_VARIABLES",
        mock: true,
        environment: {
          hasUrl: !!url,
          hasApiKey: !!apiKey, 
          hasApiSecret: !!apiSecret
        }
      });
    }

    // Parse request parameters
    const { searchParams } = new URL(req.url);
    const roomName = searchParams.get("room");
    const identity = searchParams.get("identity");

    if (!roomName || !identity) {
      return NextResponse.json({ error: "Missing required parameters: room and identity" }, { status: 400 });
    }

    console.log(`Generating token for room: ${roomName}, identity: ${identity}`);

    // Create LiveKit token
    const at = new AccessToken(apiKey, apiSecret, {
      identity,
    });

    at.addGrant({ roomJoin: true, room: roomName, canPublish: true, canSubscribe: true });
    const token = await at.toJwt();

    return NextResponse.json({ token });
  } catch (error) {
    console.error("Error generating LiveKit token:", error);
    return NextResponse.json(
      { error: "Failed to generate token", details: String(error) }, 
      { status: 500 }
    );
  }
}
