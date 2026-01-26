import { NextRequest, NextResponse } from "next/server";

import { getDb, nowIso } from "@/lib/db";
import { getCashierSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCashierSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = Number((await params).id);
  if (!id) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const courierId = body?.courierId ? Number(body.courierId) : null;
  const status = body?.status?.toString()?.trim() ?? "paid";

  const db = getDb();
  const now = nowIso();
  const update = db.transaction(() => {
    const order = db
      .prepare(
        "SELECT id, customer_id, total_amount, status, bonus_earned FROM orders WHERE id = ?"
      )
      .get(id) as
      | { id: number; customer_id: number | null; total_amount: number; status: string; bonus_earned: number }
      | undefined;

    if (!order?.id) {
      return { ok: false, status: 404 as const };
    }

    db.prepare(
      "UPDATE orders SET courier_id = ?, status = ?, updated_at = ? WHERE id = ?"
    ).run(courierId, status, now, id);

    if (
      status === "completed" &&
      order.customer_id &&
      Number(order.bonus_earned ?? 0) === 0
    ) {
      const settings = db
        .prepare("SELECT bonus_percent, delivery_fee FROM settings WHERE id = 1")
        .get() as { bonus_percent?: number; delivery_fee?: number } | undefined;
      const percent = Number(settings?.bonus_percent ?? 0);
      if (percent > 0) {
        const deliveryFee = Number(settings?.delivery_fee ?? 0);
        const baseAmount = Math.max(0, order.total_amount - deliveryFee);
        const bonus = Math.floor((baseAmount * percent) / 100);
        if (bonus > 0) {
          const customer = db
            .prepare("SELECT bonus_balance FROM customers WHERE id = ?")
            .get(order.customer_id) as { bonus_balance?: number } | undefined;
          const current = Number(customer?.bonus_balance ?? 0);
          const nextBalance = current + bonus;
          db.prepare(
            "UPDATE customers SET bonus_balance = ?, updated_at = ? WHERE id = ?"
          ).run(nextBalance, now, order.customer_id);
          db.prepare(
            "UPDATE orders SET bonus_earned = ? WHERE id = ?"
          ).run(bonus, id);
          db.prepare(
            `INSERT INTO bonus_transactions
             (customer_id, delta, balance_after, reason, order_id, created_at)
             VALUES (?, ?, ?, ?, ?, ?)`
          ).run(
            order.customer_id,
            bonus,
            nextBalance,
            "Order completed",
            id,
            now
          );
        }
      }
    }

    return { ok: true, status: 200 as const };
  });

  const result = update();
  if (!result.ok) {
    return NextResponse.json({ error: "Not found" }, { status: result.status });
  }

  return NextResponse.json({ ok: true });
}
