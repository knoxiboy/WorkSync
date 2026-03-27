import { AccessToken } from "livekit-server-sdk";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { room, username } = await req.json();

    if (!room) {
      return NextResponse.json(
        { error: 'Missing "room" query parameter' },
        { status: 400 }
      );
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

    if (!apiKey || !apiSecret || !wsUrl) {
      console.error("LiveKit configuration missing");
      return NextResponse.json(
        { error: "Server misconfigured (LiveKit credentials missing)" },
        { status: 500 }
      );
    }

    // Use a unique, safe identity (clerkId) and provide the display name
    const at = new AccessToken(apiKey, apiSecret, {
      identity: clerkId,
      name: username || "User", 
    });

    at.addGrant({ 
      roomJoin: true, 
      room: room,
      canPublish: true,
      canSubscribe: true,
    });

    const token = await at.toJwt();
    console.log(`[LIVEKIT] Generated token for user ${clerkId} in room ${room}`);

    return NextResponse.json({ token });
  } catch (error) {
    console.error("LiveKit Token Error:", error);
    return NextResponse.json(
      { error: "Failed to generate token" },
      { status: 500 }
    );
  }
}
