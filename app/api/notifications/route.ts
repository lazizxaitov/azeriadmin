import { NextResponse } from "next/server";

import { getDb, nowIso } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const items = db
    .prepare("SELECT * FROM notifications ORDER BY created_at DESC")
    .all();

  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const titleRu = body?.titleRu?.toString()?.trim();
  const titleUz = body?.titleUz?.toString()?.trim();
  const bodyRu = body?.bodyRu?.toString()?.trim();
  const bodyUz = body?.bodyUz?.toString()?.trim();
  const imageUrl = body?.imageUrl?.toString()?.trim() ?? null;
  const isActive = body?.isActive === false ? 0 : 1;

  if (!titleRu || !titleUz || !bodyRu || !bodyUz) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }

  const db = getDb();
  const now = nowIso();
  const result = db
    .prepare(
      `INSERT INTO notifications
       (title_ru, title_uz, body_ru, body_uz, image_url, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(titleRu, titleUz, bodyRu, bodyUz, imageUrl, isActive, now);

  return NextResponse.json({ id: result.lastInsertRowid });
}
