import { NextResponse } from "next/server";

import { getDb } from "@/lib/db";
import { rateLimit, requirePublicApiKey } from "@/lib/public-auth";

export const runtime = "nodejs";

export async function GET() {
  const authError = await requirePublicApiKey();
  if (authError) {
    return NextResponse.json(
      { error: authError.message },
      { status: authError.status }
    );
  }
  const rateError = await rateLimit();
  if (rateError) {
    return NextResponse.json(
      { error: rateError.message },
      { status: rateError.status }
    );
  }

  const db = getDb();
  const items = db
    .prepare(
      "SELECT id, title_ru, title_uz, body_ru, body_uz, image_url, created_at FROM notifications WHERE is_active = 1 ORDER BY created_at DESC"
    )
    .all();

  return NextResponse.json({ items });
}
