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
  const settings = db
    .prepare("SELECT * FROM settings WHERE id = 1")
    .get();

  return NextResponse.json({ item: settings });
}

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const cafeName = body?.cafeName?.toString()?.trim();
  const phone = body?.phone?.toString()?.trim() ?? "";
  const address = body?.address?.toString()?.trim() ?? "";
  const workHours = body?.workHours?.toString()?.trim() ?? "";
  const deliveryFee = Number(body?.deliveryFee ?? 0);
  const minOrder = Number(body?.minOrder ?? 0);
  const currency = body?.currency?.toString()?.trim() ?? "сум";
  const bonusPercent = Number(body?.bonusPercent ?? 0);
  const bonusRedeemAmount = Number(body?.bonusRedeemAmount ?? 25000);
  const cardPaymentEnabled = Number(body?.cardPaymentEnabled ?? 1) ? 1 : 0;
  const cashPaymentEnabled = Number(body?.cashPaymentEnabled ?? 1) ? 1 : 0;
  const cardPaymentText = body?.cardPaymentText?.toString() ?? "";
  const instagram = body?.instagram?.toString()?.trim() ?? "";
  const telegram = body?.telegram?.toString()?.trim() ?? "";

  if (!cafeName) {
    return NextResponse.json({ error: "Missing cafe name" }, { status: 400 });
  }

  const db = getDb();
  db.prepare(
    `UPDATE settings
     SET cafe_name = ?, phone = ?, address = ?, work_hours = ?, delivery_fee = ?, min_order = ?, currency = ?, bonus_percent = ?, bonus_redeem_amount = ?, card_payment_enabled = ?, cash_payment_enabled = ?, card_payment_text = ?, instagram = ?, telegram = ?, updated_at = ?
     WHERE id = 1`
  ).run(
    cafeName,
    phone,
    address,
    workHours,
    deliveryFee,
    minOrder,
    currency,
    bonusPercent,
    bonusRedeemAmount,
    cardPaymentEnabled,
    cashPaymentEnabled,
    cardPaymentText,
    instagram,
    telegram,
    nowIso()
  );

  return NextResponse.json({ ok: true });
}
