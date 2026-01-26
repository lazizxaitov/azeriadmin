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
    .prepare("SELECT * FROM pickup_points ORDER BY id DESC")
    .all();

  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const title = body?.title?.toString()?.trim();
  const address = body?.address?.toString()?.trim();
  const phone = body?.phone?.toString()?.trim() ?? null;
  const workHours = body?.workHours?.toString()?.trim() ?? null;
  const lat = body?.lat !== undefined && body?.lat !== null ? Number(body.lat) : null;
  const lng = body?.lng !== undefined && body?.lng !== null ? Number(body.lng) : null;
  const isActive = body?.isActive === false ? 0 : 1;

  if (!title || !address) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }

  const db = getDb();
  const now = nowIso();
  const result = db
    .prepare(
      `INSERT INTO pickup_points
       (title, address, phone, work_hours, lat, lng, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(title, address, phone, workHours, lat, lng, isActive, now, now);

  return NextResponse.json({ id: result.lastInsertRowid });
}