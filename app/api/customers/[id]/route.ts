import { NextResponse } from "next/server";

import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = Number(params.id);
  if (!id) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const db = getDb();
  const customer = db
    .prepare("SELECT * FROM customers WHERE id = ?")
    .get(id);

  if (!customer) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const stats = db
    .prepare(
      "SELECT COUNT(1) as orders_count, COALESCE(SUM(total_amount), 0) as total_spent FROM orders WHERE customer_id = ?"
    )
    .get(id) as { orders_count: number; total_spent: number };

  const addresses = db
    .prepare(
      "SELECT * FROM customer_addresses WHERE customer_id = ? ORDER BY is_default DESC, created_at DESC"
    )
    .all(id);

  return NextResponse.json({
    customer,
    stats,
    addresses,
  });
}
