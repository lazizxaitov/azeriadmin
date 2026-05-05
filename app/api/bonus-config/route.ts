import { NextResponse } from "next/server";

import { getCashierSession, getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const [admin, cashier] = await Promise.all([getSession(), getCashierSession()]);
  if (!admin && !cashier) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const row = db.prepare("SELECT bonus_percent FROM settings WHERE id = 1").get() as
    | { bonus_percent?: number }
    | undefined;
  return NextResponse.json({ bonusPercent: Number(row?.bonus_percent ?? 0) });
}

