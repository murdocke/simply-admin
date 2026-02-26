import { AccessToken } from "livekit-server-sdk";
import { NextResponse } from "next/server";

type TokenRequest = {
  room: string;
  identity: string;
  name?: string;
};

export async function POST(request: Request) {
  try {
    const { room, identity, name } = (await request.json()) as TokenRequest;
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const livekitUrl = process.env.LIVEKIT_URL;
    const publicUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

    if (!apiKey || !apiSecret || !livekitUrl) {
      return NextResponse.json(
        { error: "Missing LiveKit server credentials or URL." },
        { status: 500 },
      );
    }

    if (!room || !identity) {
      return NextResponse.json(
        { error: "Missing room or identity." },
        { status: 400 },
      );
    }

    const token = new AccessToken(apiKey, apiSecret, {
      identity,
      name,
    });
    token.addGrant({
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
      room,
    });

    if (publicUrl && publicUrl !== livekitUrl) {
      return NextResponse.json(
        {
          error:
            "LiveKit URL mismatch. NEXT_PUBLIC_LIVEKIT_URL does not match LIVEKIT_URL.",
        },
        { status: 500 },
      );
    }

    const jwt = await token.toJwt();
    return NextResponse.json({ token: jwt });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Token error." },
      { status: 500 },
    );
  }
}
