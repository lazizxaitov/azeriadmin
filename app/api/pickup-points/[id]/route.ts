import { NextRequest, NextResponse } from "next/server";

import { getDb, nowIso } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pointId = Number((await params).id);
  if (!Number.isFinite(pointId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
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
  const existing = db
    .prepare("SELECT id FROM pickup_points WHERE id = ?")
    .get(pointId) as { id?: number } | undefined;
  if (!existing?.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  db.prepare(
    `UPDATE pickup_points
     SET title = ?, address = ?, phone = ?, work_hours = ?, lat = ?, lng = ?, is_active = ?, updated_at = ?
     WHERE id = ?`
  ).run(title, address, phone, workHours, lat, lng, isActive, nowIso(), pointId);

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pointId = Number((await params).id);
  if (!Number.isFinite(pointId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const db = getDb();
  db.prepare("DELETE FROM pickup_points WHERE id = ?").run(pointId);

  return NextResponse.json({ ok: true });
}