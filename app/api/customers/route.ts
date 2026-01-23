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
  const customers = db
    .prepare(
      `SELECT c.*,
        COUNT(o.id) as orders_count,
        COALESCE(SUM(o.total_amount), 0) as total_spent
       FROM customers c
       LEFT JOIN orders o ON o.customer_id = c.id
       GROUP BY c.id
       ORDER BY total_spent DESC, c.created_at DESC`
    )
    .all();

  return NextResponse.json({ items: customers });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const name = body?.name?.toString()?.trim();
  let phone = body?.phone?.toString()?.trim() ?? "";
  const password = body?.password?.toString()?.trim();

  if (!name || !phone || !password) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }

  if (!phone.startsWith("+998")) {
    phone = `+998${phone.replace(/^\+?998/, "")}`;
  }

  const db = getDb();
  const existing = db
    .prepare("SELECT id FROM customers WHERE phone = ?")
    .get(phone) as { id?: number } | undefined;
  if (existing?.id) {
    return NextResponse.json({ error: "Phone already exists" }, { status: 409 });
  }

  const now = nowIso();
  const result = db
    .prepare(
      "INSERT INTO customers (name, phone, password, created_at, updated_at) VALUES (?, ?, ?, ?, ?)"
    )
    .run(name, phone, password, now, now);

  return NextResponse.json({ id: result.lastInsertRowid });
}
