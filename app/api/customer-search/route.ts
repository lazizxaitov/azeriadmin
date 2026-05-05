import { NextResponse } from "next/server";

import { getCashierSession, getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const [admin, cashier] = await Promise.all([getSession(), getCashierSession()]);
  if (!admin && !cashier) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  let phone = url.searchParams.get("phone")?.toString().trim() ?? "";
  if (!phone) {
    return NextResponse.json({ items: [] });
  }

  phone = phone.replace(/[^\d+]/g, "");
  if (phone && !phone.startsWith("+")) {
    phone = `+${phone.replace(/^\+/, "")}`;
  }

  const db = getDb();
  const items = db
    .prepare(
      `SELECT id, name, phone, bonus_balance, birth_date
       FROM customers
       WHERE phone LIKE ?
       ORDER BY updated_at DESC
       LIMIT 10`
    )
    .all(`%${phone}%`);

  return NextResponse.json({ items });
}

