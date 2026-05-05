import { NextResponse } from "next/server";

import { getCashierSession, getSession } from "@/lib/auth";
import { getDb, nowIso } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const [admin, cashier] = await Promise.all([getSession(), getCashierSession()]);
  if (!admin && !cashier) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const name = body?.name?.toString()?.trim();
  let phone = body?.phone?.toString()?.trim() ?? "";
  const birthDateRaw = body?.birthDate?.toString()?.trim() ?? "";

  if (!name || !phone) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }

  if (!phone.startsWith("+998")) {
    phone = `+998${phone.replace(/^\+?998/, "")}`;
  }

  const birthDate =
    birthDateRaw && /^\d{4}-\d{2}-\d{2}$/.test(birthDateRaw) ? birthDateRaw : null;

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
      "INSERT INTO customers (name, phone, password, birth_date, created_at, updated_at) VALUES (?, ?, NULL, ?, ?, ?)"
    )
    .run(name, phone, birthDate, now, now);

  const id = Number(result.lastInsertRowid);
  const item = db
    .prepare("SELECT id, name, phone, bonus_balance, birth_date FROM customers WHERE id = ?")
    .get(id);

  return NextResponse.json({ item });
}

