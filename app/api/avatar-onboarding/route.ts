import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';

type VideoRecord = {
  id: string;
  videoKey: string;
  title: string | null;
  description: string | null;
  provider: string | null;
  vimeoId: string | null;
  videoPath: string | null;
  openOnLoad: boolean;
  autoPlay: boolean;
  autoCloseOnEnd: boolean;
  openAfterModalKey: string | null;
  openButtonLabel: string | null;
  uiRefKey: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

type ImageRecord = {
  id: string;
  videoKey: string;
  imagePath: string | null;
  startSeconds: number | null;
  endSeconds: number | null;
  sortOrder: number | null;
  uiRefKey: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

const normalizeVideo = (row: Record<string, string | number | null>): VideoRecord => ({
  id: String(row.id ?? ''),
  videoKey: String(row.video_key ?? ''),
  title: row.title ? String(row.title) : null,
  description: row.description ? String(row.description) : null,
  provider: row.provider ? String(row.provider) : null,
  vimeoId: row.vimeo_id ? String(row.vimeo_id) : null,
  videoPath: row.video_path ? String(row.video_path) : null,
  openOnLoad: Boolean(row.open_on_load),
  autoPlay: row.auto_play === null ? true : Boolean(row.auto_play),
  autoCloseOnEnd: row.auto_close_on_end === null ? true : Boolean(row.auto_close_on_end),
  openAfterModalKey: row.open_after_modal_key ? String(row.open_after_modal_key) : null,
  openButtonLabel: row.open_button_label ? String(row.open_button_label) : null,
  uiRefKey: row.ui_ref_key ? String(row.ui_ref_key) : null,
  createdAt: row.created_at ? String(row.created_at) : null,
  updatedAt: row.updated_at ? String(row.updated_at) : null,
});

const normalizeImage = (row: Record<string, string | number | null>): ImageRecord => ({
  id: String(row.id ?? ''),
  videoKey: String(row.video_key ?? ''),
  imagePath: row.image_path ? String(row.image_path) : null,
  startSeconds: row.start_seconds === null ? null : Number(row.start_seconds),
  endSeconds: row.end_seconds === null ? null : Number(row.end_seconds),
  sortOrder: row.sort_order === null ? null : Number(row.sort_order),
  uiRefKey: row.ui_ref_key ? String(row.ui_ref_key) : null,
  createdAt: row.created_at ? String(row.created_at) : null,
  updatedAt: row.updated_at ? String(row.updated_at) : null,
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');
  const db = getDb();

  if (!key) {
    const rows = db.prepare('SELECT * FROM avatar_onboarding_videos').all() as Array<
      Record<string, string | number | null>
    >;
    const videos = rows.map(normalizeVideo);
    return NextResponse.json({ videos });
  }

  const videoRow = db
    .prepare('SELECT * FROM avatar_onboarding_videos WHERE video_key = ?')
    .get(key) as Record<string, string | number | null> | undefined;

  if (!videoRow) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  const imageRows = db
    .prepare(
      `
      SELECT * FROM avatar_onboarding_images
      WHERE video_key = ?
      ORDER BY sort_order ASC
    `,
    )
    .all(key) as Array<Record<string, string | number | null>>;

  return NextResponse.json({
    video: normalizeVideo(videoRow),
    images: imageRows.map(normalizeImage),
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    key?: string;
    title?: string;
    uiRefKey?: string;
  };
  const key = body.key?.trim();
  if (!key) {
    return NextResponse.json({ error: 'key is required.' }, { status: 400 });
  }
  const db = getDb();
  const now = new Date().toISOString();
  const existing = db
    .prepare('SELECT id FROM avatar_onboarding_videos WHERE video_key = ?')
    .get(key);
  if (existing) {
    return NextResponse.json({ error: 'Video key already exists.' }, { status: 409 });
  }

  const videoId = randomUUID();
  db.prepare(
    `
      INSERT INTO avatar_onboarding_videos (
        id,
        video_key,
        title,
        description,
        provider,
        vimeo_id,
        video_path,
        open_on_load,
        auto_play,
        auto_close_on_end,
        open_after_modal_key,
        open_button_label,
        ui_ref_key,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
  ).run(
    videoId,
    key,
    body.title ?? 'New Avatar Onboarding',
    'UI_REF_KEY_PLACEHOLDER',
    'vimeo',
    'VIMEO_ID_PLACEHOLDER',
    '/reference/onboarding/videos/AVATAR_VIDEO_PLACEHOLDER.mp4',
    0,
    1,
    1,
    null,
    'Open Training',
    body.uiRefKey ?? 'UI_REF_KEY_PLACEHOLDER',
    now,
    now,
  );

  const imageInsert = db.prepare(
    `
      INSERT INTO avatar_onboarding_images (
        id,
        video_key,
        image_path,
        start_seconds,
        end_seconds,
        sort_order,
        ui_ref_key,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
  );

  const placeholders = [
    {
      image: '/reference/onboarding/images/IMAGE_01_PLACEHOLDER.png',
      start: 0,
      end: 6,
      sort: 1,
    },
    {
      image: '/reference/onboarding/images/IMAGE_02_PLACEHOLDER.png',
      start: 6,
      end: 14,
      sort: 2,
    },
    {
      image: '/reference/onboarding/images/IMAGE_03_PLACEHOLDER.png',
      start: 14,
      end: 24,
      sort: 3,
    },
  ];

  placeholders.forEach(item => {
    imageInsert.run(
      randomUUID(),
      key,
      item.image,
      item.start,
      item.end,
      item.sort,
      'UI_REF_KEY_PLACEHOLDER',
      now,
      now,
    );
  });

  return NextResponse.json({ ok: true, key });
}
