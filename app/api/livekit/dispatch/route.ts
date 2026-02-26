import { AgentDispatchClient } from 'livekit-server-sdk';
import { NextResponse } from 'next/server';

type DispatchRequest = {
  room: string;
  agentName?: string;
  metadata?: string;
};

export async function POST(request: Request) {
  try {
    const { room, agentName, metadata } = (await request.json()) as DispatchRequest;
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const livekitUrl = process.env.LIVEKIT_URL;
    const defaultAgentName = process.env.LIVEKIT_AGENT_NAME;
    const targetAgentName = (agentName ?? defaultAgentName ?? '').trim();

    if (!apiKey || !apiSecret || !livekitUrl) {
      return NextResponse.json(
        { error: 'Missing LiveKit server credentials or URL.' },
        { status: 500 },
      );
    }
    if (!room) {
      return NextResponse.json({ error: 'Missing room.' }, { status: 400 });
    }
    if (!targetAgentName) {
      return NextResponse.json(
        {
          error:
            'Missing agent name. Set LIVEKIT_AGENT_NAME or provide agentName in request.',
        },
        { status: 400 },
      );
    }

    const host = livekitUrl.replace(/^wss?:\/\//, 'https://');
    const client = new AgentDispatchClient(host, apiKey, apiSecret);
    const dispatch = await client.createDispatch(room, targetAgentName, {
      metadata: metadata ?? JSON.stringify({ voice: 'female', mode: 'conversation' }),
    });

    return NextResponse.json({
      ok: true,
      dispatchId: dispatch.id,
      room: dispatch.room,
      agentName: dispatch.agentName,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Dispatch error.' },
      { status: 500 },
    );
  }
}
