import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

const SIGNED_URL_TTL_SECONDS = 60 * 15;

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function normalizeEndpoint(endpoint: string): string {
  return endpoint.startsWith("http") ? endpoint : `https://${endpoint}`;
}

function getS3Client(): S3Client {
  return new S3Client({
    region: getRequiredEnv("S3_REGION"),
    endpoint: normalizeEndpoint(getRequiredEnv("S3_ENDPOINT")),
    credentials: {
      accessKeyId: getRequiredEnv("S3_ACCESS_KEY"),
      secretAccessKey: getRequiredEnv("S3_SECRET_KEY"),
    },
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!id?.trim()) {
      return NextResponse.json({ error: "Recording id is required." }, { status: 400 });
    }

    const db = getDb();
    const row = db
      .prepare(
        `
          SELECT id, filepath
          FROM lesson_recordings
          WHERE id = ?
          LIMIT 1
        `,
      )
      .get(id.trim()) as { id: string; filepath: string | null } | undefined;

    if (!row) {
      return NextResponse.json({ error: "Recording not found." }, { status: 404 });
    }
    if (!row.filepath) {
      return NextResponse.json(
        { error: "Recording file path is missing." },
        { status: 409 },
      );
    }

    const key = row.filepath.replace(/^\/+/, "");
    const bucket = getRequiredEnv("S3_BUCKET");
    const s3 = getS3Client();
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    const url = await getSignedUrl(s3, command, {
      expiresIn: SIGNED_URL_TTL_SECONDS,
    });

    return NextResponse.json({ url });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create signed URL.",
      },
      { status: 500 },
    );
  }
}
