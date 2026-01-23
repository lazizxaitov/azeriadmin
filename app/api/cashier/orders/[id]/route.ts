import { NextResponse } from "next/server";

import { getDb, nowIso } from "@/lib/db";
import { getCashierSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getCashierSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = Number(params.id);
  if (!id) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const courierId = body?.courierId ? Number(body.courierId) : null;
  const status = body?.status?.toString()?.trim() ?? "paid";

  const db = getDb();
  const now = nowIso();
  db.prepare(
    "UPDATE orders SET courier_id = ?, status = ?, updated_at = ? WHERE id = ?"
  ).run(courierId, status, now, id);

  return NextResponse.json({ ok: true });
}
