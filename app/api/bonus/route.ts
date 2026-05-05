import { NextResponse } from "next/server";

import { getCashierSession, getSession } from "@/lib/auth";
import { getDb, nowIso } from "@/lib/db";

export const runtime = "nodejs";

type BonusOp = "earn" | "adjust" | "redeem";

export async function POST(request: Request) {
  const [admin, cashier] = await Promise.all([getSession(), getCashierSession()]);
  if (!admin && !cashier) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const customerId = Number(body?.customerId);
  const op = body?.op as BonusOp | undefined;

  if (!Number.isFinite(customerId) || !op) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const db = getDb();
  const now = nowIso();

  const customer = db
    .prepare("SELECT id, bonus_balance FROM customers WHERE id = ?")
    .get(customerId) as { id?: number; bonus_balance?: number } | undefined;
  if (!customer?.id) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  let delta = 0;
  let reason = body?.reason?.toString()?.trim() ?? "";

  if (op === "earn") {
    const purchaseAmount = Number(body?.purchaseAmount ?? 0);
    if (!Number.isFinite(purchaseAmount) || purchaseAmount <= 0) {
      return NextResponse.json({ error: "Invalid purchase amount" }, { status: 400 });
    }
    const settings = db.prepare("SELECT bonus_percent FROM settings WHERE id = 1").get() as
      | { bonus_percent?: number }
      | undefined;
    const percent = Number(settings?.bonus_percent ?? 0);
    const earned = Math.floor((purchaseAmount * Math.max(0, percent)) / 100);
    delta = Math.max(0, earned);
    reason = reason || "Manual purchase bonus";
  } else if (op === "adjust") {
    const bonusDelta = Number(body?.bonusDelta ?? 0);
    if (!Number.isFinite(bonusDelta) || bonusDelta === 0) {
      return NextResponse.json({ error: "Invalid bonus delta" }, { status: 400 });
    }
    delta = Math.trunc(bonusDelta);
    reason = reason || "Manual bonus adjustment";
  } else if (op === "redeem") {
    const redeem = Number(body?.redeemAmount ?? 0);
    if (!Number.isFinite(redeem) || redeem <= 0) {
      return NextResponse.json({ error: "Invalid redeem amount" }, { status: 400 });
    }
    delta = -Math.trunc(redeem);
    reason = reason || "Bonus redeemed";
  }

  const current = Number(customer.bonus_balance ?? 0);
  const next = Math.max(0, current + delta);
  const appliedDelta = next - current;

  if (appliedDelta === 0) {
    return NextResponse.json({ balance: current, delta: 0 });
  }

  const tx = db.transaction(() => {
    db.prepare("UPDATE customers SET bonus_balance = ?, updated_at = ? WHERE id = ?").run(
      next,
      now,
      customerId
    );
    db.prepare(
      `INSERT INTO bonus_transactions
       (customer_id, delta, balance_after, reason, order_id, created_at)
       VALUES (?, ?, ?, ?, NULL, ?)`
    ).run(customerId, appliedDelta, next, reason, now);
  });

  tx();

  return NextResponse.json({ balance: next, delta: appliedDelta });
}

