import { NextResponse } from "next/server";

import { getDb } from "@/lib/db";
import { rateLimit, requirePublicApiKey } from "@/lib/public-auth";

export const runtime = "nodejs";

export async function GET() {
  const authError = requirePublicApiKey();
  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: authError.status });
  }
  const rateError = rateLimit();
  if (rateError) {
    return NextResponse.json({ error: rateError.message }, { status: rateError.status });
  }

  const db = getDb();
  const items = db
    .prepare(
      `SELECT id, title, address, phone, work_hours, lat, lng
       FROM pickup_points
       WHERE is_active = 1
       ORDER BY id DESC`
    )
    .all();

  return NextResponse.json({ items });
}