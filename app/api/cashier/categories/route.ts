import { NextResponse } from "next/server";

import { getDb } from "@/lib/db";
import { getCashierSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const session = await getCashierSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const categories = db
    .prepare("SELECT id, name_ru, name_uz, image_url FROM categories ORDER BY name_ru ASC")
    .all();

  return NextResponse.json({ items: categories });
}
