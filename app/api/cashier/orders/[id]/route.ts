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
  const courierId =
    body?.courierId === undefined || body?.courierId === null
      ? undefined
      : body?.courierId
        ? Number(body.courierId)
        : null;
  const nextStatus = body?.status?.toString()?.trim();
  const cancelReason = body?.cancelReason?.toString()?.trim() ?? null;

  const db = getDb();
  const now = nowIso();
  const update = db.transaction(() => {
    const order = db
      .prepare(
        "SELECT id, customer_id, total_amount, status, bonus_earned, courier_id, accepted_at, in_delivery_at, completed_at, canceled_at FROM orders WHERE id = ?"
      )
      .get(id) as
      | {
          id: number;
          customer_id: number | null;
          total_amount: number;
          status: string;
          bonus_earned: number;
          courier_id: number | null;
          accepted_at: string | null;
          in_delivery_at: string | null;
          completed_at: string | null;
          canceled_at: string | null;
        }
      | undefined;

    if (!order?.id) {
      return { ok: false, status: 404 as const };
    }

    const status = nextStatus ?? order.status;
    const resolvedCourierId = courierId === undefined ? order.courier_id ?? null : courierId;
    const updateFields: string[] = ["courier_id = ?", "status = ?", "updated_at = ?"];
    const updateParams: Array<string | number | null> = [
      resolvedCourierId,
      status,
      now,
    ];

    if (status === "accepted" && !order.accepted_at) {
      updateFields.push("accepted_at = ?");
      updateParams.push(now);
    }
    if (status === "in_delivery" && !order.in_delivery_at) {
      updateFields.push("in_delivery_at = ?");
      updateParams.push(now);
    }
    if (status === "completed" && !order.completed_at) {
      updateFields.push("completed_at = ?");
      updateParams.push(now);
    }
    if (status === "canceled") {
      if (!order.canceled_at) {
        updateFields.push("canceled_at = ?");
        updateParams.push(now);
      }
      updateFields.push("cancel_reason = ?");
      updateParams.push(cancelReason);
    }

    updateParams.push(id);

    db.prepare(
      `UPDATE orders SET ${updateFields.join(", ")} WHERE id = ?`
    ).run(...updateParams);

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
