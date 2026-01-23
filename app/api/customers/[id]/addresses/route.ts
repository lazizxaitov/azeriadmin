import { NextResponse } from "next/server";

import { getDb, nowIso } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const customerId = Number(params.id);
  if (!customerId) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const label = body?.label?.toString()?.trim() ?? null;
  const addressLine = body?.addressLine?.toString()?.trim();
  const comment = body?.comment?.toString()?.trim() ?? null;
  const isDefault = body?.isDefault ? 1 : 0;

  if (!addressLine) {
    return NextResponse.json({ error: "Missing address" }, { status: 400 });
  }

  const db = getDb();
  const now = nowIso();

  const create = db.transaction(() => {
    if (isDefault) {
      db.prepare(
        "UPDATE customer_addresses SET is_default = 0 WHERE customer_id = ?"
      ).run(customerId);
    }
    const result = db
      .prepare(
        `INSERT INTO customer_addresses
         (customer_id, label, address_line, comment, is_default, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(customerId, label, addressLine, comment, isDefault, now, now);
    return result.lastInsertRowid;
  });

  const addressId = create();
  return NextResponse.json({ id: addressId });
}
