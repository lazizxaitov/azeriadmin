import { NextResponse } from "next/server";

import { getDb } from "@/lib/db";
import { rateLimit, requirePublicApiKey } from "@/lib/public-auth";

export const runtime = "nodejs";

export async function GET() {
  const authError = await requirePublicApiKey();
  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: authError.status });
  }
  const rateError = await rateLimit();
  if (rateError) {
    return NextResponse.json({ error: rateError.message }, { status: rateError.status });
  }

  const db = getDb();
  const item = db.prepare("SELECT * FROM settings WHERE id = 1").get();
  return NextResponse.json({ item });
}
