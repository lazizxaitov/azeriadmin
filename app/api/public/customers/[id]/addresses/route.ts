import { NextRequest, NextResponse } from "next/server";

import { getDb, nowIso } from "@/lib/db";
import { rateLimit, requirePublicApiKey } from "@/lib/public-auth";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requirePublicApiKey();
  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: authError.status });
  }
  const rateError = rateLimit();
  if (rateError) {
    return NextResponse.json({ error: rateError.message }, { status: rateError.status });
  }

  const customerId = Number((await params).id);
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
