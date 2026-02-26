import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';
const CODE_TTL_MS = 10 * 60 * 1000;

export async function POST(request: Request) {
  const body = (await request.json()) as {
    action?: 'send-code' | 'verify-code';
    token?: string;
    email?: string;
    code?: string;
  };

  if (!body?.action || !body?.token || !body?.email) {
    return NextResponse.json(
      { error: 'action, token, and email are required.' },
      { status: 400 },
    );
  }

  const db = getDb();
  const now = new Date().toISOString();
  const normalizedEmail = body.email.trim().toLowerCase();

  if (body.action === 'send-code') {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + CODE_TTL_MS).toISOString();
    db.prepare(
      `
        DELETE FROM lead_verification_codes
        WHERE token = ? AND email = ?
      `,
    ).run(body.token, normalizedEmail);
    db.prepare(
      `
        INSERT INTO lead_verification_codes (
          id,
          token,
          email,
          code,
          created_at,
          expires_at
        ) VALUES (
          @id,
          @token,
          @email,
          @code,
          @createdAt,
          @expiresAt
        )
      `,
    ).run({
      id: randomUUID(),
      token: body.token,
      email: normalizedEmail,
      code,
      createdAt: now,
      expiresAt,
    });

    db.prepare(
      `
        INSERT INTO notification_events (
          id,
          type,
          to_value,
          source,
          subject,
          title,
          body,
          data_json,
          status,
          created_at
        ) VALUES (
          @id,
          @type,
          @to,
          @source,
          @subject,
          @title,
          @body,
          @dataJson,
          @status,
          @createdAt
        )
      `,
    ).run({
      id: randomUUID(),
      type: 'email',
      to: normalizedEmail,
      source: 'Teacher Interest',
      subject: 'Verification Code',
      title: '',
      body: `Your email verification code is ${code}. It expires in 10 minutes.`,
      dataJson: JSON.stringify({
        leadVerificationToken: body.token,
        verificationChannel: 'email',
        expiresAt,
      }),
      status: 'sent',
      createdAt: now,
    });

    return NextResponse.json({ ok: true, expiresAt, demoCode: code });
  }

  if (body.action === 'verify-code') {
    if (!body.code) {
      return NextResponse.json(
        { error: 'code is required.' },
        { status: 400 },
      );
    }
    const record = db
      .prepare(
        `
        SELECT id, code, expires_at
        FROM lead_verification_codes
        WHERE token = ? AND email = ? AND consumed_at IS NULL
          AND datetime(expires_at) > datetime(?)
        ORDER BY datetime(created_at) DESC
        LIMIT 1
      `,
      )
      .get(body.token, normalizedEmail, now) as
      | { id?: string; code?: string; expires_at?: string }
      | undefined;
    if (!record?.id) {
      return NextResponse.json({ ok: false, error: 'expired' });
    }
    if ((record.code ?? '').trim() !== body.code.trim()) {
      return NextResponse.json({ ok: false, error: 'invalid' });
    }
    db.prepare(
      `
        UPDATE lead_verification_codes
        SET consumed_at = ?
        WHERE id = ?
      `,
    ).run(now, record.id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
}
