import {
  EgressClient,
  EgressStatus,
  EncodedFileOutput,
  EncodedFileType,
  RoomServiceClient,
  S3Upload,
  TrackType,
} from "livekit-server-sdk";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

const DEFAULT_ROOM_NAME = "lesson-room";
const EGRESS_STARTING_STALL_SECONDS = 30;
const TRACK_PUBLISH_CHECK_MAX_ATTEMPTS = 5;
const TRACK_PUBLISH_CHECK_RETRY_MS = 500;

type RecordingAction = "start" | "stop" | "cleanup";

type RecordingRequest = {
  action?: RecordingAction;
  room?: string;
  egressId?: string;
  all?: boolean;
};

const EGRESS_SLOT_RELEASE_WAIT_MS = 1500;

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function toHttpsHost(livekitUrl: string): string {
  return livekitUrl.replace(/^wss?:\/\//, "https://");
}

function sanitizeRoomName(room: string): string {
  const normalized = room.trim().toLowerCase();
  if (!normalized) return DEFAULT_ROOM_NAME;
  return normalized.replace(/[^a-z0-9_-]/g, "-").replace(/-+/g, "-");
}

function buildRecordingPath(roomName: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `rooms/${roomName}/${timestamp}.mp4`;
}

function statusLabel(status: EgressStatus): string {
  const label = EgressStatus[status];
  return typeof label === "string" ? label : String(status);
}

function nowIso(): string {
  return new Date().toISOString();
}

function getClient(): EgressClient {
  const apiKey = getRequiredEnv("LIVEKIT_API_KEY");
  const apiSecret = getRequiredEnv("LIVEKIT_API_SECRET");
  const livekitUrl = getRequiredEnv("LIVEKIT_URL");
  return new EgressClient(toHttpsHost(livekitUrl), apiKey, apiSecret);
}

function getRoomClient(): RoomServiceClient {
  const apiKey = getRequiredEnv("LIVEKIT_API_KEY");
  const apiSecret = getRequiredEnv("LIVEKIT_API_SECRET");
  const livekitUrl = getRequiredEnv("LIVEKIT_URL");
  return new RoomServiceClient(toHttpsHost(livekitUrl), apiKey, apiSecret);
}

function getS3Upload(): S3Upload {
  return new S3Upload({
    bucket: getRequiredEnv("S3_BUCKET"),
    region: getRequiredEnv("S3_REGION"),
    endpoint: getRequiredEnv("S3_ENDPOINT"),
    accessKey: getRequiredEnv("S3_ACCESS_KEY"),
    secret: getRequiredEnv("S3_SECRET_KEY"),
  });
}

async function stopActiveEgressForRoom(client: EgressClient, roomName: string) {
  const active = await client.listEgress({ roomName, active: true });
  const stoppedIds: string[] = [];
  for (const item of active) {
    try {
      await client.stopEgress(item.egressId);
      stoppedIds.push(item.egressId);
    } catch {
      // best-effort cleanup; start call will surface any remaining limit issues
    }
  }
  return stoppedIds;
}

function isConcurrentLimitError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return /CONCURRENT_EGRESS_SESSIONS_LIMIT_EXCEEDED/i.test(error.message);
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function envDiagnostics() {
  const livekitUrl = process.env.LIVEKIT_URL?.trim() ?? "";
  const publicLivekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL?.trim() ?? "";
  const s3Bucket = process.env.S3_BUCKET?.trim() ?? "";
  const s3Region = process.env.S3_REGION?.trim() ?? "";
  const s3Endpoint = process.env.S3_ENDPOINT?.trim() ?? "";
  return {
    livekit: {
      hasUrl: Boolean(livekitUrl),
      hasApiKey: Boolean(process.env.LIVEKIT_API_KEY?.trim()),
      hasApiSecret: Boolean(process.env.LIVEKIT_API_SECRET?.trim()),
      urlMatchesPublic:
        Boolean(livekitUrl) &&
        Boolean(publicLivekitUrl) &&
        livekitUrl === publicLivekitUrl,
      livekitUrl,
      publicLivekitUrl,
    },
    s3: {
      hasBucket: Boolean(s3Bucket),
      hasRegion: Boolean(s3Region),
      hasEndpoint: Boolean(s3Endpoint),
      hasAccessKey: Boolean(process.env.S3_ACCESS_KEY?.trim()),
      hasSecretKey: Boolean(process.env.S3_SECRET_KEY?.trim()),
      bucket: s3Bucket,
      region: s3Region,
      endpoint: s3Endpoint,
    },
  };
}

function buildHints(params: {
  status: string | null;
  error: string | null;
  activeTotal: number;
  activeInRoom: number;
  startedSeconds?: number | null;
}) {
  const hints: string[] = [];
  if (params.activeTotal >= 2) {
    hints.push(
      `LiveKit reports ${params.activeTotal} active egress session(s). Your project limit may be reached.`,
    );
  }
  if (params.status === "EGRESS_STARTING") {
    hints.push("Egress is still starting. Keep participants connected and publishing media.");
    hints.push("Wait for EGRESS_ACTIVE before pressing Stop.");
    if (
      typeof params.startedSeconds === "number" &&
      params.startedSeconds >= EGRESS_STARTING_STALL_SECONDS
    ) {
      hints.push(
        `Egress has been in STARTING for ${params.startedSeconds}s. This is likely stalled. Use force cleanup, then start again.`,
      );
    }
  }
  if (params.error && /start signal not received/i.test(params.error)) {
    hints.push("Start signal was not received. This usually means the room pipeline did not fully initialize.");
  }
  if (params.error && /CONCURRENT_EGRESS_SESSIONS_LIMIT_EXCEEDED/i.test(params.error)) {
    hints.push("Concurrent egress limit exceeded. Stop stale active sessions and retry.");
  }
  if (params.activeInRoom > 1) {
    hints.push(
      `There are ${params.activeInRoom} active egress sessions for this room. Keep only one active recording per room.`,
    );
  }
  return hints;
}

function needsRecordingSync(status: string, fileUrl: string | null): boolean {
  if (!fileUrl) return true;
  return (
    status === "EGRESS_STARTING" ||
    status === "EGRESS_ACTIVE" ||
    status === "EGRESS_ENDING"
  );
}

function buildSpacesPlaybackUrl(filepath: string): string | null {
  const endpointRaw = process.env.S3_ENDPOINT?.trim();
  const bucket = process.env.S3_BUCKET?.trim();
  if (!endpointRaw || !bucket || !filepath) {
    return null;
  }
  try {
    const endpoint = endpointRaw.startsWith("http")
      ? endpointRaw
      : `https://${endpointRaw}`;
    const parsed = new URL(endpoint);
    const safePath = filepath
      .split("/")
      .map((part) => encodeURIComponent(part))
      .join("/");
    return `${parsed.protocol}//${bucket}.${parsed.host}/${safePath}`;
  } catch {
    return null;
  }
}

type RoomTrackSnapshot = {
  participantCount: number;
  publishedTrackCount: number;
  activePublishedTrackCount: number;
  participants: Array<{
    sid: string;
    identity: string;
    name: string;
    isPublisher: boolean;
    publishedTracks: Array<{
      sid: string;
      name: string;
      type: "audio" | "video" | "data";
      muted: boolean;
    }>;
  }>;
};

async function getRoomTrackSnapshot(
  roomClient: RoomServiceClient,
  roomName: string,
): Promise<RoomTrackSnapshot> {
  const participants = await roomClient.listParticipants(roomName);
  const participantRows = participants.map((participant) => {
    const publishedTracks = participant.tracks
      .filter(
        (track) =>
          track.type === TrackType.AUDIO ||
          track.type === TrackType.VIDEO ||
          track.type === TrackType.DATA,
      )
      .map((track) => ({
        sid: track.sid,
        name: track.name,
        type:
          track.type === TrackType.AUDIO
            ? "audio"
            : track.type === TrackType.VIDEO
            ? "video"
            : "data",
        muted: track.muted,
      }));
    return {
      sid: participant.sid,
      identity: participant.identity,
      name: participant.name,
      isPublisher: participant.isPublisher,
      publishedTracks,
    };
  });

  const publishedTrackCount = participantRows.reduce(
    (total, participant) => total + participant.publishedTracks.length,
    0,
  );
  const activePublishedTrackCount = participantRows.reduce(
    (total, participant) =>
      total +
      participant.publishedTracks.filter(
        (track) => (track.type === "audio" || track.type === "video") && !track.muted,
      ).length,
    0,
  );

  return {
    participantCount: participantRows.length,
    publishedTrackCount,
    activePublishedTrackCount,
    participants: participantRows,
  };
}

async function waitForActivePublishedTracks(
  roomClient: RoomServiceClient,
  roomName: string,
): Promise<RoomTrackSnapshot> {
  let lastSnapshot: RoomTrackSnapshot | null = null;
  for (let attempt = 1; attempt <= TRACK_PUBLISH_CHECK_MAX_ATTEMPTS; attempt += 1) {
    const snapshot = await getRoomTrackSnapshot(roomClient, roomName);
    lastSnapshot = snapshot;
    console.info("[livekit-recording] track pre-check attempt", {
      roomName,
      attempt,
      maxAttempts: TRACK_PUBLISH_CHECK_MAX_ATTEMPTS,
      participantCount: snapshot.participantCount,
      publishedTrackCount: snapshot.publishedTrackCount,
      activePublishedTrackCount: snapshot.activePublishedTrackCount,
      participants: snapshot.participants.map((participant) => ({
        identity: participant.identity,
        isPublisher: participant.isPublisher,
        publishedTracks: participant.publishedTracks.map((track) => ({
          sid: track.sid,
          type: track.type,
          muted: track.muted,
          name: track.name,
        })),
      })),
    });
    if (snapshot.activePublishedTrackCount > 0) {
      return snapshot;
    }
    if (attempt < TRACK_PUBLISH_CHECK_MAX_ATTEMPTS) {
      await sleep(TRACK_PUBLISH_CHECK_RETRY_MS);
    }
  }
  return (
    lastSnapshot ?? {
      participantCount: 0,
      publishedTrackCount: 0,
      activePublishedTrackCount: 0,
      participants: [],
    }
  );
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RecordingRequest;
    const action = body.action;
    const roomName = sanitizeRoomName(body.room ?? DEFAULT_ROOM_NAME);

    if (action !== "start" && action !== "stop" && action !== "cleanup") {
      return NextResponse.json(
        { error: "Action must be 'start', 'stop', or 'cleanup'." },
        { status: 400 },
      );
    }

    const client = getClient();
    const db = getDb();

    if (action === "cleanup") {
      const target = body.all ? await client.listEgress({ active: true }) : await client.listEgress({ roomName, active: true });
      const stopped: Array<{ egressId: string; roomName: string; status: string }> = [];
      const failed: Array<{ egressId: string; roomName: string; message: string }> = [];
      for (const item of target) {
        try {
          await client.stopEgress(item.egressId);
          stopped.push({
            egressId: item.egressId,
            roomName: item.roomName || "unknown",
            status: statusLabel(item.status),
          });
        } catch (error) {
          failed.push({
            egressId: item.egressId,
            roomName: item.roomName || "unknown",
            message: error instanceof Error ? error.message : "Failed to stop egress.",
          });
        }
      }
      if (stopped.length > 0) {
        await sleep(EGRESS_SLOT_RELEASE_WAIT_MS);
      }
      const remaining = body.all
        ? await client.listEgress({ active: true })
        : await client.listEgress({ roomName, active: true });
      return NextResponse.json({
        ok: true,
        action,
        roomName,
        scope: body.all ? "all" : "room",
        stopped,
        failed,
        remaining: remaining.map((item) => ({
          egressId: item.egressId,
          roomName: item.roomName || "unknown",
          status: statusLabel(item.status),
        })),
      });
    }

    if (action === "start") {
      const roomClient = getRoomClient();
      const trackSnapshot = await waitForActivePublishedTracks(roomClient, roomName);
      console.info("[livekit-recording] egress pre-check", {
        roomName,
        participantCount: trackSnapshot.participantCount,
        publishedTrackCount: trackSnapshot.publishedTrackCount,
        activePublishedTrackCount: trackSnapshot.activePublishedTrackCount,
        participants: trackSnapshot.participants.map((participant) => ({
          identity: participant.identity,
          publishedTracks: participant.publishedTracks.map((track) => ({
            sid: track.sid,
            type: track.type,
            muted: track.muted,
            name: track.name,
          })),
        })),
      });
      if (trackSnapshot.activePublishedTrackCount === 0) {
        return NextResponse.json(
          {
            error:
              "No active published audio/video tracks found in room. Join with camera or microphone before recording.",
            participantCount: trackSnapshot.participantCount,
            publishedTrackCount: trackSnapshot.publishedTrackCount,
            activePublishedTrackCount: trackSnapshot.activePublishedTrackCount,
            participants: trackSnapshot.participants,
          },
          { status: 400 },
        );
      }

      const clearedEgressIds = await stopActiveEgressForRoom(client, roomName);
      const filepath = buildRecordingPath(roomName);
      const output = new EncodedFileOutput({
        fileType: EncodedFileType.MP4,
        filepath,
        output: {
          case: "s3",
          value: getS3Upload(),
        },
      });
      let info;
      try {
        if (clearedEgressIds.length > 0) {
          await sleep(EGRESS_SLOT_RELEASE_WAIT_MS);
        }
        info = await client.startRoomCompositeEgress(roomName, {
          file: output,
        });
      } catch (error) {
        if (isConcurrentLimitError(error)) {
          const active = await client.listEgress({ active: true });
          const blockers = active.map((item) => ({
            egressId: item.egressId,
            roomName: item.roomName || "unknown",
            status: statusLabel(item.status),
            startedAt: item.startedAt ? item.startedAt.toString() : null,
          }));
          return NextResponse.json(
            {
              error: `CONCURRENT_EGRESS_SESSIONS_LIMIT_EXCEEDED (${blockers.length} active).`,
              blockers,
            },
            { status: 429 },
          );
        }
        throw error;
      }

      const id = crypto.randomUUID();
      const startedAt = nowIso();
      db.prepare(
        `
          INSERT INTO lesson_recordings (
            id,
            room_name,
            egress_id,
            status,
            started_at,
            filepath,
            file_url,
            error
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(egress_id) DO UPDATE SET
            status = excluded.status,
            started_at = excluded.started_at,
            filepath = excluded.filepath,
            file_url = excluded.file_url,
            error = excluded.error
        `,
      ).run(
        id,
        roomName,
        info.egressId,
        statusLabel(info.status),
        startedAt,
        filepath,
        info.fileResults[0]?.location ?? null,
        info.error || null,
      );

      return NextResponse.json({
        ok: true,
        action,
        roomName,
        egressId: info.egressId,
        status: statusLabel(info.status),
        filepath,
        clearedEgressIds,
        participantCount: trackSnapshot.participantCount,
        publishedTrackCount: trackSnapshot.publishedTrackCount,
        activePublishedTrackCount: trackSnapshot.activePublishedTrackCount,
        participants: trackSnapshot.participants,
      });
    }

    let targetEgressId = body.egressId?.trim();
    if (!targetEgressId) {
      const active = await client.listEgress({ roomName, active: true });
      targetEgressId = active[0]?.egressId;
    }

    if (!targetEgressId) {
      return NextResponse.json(
        { error: `No active recording found for room '${roomName}'.` },
        { status: 404 },
      );
    }

    const info = await client.stopEgress(targetEgressId);
    const endedAt = nowIso();
    const fileUrl = info.fileResults[0]?.location ?? null;
    const filepath =
      info.fileResults[0]?.filename ||
      db
        .prepare(
          `
            SELECT filepath
            FROM lesson_recordings
            WHERE egress_id = ?
            LIMIT 1
          `,
        )
        .get(targetEgressId)?.filepath ||
      `rooms/${roomName}/unknown.mp4`;

    db.prepare(
      `
        INSERT INTO lesson_recordings (
          id,
          room_name,
          egress_id,
          status,
          started_at,
          ended_at,
          filepath,
          file_url,
          error
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(egress_id) DO UPDATE SET
          status = excluded.status,
          ended_at = excluded.ended_at,
          file_url = excluded.file_url,
          error = excluded.error
      `,
    ).run(
      crypto.randomUUID(),
      roomName,
      targetEgressId,
      statusLabel(info.status),
      nowIso(),
      endedAt,
      filepath,
      fileUrl,
      info.error || null,
    );

    return NextResponse.json({
      ok: true,
      action,
      roomName,
      egressId: targetEgressId,
      status: statusLabel(info.status),
      fileUrl,
      filepath,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Recording request failed." },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const egressId = searchParams.get("egressId")?.trim();
    const roomName = sanitizeRoomName(searchParams.get("room") ?? DEFAULT_ROOM_NAME);
    const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? "50"), 1), 200);

    if (egressId) {
      const client = getClient();
      const list = await client.listEgress({ egressId });
      const current = list[0];
      const active = await client.listEgress({ active: true });
      const activeInRoom = active.filter((item) => item.roomName === roomName).length;
      const status = current ? statusLabel(current.status) : null;
      const error = current?.error || null;
      const startedAtMs = current?.startedAt ? Number(current.startedAt) : null;
      const startedSeconds =
        startedAtMs && startedAtMs > 0 ? Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000)) : null;
      return NextResponse.json({
        roomName,
        egressId,
        live: current
          ? {
              status,
              error,
              egressId: current.egressId,
              details: current.details || null,
              roomName: current.roomName || roomName,
              sourceType: String(current.sourceType),
              requestType: current.request.case || null,
              startedAt: current.startedAt ? current.startedAt.toString() : null,
              updatedAt: current.updatedAt ? current.updatedAt.toString() : null,
              endedAt: current.endedAt ? current.endedAt.toString() : null,
              startedSeconds,
              destinations:
                current.request.case === "roomComposite"
                  ? current.request.value.fileOutputs.map((file) => file.filepath)
                  : [],
            }
          : null,
        active: {
          total: active.length,
          room: activeInRoom,
          ids: active.map((item) => item.egressId),
          details: active.map((item) => ({
            egressId: item.egressId,
            roomName: item.roomName || "unknown",
            status: statusLabel(item.status),
            startedAt: item.startedAt ? item.startedAt.toString() : null,
          })),
        },
        diagnostics: envDiagnostics(),
        hints: buildHints({
          status,
          error,
          activeTotal: active.length,
          activeInRoom,
          startedSeconds,
        }),
      });
    }

    const db = getDb();
    const rows = db
      .prepare(
        `
          SELECT
            id,
            room_name,
            egress_id,
            status,
            started_at,
            ended_at,
            filepath,
            file_url,
            error
          FROM lesson_recordings
          WHERE room_name = ?
          ORDER BY started_at DESC
          LIMIT ?
        `,
      )
      .all(roomName, limit) as Array<{
      id: string;
      room_name: string;
      egress_id: string;
      status: string;
      started_at: string;
      ended_at: string | null;
      filepath: string;
      file_url: string | null;
      error: string | null;
    }>;

    const syncCandidates = rows.filter((row) =>
      needsRecordingSync(row.status, row.file_url),
    );
    if (syncCandidates.length > 0) {
      const client = getClient();
      for (const row of syncCandidates) {
        try {
          const list = await client.listEgress({ egressId: row.egress_id });
          const current = list[0];
          if (!current) {
            continue;
          }
          const nextStatus = statusLabel(current.status);
          const nextFileUrl = current.fileResults[0]?.location ?? row.file_url;
          const nextFilepath =
            current.fileResults[0]?.filename ||
            row.filepath ||
            `rooms/${roomName}/unknown.mp4`;
          const endedAt = current.endedAt ? current.endedAt.toString() : row.ended_at;
          db.prepare(
            `
              UPDATE lesson_recordings
              SET
                status = ?,
                ended_at = ?,
                filepath = ?,
                file_url = ?,
                error = ?
              WHERE egress_id = ?
            `,
          ).run(
            nextStatus,
            endedAt,
            nextFilepath,
            nextFileUrl,
            current.error || row.error,
            row.egress_id,
          );
        } catch {
          // best-effort sync; stale row is still returned below
        }
      }
    }

    const latestRows = db
      .prepare(
        `
          SELECT
            id,
            room_name,
            egress_id,
            status,
            started_at,
            ended_at,
            filepath,
            file_url,
            error
          FROM lesson_recordings
          WHERE room_name = ?
          ORDER BY started_at DESC
          LIMIT ?
        `,
      )
      .all(roomName, limit) as Array<{
      id: string;
      room_name: string;
      egress_id: string;
      status: string;
      started_at: string;
      ended_at: string | null;
      filepath: string;
      file_url: string | null;
      error: string | null;
    }>;

    return NextResponse.json({
      roomName,
      recordings: latestRows.map((row) => ({
        id: row.id,
        roomName: row.room_name,
        egressId: row.egress_id,
        status: row.status,
        startedAt: row.started_at,
        endedAt: row.ended_at,
        filepath: row.filepath,
        fileUrl: row.file_url,
        playbackUrl: row.file_url || buildSpacesPlaybackUrl(row.filepath),
        error: row.error,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load recordings." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const roomName = sanitizeRoomName(searchParams.get("room") ?? DEFAULT_ROOM_NAME);
    const db = getDb();
    const result = db
      .prepare(
        `
          DELETE FROM lesson_recordings
          WHERE room_name = ?
        `,
      )
      .run(roomName);
    return NextResponse.json({
      ok: true,
      roomName,
      deleted: result.changes ?? 0,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to clear recordings." },
      { status: 500 },
    );
  }
}
