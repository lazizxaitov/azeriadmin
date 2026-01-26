import { NextRequest, NextResponse } from "next/server";

import { getDb } from "@/lib/db";
import { rateLimit, requirePublicApiKey } from "@/lib/public-auth";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requirePublicApiKey();
  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: authError.status });
  }
  const rateError = await rateLimit();
  if (rateError) {
    return NextResponse.json({ error: rateError.message }, { status: rateError.status });
  }

  const customerId = Number((await params).id);
  if (!Number.isFinite(customerId)) {
    return NextResponse.json({ error: "Invalid customer id" }, { status: 400 });
  }

  const db = getDb();
  const customer = db
    .prepare("SELECT id, bonus_balance FROM customers WHERE id = ?")
    .get(customerId) as { id?: number; bonus_balance?: number } | undefined;

  if (!customer?.id) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  const transactions = db
    .prepare(
      `SELECT id, delta, balance_after, reason, order_id, created_at
       FROM bonus_transactions
       WHERE customer_id = ?
       ORDER BY created_at DESC`
    )
    .all(customerId);

  return NextResponse.json({
    balance: customer.bonus_balance ?? 0,
    transactions,
  });
}