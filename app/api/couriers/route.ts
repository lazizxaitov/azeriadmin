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
  const couriers = db
    .prepare("SELECT * FROM couriers ORDER BY is_active DESC, name ASC")
    .all();
  return NextResponse.json({ items: couriers });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const name = body?.name?.toString()?.trim();
  const phone = body?.phone?.toString()?.trim() ?? null;
  const isActive = body?.isActive === false ? 0 : 1;

  if (!name) {
    return NextResponse.json({ error: "Missing name" }, { status: 400 });
  }

  const db = getDb();
  const now = nowIso();
  const result = db
    .prepare(
      "INSERT INTO couriers (name, phone, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?)"
    )
    .run(name, phone, isActive, now, now);

  return NextResponse.json({ id: result.lastInsertRowid });
}
