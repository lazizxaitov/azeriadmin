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

  const id = Number((await params).id);
  if (!id) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const name = body?.name?.toString()?.trim();
  const phone = body?.phone?.toString()?.trim() ?? null;
  const carNumber = body?.carNumber?.toString()?.trim() ?? null;
  const comment = body?.comment?.toString()?.trim() ?? null;
  const isActive = body?.isActive === false ? 0 : 1;

  if (!name) {
    return NextResponse.json({ error: "Missing name" }, { status: 400 });
  }

  const db = getDb();
  const existing = db
    .prepare("SELECT id FROM couriers WHERE id = ?")
    .get(id) as { id?: number } | undefined;
  if (!existing?.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  db.prepare(
    `UPDATE couriers
     SET name = ?, phone = ?, car_number = ?, comment = ?, is_active = ?, updated_at = ?
     WHERE id = ?`
  ).run(name, phone, carNumber, comment, isActive, nowIso(), id);

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

  const id = Number((await params).id);
  if (!id) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const db = getDb();
  db.prepare("DELETE FROM couriers WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}